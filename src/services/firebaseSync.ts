import { 
  collection, doc, setDoc, deleteDoc, onSnapshot, getDocs
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { 
  ClassRoom, Student, PerformanceLog, QuizScore, Homework, 
  HomeworkRecord, NotebookControl, WeightSettings, NotificationSetting, ParentFeedbackLog 
} from '../types';
import { 
  INITIAL_CLASSES, INITIAL_STUDENTS, INITIAL_PLUS_MINUS_LOGS, 
  INITIAL_QUIZZES, INITIAL_HOMEWORKS, INITIAL_HOMEWORK_RECORDS, 
  INITIAL_NOTEBOOK_CONTROLS, INITIAL_WEIGHT_SETTINGS, 
  INITIAL_NOTIFICATION_SETTINGS, INITIAL_FEEDBACK_LOGS 
} from '../mockData';

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

// Collections Names
const COLS = {
  CLASSES: 'classes',
  STUDENTS: 'students',
  PLUS_MINUS: 'plusMinusLogs',
  QUIZZES: 'quizzes',
  HOMEWORKS: 'homeworks',
  HW_RECORDS: 'homeworkRecords',
  NOTEBOOKS: 'notebookControls',
  WEIGHTS: 'weightSettings',
  NOTIFICATIONS: 'notificationSettings',
  FEEDBACKS: 'feedbackLogs',
};

// Seed initial data if collections are empty
export async function seedInitialDataIfEmpty() {
  try {
    const classSnap = await getDocs(collection(db, COLS.CLASSES));
    if (!classSnap.empty) return; // already seeded

    console.log('Seeding initial data to Firestore...');

    for (const c of INITIAL_CLASSES) {
      await setDoc(doc(db, COLS.CLASSES, c.id), c);
    }
    for (const s of INITIAL_STUDENTS) {
      await setDoc(doc(db, COLS.STUDENTS, s.id), s);
    }
    for (const pm of INITIAL_PLUS_MINUS_LOGS) {
      await setDoc(doc(db, COLS.PLUS_MINUS, pm.id), pm);
    }
    for (const q of INITIAL_QUIZZES) {
      await setDoc(doc(db, COLS.QUIZZES, q.id), q);
    }
    for (const hw of INITIAL_HOMEWORKS) {
      await setDoc(doc(db, COLS.HOMEWORKS, hw.id), hw);
    }
    for (const hwr of INITIAL_HOMEWORK_RECORDS) {
      await setDoc(doc(db, COLS.HW_RECORDS, hwr.id), hwr);
    }
    for (const nb of INITIAL_NOTEBOOK_CONTROLS) {
      await setDoc(doc(db, COLS.NOTEBOOKS, nb.id), nb);
    }
    await setDoc(doc(db, COLS.WEIGHTS, 'default_weights'), INITIAL_WEIGHT_SETTINGS);
    
    for (const n of INITIAL_NOTIFICATION_SETTINGS) {
      await setDoc(doc(db, COLS.NOTIFICATIONS, n.id), n);
    }
    for (const fb of INITIAL_FEEDBACK_LOGS) {
      await setDoc(doc(db, COLS.FEEDBACKS, fb.id), fb);
    }
    console.log('Firebase seeding complete.');
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'seeding');
  }
}

// Subscriptions
export function subscribeClasses(callback: (classes: ClassRoom[]) => void) {
  return onSnapshot(
    collection(db, COLS.CLASSES),
    (snap) => {
      const items: ClassRoom[] = snap.docs.map((d) => d.data() as ClassRoom);
      if (items.length > 0) callback(items);
    },
    (err) => handleFirestoreError(err, OperationType.GET, COLS.CLASSES)
  );
}

export function subscribeStudents(callback: (students: Student[]) => void) {
  return onSnapshot(
    collection(db, COLS.STUDENTS),
    (snap) => {
      const items: Student[] = snap.docs.map((d) => d.data() as Student);
      callback(items);
    },
    (err) => handleFirestoreError(err, OperationType.GET, COLS.STUDENTS)
  );
}

export function subscribePlusMinusLogs(callback: (logs: PerformanceLog[]) => void) {
  return onSnapshot(
    collection(db, COLS.PLUS_MINUS),
    (snap) => {
      const items: PerformanceLog[] = snap.docs.map((d) => d.data() as PerformanceLog);
      callback(items);
    },
    (err) => handleFirestoreError(err, OperationType.GET, COLS.PLUS_MINUS)
  );
}

export function subscribeQuizzes(callback: (quizzes: QuizScore[]) => void) {
  return onSnapshot(
    collection(db, COLS.QUIZZES),
    (snap) => {
      const items: QuizScore[] = snap.docs.map((d) => d.data() as QuizScore);
      callback(items);
    },
    (err) => handleFirestoreError(err, OperationType.GET, COLS.QUIZZES)
  );
}

export function subscribeHomeworks(callback: (hws: Homework[]) => void) {
  return onSnapshot(
    collection(db, COLS.HOMEWORKS),
    (snap) => {
      const items: Homework[] = snap.docs.map((d) => d.data() as Homework);
      callback(items);
    },
    (err) => handleFirestoreError(err, OperationType.GET, COLS.HOMEWORKS)
  );
}

export function subscribeHomeworkRecords(callback: (records: HomeworkRecord[]) => void) {
  return onSnapshot(
    collection(db, COLS.HW_RECORDS),
    (snap) => {
      const items: HomeworkRecord[] = snap.docs.map((d) => d.data() as HomeworkRecord);
      callback(items);
    },
    (err) => handleFirestoreError(err, OperationType.GET, COLS.HW_RECORDS)
  );
}

export function subscribeNotebookControls(callback: (controls: NotebookControl[]) => void) {
  return onSnapshot(
    collection(db, COLS.NOTEBOOKS),
    (snap) => {
      const items: NotebookControl[] = snap.docs.map((d) => d.data() as NotebookControl);
      callback(items);
    },
    (err) => handleFirestoreError(err, OperationType.GET, COLS.NOTEBOOKS)
  );
}

export function subscribeWeights(callback: (weights: WeightSettings) => void) {
  return onSnapshot(
    collection(db, COLS.WEIGHTS),
    (snap) => {
      if (!snap.empty) {
        callback(snap.docs[0].data() as WeightSettings);
      }
    },
    (err) => handleFirestoreError(err, OperationType.GET, COLS.WEIGHTS)
  );
}

export function subscribeNotifications(callback: (notifications: NotificationSetting[]) => void) {
  return onSnapshot(
    collection(db, COLS.NOTIFICATIONS),
    (snap) => {
      const items: NotificationSetting[] = snap.docs.map((d) => d.data() as NotificationSetting);
      callback(items);
    },
    (err) => handleFirestoreError(err, OperationType.GET, COLS.NOTIFICATIONS)
  );
}

export function subscribeFeedbacks(callback: (feedbacks: ParentFeedbackLog[]) => void) {
  return onSnapshot(
    collection(db, COLS.FEEDBACKS),
    (snap) => {
      const items: ParentFeedbackLog[] = snap.docs.map((d) => d.data() as ParentFeedbackLog);
      callback(items);
    },
    (err) => handleFirestoreError(err, OperationType.GET, COLS.FEEDBACKS)
  );
}

// Writers
export async function saveClassToFirebase(cls: ClassRoom) {
  try {
    await setDoc(doc(db, COLS.CLASSES, cls.id), cls);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `${COLS.CLASSES}/${cls.id}`);
  }
}

export async function saveStudentToFirebase(student: Student) {
  try {
    await setDoc(doc(db, COLS.STUDENTS, student.id), student);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `${COLS.STUDENTS}/${student.id}`);
  }
}

export async function savePlusMinusLogToFirebase(log: PerformanceLog) {
  try {
    await setDoc(doc(db, COLS.PLUS_MINUS, log.id), log);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `${COLS.PLUS_MINUS}/${log.id}`);
  }
}

export async function deletePlusMinusLogFromFirebase(id: string) {
  try {
    await deleteDoc(doc(db, COLS.PLUS_MINUS, id));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `${COLS.PLUS_MINUS}/${id}`);
  }
}

export async function saveQuizScoreToFirebase(quiz: QuizScore) {
  try {
    await setDoc(doc(db, COLS.QUIZZES, quiz.id), quiz);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `${COLS.QUIZZES}/${quiz.id}`);
  }
}

export async function saveHomeworkToFirebase(hw: Homework) {
  try {
    await setDoc(doc(db, COLS.HOMEWORKS, hw.id), hw);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `${COLS.HOMEWORKS}/${hw.id}`);
  }
}

export async function saveHomeworkRecordToFirebase(rec: HomeworkRecord) {
  try {
    await setDoc(doc(db, COLS.HW_RECORDS, rec.id), rec);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `${COLS.HW_RECORDS}/${rec.id}`);
  }
}

export async function saveNotebookControlToFirebase(ctrl: NotebookControl) {
  try {
    await setDoc(doc(db, COLS.NOTEBOOKS, ctrl.id), ctrl);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `${COLS.NOTEBOOKS}/${ctrl.id}`);
  }
}

export async function saveWeightsToFirebase(weights: WeightSettings) {
  try {
    await setDoc(doc(db, COLS.WEIGHTS, 'default_weights'), weights);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `${COLS.WEIGHTS}/default_weights`);
  }
}

export async function saveNotificationSettingToFirebase(setting: NotificationSetting) {
  try {
    await setDoc(doc(db, COLS.NOTIFICATIONS, setting.id), setting);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `${COLS.NOTIFICATIONS}/${setting.id}`);
  }
}

export async function saveFeedbackLogToFirebase(feedback: ParentFeedbackLog) {
  try {
    await setDoc(doc(db, COLS.FEEDBACKS, feedback.id), feedback);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `${COLS.FEEDBACKS}/${feedback.id}`);
  }
}
