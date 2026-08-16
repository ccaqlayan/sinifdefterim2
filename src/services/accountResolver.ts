import { doc, getDoc, setDoc, getDocs, collection } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Storage, DEFAULT_LUCKY_DRAW_SETTINGS } from '../utils/storage';
import { User } from '../types';
import { getUserProfileFromFirebaseOnce, saveUserProfileToFirebase } from './firebaseSync';

export interface ResolveUserParams {
  loginMethod: 'google' | 'email';
  providedEmail: string;
  providedUserId: string;
  name: string;
  password?: string;
  subject?: string;
  schoolName?: string;
  photoUrl?: string;
}

export interface EmailMapping {
  email: string;
  canonicalUserId: string;
  primaryMethod: 'google' | 'email';
  updatedAt: string;
}

const LOCAL_MAP_PREFIX = 'teacher_app_email_map_';

function getSanitizedEmailKey(email: string): string {
  return email.trim().toLowerCase().replace(/[^a-zA-Z0-9]/g, '_');
}

/**
 * Gets the email mapping from LocalStorage or Firestore
 */
export async function getEmailMapping(email: string): Promise<EmailMapping | null> {
  const sanitizedKey = getSanitizedEmailKey(email);
  if (!sanitizedKey) return null;

  // 1. Try LocalStorage
  try {
    const local = localStorage.getItem(`${LOCAL_MAP_PREFIX}${sanitizedKey}`);
    if (local) {
      const parsed = JSON.parse(local);
      if (parsed && parsed.canonicalUserId) {
        return parsed as EmailMapping;
      }
    }
  } catch (e) {
    console.warn('LocalStorage error reading email mapping:', e);
  }

  // 2. Try Firestore
  try {
    const ref = doc(db, 'emailMappings', sanitizedKey);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const data = snap.data() as EmailMapping;
      try {
        localStorage.setItem(`${LOCAL_MAP_PREFIX}${sanitizedKey}`, JSON.stringify(data));
      } catch (e) {
        // ignore storage errors
      }
      return data;
    }
  } catch (e) {
    console.warn('Firestore error reading email mapping:', e);
  }

  return null;
}

/**
 * Saves/updates the email mapping in LocalStorage and Firestore
 */
export async function saveEmailMapping(mapping: EmailMapping): Promise<void> {
  const sanitizedKey = getSanitizedEmailKey(mapping.email);
  if (!sanitizedKey) return;

  try {
    localStorage.setItem(`${LOCAL_MAP_PREFIX}${sanitizedKey}`, JSON.stringify(mapping));
  } catch (e) {
    console.warn('LocalStorage error writing email mapping:', e);
  }

  try {
    const ref = doc(db, 'emailMappings', sanitizedKey);
    await setDoc(ref, mapping, { merge: true });
  } catch (e) {
    console.warn('Firestore error writing email mapping:', e);
  }
}

/**
 * Checks if a user has existing data (classes, students) in LocalStorage or Firestore
 */
async function userHasData(userId: string): Promise<boolean> {
  if (!userId) return false;

  const localClasses = Storage.getClasses(userId);
  if (localClasses && localClasses.length > 0) return true;

  try {
    const safeUid = userId.replace(/[^a-zA-Z0-9_-]/g, '_');
    const snap = await getDocs(collection(db, 'users', safeUid, 'classes'));
    if (!snap.empty) return true;
  } catch (e) {
    console.warn('Firestore check userHasData error:', e);
  }

  return false;
}

/**
 * Migrates/copies user data from fromUserId to toUserId if toUserId has no data
 */
export async function migrateUserDataIfNeeded(fromUserId: string, toUserId: string): Promise<void> {
  if (!fromUserId || !toUserId || fromUserId === toUserId) return;

  const fromHasData = await userHasData(fromUserId);
  const toHasData = await userHasData(toUserId);

  if (fromHasData && !toHasData) {
    console.log(`Migrating account data from ${fromUserId} -> ${toUserId}`);

    Storage.setClasses(toUserId, Storage.getClasses(fromUserId));
    Storage.setStudents(toUserId, Storage.getStudents(fromUserId));
    Storage.setPlusMinusLogs(toUserId, Storage.getPlusMinusLogs(fromUserId));
    Storage.setQuizDefinitions(toUserId, Storage.getQuizDefinitions(fromUserId));
    Storage.setQuizzes(toUserId, Storage.getQuizzes(fromUserId));
    Storage.setHomeworks(toUserId, Storage.getHomeworks(fromUserId));
    Storage.setHomeworkRecords(toUserId, Storage.getHomeworkRecords(fromUserId));
    Storage.setNotebookControls(toUserId, Storage.getNotebookControls(fromUserId));
    Storage.setWeights(toUserId, Storage.getWeights(fromUserId));
    Storage.setNotifications(toUserId, Storage.getNotifications(fromUserId));
    Storage.setFeedbacks(toUserId, Storage.getFeedbacks(fromUserId));
    Storage.setScheduleConfig(toUserId, Storage.getScheduleConfig(fromUserId));
    Storage.setScheduleLessons(toUserId, Storage.getScheduleLessons(fromUserId));
    Storage.setAcademicYearConfig(toUserId, Storage.getAcademicYearConfig(fromUserId));
    Storage.setLuckyDrawSettings(toUserId, Storage.getLuckyDrawSettings(fromUserId));

    const collectionsToCopy = [
      'classes', 'students', 'plusMinusLogs', 'quizDefinitions', 'quizzes',
      'homeworks', 'homeworkRecords', 'notebookControls', 'scheduleLessons', 'feedbackLogs'
    ];

    const safeFrom = fromUserId.replace(/[^a-zA-Z0-9_-]/g, '_');
    const safeTo = toUserId.replace(/[^a-zA-Z0-9_-]/g, '_');

    for (const colName of collectionsToCopy) {
      try {
        const snap = await getDocs(collection(db, 'users', safeFrom, colName));
        for (const docSnap of snap.docs) {
          await setDoc(doc(db, 'users', safeTo, colName, docSnap.id), docSnap.data(), { merge: true });
        }
      } catch (e) {
        console.warn(`Firestore migration error for ${colName}:`, e);
      }
    }
  }
}

/**
 * Loads and aggregates user profile data across possible user IDs (Firestore & LocalStorage)
 */
async function fetchCombinedProfileData(candidateUserIds: string[], email: string): Promise<Partial<User>> {
  let mergedProfile: Partial<User> = {};
  const isDemoEmail = email.toLowerCase() === 'demo.ogretmen@okul.k12.tr';

  // Check LocalStorage current user first if email matches
  try {
    const currentUser = Storage.getUser();
    if (currentUser && currentUser.email && currentUser.email.toLowerCase() === email.toLowerCase()) {
      mergedProfile = { ...currentUser };
    }
  } catch (e) {
    // ignore
  }

  // Check Firestore userProfiles for all candidate IDs
  for (const uid of candidateUserIds) {
    if (!uid || (!isDemoEmail && uid === 'usr-demo-teacher')) continue;
    try {
      const cloudProfile = await getUserProfileFromFirebaseOnce(uid);
      if (cloudProfile) {
        const cleanName = (!isDemoEmail && cloudProfile.name === 'Demo Öğretmen') ? '' : cloudProfile.name;
        const cleanSubject = (!isDemoEmail && cloudProfile.subject === 'Matematik & Fen Bilimleri') ? '' : cloudProfile.subject;
        const cleanSchool = (!isDemoEmail && cloudProfile.schoolName === 'Atatürk Ortaokulu') ? '' : cloudProfile.schoolName;

        mergedProfile = {
          ...mergedProfile,
          name: (cleanName && cleanName !== 'Öğretmen' && cleanName !== 'Öğretmen (Google)')
            ? cleanName
            : (mergedProfile.name || cleanName),
          subject: cleanSubject || mergedProfile.subject,
          schoolName: cleanSchool || mergedProfile.schoolName,
          photoUrl: cloudProfile.photoUrl || mergedProfile.photoUrl,
          password: cloudProfile.password || mergedProfile.password,
          hasCustomPassword: cloudProfile.hasCustomPassword || mergedProfile.hasCustomPassword,
          luckyDrawSettings: cloudProfile.luckyDrawSettings || mergedProfile.luckyDrawSettings,
        };
      }
    } catch (e) {
      console.warn(`Error fetching candidate profile for ${uid}:`, e);
    }
  }

  // Final cleanup for non-demo email
  if (!isDemoEmail) {
    if (mergedProfile.subject === 'Matematik & Fen Bilimleri') mergedProfile.subject = '';
    if (mergedProfile.schoolName === 'Atatürk Ortaokulu') mergedProfile.schoolName = '';
    if (mergedProfile.name === 'Demo Öğretmen') mergedProfile.name = '';
  }

  return mergedProfile;
}

/**
 * Resolves the unified canonical user object based on email and login method
 */
export async function resolveCanonicalUser(params: ResolveUserParams): Promise<User> {
  const {
    loginMethod,
    providedEmail,
    providedUserId,
    name,
    password,
    subject,
    schoolName,
    photoUrl,
  } = params;

  const email = providedEmail.trim().toLowerCase();
  const sanitizedKey = getSanitizedEmailKey(email);

  // Check existing mapping
  const existingMapping = await getEmailMapping(email);

  // Candidate IDs for this email address
  const emailAccId = 'usr-account-' + sanitizedKey;
  const googleFallbackId = 'usr-google-' + sanitizedKey;
  const candidateIds = [
    existingMapping?.canonicalUserId,
    providedUserId,
    googleFallbackId,
    emailAccId,
  ].filter((id): id is string => Boolean(id));

  let canonicalUserId = providedUserId;

  if (existingMapping && existingMapping.canonicalUserId) {
    canonicalUserId = existingMapping.canonicalUserId;
  } else if (loginMethod === 'google') {
    canonicalUserId = providedUserId || googleFallbackId;
  } else {
    // Email login: check if Google account or fallback has data/profile
    const googleHasData = await userHasData(googleFallbackId) || (providedUserId ? await userHasData(providedUserId) : false);
    if (googleHasData) {
      canonicalUserId = (providedUserId && await userHasData(providedUserId)) ? providedUserId : googleFallbackId;
    } else {
      canonicalUserId = emailAccId;
    }
  }

  // Update mapping so all future logins immediately resolve to canonicalUserId
  await saveEmailMapping({
    email,
    canonicalUserId,
    primaryMethod: existingMapping ? existingMapping.primaryMethod : loginMethod,
    updatedAt: new Date().toISOString(),
  });

  // Migrate data from candidate IDs if needed
  for (const candId of candidateIds) {
    if (candId !== canonicalUserId) {
      await migrateUserDataIfNeeded(candId, canonicalUserId);
    }
  }

  // Load and combine saved profile data across Firestore and LocalStorage
  const existingProfile = await fetchCombinedProfileData([canonicalUserId, ...candidateIds], email);

  // Check password if logging in via email and a password was previously set
  if (loginMethod === 'email' && password && password.length > 0) {
    if (existingProfile.password && existingProfile.password !== password) {
      throw new Error('Girdiğiniz şifre hatalı. Lütfen kontrol edip tekrar deneyiniz.');
    }
  }

  // Determine final profile values
  const finalPassword = password || existingProfile.password || undefined;
  const finalHasCustomPassword = Boolean(finalPassword && finalPassword.length > 0);

  const finalName = (name && name !== 'Öğretmen' && name !== 'Öğretmen (Google)')
    ? name
    : (existingProfile.name || name || 'Öğretmen');

  const finalSubject = subject || existingProfile.subject || '';
  const finalSchoolName = schoolName || existingProfile.schoolName || '';
  const finalPhotoUrl = photoUrl || existingProfile.photoUrl || undefined;

  const resolvedUser: User = {
    id: canonicalUserId,
    name: finalName,
    email,
    password: finalPassword,
    hasCustomPassword: finalHasCustomPassword,
    role: email.toLowerCase() === 'ccaqlayan@gmail.com' ? 'admin' : 'teacher',
    authMethod: loginMethod,
    subject: finalSubject,
    schoolName: finalSchoolName,
    photoUrl: finalPhotoUrl,
    isLoggedIn: true,
    luckyDrawSettings: existingProfile.luckyDrawSettings || DEFAULT_LUCKY_DRAW_SETTINGS,
  };

  // Save the unified user profile to Firestore and LocalStorage
  await saveUserProfileToFirebase(resolvedUser);
  Storage.setUser(resolvedUser);

  return resolvedUser;
}
