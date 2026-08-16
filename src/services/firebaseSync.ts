import { 
  collection, doc, setDoc, deleteDoc, onSnapshot, getDocs, getDoc
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { 
  ClassRoom, Student, PerformanceLog, Quiz, QuizScore, Homework, 
  HomeworkRecord, NotebookControl, WeightSettings, NotificationSetting, ParentFeedbackLog,
  User, LuckyDrawSettings, ScheduleConfig, ScheduleLesson, AcademicYearConfig 
} from '../types';
import { 
  INITIAL_CLASSES, INITIAL_STUDENTS, INITIAL_PLUS_MINUS_LOGS, 
  INITIAL_QUIZ_DEFINITIONS, INITIAL_QUIZZES, INITIAL_HOMEWORKS, INITIAL_HOMEWORK_RECORDS, 
  INITIAL_NOTEBOOK_CONTROLS, INITIAL_WEIGHT_SETTINGS, 
  INITIAL_NOTIFICATION_SETTINGS, INITIAL_FEEDBACK_LOGS 
} from '../mockData';
import { DEFAULT_SCHEDULE_CONFIG, INITIAL_SCHEDULE_LESSONS } from '../utils/scheduleUtils';
import { DEFAULT_ACADEMIC_YEAR_CONFIG } from '../utils/termUtils';
import { Storage } from '../utils/storage';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  };
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
}

/**
 * Sanitizes an object before writing to Firestore by removing keys with `undefined` values.
 * Firestore setDoc/addDoc throws a runtime error if any field is `undefined`.
 */
function sanitizeForFirestore<T>(data: T): T {
  if (data === null || data === undefined) {
    return data;
  }
  if (Array.isArray(data)) {
    return data.map((item) => sanitizeForFirestore(item)) as unknown as T;
  }
  if (typeof data === 'object') {
    const cleaned: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        cleaned[key] = typeof value === 'object' && value !== null ? sanitizeForFirestore(value) : value;
      }
    }
    return cleaned as T;
  }
  return data;
}

function getSafeUserId(userId?: string): string {
  if (!userId || userId.trim() === '') {
    return 'usr_guest_unauthenticated';
  }
  return userId.replace(/[^a-zA-Z0-9_-]/g, '_');
}

// User-scoped Collection Names
const COLS = {
  CLASSES: 'classes',
  STUDENTS: 'students',
  PLUS_MINUS: 'plusMinusLogs',
  QUIZ_DEFS: 'quizDefinitions',
  QUIZZES: 'quizzes',
  HOMEWORKS: 'homeworks',
  HW_RECORDS: 'homeworkRecords',
  NOTEBOOKS: 'notebookControls',
  WEIGHTS: 'weightSettings',
  NOTIFICATIONS: 'notificationSettings',
  FEEDBACKS: 'feedbackLogs',
  PROFILES: 'userProfiles',
  LUCKY_DRAW_SETTINGS: 'luckyDrawSettings',
  SCHEDULE_CONFIG: 'scheduleConfig',
  SCHEDULE_LESSONS: 'scheduleLessons',
};

// Seed initial data for user if empty
export async function seedInitialDataIfEmpty(userId: string = 'usr-demo-teacher') {
  try {
    const safeUid = getSafeUserId(userId);
    const classesRef = collection(db, 'users', safeUid, COLS.CLASSES);
    const classSnap = await getDocs(classesRef);
    if (!classSnap.empty) return; // already seeded

    if (safeUid === 'usr-demo-teacher') {
      console.log(`Seeding demo teacher initial data into users/${safeUid}...`);

      for (const c of INITIAL_CLASSES) {
        await setDoc(doc(db, 'users', safeUid, COLS.CLASSES, c.id), sanitizeForFirestore(c));
      }
      for (const s of INITIAL_STUDENTS) {
        await setDoc(doc(db, 'users', safeUid, COLS.STUDENTS, s.id), sanitizeForFirestore(s));
      }
      for (const pm of INITIAL_PLUS_MINUS_LOGS) {
        await setDoc(doc(db, 'users', safeUid, COLS.PLUS_MINUS, pm.id), sanitizeForFirestore(pm));
      }
      for (const qd of INITIAL_QUIZ_DEFINITIONS) {
        await setDoc(doc(db, 'users', safeUid, COLS.QUIZ_DEFS, qd.id), sanitizeForFirestore(qd));
      }
      for (const q of INITIAL_QUIZZES) {
        await setDoc(doc(db, 'users', safeUid, COLS.QUIZZES, q.id), sanitizeForFirestore(q));
      }
      for (const hw of INITIAL_HOMEWORKS) {
        await setDoc(doc(db, 'users', safeUid, COLS.HOMEWORKS, hw.id), sanitizeForFirestore(hw));
      }
      for (const hwr of INITIAL_HOMEWORK_RECORDS) {
        await setDoc(doc(db, 'users', safeUid, COLS.HW_RECORDS, hwr.id), sanitizeForFirestore(hwr));
      }
      for (const nb of INITIAL_NOTEBOOK_CONTROLS) {
        await setDoc(doc(db, 'users', safeUid, COLS.NOTEBOOKS, nb.id), sanitizeForFirestore(nb));
      }
      for (const n of INITIAL_NOTIFICATION_SETTINGS) {
        await setDoc(doc(db, 'users', safeUid, COLS.NOTIFICATIONS, n.id), sanitizeForFirestore(n));
      }
      for (const fb of INITIAL_FEEDBACK_LOGS) {
        await setDoc(doc(db, 'users', safeUid, COLS.FEEDBACKS, fb.id), sanitizeForFirestore(fb));
      }
      for (const sch of INITIAL_SCHEDULE_LESSONS) {
        await setDoc(doc(db, 'users', safeUid, COLS.SCHEDULE_LESSONS, sch.id), sanitizeForFirestore(sch));
      }
    }

    // Default settings for every user
    await setDoc(doc(db, 'users', safeUid, 'settings', 'weights'), sanitizeForFirestore(INITIAL_WEIGHT_SETTINGS));
    await setDoc(doc(db, 'users', safeUid, 'settings', 'scheduleConfig'), sanitizeForFirestore(DEFAULT_SCHEDULE_CONFIG));
    console.log(`Firestore initial user setup complete for ${safeUid}`);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `users/${userId}/seeding`);
  }
}

// ----------------------------------------------------
// USER-SCOPED SUBSCRIPTIONS
// ----------------------------------------------------

export function subscribeClasses(userId: string, callback: (classes: ClassRoom[]) => void) {
  const safeUid = getSafeUserId(userId);
  return onSnapshot(
    collection(db, 'users', safeUid, COLS.CLASSES),
    (snap) => {
      const items: ClassRoom[] = snap.docs.map((d) => d.data() as ClassRoom);
      callback(items);
    },
    (err) => handleFirestoreError(err, OperationType.GET, `users/${safeUid}/${COLS.CLASSES}`)
  );
}

export function subscribeStudents(userId: string, callback: (students: Student[]) => void) {
  const safeUid = getSafeUserId(userId);
  return onSnapshot(
    collection(db, 'users', safeUid, COLS.STUDENTS),
    (snap) => {
      const items: Student[] = snap.docs.map((d) => d.data() as Student);
      callback(items);
    },
    (err) => handleFirestoreError(err, OperationType.GET, `users/${safeUid}/${COLS.STUDENTS}`)
  );
}

export function subscribePlusMinusLogs(userId: string, callback: (logs: PerformanceLog[]) => void) {
  const safeUid = getSafeUserId(userId);
  return onSnapshot(
    collection(db, 'users', safeUid, COLS.PLUS_MINUS),
    (snap) => {
      const items: PerformanceLog[] = snap.docs.map((d) => d.data() as PerformanceLog);
      callback(items);
    },
    (err) => handleFirestoreError(err, OperationType.GET, `users/${safeUid}/${COLS.PLUS_MINUS}`)
  );
}

export function subscribeQuizDefinitions(userId: string, callback: (quizDefs: Quiz[]) => void) {
  const safeUid = getSafeUserId(userId);
  return onSnapshot(
    collection(db, 'users', safeUid, COLS.QUIZ_DEFS),
    (snap) => {
      const items: Quiz[] = snap.docs.map((d) => d.data() as Quiz);
      callback(items);
    },
    (err) => handleFirestoreError(err, OperationType.GET, `users/${safeUid}/${COLS.QUIZ_DEFS}`)
  );
}

export function subscribeQuizzes(userId: string, callback: (quizzes: QuizScore[]) => void) {
  const safeUid = getSafeUserId(userId);
  return onSnapshot(
    collection(db, 'users', safeUid, COLS.QUIZZES),
    (snap) => {
      const items: QuizScore[] = snap.docs.map((d) => d.data() as QuizScore);
      callback(items);
    },
    (err) => handleFirestoreError(err, OperationType.GET, `users/${safeUid}/${COLS.QUIZZES}`)
  );
}

export function subscribeHomeworks(userId: string, callback: (hws: Homework[]) => void) {
  const safeUid = getSafeUserId(userId);
  return onSnapshot(
    collection(db, 'users', safeUid, COLS.HOMEWORKS),
    (snap) => {
      const items: Homework[] = snap.docs.map((d) => d.data() as Homework);
      callback(items);
    },
    (err) => handleFirestoreError(err, OperationType.GET, `users/${safeUid}/${COLS.HOMEWORKS}`)
  );
}

export function subscribeHomeworkRecords(userId: string, callback: (records: HomeworkRecord[]) => void) {
  const safeUid = getSafeUserId(userId);
  return onSnapshot(
    collection(db, 'users', safeUid, COLS.HW_RECORDS),
    (snap) => {
      const items: HomeworkRecord[] = snap.docs.map((d) => d.data() as HomeworkRecord);
      callback(items);
    },
    (err) => handleFirestoreError(err, OperationType.GET, `users/${safeUid}/${COLS.HW_RECORDS}`)
  );
}

export function subscribeNotebookControls(userId: string, callback: (controls: NotebookControl[]) => void) {
  const safeUid = getSafeUserId(userId);
  return onSnapshot(
    collection(db, 'users', safeUid, COLS.NOTEBOOKS),
    (snap) => {
      const items: NotebookControl[] = snap.docs.map((d) => d.data() as NotebookControl);
      callback(items);
    },
    (err) => handleFirestoreError(err, OperationType.GET, `users/${safeUid}/${COLS.NOTEBOOKS}`)
  );
}

export function subscribeWeights(userId: string, callback: (weights: WeightSettings) => void) {
  const safeUid = getSafeUserId(userId);
  return onSnapshot(
    doc(db, 'users', safeUid, 'settings', 'weights'),
    (snap) => {
      if (snap.exists()) {
        callback(snap.data() as WeightSettings);
      }
    },
    (err) => handleFirestoreError(err, OperationType.GET, `users/${safeUid}/settings/weights`)
  );
}

export function subscribeNotifications(userId: string, callback: (notifications: NotificationSetting[]) => void) {
  const safeUid = getSafeUserId(userId);
  return onSnapshot(
    collection(db, 'users', safeUid, COLS.NOTIFICATIONS),
    (snap) => {
      const items: NotificationSetting[] = snap.docs.map((d) => d.data() as NotificationSetting);
      callback(items);
    },
    (err) => handleFirestoreError(err, OperationType.GET, `users/${safeUid}/${COLS.NOTIFICATIONS}`)
  );
}

export function subscribeFeedbacks(userId: string, callback: (feedbacks: ParentFeedbackLog[]) => void) {
  const safeUid = getSafeUserId(userId);
  return onSnapshot(
    collection(db, 'users', safeUid, COLS.FEEDBACKS),
    (snap) => {
      const items: ParentFeedbackLog[] = snap.docs.map((d) => d.data() as ParentFeedbackLog);
      callback(items);
    },
    (err) => handleFirestoreError(err, OperationType.GET, `users/${safeUid}/${COLS.FEEDBACKS}`)
  );
}

// ----------------------------------------------------
// USER-SCOPED WRITERS & MUTATIONS
// ----------------------------------------------------

export async function saveClassToFirebase(userId: string, cls: ClassRoom) {
  const safeUid = getSafeUserId(userId);
  try {
    await setDoc(doc(db, 'users', safeUid, COLS.CLASSES, cls.id), sanitizeForFirestore(cls));
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `users/${safeUid}/${COLS.CLASSES}/${cls.id}`);
  }
}

export async function deleteClassFromFirebase(userId: string, id: string) {
  const safeUid = getSafeUserId(userId);
  try {
    await deleteDoc(doc(db, 'users', safeUid, COLS.CLASSES, id));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `users/${safeUid}/${COLS.CLASSES}/${id}`);
  }
}

export async function saveStudentToFirebase(userId: string, student: Student) {
  const safeUid = getSafeUserId(userId);
  try {
    await setDoc(doc(db, 'users', safeUid, COLS.STUDENTS, student.id), sanitizeForFirestore(student));
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `users/${safeUid}/${COLS.STUDENTS}/${student.id}`);
  }
}

export async function deleteStudentFromFirebase(userId: string, id: string) {
  const safeUid = getSafeUserId(userId);
  try {
    await deleteDoc(doc(db, 'users', safeUid, COLS.STUDENTS, id));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `users/${safeUid}/${COLS.STUDENTS}/${id}`);
  }
}

export async function savePlusMinusLogToFirebase(userId: string, log: PerformanceLog) {
  const safeUid = getSafeUserId(userId);
  try {
    await setDoc(doc(db, 'users', safeUid, COLS.PLUS_MINUS, log.id), sanitizeForFirestore(log));
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `users/${safeUid}/${COLS.PLUS_MINUS}/${log.id}`);
  }
}

export async function deletePlusMinusLogFromFirebase(userId: string, id: string) {
  const safeUid = getSafeUserId(userId);
  try {
    await deleteDoc(doc(db, 'users', safeUid, COLS.PLUS_MINUS, id));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `users/${safeUid}/${COLS.PLUS_MINUS}/${id}`);
  }
}

export async function saveQuizDefinitionToFirebase(userId: string, quizDef: Quiz) {
  const safeUid = getSafeUserId(userId);
  try {
    await setDoc(doc(db, 'users', safeUid, COLS.QUIZ_DEFS, quizDef.id), sanitizeForFirestore(quizDef));
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `users/${safeUid}/${COLS.QUIZ_DEFS}/${quizDef.id}`);
  }
}

export async function deleteQuizDefinitionFromFirebase(userId: string, id: string) {
  const safeUid = getSafeUserId(userId);
  try {
    await deleteDoc(doc(db, 'users', safeUid, COLS.QUIZ_DEFS, id));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `users/${safeUid}/${COLS.QUIZ_DEFS}/${id}`);
  }
}

export async function saveQuizScoreToFirebase(userId: string, quiz: QuizScore) {
  const safeUid = getSafeUserId(userId);
  try {
    await setDoc(doc(db, 'users', safeUid, COLS.QUIZZES, quiz.id), sanitizeForFirestore(quiz));
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `users/${safeUid}/${COLS.QUIZZES}/${quiz.id}`);
  }
}

export async function deleteQuizScoreFromFirebase(userId: string, id: string) {
  const safeUid = getSafeUserId(userId);
  try {
    await deleteDoc(doc(db, 'users', safeUid, COLS.QUIZZES, id));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `users/${safeUid}/${COLS.QUIZZES}/${id}`);
  }
}

export async function saveHomeworkToFirebase(userId: string, hw: Homework) {
  const safeUid = getSafeUserId(userId);
  try {
    await setDoc(doc(db, 'users', safeUid, COLS.HOMEWORKS, hw.id), sanitizeForFirestore(hw));
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `users/${safeUid}/${COLS.HOMEWORKS}/${hw.id}`);
  }
}

export async function deleteHomeworkFromFirebase(userId: string, id: string) {
  const safeUid = getSafeUserId(userId);
  try {
    await deleteDoc(doc(db, 'users', safeUid, COLS.HOMEWORKS, id));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `users/${safeUid}/${COLS.HOMEWORKS}/${id}`);
  }
}

export async function saveHomeworkRecordToFirebase(userId: string, rec: HomeworkRecord) {
  const safeUid = getSafeUserId(userId);
  try {
    await setDoc(doc(db, 'users', safeUid, COLS.HW_RECORDS, rec.id), sanitizeForFirestore(rec));
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `users/${safeUid}/${COLS.HW_RECORDS}/${rec.id}`);
  }
}

export async function deleteHomeworkRecordFromFirebase(userId: string, id: string) {
  const safeUid = getSafeUserId(userId);
  try {
    await deleteDoc(doc(db, 'users', safeUid, COLS.HW_RECORDS, id));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `users/${safeUid}/${COLS.HW_RECORDS}/${id}`);
  }
}

export async function saveNotebookControlToFirebase(userId: string, ctrl: NotebookControl) {
  const safeUid = getSafeUserId(userId);
  try {
    await setDoc(doc(db, 'users', safeUid, COLS.NOTEBOOKS, ctrl.id), sanitizeForFirestore(ctrl));
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `users/${safeUid}/${COLS.NOTEBOOKS}/${ctrl.id}`);
  }
}

export async function saveWeightsToFirebase(userId: string, weights: WeightSettings) {
  const safeUid = getSafeUserId(userId);
  try {
    await setDoc(doc(db, 'users', safeUid, 'settings', 'weights'), sanitizeForFirestore(weights));
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `users/${safeUid}/settings/weights`);
  }
}

export async function saveNotificationSettingToFirebase(userId: string, setting: NotificationSetting) {
  const safeUid = getSafeUserId(userId);
  try {
    await setDoc(doc(db, 'users', safeUid, COLS.NOTIFICATIONS, setting.id), sanitizeForFirestore(setting));
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `users/${safeUid}/${COLS.NOTIFICATIONS}/${setting.id}`);
  }
}

export async function saveFeedbackLogToFirebase(userId: string, feedback: ParentFeedbackLog) {
  const safeUid = getSafeUserId(userId);
  try {
    await setDoc(doc(db, 'users', safeUid, COLS.FEEDBACKS, feedback.id), sanitizeForFirestore(feedback));
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `users/${safeUid}/${COLS.FEEDBACKS}/${feedback.id}`);
  }
}

// User Profile Sync (Global userProfiles collection keyed by userId)
export async function getUserProfileFromFirebaseOnce(userId: string): Promise<Partial<User> | null> {
  const profileId = getSafeUserId(userId);
  try {
    const snap = await getDoc(doc(db, COLS.PROFILES, profileId));
    if (snap.exists()) {
      return snap.data() as Partial<User>;
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, `${COLS.PROFILES}/${profileId}`);
  }
  return null;
}

export async function getAllUserProfilesFromFirebase(): Promise<User[]> {
  const usersMap = new Map<string, User>();
  try {
    const snap = await getDocs(collection(db, COLS.PROFILES));
    snap.docs.forEach((d) => {
      const data = d.data() as User;
      if (data && data.email) {
        const emailLower = data.email.toLowerCase();
        // Force admin role for ccaqlayan@gmail.com, teacher for others
        const role = emailLower === 'ccaqlayan@gmail.com' ? 'admin' : 'teacher';
        usersMap.set(emailLower, { ...data, role });
      }
    });
  } catch (err) {
    console.warn('Error getting all user profiles from Firestore:', err);
  }

  // Also check email mappings if any profile was missed
  try {
    const mappingsSnap = await getDocs(collection(db, 'emailMappings'));
    for (const d of mappingsSnap.docs) {
      const mapData = d.data();
      if (mapData && mapData.email && !usersMap.has(mapData.email.toLowerCase())) {
        const emailLower = mapData.email.toLowerCase();
        const role = emailLower === 'ccaqlayan@gmail.com' ? 'admin' : 'teacher';
        usersMap.set(emailLower, {
          id: mapData.canonicalUserId || d.id,
          name: mapData.email.split('@')[0],
          email: mapData.email,
          role,
          authMethod: mapData.primaryMethod || 'email',
          isLoggedIn: true,
        });
      }
    }
  } catch (err) {
    console.warn('Error reading emailMappings:', err);
  }

  // Ensure current logged-in user is present
  const currentUser = Storage.getUser();
  if (currentUser && currentUser.email) {
    const emailLower = currentUser.email.toLowerCase();
    const role = emailLower === 'ccaqlayan@gmail.com' ? 'admin' : 'teacher';
    const existing = usersMap.get(emailLower);
    usersMap.set(emailLower, {
      ...(existing || {}),
      ...currentUser,
      role,
    });
  }

  return Array.from(usersMap.values());
}

export async function getTeacherDataForAdmin(teacherUserId: string, teacherEmail?: string): Promise<{ classes: ClassRoom[]; students: Student[] }> {
  const candidateIds = new Set<string>();
  if (teacherUserId) candidateIds.add(teacherUserId);
  if (teacherEmail) {
    const emailLower = teacherEmail.toLowerCase();
    const sanitizedEmailKey = emailLower.replace(/[^a-zA-Z0-9]/g, '_');
    candidateIds.add('usr-account-' + sanitizedEmailKey);
    candidateIds.add('usr-google-' + sanitizedEmailKey);
  }
  const currentUser = Storage.getUser();
  if (currentUser && currentUser.email && teacherEmail && currentUser.email.toLowerCase() === teacherEmail.toLowerCase()) {
    if (currentUser.id) candidateIds.add(currentUser.id);
  }

  const classesMap = new Map<string, ClassRoom>();
  const studentsMap = new Map<string, Student>();

  for (const uid of Array.from(candidateIds)) {
    if (!uid) continue;
    const safeUid = getSafeUserId(uid);

    // 1. Try Firestore for candidate ID
    try {
      const classSnap = await getDocs(collection(db, 'users', safeUid, COLS.CLASSES));
      classSnap.docs.forEach((d) => {
        const cls = d.data() as ClassRoom;
        if (cls && cls.id) classesMap.set(cls.id, cls);
      });

      const studentSnap = await getDocs(collection(db, 'users', safeUid, COLS.STUDENTS));
      studentSnap.docs.forEach((d) => {
        const s = d.data() as Student;
        if (s && s.id) studentsMap.set(s.id, s);
      });
    } catch (err) {
      console.warn('Firestore fetch teacher data error for uid:', safeUid, err);
    }

    // 2. Check LocalStorage for candidate ID
    const localClasses = Storage.getClasses(uid);
    if (localClasses && localClasses.length > 0) {
      localClasses.forEach((cls) => {
        if (cls && cls.id && !classesMap.has(cls.id)) {
          classesMap.set(cls.id, cls);
        }
      });
    }

    const localStudents = Storage.getStudents(uid);
    if (localStudents && localStudents.length > 0) {
      localStudents.forEach((s) => {
        if (s && s.id && !studentsMap.has(s.id)) {
          studentsMap.set(s.id, s);
        }
      });
    }
  }

  // Fallback: If teacher matches current logged-in user and maps are still empty, read from default LocalStorage
  if (currentUser && currentUser.email && teacherEmail && currentUser.email.toLowerCase() === teacherEmail.toLowerCase()) {
    if (classesMap.size === 0) {
      const currentClasses = Storage.getClasses(currentUser.id);
      currentClasses.forEach((cls) => {
        if (cls && cls.id) classesMap.set(cls.id, cls);
      });
    }
    if (studentsMap.size === 0) {
      const currentStudents = Storage.getStudents(currentUser.id);
      currentStudents.forEach((s) => {
        if (s && s.id) studentsMap.set(s.id, s);
      });
    }
  }

  return { 
    classes: Array.from(classesMap.values()), 
    students: Array.from(studentsMap.values()) 
  };
}

export function subscribeUserProfile(userId: string, callback: (profile: Partial<User>) => void) {
  if (!userId || userId === 'usr_guest_unauthenticated') {
    return () => {};
  }
  const profileId = getSafeUserId(userId);
  return onSnapshot(
    doc(db, COLS.PROFILES, profileId),
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as Partial<User>;
        if (data && data.email && data.email.toLowerCase() !== 'demo.ogretmen@okul.k12.tr') {
          if (data.subject === 'Matematik & Fen Bilimleri') data.subject = '';
          if (data.schoolName === 'Atatürk Ortaokulu') data.schoolName = '';
          if (data.name === 'Demo Öğretmen') data.name = '';
        }
        callback(data);
      }
    },
    (err) => handleFirestoreError(err, OperationType.GET, `${COLS.PROFILES}/${profileId}`)
  );
}

export async function saveUserProfileToFirebase(user: User) {
  if (!user || !user.id || user.id === 'usr_guest_unauthenticated') return;
  try {
    const profileId = getSafeUserId(user.id);
    const sanitizedData = sanitizeForFirestore({
      ...user,
      updatedAt: new Date().toISOString(),
    });

    await setDoc(doc(db, COLS.PROFILES, profileId), sanitizedData, { merge: true });

    // Sync across user aliases for same email
    if (user.email) {
      const emailLower = user.email.toLowerCase();
      const sanitizedEmailKey = emailLower.replace(/[^a-zA-Z0-9]/g, '_');
      const alias1 = 'usr-account-' + sanitizedEmailKey;
      const alias2 = 'usr-google-' + sanitizedEmailKey;

      if (alias1 !== profileId) {
        await setDoc(doc(db, COLS.PROFILES, alias1), sanitizedData, { merge: true }).catch(() => {});
      }
      if (alias2 !== profileId) {
        await setDoc(doc(db, COLS.PROFILES, alias2), sanitizedData, { merge: true }).catch(() => {});
      }
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `${COLS.PROFILES}/${user.id}`);
  }
}

export async function deleteUserProfileFromFirebase(teacherUserId: string, email?: string) {
  try {
    const profileId = getSafeUserId(teacherUserId);
    await deleteDoc(doc(db, COLS.PROFILES, profileId)).catch(() => {});

    if (email) {
      const emailLower = email.toLowerCase();
      const sanitizedEmailKey = emailLower.replace(/[^a-zA-Z0-9]/g, '_');
      const alias1 = 'usr-account-' + sanitizedEmailKey;
      const alias2 = 'usr-google-' + sanitizedEmailKey;
      await deleteDoc(doc(db, COLS.PROFILES, alias1)).catch(() => {});
      await deleteDoc(doc(db, COLS.PROFILES, alias2)).catch(() => {});
      await deleteDoc(doc(db, 'emailMappings', sanitizedEmailKey)).catch(() => {});
    }
  } catch (err) {
    console.warn('Error deleting user profile from Firebase:', err);
  }
}

// Lucky Draw Settings Persistence
export function subscribeLuckyDrawSettings(userId: string, callback: (settings: LuckyDrawSettings) => void) {
  const safeUid = getSafeUserId(userId);
  return onSnapshot(
    doc(db, 'users', safeUid, 'settings', 'luckyDrawSettings'),
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as LuckyDrawSettings;
        callback(data);
      }
    },
    (err) => handleFirestoreError(err, OperationType.GET, `users/${safeUid}/settings/luckyDrawSettings`)
  );
}

export async function saveLuckyDrawSettingsToFirebase(settings: LuckyDrawSettings, userId?: string) {
  const safeUid = getSafeUserId(userId);
  try {
    await setDoc(doc(db, 'users', safeUid, 'settings', 'luckyDrawSettings'), sanitizeForFirestore(settings), { merge: true });
    // Also save directly into user profile document
    await setDoc(doc(db, COLS.PROFILES, safeUid), sanitizeForFirestore({ 
      luckyDrawSettings: settings,
      updatedAt: new Date().toISOString()
    }), { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `users/${safeUid}/settings/luckyDrawSettings`);
  }
}

export async function getLuckyDrawSettingsOnce(userId?: string): Promise<LuckyDrawSettings | null> {
  const safeUid = getSafeUserId(userId);
  try {
    const snap = await getDoc(doc(db, 'users', safeUid, 'settings', 'luckyDrawSettings'));
    if (snap.exists()) {
      return snap.data() as LuckyDrawSettings;
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, `users/${safeUid}/settings/luckyDrawSettings`);
  }
  return null;
}

// ----------------------------------------------------
// DERS PROGRAMI (TIMETABLE / SCHEDULE) FIREBASE SYNC
// ----------------------------------------------------

export function subscribeScheduleConfig(userId: string, callback: (config: ScheduleConfig) => void) {
  const safeUid = getSafeUserId(userId);
  return onSnapshot(
    doc(db, 'users', safeUid, 'settings', 'scheduleConfig'),
    (snapshot) => {
      if (snapshot.exists()) {
        callback(snapshot.data() as ScheduleConfig);
      } else {
        callback(DEFAULT_SCHEDULE_CONFIG);
      }
    },
    (err) => handleFirestoreError(err, OperationType.GET, `users/${safeUid}/settings/scheduleConfig`)
  );
}

export async function saveScheduleConfigToFirebase(userId: string, config: ScheduleConfig) {
  const safeUid = getSafeUserId(userId);
  try {
    await setDoc(doc(db, 'users', safeUid, 'settings', 'scheduleConfig'), sanitizeForFirestore(config));
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `users/${safeUid}/settings/scheduleConfig`);
  }
}

export function subscribeScheduleLessons(userId: string, callback: (lessons: ScheduleLesson[]) => void) {
  const safeUid = getSafeUserId(userId);
  return onSnapshot(
    collection(db, 'users', safeUid, COLS.SCHEDULE_LESSONS),
    (snapshot) => {
      const data: ScheduleLesson[] = [];
      snapshot.forEach((d) => data.push(d.data() as ScheduleLesson));
      callback(data);
    },
    (err) => handleFirestoreError(err, OperationType.LIST, `users/${safeUid}/${COLS.SCHEDULE_LESSONS}`)
  );
}

export async function saveScheduleLessonToFirebase(userId: string, lesson: ScheduleLesson) {
  const safeUid = getSafeUserId(userId);
  try {
    await setDoc(doc(db, 'users', safeUid, COLS.SCHEDULE_LESSONS, lesson.id), sanitizeForFirestore(lesson));
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `users/${safeUid}/${COLS.SCHEDULE_LESSONS}/${lesson.id}`);
  }
}

export async function deleteScheduleLessonFromFirebase(userId: string, lessonId: string) {
  const safeUid = getSafeUserId(userId);
  try {
    await deleteDoc(doc(db, 'users', safeUid, COLS.SCHEDULE_LESSONS, lessonId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `users/${safeUid}/${COLS.SCHEDULE_LESSONS}/${lessonId}`);
  }
}

export async function clearAllScheduleLessonsFromFirebase(userId: string, currentLessons?: ScheduleLesson[]) {
  const safeUid = getSafeUserId(userId);
  try {
    if (currentLessons && currentLessons.length > 0) {
      const promises = currentLessons.map((l) => deleteDoc(doc(db, 'users', safeUid, COLS.SCHEDULE_LESSONS, l.id)));
      await Promise.all(promises);
    } else {
      const snapshot = await getDocs(collection(db, 'users', safeUid, COLS.SCHEDULE_LESSONS));
      const promises = snapshot.docs.map((d) => deleteDoc(d.ref));
      await Promise.all(promises);
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `users/${safeUid}/${COLS.SCHEDULE_LESSONS}`);
  }
}

export async function batchSaveScheduleLessonsToFirebase(userId: string, lessons: ScheduleLesson[]) {
  const safeUid = getSafeUserId(userId);
  try {
    const promises = lessons.map((l) => setDoc(doc(db, 'users', safeUid, COLS.SCHEDULE_LESSONS, l.id), sanitizeForFirestore(l)));
    await Promise.all(promises);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `users/${safeUid}/${COLS.SCHEDULE_LESSONS}`);
  }
}

// ----------------------------------------------------
// DÖNEM AYARLARI (ACADEMIC YEAR & TERMS) FIREBASE SYNC
// ----------------------------------------------------

export function subscribeAcademicYearConfig(userId: string, callback: (config: AcademicYearConfig) => void) {
  const safeUid = getSafeUserId(userId);
  return onSnapshot(
    doc(db, 'users', safeUid, 'settings', 'academicYearConfig'),
    (snapshot) => {
      if (snapshot.exists()) {
        callback(snapshot.data() as AcademicYearConfig);
      } else {
        callback(DEFAULT_ACADEMIC_YEAR_CONFIG);
      }
    },
    (err) => handleFirestoreError(err, OperationType.GET, `users/${safeUid}/settings/academicYearConfig`)
  );
}

export async function saveAcademicYearConfigToFirebase(userId: string, config: AcademicYearConfig) {
  const safeUid = getSafeUserId(userId);
  try {
    await setDoc(doc(db, 'users', safeUid, 'settings', 'academicYearConfig'), sanitizeForFirestore(config));
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `users/${safeUid}/settings/academicYearConfig`);
  }
}


