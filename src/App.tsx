import React, { useState, useEffect } from 'react';
import { Storage } from './utils/storage';
import {
  User,
  ClassRoom,
  Student,
  PerformanceLog,
  Quiz,
  QuizScore,
  Homework,
  HomeworkRecord,
  NotebookControl,
  WeightSettings,
  NotificationSetting,
  ParentFeedbackLog,
  LuckyDrawSettings,
  ScheduleConfig,
  ScheduleLesson,
  AcademicYearConfig,
} from './types';

import { Header } from './components/Header';
import { MobileBottomNav } from './components/MobileBottomNav';
import { DashboardView } from './components/DashboardView';
import { QuickScoreView } from './components/QuickScoreView';
import { NotebookView } from './components/NotebookView';
import { QuizAndHomeworkView } from './components/QuizAndHomeworkView';
import { ReportsView } from './components/ReportsView';
import { FeedbackView } from './components/FeedbackView';
import { ParentPortalView } from './components/ParentPortalView';
import { ClassAndStudentManagementView } from './components/ClassAndStudentManagementView';
import { ScheduleView } from './components/schedule/ScheduleView';
import { LoginPage } from './components/auth/LoginPage';
import { NoClassGuideView } from './components/NoClassGuideView';

import { ProfileModal } from './components/ProfileModal';
import { TeacherManagementModal } from './components/TeacherManagementModal';
import { StudentModal } from './components/StudentModal';
import { BulkImportModal } from './components/BulkImportModal';
import { PdfImportModal } from './components/PdfImportModal';
import { ClassModal } from './components/ClassModal';
import { LuckyDrawModal } from './components/LuckyDrawModal';
import { AcademicYearSettingsModal } from './components/AcademicYearSettingsModal';

import { DEFAULT_SCHEDULE_CONFIG, INITIAL_SCHEDULE_LESSONS } from './utils/scheduleUtils';

import { 
  seedInitialDataIfEmpty,
  subscribeClasses,
  subscribeStudents,
  subscribePlusMinusLogs,
  subscribeQuizDefinitions,
  subscribeQuizzes,
  subscribeHomeworks,
  subscribeHomeworkRecords,
  subscribeNotebookControls,
  subscribeWeights,
  subscribeNotifications,
  subscribeFeedbacks,
  subscribeUserProfile,
  saveUserProfileToFirebase,
  subscribeLuckyDrawSettings,
  saveLuckyDrawSettingsToFirebase,
  subscribeScheduleConfig,
  subscribeScheduleLessons,
  saveScheduleConfigToFirebase,
  saveScheduleLessonToFirebase,
  deleteScheduleLessonFromFirebase,
  clearAllScheduleLessonsFromFirebase,
  batchSaveScheduleLessonsToFirebase,
  saveClassToFirebase,
  deleteClassFromFirebase,
  saveStudentToFirebase,
  deleteStudentFromFirebase,
  savePlusMinusLogToFirebase,
  deletePlusMinusLogFromFirebase,
  saveQuizDefinitionToFirebase,
  deleteQuizDefinitionFromFirebase,
  saveQuizScoreToFirebase,
  deleteQuizScoreFromFirebase,
  saveHomeworkToFirebase,
  deleteHomeworkFromFirebase,
  saveHomeworkRecordToFirebase,
  deleteHomeworkRecordFromFirebase,
  saveNotebookControlToFirebase,
  saveWeightsToFirebase,
  saveNotificationSettingToFirebase,
  saveFeedbackLogToFirebase,
  subscribeAcademicYearConfig,
  saveAcademicYearConfigToFirebase,
} from './services/firebaseSync';

export default function App() {
  // State Initialization from Persistent Storage
  const [user, setUser] = useState<User>(Storage.getUser());
  const [luckyDrawSettings, setLuckyDrawSettings] = useState<LuckyDrawSettings>(
    user.luckyDrawSettings || Storage.getLuckyDrawSettings(user.id)
  );
  const [classes, setClasses] = useState<ClassRoom[]>(Storage.getClasses(user.id));
  const [selectedClassId, setSelectedClassId] = useState<string>(classes[0]?.id || '');
  const [students, setStudents] = useState<Student[]>(Storage.getStudents(user.id));
  const [plusMinusLogs, setPlusMinusLogs] = useState<PerformanceLog[]>(Storage.getPlusMinusLogs(user.id));
  const [quizDefinitions, setQuizDefinitions] = useState<Quiz[]>(Storage.getQuizDefinitions(user.id));
  const [quizzes, setQuizzes] = useState<QuizScore[]>(Storage.getQuizzes(user.id));
  const [homeworks, setHomeworks] = useState<Homework[]>(Storage.getHomeworks(user.id));
  const [homeworkRecords, setHomeworkRecords] = useState<HomeworkRecord[]>(Storage.getHomeworkRecords(user.id));
  const [notebookControls, setNotebookControls] = useState<NotebookControl[]>(Storage.getNotebookControls(user.id));
  const [weights, setWeights] = useState<WeightSettings>(Storage.getWeights(user.id));
  const [notifications, setNotifications] = useState<NotificationSetting[]>(Storage.getNotifications(user.id));
  const [feedbackLogs, setFeedbackLogs] = useState<ParentFeedbackLog[]>(Storage.getFeedbacks(user.id));

  // Academic Year / Term Configuration State
  const [academicYearConfig, setAcademicYearConfig] = useState<AcademicYearConfig>(
    Storage.getAcademicYearConfig(user.id)
  );

  // Class Schedule State (Optional Feature)
  const [scheduleConfig, setScheduleConfig] = useState<ScheduleConfig>(Storage.getScheduleConfig(user.id));
  const [scheduleLessons, setScheduleLessons] = useState<ScheduleLesson[]>(Storage.getScheduleLessons(user.id));

  // Cloud sync state
  const [isCloudConnected, setIsCloudConnected] = useState<boolean>(true);

  // Navigation State
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // Modals
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);
  const [isStudentModalOpen, setIsStudentModalOpen] = useState<boolean>(false);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState<boolean>(false);
  const [isPdfImportOpen, setIsPdfImportOpen] = useState<boolean>(false);
  const [isClassModalOpen, setIsClassModalOpen] = useState<boolean>(false);
  const [isLuckyDrawOpen, setIsLuckyDrawOpen] = useState<boolean>(false);
  const [isAcademicSettingsOpen, setIsAcademicSettingsOpen] = useState<boolean>(false);
  const [isTeacherManagementOpen, setIsTeacherManagementOpen] = useState<boolean>(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  const currentClass = classes.find((c) => c.id === selectedClassId) || classes[0];

  // Auto-sync state to user-partitioned LocalStorage
  useEffect(() => Storage.setUser(user), [user]);
  useEffect(() => { if (user?.id) Storage.setLuckyDrawSettings(user.id, luckyDrawSettings); }, [luckyDrawSettings, user?.id]);
  useEffect(() => { if (user?.id) Storage.setAcademicYearConfig(user.id, academicYearConfig); }, [academicYearConfig, user?.id]);
  useEffect(() => { if (user?.id) Storage.setClasses(user.id, classes); }, [classes, user?.id]);
  useEffect(() => { if (user?.id) Storage.setStudents(user.id, students); }, [students, user?.id]);
  useEffect(() => { if (user?.id) Storage.setPlusMinusLogs(user.id, plusMinusLogs); }, [plusMinusLogs, user?.id]);
  useEffect(() => { if (user?.id) Storage.setQuizDefinitions(user.id, quizDefinitions); }, [quizDefinitions, user?.id]);
  useEffect(() => { if (user?.id) Storage.setQuizzes(user.id, quizzes); }, [quizzes, user?.id]);
  useEffect(() => { if (user?.id) Storage.setHomeworks(user.id, homeworks); }, [homeworks, user?.id]);
  useEffect(() => { if (user?.id) Storage.setHomeworkRecords(user.id, homeworkRecords); }, [homeworkRecords, user?.id]);
  useEffect(() => { if (user?.id) Storage.setNotebookControls(user.id, notebookControls); }, [notebookControls, user?.id]);
  useEffect(() => { if (user?.id) Storage.setWeights(user.id, weights); }, [weights, user?.id]);
  useEffect(() => { if (user?.id) Storage.setNotifications(user.id, notifications); }, [notifications, user?.id]);
  useEffect(() => { if (user?.id) Storage.setFeedbacks(user.id, feedbackLogs); }, [feedbackLogs, user?.id]);
  useEffect(() => { if (user?.id) Storage.setScheduleConfig(user.id, scheduleConfig); }, [scheduleConfig, user?.id]);
  useEffect(() => { if (user?.id) Storage.setScheduleLessons(user.id, scheduleLessons); }, [scheduleLessons, user?.id]);

  // Firebase Real-time Subscriptions & Initial Seeding per User
  useEffect(() => {
    if (!user || !user.id || user.isLoggedIn === false) return;

    const currentUserId = user.id;

    // Immediately load storage partition for this user
    const localClasses = Storage.getClasses(currentUserId);
    setClasses(localClasses);
    setSelectedClassId((prev) => (localClasses.some((c) => c.id === prev) ? prev : localClasses[0]?.id || ''));
    setStudents(Storage.getStudents(currentUserId));
    setPlusMinusLogs(Storage.getPlusMinusLogs(currentUserId));
    setQuizDefinitions(Storage.getQuizDefinitions(currentUserId));
    setQuizzes(Storage.getQuizzes(currentUserId));
    setHomeworks(Storage.getHomeworks(currentUserId));
    setHomeworkRecords(Storage.getHomeworkRecords(currentUserId));
    setNotebookControls(Storage.getNotebookControls(currentUserId));
    setWeights(Storage.getWeights(currentUserId));
    setNotifications(Storage.getNotifications(currentUserId));
    setFeedbackLogs(Storage.getFeedbacks(currentUserId));
    setScheduleConfig(Storage.getScheduleConfig(currentUserId));
    setScheduleLessons(Storage.getScheduleLessons(currentUserId));
    setLuckyDrawSettings(user.luckyDrawSettings || Storage.getLuckyDrawSettings(currentUserId));
    setAcademicYearConfig(Storage.getAcademicYearConfig(currentUserId));

    seedInitialDataIfEmpty(currentUserId).then(() => setIsCloudConnected(true));

    const unsubClasses = subscribeClasses(currentUserId, (data) => {
      setClasses(data);
      setSelectedClassId((prev) => (data.some((c) => c.id === prev) ? prev : data[0]?.id || ''));
    });
    const unsubStudents = subscribeStudents(currentUserId, (data) => {
      setStudents(data);
    });
    const unsubLogs = subscribePlusMinusLogs(currentUserId, (data) => setPlusMinusLogs(data));
    const unsubQuizDefs = subscribeQuizDefinitions(currentUserId, (data) => setQuizDefinitions(data));
    const unsubQuizzes = subscribeQuizzes(currentUserId, (data) => setQuizzes(data));
    const unsubHws = subscribeHomeworks(currentUserId, (data) => setHomeworks(data));
    const unsubHwRecs = subscribeHomeworkRecords(currentUserId, (data) => setHomeworkRecords(data));
    const unsubNotebooks = subscribeNotebookControls(currentUserId, (data) => setNotebookControls(data));
    const unsubWeights = subscribeWeights(currentUserId, (data) => setWeights(data));
    const unsubNotifs = subscribeNotifications(currentUserId, (data) => setNotifications(data));
    const unsubFeedbacks = subscribeFeedbacks(currentUserId, (data) => setFeedbackLogs(data));

    // Academic Year Config subscription
    const unsubAcademicConfig = subscribeAcademicYearConfig(currentUserId, (config) => {
      if (config) setAcademicYearConfig(config);
    });

    // Schedule subscriptions
    const unsubScheduleConfig = subscribeScheduleConfig(currentUserId, (config) => {
      if (config) setScheduleConfig(config);
    });
    const unsubScheduleLessons = subscribeScheduleLessons(currentUserId, (lessons) => {
      if (lessons) setScheduleLessons(lessons);
    });

    // Subscribe to current user profile & lucky draw settings
    const unsubProfile = subscribeUserProfile(currentUserId, (profile) => {
      if (profile) {
        setUser((prev) => ({ ...prev, ...profile }));
        if (profile.luckyDrawSettings) {
          setLuckyDrawSettings(profile.luckyDrawSettings);
        }
      }
    });

    const unsubWheelSettings = subscribeLuckyDrawSettings(currentUserId, (settings) => {
      if (settings) {
        setLuckyDrawSettings(settings);
      }
    });

    return () => {
      unsubClasses();
      unsubStudents();
      unsubLogs();
      unsubQuizDefs();
      unsubQuizzes();
      unsubHws();
      unsubHwRecs();
      unsubNotebooks();
      unsubWeights();
      unsubNotifs();
      unsubFeedbacks();
      unsubAcademicConfig();
      unsubScheduleConfig();
      unsubScheduleLessons();
      unsubProfile();
      unsubWheelSettings();
    };
  }, [user.id, user.isLoggedIn]);

  const handleSaveAcademicYearConfig = (newConfig: AcademicYearConfig) => {
    setAcademicYearConfig(newConfig);
    Storage.setAcademicYearConfig(user.id, newConfig);
    if (user.isLoggedIn) {
      saveAcademicYearConfigToFirebase(user.id, newConfig);
    }
  };

  // User Profile and Settings Handlers
  const handleUpdateUser = (updatedUser: User) => {
    setUser(updatedUser);
    Storage.setUser(updatedUser);
    if (updatedUser.isLoggedIn) {
      saveUserProfileToFirebase(updatedUser);
    }
    if (updatedUser.luckyDrawSettings) {
      setLuckyDrawSettings(updatedUser.luckyDrawSettings);
      Storage.setLuckyDrawSettings(updatedUser.id, updatedUser.luckyDrawSettings);
      saveLuckyDrawSettingsToFirebase(updatedUser.luckyDrawSettings, updatedUser.id);
    }
  };

  const handleUpdateLuckyDrawSettings = (newSettings: LuckyDrawSettings) => {
    setLuckyDrawSettings(newSettings);
    Storage.setLuckyDrawSettings(user.id, newSettings);
    saveLuckyDrawSettingsToFirebase(newSettings, user.id);
    setUser((prev) => ({
      ...prev,
      luckyDrawSettings: newSettings,
    }));
  };

  // Handlers for Data Mutations (Synchronized to Firebase + Local State)
  const handleAddPlusMinusLog = (log: Omit<PerformanceLog, 'id'>) => {
    const newLog: PerformanceLog = { ...log, id: 'pm-' + Date.now() + Math.random().toString(36).substring(2, 5) };
    setPlusMinusLogs((prev) => [...prev, newLog]);
    savePlusMinusLogToFirebase(user.id, newLog);
  };

  const handleDeletePlusMinusLog = (id: string) => {
    setPlusMinusLogs((prev) => prev.filter((l) => l.id !== id));
    deletePlusMinusLogFromFirebase(user.id, id);
  };

  const handleSaveNotebookControl = (control: Omit<NotebookControl, 'id'>) => {
    const newCtrl: NotebookControl = { ...control, id: 'nb-' + Date.now() + Math.random().toString(36).substring(2, 5) };
    setNotebookControls((prev) => [...prev, newCtrl]);
    saveNotebookControlToFirebase(user.id, newCtrl);
  };

  // Quiz Definition Handlers
  const handleAddQuizDefinition = (quizData: Omit<Quiz, 'id'>) => {
    const newDef: Quiz = { ...quizData, id: 'quiz-def-' + Date.now() };
    setQuizDefinitions((prev) => [...prev, newDef]);
    saveQuizDefinitionToFirebase(user.id, newDef);
    return newDef;
  };

  const handleUpdateQuizDefinition = (updatedQuiz: Quiz) => {
    setQuizDefinitions((prev) => prev.map((q) => (q.id === updatedQuiz.id ? updatedQuiz : q)));
    saveQuizDefinitionToFirebase(user.id, updatedQuiz);

    // Update titles on related QuizScore items if title or date changed
    setQuizzes((prev) =>
      prev.map((qs) => {
        if (qs.quizId === updatedQuiz.id) {
          const updated = { ...qs, quizTitle: updatedQuiz.title, date: updatedQuiz.date };
          saveQuizScoreToFirebase(user.id, updated);
          return updated;
        }
        return qs;
      })
    );
  };

  const handleSoftDeleteQuizDefinition = (quizId: string) => {
    const deletedAt = new Date().toISOString();
    setQuizDefinitions((prev) =>
      prev.map((q) => (q.id === quizId ? { ...q, isDeleted: true, deletedAt } : q))
    );
    const target = quizDefinitions.find((q) => q.id === quizId);
    if (target) {
      saveQuizDefinitionToFirebase(user.id, { ...target, isDeleted: true, deletedAt });
    }
  };

  const handleRestoreQuizDefinition = (quizId: string) => {
    setQuizDefinitions((prev) =>
      prev.map((q) => {
        if (q.id === quizId) {
          const restored = { ...q, isDeleted: false };
          delete restored.deletedAt;
          return restored;
        }
        return q;
      })
    );
    const target = quizDefinitions.find((q) => q.id === quizId);
    if (target) {
      const restored = { ...target, isDeleted: false };
      delete restored.deletedAt;
      saveQuizDefinitionToFirebase(user.id, restored);
    }
  };

  const handlePermanentDeleteQuizDefinition = (quizId: string) => {
    setQuizDefinitions((prev) => prev.filter((q) => q.id !== quizId));
    deleteQuizDefinitionFromFirebase(user.id, quizId);

    // Delete associated scores
    const scoresToDelete = quizzes.filter((qs) => qs.quizId === quizId);
    setQuizzes((prev) => prev.filter((qs) => qs.quizId !== quizId));
    scoresToDelete.forEach((qs) => deleteQuizScoreFromFirebase(user.id, qs.id));
  };

  const handleSaveQuizScore = (score: Omit<QuizScore, 'id'>) => {
    let scoreToSave: QuizScore;
    setQuizzes((prev) => {
      const existingIdx = prev.findIndex(
        (q) => (score.quizId ? q.quizId === score.quizId : q.quizTitle === score.quizTitle) && q.studentId === score.studentId
      );
      if (existingIdx >= 0) {
        const updated = [...prev];
        scoreToSave = { ...updated[existingIdx], ...score };
        updated[existingIdx] = scoreToSave;
        return updated;
      }
      scoreToSave = { ...score, id: 'qz-' + Date.now() + Math.random().toString(36).substring(2, 5) };
      return [...prev, scoreToSave];
    });
    setTimeout(() => {
      if (scoreToSave) saveQuizScoreToFirebase(user.id, scoreToSave);
    }, 50);
  };

  const handleBatchSaveQuizScores = (scores: Omit<QuizScore, 'id'>[]) => {
    scores.forEach((s) => handleSaveQuizScore(s));
  };

  const handleAddHomework = (hw: Omit<Homework, 'id'>) => {
    const newHW: Homework = { ...hw, id: 'hw-' + Date.now() };
    setHomeworks((prev) => [...prev, newHW]);
    saveHomeworkToFirebase(user.id, newHW);
  };

  const handleUpdateHomework = (updatedHw: Homework) => {
    setHomeworks((prev) => prev.map((h) => (h.id === updatedHw.id ? updatedHw : h)));
    saveHomeworkToFirebase(user.id, updatedHw);
  };

  const handleSoftDeleteHomework = (hwId: string) => {
    const deletedAt = new Date().toISOString();
    setHomeworks((prev) =>
      prev.map((h) => (h.id === hwId ? { ...h, isDeleted: true, deletedAt } : h))
    );
    const target = homeworks.find((h) => h.id === hwId);
    if (target) {
      saveHomeworkToFirebase(user.id, { ...target, isDeleted: true, deletedAt });
    }
  };

  const handleRestoreHomework = (hwId: string) => {
    setHomeworks((prev) =>
      prev.map((h) => {
        if (h.id === hwId) {
          const restored = { ...h, isDeleted: false };
          delete restored.deletedAt;
          return restored;
        }
        return h;
      })
    );
    const target = homeworks.find((h) => h.id === hwId);
    if (target) {
      const restored = { ...target, isDeleted: false };
      delete restored.deletedAt;
      saveHomeworkToFirebase(user.id, restored);
    }
  };

  const handlePermanentDeleteHomework = (hwId: string) => {
    setHomeworks((prev) => prev.filter((h) => h.id !== hwId));
    deleteHomeworkFromFirebase(user.id, hwId);

    // Delete associated homework records
    const recordsToDelete = homeworkRecords.filter((r) => r.homeworkId === hwId);
    setHomeworkRecords((prev) => prev.filter((r) => r.homeworkId !== hwId));
    recordsToDelete.forEach((r) => deleteHomeworkRecordFromFirebase(user.id, r.id));
  };

  const handleUpdateHomeworkRecord = (record: Omit<HomeworkRecord, 'id'>) => {
    let recToSave: HomeworkRecord;
    setHomeworkRecords((prev) => {
      const existingIdx = prev.findIndex(
        (r) => r.homeworkId === record.homeworkId && r.studentId === record.studentId
      );
      if (existingIdx >= 0) {
        const updated = [...prev];
        recToSave = { ...updated[existingIdx], ...record };
        updated[existingIdx] = recToSave;
        return updated;
      }
      recToSave = { ...record, id: 'hwr-' + Date.now() + Math.random().toString(36).substring(2, 5) };
      return [...prev, recToSave];
    });
    setTimeout(() => {
      if (recToSave) saveHomeworkRecordToFirebase(user.id, recToSave);
    }, 50);
  };

  const handleBatchUpdateHomeworkRecords = (records: Omit<HomeworkRecord, 'id'>[]) => {
    records.forEach((record) => {
      handleUpdateHomeworkRecord(record);
    });
  };

  const handleSaveStudent = (studentData: Omit<Student, 'id'> | Student) => {
    if ('id' in studentData && studentData.id) {
      const updatedStd = studentData as Student;
      setStudents((prev) => prev.map((s) => (s.id === studentData.id ? updatedStd : s)));
      saveStudentToFirebase(user.id, updatedStd);
    } else {
      const newStd: Student = {
        ...(studentData as Omit<Student, 'id'>),
        id: 'std-' + Date.now(),
      };
      setStudents((prev) => [...prev, newStd]);
      saveStudentToFirebase(user.id, newStd);
    }
  };

  const handleBulkAddStudents = (
    newStudents: Omit<Student, 'id'>[],
    targetClassId?: string,
    newClassName?: string
  ) => {
    let targetId = targetClassId || selectedClassId;

    if (newClassName && newClassName.trim()) {
      const created: ClassRoom = {
        id: 'class-' + Date.now(),
        name: newClassName.trim(),
        grade: newClassName.match(/\d+/)?.[0] || '9',
        subject: 'Genel',
        term: '2024-2025',
        createdAt: new Date().toISOString().slice(0, 10),
      };
      setClasses((prev) => [...prev, created]);
      saveClassToFirebase(user.id, created);
      targetId = created.id;
      setSelectedClassId(created.id);
    }

    const prepared: Student[] = newStudents.map((s, idx) => ({
      ...s,
      classId: targetId,
      id: 'std-bulk-' + Date.now() + '-' + idx,
    }));
    setStudents((prev) => [...prev, ...prepared]);
    prepared.forEach((st) => saveStudentToFirebase(user.id, st));
  };

  const handleAddClass = (newClass: Omit<ClassRoom, 'id' | 'createdAt'>) => {
    const created: ClassRoom = {
      ...newClass,
      id: 'class-' + Date.now(),
      createdAt: new Date().toISOString().slice(0, 10),
    };
    setClasses((prev) => [...prev, created]);
    setSelectedClassId(created.id);
    saveClassToFirebase(user.id, created);
  };

  const handleUpdateClass = (updatedClass: ClassRoom) => {
    setClasses((prev) => prev.map((c) => (c.id === updatedClass.id ? updatedClass : c)));
    saveClassToFirebase(user.id, updatedClass);
  };

  const handleDeleteClass = (
    classId: string,
    actionOnStudents: 'delete' | 'transfer',
    targetClassId?: string
  ) => {
    if (actionOnStudents === 'transfer' && targetClassId) {
      const studentIdsToTransfer = students.filter((s) => s.classId === classId).map((s) => s.id);
      handleTransferStudents(studentIdsToTransfer, targetClassId);
    } else if (actionOnStudents === 'delete') {
      const studentIdsToDelete = students.filter((s) => s.classId === classId).map((s) => s.id);
      handleDeleteMultipleStudents(studentIdsToDelete);
    }

    setClasses((prev) => prev.filter((c) => c.id !== classId));
    deleteClassFromFirebase(user.id, classId);

    if (selectedClassId === classId) {
      const remaining = classes.filter((c) => c.id !== classId);
      if (remaining.length > 0) setSelectedClassId(remaining[0].id);
    }
  };

  const handleDeleteStudent = (studentId: string) => {
    setStudents((prev) => prev.filter((s) => s.id !== studentId));
    deleteStudentFromFirebase(user.id, studentId);
  };

  const handleDeleteMultipleStudents = (studentIds: string[]) => {
    setStudents((prev) => prev.filter((s) => !studentIds.includes(s.id)));
    studentIds.forEach((id) => deleteStudentFromFirebase(user.id, id));
  };

  const handleTransferStudents = (studentIds: string[], targetClassId: string) => {
    setStudents((prev) =>
      prev.map((s) => {
        if (studentIds.includes(s.id)) {
          const updated = { ...s, classId: targetClassId };
          saveStudentToFirebase(user.id, updated);
          return updated;
        }
        return s;
      })
    );
  };

  const handleUpdateWeights = (newWeights: WeightSettings) => {
    setWeights(newWeights);
    saveWeightsToFirebase(user.id, newWeights);
  };

  const handleUpdateNotifications = (newNotifs: NotificationSetting[]) => {
    setNotifications(newNotifs);
    newNotifs.forEach((n) => saveNotificationSettingToFirebase(user.id, n));
  };

  const handleAddFeedbackLog = (log: ParentFeedbackLog) => {
    setFeedbackLogs((prev) => [log, ...prev]);
    saveFeedbackLogToFirebase(user.id, log);
  };

  // Schedule Handlers (Optional Feature with Cloud & Local Persistence)
  const handleSaveScheduleLesson = (lessonData: Omit<ScheduleLesson, 'id'>, isBatchMode: boolean) => {
    const newLesson: ScheduleLesson = {
      ...lessonData,
      id: 'lesson-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
    };
    setScheduleLessons((prev) => {
      // Remove any existing lesson at the exact same day & period to prevent collision
      const filtered = prev.filter((l) => !(l.day === lessonData.day && l.period === lessonData.period));
      return [...filtered, newLesson];
    });
    saveScheduleLessonToFirebase(user.id, newLesson);
  };

  const handleUpdateScheduleLesson = (lesson: ScheduleLesson) => {
    setScheduleLessons((prev) => prev.map((l) => (l.id === lesson.id ? lesson : l)));
    saveScheduleLessonToFirebase(user.id, lesson);
  };

  const handleDeleteScheduleLesson = (lessonId: string) => {
    setScheduleLessons((prev) => prev.filter((l) => l.id !== lessonId));
    deleteScheduleLessonFromFirebase(user.id, lessonId);
  };

  const handleClearAllScheduleLessons = () => {
    setScheduleLessons([]);
    clearAllScheduleLessonsFromFirebase(user.id, scheduleLessons);
  };

  const handleLoadInitialScheduleTemplate = () => {
    setScheduleLessons(INITIAL_SCHEDULE_LESSONS);
    batchSaveScheduleLessonsToFirebase(user.id, INITIAL_SCHEDULE_LESSONS);
  };

  const handleSaveScheduleConfig = (newConfig: ScheduleConfig) => {
    setScheduleConfig(newConfig);
    Storage.setScheduleConfig(user.id, newConfig);
    saveScheduleConfigToFirebase(user.id, newConfig);
  };

  // Strictly enforce authentication gate: When logged out, only show LoginPage
  if (!user || user.isLoggedIn === false) {
    return <LoginPage onLogin={handleUpdateUser} />;
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-800 antialiased selection:bg-indigo-100 selection:text-indigo-900">
      <div className="flex-1 w-full max-w-lg md:max-w-3xl lg:max-w-4xl mx-auto bg-slate-50 min-h-screen shadow-xl border-x border-slate-200/80 flex flex-col relative">
        {/* Top Sticky Header */}
        <Header
          user={user}
          classes={classes}
          selectedClassId={selectedClassId}
          onSelectClass={setSelectedClassId}
          onOpenAuth={() => setIsAuthOpen(true)}
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          onOpenAddClass={() => setIsClassModalOpen(true)}
          academicYearConfig={academicYearConfig}
          onOpenAcademicSettings={() => setIsAcademicSettingsOpen(true)}
        />

        {/* Main View Container */}
        <main className="flex-1 p-4 overflow-y-auto">
          {user.role === 'parent' || activeTab === 'parent-portal' ? (
            <ParentPortalView
              user={user}
              students={students}
              classes={classes}
              plusMinusLogs={plusMinusLogs}
              quizzes={quizzes}
              homeworkRecords={homeworkRecords}
              notebookControls={notebookControls}
              weights={weights}
            />
          ) : (
            <>
              {activeTab === 'dashboard' && (
                <DashboardView
                  classes={classes}
                  selectedClassId={selectedClassId}
                  onSelectClass={setSelectedClassId}
                  students={students}
                  plusMinusLogs={plusMinusLogs}
                  quizzes={quizzes}
                  homeworkRecords={homeworkRecords}
                  notebookControls={notebookControls}
                  weights={weights}
                  onNavigateTab={setActiveTab}
                  onOpenAddStudent={() => {
                    setEditingStudent(null);
                    setIsStudentModalOpen(true);
                  }}
                  onOpenBulkImport={() => setIsBulkImportOpen(true)}
                  onOpenLuckyDraw={() => setIsLuckyDrawOpen(true)}
                  onOpenAddClassModal={() => setIsClassModalOpen(true)}
                  academicYearConfig={academicYearConfig}
                  onOpenAcademicSettings={() => setIsAcademicSettingsOpen(true)}
                />
              )}

              {activeTab === 'quick-score' && (
                currentClass ? (
                  <QuickScoreView
                    currentClass={currentClass}
                    students={students}
                    plusMinusLogs={plusMinusLogs}
                    onAddLog={handleAddPlusMinusLog}
                    onDeleteLog={handleDeletePlusMinusLog}
                    onOpenLuckyDraw={() => setIsLuckyDrawOpen(true)}
                    quizzes={quizzes}
                    homeworks={homeworks}
                    homeworkRecords={homeworkRecords}
                    notebookControls={notebookControls}
                    weights={weights}
                  />
                ) : (
                  <NoClassGuideView
                    tabKey="quick-score"
                    tabName="Pratik + / - (Canlı Puanlama)"
                    onOpenAddClass={() => setIsClassModalOpen(true)}
                    onNavigateManagement={() => setActiveTab('management')}
                    onOpenBulkImport={() => setIsBulkImportOpen(true)}
                    onOpenPdfImport={() => setIsPdfImportOpen(true)}
                  />
                )
              )}

              {activeTab === 'notebook' && (
                currentClass ? (
                  <NotebookView
                    currentClass={currentClass}
                    students={students}
                    notebookControls={notebookControls}
                    onSaveNotebookControl={handleSaveNotebookControl}
                    plusMinusLogs={plusMinusLogs}
                    quizzes={quizzes}
                    homeworks={homeworks}
                    homeworkRecords={homeworkRecords}
                    weights={weights}
                  />
                ) : (
                  <NoClassGuideView
                    tabKey="notebook"
                    tabName="Defter Kontrolü"
                    onOpenAddClass={() => setIsClassModalOpen(true)}
                    onNavigateManagement={() => setActiveTab('management')}
                    onOpenBulkImport={() => setIsBulkImportOpen(true)}
                    onOpenPdfImport={() => setIsPdfImportOpen(true)}
                  />
                )
              )}

              {(activeTab === 'quiz' || activeTab === 'homework' || activeTab === 'quiz-hw') && (
                currentClass ? (
                  <QuizAndHomeworkView
                    currentClass={currentClass}
                    students={students}
                    quizDefinitions={quizDefinitions}
                    quizzes={quizzes}
                    homeworks={homeworks}
                    homeworkRecords={homeworkRecords}
                    initialSubTab={activeTab === 'homework' ? 'homeworks' : 'quizzes'}
                    hideSubTabs={true}
                    onAddQuizDefinition={handleAddQuizDefinition}
                    onUpdateQuizDefinition={handleUpdateQuizDefinition}
                    onSoftDeleteQuizDefinition={handleSoftDeleteQuizDefinition}
                    onRestoreQuizDefinition={handleRestoreQuizDefinition}
                    onPermanentDeleteQuizDefinition={handlePermanentDeleteQuizDefinition}
                    onSaveQuizScore={handleSaveQuizScore}
                    onBatchSaveQuizScores={handleBatchSaveQuizScores}
                    onAddHomework={handleAddHomework}
                    onUpdateHomework={handleUpdateHomework}
                    onSoftDeleteHomework={handleSoftDeleteHomework}
                    onRestoreHomework={handleRestoreHomework}
                    onPermanentDeleteHomework={handlePermanentDeleteHomework}
                    onUpdateHomeworkRecord={handleUpdateHomeworkRecord}
                    onBatchUpdateHomeworkRecords={handleBatchUpdateHomeworkRecords}
                  />
                ) : (
                  <NoClassGuideView
                    tabKey={activeTab}
                    tabName={activeTab === 'homework' ? "Ödev Takibi" : "Quiz Takibi"}
                    onOpenAddClass={() => setIsClassModalOpen(true)}
                    onNavigateManagement={() => setActiveTab('management')}
                    onOpenBulkImport={() => setIsBulkImportOpen(true)}
                    onOpenPdfImport={() => setIsPdfImportOpen(true)}
                  />
                )
              )}

              {activeTab === 'management' && (
                <ClassAndStudentManagementView
                  classes={classes}
                  students={students}
                  selectedClassId={selectedClassId}
                  onSelectClass={setSelectedClassId}
                  onAddClass={handleAddClass}
                  onUpdateClass={handleUpdateClass}
                  onDeleteClass={handleDeleteClass}
                  onSaveStudent={handleSaveStudent}
                  onDeleteStudent={handleDeleteStudent}
                  onDeleteMultipleStudents={handleDeleteMultipleStudents}
                  onTransferStudents={handleTransferStudents}
                  onOpenBulkImport={() => setIsBulkImportOpen(true)}
                  onOpenPdfImport={() => setIsPdfImportOpen(true)}
                  onOpenAddClassModal={() => setIsClassModalOpen(true)}
                />
              )}

              {activeTab === 'reports' && (
                currentClass ? (
                  <ReportsView
                    currentClass={currentClass}
                    students={students}
                    plusMinusLogs={plusMinusLogs}
                    quizzes={quizzes}
                    homeworks={homeworks}
                    homeworkRecords={homeworkRecords}
                    notebookControls={notebookControls}
                    weights={weights}
                    onUpdateWeights={handleUpdateWeights}
                    academicYearConfig={academicYearConfig}
                    onOpenAcademicSettings={() => setIsAcademicSettingsOpen(true)}
                  />
                ) : (
                  <NoClassGuideView
                    tabKey="reports"
                    tabName="Raporlar ve Karne Notları"
                    onOpenAddClass={() => setIsClassModalOpen(true)}
                    onNavigateManagement={() => setActiveTab('management')}
                    onOpenBulkImport={() => setIsBulkImportOpen(true)}
                    onOpenPdfImport={() => setIsPdfImportOpen(true)}
                  />
                )
              )}

              {activeTab === 'feedback' && (
                <FeedbackView
                  currentClass={currentClass}
                  students={students}
                  plusMinusLogs={plusMinusLogs}
                  quizzes={quizzes}
                  homeworkRecords={homeworkRecords}
                  notebookControls={notebookControls}
                  weights={weights}
                  notifications={notifications}
                  onUpdateNotifications={handleUpdateNotifications}
                  feedbackLogs={feedbackLogs}
                  onAddFeedbackLog={handleAddFeedbackLog}
                  academicYearConfig={academicYearConfig}
                  quizDefinitions={quizDefinitions}
                  homeworks={homeworks}
                  onRestoreQuizDefinition={handleRestoreQuizDefinition}
                  onPermanentDeleteQuizDefinition={handlePermanentDeleteQuizDefinition}
                  onRestoreHomework={handleRestoreHomework}
                  onPermanentDeleteHomework={handlePermanentDeleteHomework}
                  onOpenAcademicSettings={() => setIsAcademicSettingsOpen(true)}
                  onNavigateTab={setActiveTab}
                  onOpenAddClassModal={() => setIsClassModalOpen(true)}
                />
              )}

              {activeTab === 'schedule' && (
                <ScheduleView
                  config={scheduleConfig}
                  lessons={scheduleLessons}
                  classes={classes}
                  onSaveLesson={handleSaveScheduleLesson}
                  onUpdateLesson={handleUpdateScheduleLesson}
                  onDeleteLesson={handleDeleteScheduleLesson}
                  onClearAllLessons={handleClearAllScheduleLessons}
                  onLoadInitialTemplate={handleLoadInitialScheduleTemplate}
                  onSaveConfig={handleSaveScheduleConfig}
                  onSelectClass={(classId) => {
                    setSelectedClassId(classId);
                    setActiveTab('dashboard');
                  }}
                  onBackToDashboard={() => setActiveTab('dashboard')}
                />
              )}
            </>
          )}
        </main>

        {/* Mobile Fixed Bottom Navigation Bar */}
        <MobileBottomNav
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          role={user.role}
        />
      </div>

      {/* Modals */}
      <ProfileModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        currentUser={user}
        onUpdateUser={handleUpdateUser}
        luckyDrawSettings={luckyDrawSettings}
        onUpdateLuckyDrawSettings={handleUpdateLuckyDrawSettings}
        isCloudConnected={isCloudConnected}
        onOpenSchedule={() => setActiveTab('schedule')}
        onOpenTeacherManagement={() => setIsTeacherManagementOpen(true)}
      />

      <TeacherManagementModal
        isOpen={isTeacherManagementOpen}
        onClose={() => setIsTeacherManagementOpen(false)}
        currentUser={user}
      />

      <StudentModal
        isOpen={isStudentModalOpen}
        onClose={() => setIsStudentModalOpen(false)}
        classId={selectedClassId}
        studentToEdit={editingStudent}
        onSaveStudent={handleSaveStudent}
      />

      <BulkImportModal
        isOpen={isBulkImportOpen}
        onClose={() => setIsBulkImportOpen(false)}
        classId={selectedClassId}
        onBulkAddStudents={handleBulkAddStudents}
      />

      <PdfImportModal
        isOpen={isPdfImportOpen}
        onClose={() => setIsPdfImportOpen(false)}
        classes={classes}
        selectedClassId={selectedClassId}
        onBulkAddStudents={handleBulkAddStudents}
      />

      <ClassModal
        isOpen={isClassModalOpen}
        onClose={() => setIsClassModalOpen(false)}
        onAddClass={handleAddClass}
      />

      <AcademicYearSettingsModal
        isOpen={isAcademicSettingsOpen}
        onClose={() => setIsAcademicSettingsOpen(false)}
        config={academicYearConfig}
        onSaveConfig={handleSaveAcademicYearConfig}
      />

      {currentClass && (
        <LuckyDrawModal
          isOpen={isLuckyDrawOpen}
          onClose={() => setIsLuckyDrawOpen(false)}
          currentClass={currentClass}
          students={students}
          savedSettings={luckyDrawSettings}
          onUpdateSettings={handleUpdateLuckyDrawSettings}
          onAddPlusPoint={(studentId) => {
            handleAddPlusMinusLog({
              studentId,
              classId: currentClass.id,
              date: new Date().toISOString().slice(0, 10),
              type: 'plus',
              category: 'Ders Katılımı',
              note: 'Kura / Şans Çarkı',
            });
          }}
        />
      )}
    </div>
  );
}

