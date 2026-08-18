import React, { useState, useEffect, useRef } from 'react';
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
  AuditLog,
  PlusMinusCategory,
  NotebookStatus,
  AnnualPlanItem,
  NotificationSettingsConfig,
  RiskRadarConfig,
  LessonLogNote,
  DashboardLayoutConfig,
} from './types';
import { DEFAULT_RISK_RADAR_CONFIG } from './utils/studentRiskUtils';
import { useCurrentLessonTracker } from './utils/currentLessonTracker';

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
import { WeeklySummaryView } from './components/WeeklySummaryView';
import { TrashBinView } from './components/TrashBinView';
import { AuditLogView } from './components/AuditLogView';
import { AnnualPlanDetailView } from './components/AnnualPlanDetailView';
import { StudentRiskRadarView } from './components/StudentRiskRadarView';
import { LoginPage } from './components/auth/LoginPage';
import { NoClassGuideView } from './components/NoClassGuideView';
import { LessonLogTimelineView } from './components/lessonLog/LessonLogTimelineView';
import { QuickLessonLogModal } from './components/lessonLog/QuickLessonLogModal';
import { DashboardCustomizeModal } from './components/DashboardCustomizeModal';

import { ProfileModal } from './components/ProfileModal';
import { TeacherManagementModal } from './components/TeacherManagementModal';
import { StudentModal } from './components/StudentModal';
import { BulkImportModal } from './components/BulkImportModal';
import { PdfImportModal } from './components/PdfImportModal';
import { ClassModal } from './components/ClassModal';
import { LuckyDrawModal } from './components/LuckyDrawModal';
import { AcademicYearSettingsModal } from './components/AcademicYearSettingsModal';
import { AnnualPlanDetailModal } from './components/AnnualPlanDetailModal';
import { NotificationSettingsModal } from './components/NotificationSettingsModal';

import { DEFAULT_SCHEDULE_CONFIG, INITIAL_SCHEDULE_LESSONS } from './utils/scheduleUtils';
import { getCurrentAcademicWeek } from './utils/termUtils';
import { buildAuditLog, CreateAuditLogParams } from './utils/auditLogger';

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
  subscribeAuditLogs,
  saveAuditLogToFirebase,
  deleteAuditLogFromFirebase,
  clearAllAuditLogsFromFirebase,
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
  deleteNotebookControlFromFirebase,
  saveWeightsToFirebase,
  saveNotificationSettingToFirebase,
  saveFeedbackLogToFirebase,
  subscribeAcademicYearConfig,
  saveAcademicYearConfigToFirebase,
  subscribeAnnualPlans,
  batchSaveAnnualPlansToFirebase,
  subscribeNotificationConfig,
  saveNotificationConfigToFirebase,
  subscribeLessonLogs,
  saveLessonLogToFirebase,
  deleteLessonLogFromFirebase,
  subscribeDashboardLayout,
  saveDashboardLayoutToFirebase,
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
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(Storage.getAuditLogs(user.id));

  // Academic Year / Term Configuration State
  const [academicYearConfig, setAcademicYearConfig] = useState<AcademicYearConfig>(
    Storage.getAcademicYearConfig(user.id)
  );

  // Class Schedule State (Optional Feature)
  const [scheduleConfig, setScheduleConfig] = useState<ScheduleConfig>(Storage.getScheduleConfig(user.id));
  const [scheduleLessons, setScheduleLessons] = useState<ScheduleLesson[]>(Storage.getScheduleLessons(user.id));

  // Annual Curriculum Plan State
  const [annualPlanItems, setAnnualPlanItems] = useState<AnnualPlanItem[]>(Storage.getAnnualPlans(user.id));
  const [lessonLogs, setLessonLogs] = useState<LessonLogNote[]>(Storage.getLessonLogs(user.id));
  const [isLessonLogModalOpen, setIsLessonLogModalOpen] = useState<boolean>(false);
  const [lessonLogClassId, setLessonLogClassId] = useState<string>('');
  const [editingLessonLog, setEditingLessonLog] = useState<LessonLogNote | null>(null);
  const [selectedPlanDetail, setSelectedPlanDetail] = useState<{
    isOpen: boolean;
    grade: string;
    classNameTitle: string;
    week: number;
  } | null>(null);

  // Cloud sync state
  const [isCloudConnected, setIsCloudConnected] = useState<boolean>(true);

  // Notification Alerts Configuration State
  const [notificationConfig, setNotificationConfig] = useState<NotificationSettingsConfig>(
    Storage.getNotificationConfig(user.id)
  );

  // Student Risk Radar Configuration State
  const [riskConfig, setRiskConfig] = useState<RiskRadarConfig>(
    Storage.getRiskConfig(user.id)
  );

  // Dashboard Layout Configuration State
  const [dashboardLayout, setDashboardLayout] = useState<DashboardLayoutConfig>(
    Storage.getDashboardLayout(user.id)
  );

  // Navigation State
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [targetHomeworkId, setTargetHomeworkId] = useState<string | undefined>(undefined);
  const [targetQuizId, setTargetQuizId] = useState<string | undefined>(undefined);

  const handleNavigateTab = (tab: string, itemId?: string) => {
    if (tab === 'homework') {
      setActiveTab('homework');
      if (itemId) setTargetHomeworkId(itemId);
    } else if (tab === 'quiz') {
      setActiveTab('quiz');
      if (itemId) setTargetQuizId(itemId);
    } else if (tab === 'quiz-hw') {
      setActiveTab('homework');
      if (itemId) setTargetHomeworkId(itemId);
    } else {
      setActiveTab(tab);
    }
  };

  // Modals
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);
  const [isStudentModalOpen, setIsStudentModalOpen] = useState<boolean>(false);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState<boolean>(false);
  const [isPdfImportOpen, setIsPdfImportOpen] = useState<boolean>(false);
  const [isClassModalOpen, setIsClassModalOpen] = useState<boolean>(false);
  const [isLuckyDrawOpen, setIsLuckyDrawOpen] = useState<boolean>(false);
  const [isAcademicSettingsOpen, setIsAcademicSettingsOpen] = useState<boolean>(false);
  const [isTeacherManagementOpen, setIsTeacherManagementOpen] = useState<boolean>(false);
  const [isNotificationSettingsOpen, setIsNotificationSettingsOpen] = useState<boolean>(false);
  const [isDashboardCustomizeOpen, setIsDashboardCustomizeOpen] = useState<boolean>(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  // Live Lesson Tracker & Automatic Class Switching
  const { status: liveLessonStatus } = useCurrentLessonTracker(scheduleConfig, scheduleLessons, classes);
  const lastSwitchedLessonKeyRef = useRef<string | null>(null);
  const [autoSwitchNotice, setAutoSwitchNotice] = useState<{ lessonTitle: string; className: string } | null>(null);

  // Auto-switch active class context when a new scheduled lesson begins
  useEffect(() => {
    if (liveLessonStatus.state === 'ONGOING' && liveLessonStatus.currentLesson && liveLessonStatus.currentClassId) {
      const lessonKey = `${liveLessonStatus.currentLesson.id}-${liveLessonStatus.currentLesson.day}-${liveLessonStatus.currentLesson.period}`;
      
      if (lastSwitchedLessonKeyRef.current !== lessonKey) {
        lastSwitchedLessonKeyRef.current = lessonKey;
        
        const matchedClass = classes.find((c) => c.id === liveLessonStatus.currentClassId);
        if (matchedClass && selectedClassId !== matchedClass.id) {
          setSelectedClassId(matchedClass.id);
          setAutoSwitchNotice({
            lessonTitle: liveLessonStatus.currentLesson.title || liveLessonStatus.currentLesson.shortName,
            className: matchedClass.name,
          });
          setTimeout(() => setAutoSwitchNotice(null), 6000);
        }
      }
    }
  }, [liveLessonStatus.state, liveLessonStatus.currentLesson, liveLessonStatus.currentClassId, classes, selectedClassId]);

  const currentClass = classes.find((c) => c.id === selectedClassId) || classes[0];

  // Auto-sync state to user-partitioned LocalStorage
  useEffect(() => Storage.setUser(user), [user]);
  useEffect(() => { if (user?.id) Storage.setLuckyDrawSettings(user.id, luckyDrawSettings); }, [luckyDrawSettings, user?.id]);
  useEffect(() => { if (user?.id) Storage.setAcademicYearConfig(user.id, academicYearConfig); }, [academicYearConfig, user?.id]);
  useEffect(() => { if (user?.id) Storage.setNotificationConfig(user.id, notificationConfig); }, [notificationConfig, user?.id]);
  useEffect(() => { if (user?.id) Storage.setDashboardLayout(user.id, dashboardLayout); }, [dashboardLayout, user?.id]);
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
  useEffect(() => { if (user?.id) Storage.setAuditLogs(user.id, auditLogs); }, [auditLogs, user?.id]);
  useEffect(() => { if (user?.id) Storage.setScheduleConfig(user.id, scheduleConfig); }, [scheduleConfig, user?.id]);
  useEffect(() => { if (user?.id) Storage.setScheduleLessons(user.id, scheduleLessons); }, [scheduleLessons, user?.id]);
  useEffect(() => { if (user?.id) Storage.setAnnualPlans(user.id, annualPlanItems); }, [annualPlanItems, user?.id]);
  useEffect(() => { if (user?.id) Storage.setLessonLogs(user.id, lessonLogs); }, [lessonLogs, user?.id]);
  useEffect(() => { if (user?.id) Storage.setRiskConfig(user.id, riskConfig); }, [riskConfig, user?.id]);

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
    setAuditLogs(Storage.getAuditLogs(currentUserId));
    setScheduleConfig(Storage.getScheduleConfig(currentUserId));
    setScheduleLessons(Storage.getScheduleLessons(currentUserId));
    setAnnualPlanItems(Storage.getAnnualPlans(currentUserId));
    setLessonLogs(Storage.getLessonLogs(currentUserId));
    setLuckyDrawSettings(user.luckyDrawSettings || Storage.getLuckyDrawSettings(currentUserId));
    setAcademicYearConfig(Storage.getAcademicYearConfig(currentUserId));
    setNotificationConfig(Storage.getNotificationConfig(currentUserId));
    setDashboardLayout(Storage.getDashboardLayout(currentUserId));

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
    const unsubAuditLogs = subscribeAuditLogs(currentUserId, (data) => setAuditLogs(data));
    const unsubLessonLogs = subscribeLessonLogs(currentUserId, (data) => setLessonLogs(data));

    // Dashboard layout subscription
    const unsubDashboardLayout = subscribeDashboardLayout(currentUserId, (layout) => {
      if (layout) setDashboardLayout(layout);
    });

    // Notification config subscription
    const unsubNotifConfig = subscribeNotificationConfig(currentUserId, (config) => {
      if (config) setNotificationConfig(config);
    });

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

    // Annual Plans subscription
    const unsubAnnualPlans = subscribeAnnualPlans(currentUserId, (plans) => {
      if (plans) setAnnualPlanItems(plans);
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
      unsubAuditLogs();
      unsubDashboardLayout();
      unsubNotifConfig();
      unsubAcademicConfig();
      unsubScheduleConfig();
      unsubScheduleLessons();
      unsubAnnualPlans();
      unsubLessonLogs();
      unsubProfile();
      unsubWheelSettings();
    };
  }, [user.id, user.isLoggedIn]);

  // Dashboard Layout Save Handler
  const handleSaveDashboardLayout = (newLayout: DashboardLayoutConfig) => {
    setDashboardLayout(newLayout);
    Storage.setDashboardLayout(user.id, newLayout);
    if (user?.id) {
      saveDashboardLayoutToFirebase(user.id, newLayout);
    }
  };

  // Lesson Logs Handlers
  const handleSaveLessonLog = async (log: LessonLogNote) => {
    setLessonLogs((prev) => {
      const idx = prev.findIndex((l) => l.id === log.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = log;
        return next;
      }
      return [log, ...prev];
    });
    Storage.saveLessonLog(user.id, log);
    if (user?.id) {
      await saveLessonLogToFirebase(user.id, log);
    }
    addAuditLog({
      category: 'class',
      actionType: 'create',
      classId: log.classId,
      className: log.className,
      title: `${log.className || 'Sınıf'} - Ders Seyir Notu Kaydedildi`,
      description: `${log.lastTopic || ''} ${log.lastPageAndQuestion ? `(${log.lastPageAndQuestion})` : ''} - Bir sonraki ders için ${log.nextLessonActions?.length || 0} eylem planlandı.`,
    });
  };

  const handleDeleteLessonLog = async (logId: string) => {
    const target = lessonLogs.find((l) => l.id === logId);
    setLessonLogs((prev) => prev.filter((l) => l.id !== logId));
    Storage.deleteLessonLog(user.id, logId);
    if (user?.id) {
      await deleteLessonLogFromFirebase(user.id, logId);
    }
    if (target) {
      addAuditLog({
        category: 'class',
        actionType: 'delete',
        classId: target.classId,
        className: target.className,
        title: `${target.className || 'Sınıf'} - Ders Seyir Notu Silindi`,
        description: `Silinen not: ${target.date} - ${target.lastTopic || 'Ders Notu'}`,
      });
    }
  };

  const handleToggleLessonLogAction = async (logId: string, actionText: string) => {
    const target = lessonLogs.find((l) => l.id === logId);
    if (!target) return;
    const completed = target.completedActions || [];
    const isDone = completed.includes(actionText);
    const nextCompleted = isDone
      ? completed.filter((a) => a !== actionText)
      : [...completed, actionText];

    const updatedLog: LessonLogNote = {
      ...target,
      completedActions: nextCompleted,
    };

    handleSaveLessonLog(updatedLog);
  };

  const handleOpenNewLessonLogModal = (classId?: string, log?: LessonLogNote) => {
    setLessonLogClassId(classId || selectedClassId || classes[0]?.id || '');
    setEditingLessonLog(log || null);
    setIsLessonLogModalOpen(true);
  };

  // Centralized Audit Log Helper (Ayak İzi)
  const addAuditLog = (params: CreateAuditLogParams) => {
    const log = buildAuditLog({ ...params, user });
    setAuditLogs((prev) => [log, ...prev]);
    Storage.setAuditLogs(user.id, [log, ...auditLogs]);
    if (user.isLoggedIn) {
      saveAuditLogToFirebase(user.id, log);
    }
  };

  const handleDeleteAuditLog = (logId: string) => {
    setAuditLogs((prev) => prev.filter((l) => l.id !== logId));
    if (user.isLoggedIn) {
      deleteAuditLogFromFirebase(user.id, logId);
    }
  };

  const handleClearAllAuditLogs = () => {
    setAuditLogs([]);
    Storage.setAuditLogs(user.id, []);
    if (user.isLoggedIn) {
      clearAllAuditLogsFromFirebase(user.id);
    }
  };

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

  // Handlers for Data Mutations (Synchronized to Firebase + Local State + Audit Log)
  const handleAddPlusMinusLog = (log: Omit<PerformanceLog, 'id'>) => {
    const newLog: PerformanceLog = { ...log, id: 'pm-' + Date.now() + Math.random().toString(36).substring(2, 5) };
    setPlusMinusLogs((prev) => [...prev, newLog]);
    savePlusMinusLogToFirebase(user.id, newLog);

    const std = students.find((s) => s.id === log.studentId);
    const cls = classes.find((c) => c.id === log.classId);
    const studentName = std ? `${std.name} ${std.surname}` : 'Öğrenci';
    const typeLabel = log.type === 'plus' ? 'Artı (+1)' : 'Eksi (-1)';

    addAuditLog({
      category: 'plus_minus',
      actionType: 'create',
      title: `${studentName} için ${typeLabel} Verildi`,
      description: `${cls?.name || ''} sınıfında ${log.category} kategorisinde ${typeLabel} işlendi.${log.note ? ` Açıklama: ${log.note}` : ''}`,
      classId: log.classId,
      className: cls?.name,
      isBulk: false,
      affectedCount: 1,
      studentDetails: [
        {
          studentId: log.studentId,
          studentName,
          studentNumber: std?.number,
          changeSummary: `${log.category} -> ${typeLabel}${log.note ? ` (${log.note})` : ''}`,
          oldValue: '-',
          newValue: typeLabel,
        },
      ],
    });
  };

  const handleBatchAddPlusMinusLogs = (
    logs: Omit<PerformanceLog, 'id'>[],
    details: {
      studentId: string;
      studentName: string;
      studentNumber?: string;
      type: 'plus' | 'minus';
      category: PlusMinusCategory;
      note?: string;
    }[]
  ) => {
    const preparedLogs: PerformanceLog[] = logs.map((l, idx) => ({
      ...l,
      id: 'pm-batch-' + Date.now() + '-' + idx,
    }));
    setPlusMinusLogs((prev) => [...prev, ...preparedLogs]);
    preparedLogs.forEach((pl) => savePlusMinusLogToFirebase(user.id, pl));

    const classId = logs[0]?.classId;
    const cls = classes.find((c) => c.id === classId);
    const type = logs[0]?.type === 'plus' ? 'Artı (+1)' : 'Eksi (-1)';
    const category = logs[0]?.category || 'Ders Katılımı';

    addAuditLog({
      category: 'plus_minus',
      actionType: 'bulk_action',
      title: `${cls?.name || 'Sınıf'} Toplu ${type} Kaydı`,
      description: `${cls?.name || ''} sınıfındaki ${details.length} öğrenciye toplu "${category}" ${type} verildi.`,
      classId,
      className: cls?.name,
      isBulk: true,
      affectedCount: details.length,
      studentDetails: details.map((d) => ({
        studentId: d.studentId,
        studentName: d.studentName,
        studentNumber: d.studentNumber,
        changeSummary: `${category} -> ${type}${d.note ? ` (${d.note})` : ''}`,
        oldValue: '-',
        newValue: type,
      })),
    });
  };

  const handleUpdatePlusMinusLog = (updatedLog: PerformanceLog) => {
    setPlusMinusLogs((prev) => prev.map((l) => (l.id === updatedLog.id ? updatedLog : l)));
    savePlusMinusLogToFirebase(user.id, updatedLog);

    const std = students.find((s) => s.id === updatedLog.studentId);
    const cls = classes.find((c) => c.id === updatedLog.classId);
    const studentName = std ? `${std.name} ${std.surname}` : 'Öğrenci';

    addAuditLog({
      category: 'plus_minus',
      actionType: 'update',
      title: `${studentName} Katılım Puanı Güncellendi`,
      description: `${cls?.name || ''} sınıfında ${studentName} için ${updatedLog.category} puanı güncellendi.`,
      classId: updatedLog.classId,
      className: cls?.name,
      isBulk: false,
      affectedCount: 1,
      studentDetails: [
        {
          studentId: updatedLog.studentId,
          studentName,
          studentNumber: std?.number,
          changeSummary: `${updatedLog.category} -> ${updatedLog.type === 'plus' ? 'Artı (+1)' : 'Eksi (-1)'}`,
          newValue: updatedLog.type === 'plus' ? '+1' : '-1',
        },
      ],
    });
  };

  const handleDeletePlusMinusLog = (id: string) => {
    const deletedAt = new Date().toISOString();
    setPlusMinusLogs((prev) =>
      prev.map((l) => (l.id === id ? { ...l, isDeleted: true, deletedAt } : l))
    );
    const target = plusMinusLogs.find((l) => l.id === id);
    if (target) {
      savePlusMinusLogToFirebase(user.id, { ...target, isDeleted: true, deletedAt });
      const std = students.find((s) => s.id === target.studentId);
      const cls = classes.find((c) => c.id === target.classId);
      addAuditLog({
        category: 'trash',
        actionType: 'delete',
        title: `Katılım Puanı Çöp Kutusuna Taşındı`,
        description: `${std ? `${std.name} ${std.surname}` : 'Öğrenci'} için verilen ${target.type === 'plus' ? '+1' : '-1'} puan çöp kutusuna taşındı.`,
        classId: target.classId,
        className: cls?.name,
        isBulk: false,
        affectedCount: 1,
      });
    }
  };

  const handleRestorePlusMinusLog = (id: string) => {
    setPlusMinusLogs((prev) =>
      prev.map((l) => {
        if (l.id === id) {
          const restored = { ...l, isDeleted: false };
          delete restored.deletedAt;
          return restored;
        }
        return l;
      })
    );
    const target = plusMinusLogs.find((l) => l.id === id);
    if (target) {
      const restored = { ...target, isDeleted: false };
      delete restored.deletedAt;
      savePlusMinusLogToFirebase(user.id, restored);
      const std = students.find((s) => s.id === target.studentId);
      const cls = classes.find((c) => c.id === target.classId);
      addAuditLog({
        category: 'trash',
        actionType: 'restore',
        title: `Katılım Puanı Geri Yüklendi`,
        description: `${std ? `${std.name} ${std.surname}` : 'Öğrenci'} için puan çöp kutusundan geri yüklendi.`,
        classId: target.classId,
        className: cls?.name,
      });
    }
  };

  const handlePermanentDeletePlusMinusLog = (id: string) => {
    setPlusMinusLogs((prev) => prev.filter((l) => l.id !== id));
    deletePlusMinusLogFromFirebase(user.id, id);
    addAuditLog({
      category: 'trash',
      actionType: 'delete',
      title: `Katılım Puanı Kalıcı Olarak Silindi`,
      description: `Çöp kutusundan puan kaydı kalıcı olarak silindi.`,
    });
  };

  const handleSaveNotebookControl = (control: Omit<NotebookControl, 'id'>) => {
    const newCtrl: NotebookControl = { ...control, id: 'nb-' + Date.now() + Math.random().toString(36).substring(2, 5) };
    setNotebookControls((prev) => [...prev, newCtrl]);
    saveNotebookControlToFirebase(user.id, newCtrl);

    const std = students.find((s) => s.id === control.studentId);
    const cls = classes.find((c) => c.id === control.classId);
    const studentName = std ? `${std.name} ${std.surname}` : 'Öğrenci';

    const statusLabels: Record<string, string> = {
      full: 'Tam (%100)',
      partial: 'Yarım (%60)',
      missing: 'Eksik (%0)',
    };

    addAuditLog({
      category: 'notebook',
      actionType: 'create',
      title: `${studentName} Defter Kontrolü Kaydedildi`,
      description: `${cls?.name || ''} sınıfında ${studentName} için ${control.date} tarihli defter kontrolü (${statusLabels[control.status] || control.status}) kaydedildi.`,
      classId: control.classId,
      className: cls?.name,
      isBulk: false,
      affectedCount: 1,
      studentDetails: [
        {
          studentId: control.studentId,
          studentName,
          studentNumber: std?.number,
          changeSummary: `${statusLabels[control.status] || control.status} (${control.percentage}%)${control.note ? ` - ${control.note}` : ''}`,
          newValue: `${control.percentage}%`,
        },
      ],
    });
  };

  const handleBatchSaveNotebookControls = (
    controls: {
      studentId: string;
      studentName: string;
      studentNumber?: string;
      status: NotebookStatus;
      percentage: number;
      note?: string;
      existingId?: string;
    }[],
    date: string,
    classId: string,
    className: string
  ) => {
    controls.forEach((c) => {
      if (c.existingId) {
        const existing = notebookControls.find((n) => n.id === c.existingId);
        if (existing) {
          const updated = {
            ...existing,
            status: c.status,
            percentage: c.percentage,
            note: c.note,
          };
          setNotebookControls((prev) => prev.map((n) => (n.id === c.existingId ? updated : n)));
          saveNotebookControlToFirebase(user.id, updated);
        }
      } else {
        const newCtrl: NotebookControl = {
          id: 'nb-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
          studentId: c.studentId,
          classId,
          date,
          status: c.status,
          percentage: c.percentage,
          note: c.note,
        };
        setNotebookControls((prev) => [...prev, newCtrl]);
        saveNotebookControlToFirebase(user.id, newCtrl);
      }
    });

    const statusLabels: Record<NotebookStatus, string> = {
      full: 'Tam (%100)',
      partial: 'Yarım (%60)',
      missing: 'Eksik (%0)',
    };

    addAuditLog({
      category: 'notebook',
      actionType: 'bulk_action',
      title: `${className} Sınıfı Defter Kontrolü Kaydedildi`,
      description: `${date} tarihinde ${className} sınıfından ${controls.length} öğrencinin defter kontrolü toplu olarak işlendi.`,
      classId,
      className,
      isBulk: true,
      affectedCount: controls.length,
      studentDetails: controls.map((c) => ({
        studentId: c.studentId,
        studentName: c.studentName,
        studentNumber: c.studentNumber,
        changeSummary: `${statusLabels[c.status] || c.status} (${c.percentage}%)${c.note ? ` - Not: ${c.note}` : ''}`,
        newValue: `${c.percentage}% (${statusLabels[c.status] || c.status})`,
      })),
    });
  };

  const handleUpdateNotebookControl = (updatedCtrl: NotebookControl) => {
    setNotebookControls((prev) => prev.map((n) => (n.id === updatedCtrl.id ? updatedCtrl : n)));
    saveNotebookControlToFirebase(user.id, updatedCtrl);
  };

  const handleDeleteNotebookControl = (id: string) => {
    const deletedAt = new Date().toISOString();
    setNotebookControls((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isDeleted: true, deletedAt } : n))
    );
    const target = notebookControls.find((n) => n.id === id);
    if (target) {
      saveNotebookControlToFirebase(user.id, { ...target, isDeleted: true, deletedAt });
      const std = students.find((s) => s.id === target.studentId);
      const cls = classes.find((c) => c.id === target.classId);
      addAuditLog({
        category: 'trash',
        actionType: 'delete',
        title: `Defter Kontrolü Çöp Kutusuna Taşındı`,
        description: `${std ? `${std.name} ${std.surname}` : 'Öğrenci'} defter kontrolü çöp kutusuna taşındı.`,
        classId: target.classId,
        className: cls?.name,
      });
    }
  };

  const handleRestoreNotebookControl = (id: string) => {
    setNotebookControls((prev) =>
      prev.map((n) => {
        if (n.id === id) {
          const restored = { ...n, isDeleted: false };
          delete restored.deletedAt;
          return restored;
        }
        return n;
      })
    );
    const target = notebookControls.find((n) => n.id === id);
    if (target) {
      const restored = { ...target, isDeleted: false };
      delete restored.deletedAt;
      saveNotebookControlToFirebase(user.id, restored);
      const std = students.find((s) => s.id === target.studentId);
      const cls = classes.find((c) => c.id === target.classId);
      addAuditLog({
        category: 'trash',
        actionType: 'restore',
        title: `Defter Kontrolü Geri Yüklendi`,
        description: `${std ? `${std.name} ${std.surname}` : 'Öğrenci'} defter kontrolü geri yüklendi.`,
        classId: target.classId,
        className: cls?.name,
      });
    }
  };

  const handlePermanentDeleteNotebookControl = (id: string) => {
    setNotebookControls((prev) => prev.filter((n) => n.id !== id));
    deleteNotebookControlFromFirebase(user.id, id);
    addAuditLog({
      category: 'trash',
      actionType: 'delete',
      title: `Defter Kontrolü Kalıcı Silindi`,
      description: `Çöp kutusundan defter kontrol kaydı kalıcı olarak silindi.`,
    });
  };

  // Quiz Definition Handlers
  const handleAddQuizDefinition = (quizData: Omit<Quiz, 'id'>) => {
    const newDef: Quiz = { ...quizData, id: 'quiz-def-' + Date.now() };
    setQuizDefinitions((prev) => [...prev, newDef]);
    saveQuizDefinitionToFirebase(user.id, newDef);

    const cls = classes.find((c) => c.id === quizData.classId);
    addAuditLog({
      category: 'quiz',
      actionType: 'create',
      title: `"${quizData.title}" Quiz Tanımı Oluşturuldu`,
      description: `${cls?.name || ''} sınıfı için "${quizData.title}" quiz başlığı oluşturuldu.`,
      classId: quizData.classId,
      className: cls?.name,
    });

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

    const cls = classes.find((c) => c.id === updatedQuiz.classId);
    addAuditLog({
      category: 'quiz',
      actionType: 'update',
      title: `"${updatedQuiz.title}" Quiz Bilgisi Güncellendi`,
      description: `${cls?.name || ''} sınıfındaki quiz bilgileri güncellendi.`,
      classId: updatedQuiz.classId,
      className: cls?.name,
    });
  };

  const handleSoftDeleteQuizDefinition = (quizId: string) => {
    const deletedAt = new Date().toISOString();
    setQuizDefinitions((prev) =>
      prev.map((q) => (q.id === quizId ? { ...q, isDeleted: true, deletedAt } : q))
    );
    const target = quizDefinitions.find((q) => q.id === quizId);
    if (target) {
      saveQuizDefinitionToFirebase(user.id, { ...target, isDeleted: true, deletedAt });
      const cls = classes.find((c) => c.id === target.classId);
      addAuditLog({
        category: 'trash',
        actionType: 'delete',
        title: `"${target.title}" Quiz Çöp Kutusuna Taşındı`,
        description: `${cls?.name || ''} sınıfındaki "${target.title}" quiz çöp kutusuna taşındı.`,
        classId: target.classId,
        className: cls?.name,
      });
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
      const cls = classes.find((c) => c.id === target.classId);
      addAuditLog({
        category: 'trash',
        actionType: 'restore',
        title: `"${target.title}" Quiz Geri Yüklendi`,
        description: `${cls?.name || ''} sınıfındaki "${target.title}" quiz geri yüklendi.`,
        classId: target.classId,
        className: cls?.name,
      });
    }
  };

  const handlePermanentDeleteQuizDefinition = (quizId: string) => {
    const target = quizDefinitions.find((q) => q.id === quizId);
    setQuizDefinitions((prev) => prev.filter((q) => q.id !== quizId));
    deleteQuizDefinitionFromFirebase(user.id, quizId);

    // Delete associated scores
    const scoresToDelete = quizzes.filter((qs) => qs.quizId === quizId);
    setQuizzes((prev) => prev.filter((qs) => qs.quizId !== quizId));
    scoresToDelete.forEach((qs) => deleteQuizScoreFromFirebase(user.id, qs.id));

    addAuditLog({
      category: 'trash',
      actionType: 'delete',
      title: `"${target?.title || 'Quiz'}" Kalıcı Olarak Silindi`,
      description: `Quiz ve ilişkili ${scoresToDelete.length} adet not kaydı kalıcı olarak silindi.`,
    });
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

    const std = students.find((s) => s.id === score.studentId);
    const cls = classes.find((c) => c.id === score.classId);
    const quizDef = quizDefinitions.find((q) => q.id === score.quizId);
    const quizTitle = score.quizTitle || quizDef?.title || 'Quiz';
    const studentName = std ? `${std.name} ${std.surname}` : 'Öğrenci';
    const maxScore = quizDef?.maxScore || score.maxScore || 100;

    addAuditLog({
      category: 'quiz',
      actionType: 'create',
      title: `${studentName} Quiz Notu Kaydedildi`,
      description: `${cls?.name || ''} sınıfında ${studentName} öğrencisinin "${quizTitle}" notu (${score.score}/${maxScore}) kaydedildi.`,
      classId: score.classId,
      className: cls?.name,
      isBulk: false,
      affectedCount: 1,
      studentDetails: [
        {
          studentId: score.studentId,
          studentName,
          studentNumber: std?.number,
          changeSummary: `${quizTitle}: ${score.score} / ${maxScore}`,
          newValue: `${score.score} Puan`,
        },
      ],
    });
  };

  const handleBatchSaveQuizScores = (scores: Omit<QuizScore, 'id'>[]) => {
    scores.forEach((s) => {
      let scoreToSave: QuizScore;
      setQuizzes((prev) => {
        const existingIdx = prev.findIndex(
          (q) => (s.quizId ? q.quizId === s.quizId : q.quizTitle === s.quizTitle) && q.studentId === s.studentId
        );
        if (existingIdx >= 0) {
          const updated = [...prev];
          scoreToSave = { ...updated[existingIdx], ...s };
          updated[existingIdx] = scoreToSave;
          return updated;
        }
        scoreToSave = { ...s, id: 'qz-' + Date.now() + Math.random().toString(36).substring(2, 5) };
        return [...prev, scoreToSave];
      });
      setTimeout(() => {
        if (scoreToSave) saveQuizScoreToFirebase(user.id, scoreToSave);
      }, 50);
    });

    if (scores.length > 0) {
      const firstScore = scores[0];
      const cls = classes.find((c) => c.id === firstScore.classId);
      const quizDef = quizDefinitions.find((q) => q.id === firstScore.quizId);
      const quizTitle = firstScore.quizTitle || quizDef?.title || 'Quiz';
      const maxScore = quizDef?.maxScore || firstScore.maxScore || 100;

      const details = scores.map((sc) => {
        const std = students.find((s) => s.id === sc.studentId);
        return {
          studentId: sc.studentId,
          studentName: std ? `${std.name} ${std.surname}` : 'Öğrenci',
          studentNumber: std?.number,
          changeSummary: `Not: ${sc.score}/${maxScore}`,
          newValue: `${sc.score} Puan`,
        };
      });

      addAuditLog({
        category: 'quiz',
        actionType: 'bulk_action',
        title: `"${quizTitle}" Quiz Notları Toplu Kaydedildi`,
        description: `${cls?.name || ''} sınıfında ${scores.length} öğrencinin "${quizTitle}" notları işlendi.`,
        classId: firstScore.classId,
        className: cls?.name,
        isBulk: true,
        affectedCount: scores.length,
        studentDetails: details,
      });
    }
  };

  const handleAddHomework = (hw: Omit<Homework, 'id'>) => {
    const newHW: Homework = { ...hw, id: 'hw-' + Date.now() };
    setHomeworks((prev) => [...prev, newHW]);
    saveHomeworkToFirebase(user.id, newHW);

    const cls = classes.find((c) => c.id === hw.classId);
    addAuditLog({
      category: 'homework',
      actionType: 'create',
      title: `"${hw.title}" Ödevi Tanımlandı`,
      description: `${cls?.name || ''} sınıfı için "${hw.title}" ödevi sisteme eklendi (Teslim: ${hw.dueDate}).`,
      classId: hw.classId,
      className: cls?.name,
    });
  };

  const handleUpdateHomework = (updatedHw: Homework) => {
    setHomeworks((prev) => prev.map((h) => (h.id === updatedHw.id ? updatedHw : h)));
    saveHomeworkToFirebase(user.id, updatedHw);

    const cls = classes.find((c) => c.id === updatedHw.classId);
    addAuditLog({
      category: 'homework',
      actionType: 'update',
      title: `"${updatedHw.title}" Ödev Bilgisi Güncellendi`,
      description: `${cls?.name || ''} sınıfındaki ödev detayları güncellendi.`,
      classId: updatedHw.classId,
      className: cls?.name,
    });
  };

  const handleSoftDeleteHomework = (hwId: string) => {
    const deletedAt = new Date().toISOString();
    setHomeworks((prev) =>
      prev.map((h) => (h.id === hwId ? { ...h, isDeleted: true, deletedAt } : h))
    );
    const target = homeworks.find((h) => h.id === hwId);
    if (target) {
      saveHomeworkToFirebase(user.id, { ...target, isDeleted: true, deletedAt });
      const cls = classes.find((c) => c.id === target.classId);
      addAuditLog({
        category: 'trash',
        actionType: 'delete',
        title: `"${target.title}" Ödev Çöp Kutusuna Taşındı`,
        description: `${cls?.name || ''} sınıfındaki "${target.title}" ödevi çöp kutusuna taşındı.`,
        classId: target.classId,
        className: cls?.name,
      });
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
      const cls = classes.find((c) => c.id === target.classId);
      addAuditLog({
        category: 'trash',
        actionType: 'restore',
        title: `"${target.title}" Ödev Geri Yüklendi`,
        description: `${cls?.name || ''} sınıfındaki "${target.title}" ödevi geri yüklendi.`,
        classId: target.classId,
        className: cls?.name,
      });
    }
  };

  const handlePermanentDeleteHomework = (hwId: string) => {
    const target = homeworks.find((h) => h.id === hwId);
    setHomeworks((prev) => prev.filter((h) => h.id !== hwId));
    deleteHomeworkFromFirebase(user.id, hwId);

    // Delete associated homework records
    const recordsToDelete = homeworkRecords.filter((r) => r.homeworkId === hwId);
    setHomeworkRecords((prev) => prev.filter((r) => r.homeworkId !== hwId));
    recordsToDelete.forEach((r) => deleteHomeworkRecordFromFirebase(user.id, r.id));

    addAuditLog({
      category: 'trash',
      actionType: 'delete',
      title: `"${target?.title || 'Ödev'}" Kalıcı Olarak Silindi`,
      description: `Ödev ve ilişkili ${recordsToDelete.length} adet teslim kaydı kalıcı olarak silindi.`,
    });
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

    const std = students.find((s) => s.id === record.studentId);
    const hw = homeworks.find((h) => h.id === record.homeworkId);
    const targetClassId = record.classId || hw?.classId || std?.classId;
    const cls = classes.find((c) => c.id === targetClassId);
    const hwTitle = hw?.title || 'Ödev';
    const studentName = std ? `${std.name} ${std.surname}` : 'Öğrenci';

    const statusLabels: Record<string, string> = {
      done: 'Tam Yapıldı',
      late: 'Geç Getirdi',
      missing: 'Yapmadı',
      excused: 'İzinli/Muaf',
    };

    addAuditLog({
      category: 'homework',
      actionType: 'update',
      title: `${studentName} Ödev Teslim Durumu Kaydedildi`,
      description: `${cls?.name || ''} sınıfında "${hwTitle}" için ${studentName} durumu (${statusLabels[record.status] || record.status}) kaydedildi.`,
      classId: targetClassId,
      className: cls?.name,
      isBulk: false,
      affectedCount: 1,
      studentDetails: [
        {
          studentId: record.studentId,
          studentName,
          studentNumber: std?.number,
          changeSummary: `${hwTitle}: ${statusLabels[record.status] || record.status}`,
          newValue: statusLabels[record.status] || record.status,
        },
      ],
    });
  };

  const handleBatchUpdateHomeworkRecords = (records: Omit<HomeworkRecord, 'id'>[]) => {
    records.forEach((record) => {
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
    });

    if (records.length > 0) {
      const first = records[0];
      const hw = homeworks.find((h) => h.id === first.homeworkId);
      const targetClassId = first.classId || hw?.classId;
      const cls = classes.find((c) => c.id === targetClassId);
      const hwTitle = hw?.title || 'Ödev';

      const statusLabels: Record<string, string> = {
        done: 'Tam Yapıldı',
        late: 'Geç Getirdi',
        missing: 'Yapmadı',
        excused: 'İzinli/Muaf',
      };

      const details = records.map((r) => {
        const std = students.find((s) => s.id === r.studentId);
        return {
          studentId: r.studentId,
          studentName: std ? `${std.name} ${std.surname}` : 'Öğrenci',
          studentNumber: std?.number,
          changeSummary: `${statusLabels[r.status] || r.status}${r.note ? ` (${r.note})` : ''}`,
          newValue: statusLabels[r.status] || r.status,
        };
      });

      addAuditLog({
        category: 'homework',
        actionType: 'bulk_action',
        title: `"${hwTitle}" Ödev Kontrolü Toplu Kaydedildi`,
        description: `${cls?.name || ''} sınıfında ${records.length} öğrencinin ödev teslim durumu toplu olarak işlendi.`,
        classId: targetClassId,
        className: cls?.name,
        isBulk: true,
        affectedCount: records.length,
        studentDetails: details,
      });
    }
  };

  const handleSaveStudent = (studentData: Omit<Student, 'id'> | Student) => {
    if ('id' in studentData && studentData.id) {
      const updatedStd = studentData as Student;
      setStudents((prev) => prev.map((s) => (s.id === studentData.id ? updatedStd : s)));
      saveStudentToFirebase(user.id, updatedStd);

      const cls = classes.find((c) => c.id === updatedStd.classId);
      addAuditLog({
        category: 'student',
        actionType: 'update',
        title: `Öğrenci Bilgisi Güncellendi`,
        description: `${cls?.name || ''} sınıfından ${updatedStd.name} ${updatedStd.surname} (#${updatedStd.number}) bilgileri güncellendi.`,
        classId: updatedStd.classId,
        className: cls?.name,
        studentDetails: [
          {
            studentId: updatedStd.id,
            studentName: `${updatedStd.name} ${updatedStd.surname}`,
            studentNumber: updatedStd.number,
            changeSummary: `Bilgiler güncellendi`,
          },
        ],
      });
    } else {
      const newStd: Student = {
        ...(studentData as Omit<Student, 'id'>),
        id: 'std-' + Date.now(),
      };
      setStudents((prev) => [...prev, newStd]);
      saveStudentToFirebase(user.id, newStd);

      const cls = classes.find((c) => c.id === newStd.classId);
      addAuditLog({
        category: 'student',
        actionType: 'create',
        title: `Yeni Öğrenci Eklendi: ${newStd.name} ${newStd.surname}`,
        description: `${cls?.name || ''} sınıfına ${newStd.name} ${newStd.surname} (#${newStd.number}) eklendi.`,
        classId: newStd.classId,
        className: cls?.name,
        studentDetails: [
          {
            studentId: newStd.id,
            studentName: `${newStd.name} ${newStd.surname}`,
            studentNumber: newStd.number,
            changeSummary: `Yeni kayıt`,
          },
        ],
      });
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

    const cls = classes.find((c) => c.id === targetId) || (newClassName ? { name: newClassName } : null);
    addAuditLog({
      category: 'student',
      actionType: 'bulk_action',
      title: `${cls?.name || 'Sınıf'} Toplu Öğrenci İçe Aktarıldı`,
      description: `${cls?.name || ''} sınıfına ${prepared.length} öğrenci başarıyla eklendi.`,
      classId: targetId,
      className: cls?.name,
      isBulk: true,
      affectedCount: prepared.length,
      studentDetails: prepared.map((s) => ({
        studentId: s.id,
        studentName: `${s.name} ${s.surname}`,
        studentNumber: s.number,
        changeSummary: `Toplu kayıt`,
      })),
    });
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

    addAuditLog({
      category: 'class',
      actionType: 'create',
      title: `Yeni Sınıf Oluşturuldu: ${created.name}`,
      description: `${created.name} sınıfı (${created.subject || 'Ders'} - ${created.grade}. Sınıf) başarıyla oluşturuldu.`,
      classId: created.id,
      className: created.name,
    });
  };

  const handleUpdateClass = (updatedClass: ClassRoom) => {
    setClasses((prev) => prev.map((c) => (c.id === updatedClass.id ? updatedClass : c)));
    saveClassToFirebase(user.id, updatedClass);

    addAuditLog({
      category: 'class',
      actionType: 'update',
      title: `Sınıf Bilgileri Güncellendi: ${updatedClass.name}`,
      description: `${updatedClass.name} sınıfının bilgileri güncellendi.`,
      classId: updatedClass.id,
      className: updatedClass.name,
    });
  };

  const handleDeleteClass = (
    classId: string,
    actionOnStudents: 'delete' | 'transfer',
    targetClassId?: string
  ) => {
    const targetClass = classes.find((c) => c.id === classId);
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

    addAuditLog({
      category: 'class',
      actionType: 'delete',
      title: `Sınıf Silindi: ${targetClass?.name || 'Sınıf'}`,
      description: `${targetClass?.name || 'Sınıf'} silindi (Öğrenci aksiyonu: ${actionOnStudents === 'transfer' ? 'Başka sınıfa taşındı' : 'Silindi'}).`,
    });
  };

  const handleDeleteStudent = (studentId: string) => {
    const target = students.find((s) => s.id === studentId);
    const cls = classes.find((c) => c.id === target?.classId);
    setStudents((prev) => prev.filter((s) => s.id !== studentId));
    deleteStudentFromFirebase(user.id, studentId);

    addAuditLog({
      category: 'student',
      actionType: 'delete',
      title: `Öğrenci Silindi: ${target ? `${target.name} ${target.surname}` : 'Öğrenci'}`,
      description: `${cls?.name || ''} sınıfından ${target ? `${target.name} ${target.surname} (#${target.number})` : 'öğrenci'} kaydı silindi.`,
      classId: target?.classId,
      className: cls?.name,
    });
  };

  const handleDeleteMultipleStudents = (studentIds: string[]) => {
    const deletedStudents = students.filter((s) => studentIds.includes(s.id));
    setStudents((prev) => prev.filter((s) => !studentIds.includes(s.id)));
    studentIds.forEach((id) => deleteStudentFromFirebase(user.id, id));

    addAuditLog({
      category: 'student',
      actionType: 'bulk_action',
      title: `Toplu ${deletedStudents.length} Öğrenci Silindi`,
      description: `${deletedStudents.length} öğrenci kaydı sistemden toplu olarak silindi.`,
      isBulk: true,
      affectedCount: deletedStudents.length,
      studentDetails: deletedStudents.map((s) => ({
        studentId: s.id,
        studentName: `${s.name} ${s.surname}`,
        studentNumber: s.number,
        changeSummary: `Kayıt silindi`,
      })),
    });
  };

  const handleTransferStudents = (studentIds: string[], targetClassId: string) => {
    const targetClass = classes.find((c) => c.id === targetClassId);
    const transferred = students.filter((s) => studentIds.includes(s.id));

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

    addAuditLog({
      category: 'student',
      actionType: 'bulk_action',
      title: `${transferred.length} Öğrenci ${targetClass?.name || 'Sınıfa'} Transfer Edildi`,
      description: `${transferred.length} öğrenci yeni sınıfına (${targetClass?.name || ''}) taşındı.`,
      classId: targetClassId,
      className: targetClass?.name,
      isBulk: true,
      affectedCount: transferred.length,
      studentDetails: transferred.map((s) => ({
        studentId: s.id,
        studentName: `${s.name} ${s.surname}`,
        studentNumber: s.number,
        changeSummary: `Yeni sınıf: ${targetClass?.name}`,
      })),
    });
  };

  const handleUpdateWeights = (newWeights: WeightSettings) => {
    setWeights(newWeights);
    saveWeightsToFirebase(user.id, newWeights);

    addAuditLog({
      category: 'settings',
      actionType: 'update',
      title: `Değerlendirme Ağırlıkları Güncellendi`,
      description: `Quiz: %${newWeights.quizWeight}, Ödev: %${newWeights.homeworkWeight}, Defter: %${newWeights.notebookWeight}, Katılım: %${newWeights.plusMinusWeight} olarak ayarlandı.`,
    });
  };

  const handleUpdateNotifications = (newNotifs: NotificationSetting[]) => {
    setNotifications(newNotifs);
    newNotifs.forEach((n) => saveNotificationSettingToFirebase(user.id, n));
  };

  const handleSaveNotificationConfig = (newConfig: NotificationSettingsConfig) => {
    setNotificationConfig(newConfig);
    Storage.setNotificationConfig(user.id, newConfig);
    saveNotificationConfigToFirebase(user.id, newConfig);

    addAuditLog({
      category: 'settings',
      actionType: 'update',
      title: 'Bildirim Ayarları Güncellendi',
      description: `Ödev eşiği: ${newConfig.homeworkDeadlineDays} gün, Quiz eşiği: ${newConfig.quizUngradedDays} gün, Defter eşiği: ${newConfig.notebookUngradedDays} gün olarak güncellendi.`,
    });
  };

  const handleSaveRiskConfig = (newConfig: RiskRadarConfig) => {
    setRiskConfig(newConfig);
    Storage.setRiskConfig(user.id, newConfig);

    addAuditLog({
      category: 'settings',
      actionType: 'update',
      title: 'Riskli Öğrenci Alarm Kriterleri Güncellendi',
      description: `Analiz penceresi: ${newConfig.windowDays} gün, Ödev eşiği: %${newConfig.homeworkThresholdPercent}, Eksi toleransı: ${newConfig.maxMinusAllowed}, Quiz eşiği: ${newConfig.quizScoreThreshold} puan.`,
    });
  };

  const handleAddFeedbackLog = (log: ParentFeedbackLog) => {
    setFeedbackLogs((prev) => [log, ...prev]);
    saveFeedbackLogToFirebase(user.id, log);

    const std = students.find((s) => s.id === log.studentId);
    const targetClassId = log.classId || std?.classId;
    const cls = classes.find((c) => c.id === targetClassId);
    addAuditLog({
      category: 'parent',
      actionType: 'send_message',
      title: `Veli İletişim / Bildirim Kaydı`,
      description: `${std ? `${std.name} ${std.surname}` : 'Öğrenci'} velisine (${log.channel}) mesaj kaydedildi: ${log.message.slice(0, 50)}...`,
      classId: targetClassId,
      className: cls?.name,
      studentDetails: [
        {
          studentId: log.studentId,
          studentName: std ? `${std.name} ${std.surname}` : 'Öğrenci',
          studentNumber: std?.number,
          actionSummary: `${log.channel.toUpperCase()}: ${log.message.slice(0, 60)}`,
        },
      ],
    });
  };

  // Schedule Handlers (Optional Feature with Cloud & Local Persistence)
  const handleSaveScheduleLesson = (lessonData: Omit<ScheduleLesson, 'id'>, isBatchMode: boolean) => {
    const newLesson: ScheduleLesson = {
      ...lessonData,
      id: 'lesson-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
    };
    setScheduleLessons((prev) => {
      const filtered = prev.filter((l) => !(l.day === lessonData.day && l.period === lessonData.period));
      return [...filtered, newLesson];
    });
    saveScheduleLessonToFirebase(user.id, newLesson);

    if (!isBatchMode) {
      addAuditLog({
        category: 'schedule',
        actionType: 'create',
        title: `Ders Programına Ders Eklendi`,
        description: `${lessonData.title || lessonData.shortName} ${lessonData.day} günü ${lessonData.period}. saate eklendi.`,
      });
    }
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
    addAuditLog({
      category: 'schedule',
      actionType: 'delete',
      title: `Haftalık Ders Programı Temizlendi`,
      description: `Tüm haftalık ders programı kayıtları sıfırlandı.`,
    });
  };

  const handleLoadInitialScheduleTemplate = () => {
    setScheduleLessons(INITIAL_SCHEDULE_LESSONS);
    batchSaveScheduleLessonsToFirebase(user.id, INITIAL_SCHEDULE_LESSONS);
    addAuditLog({
      category: 'schedule',
      actionType: 'bulk_action',
      title: `Örnek Ders Programı Şablonu Yüklendi`,
      description: `Haftalık ders programı için örnek şablon başarıyla yüklendi.`,
    });
  };

  const handleSaveScheduleConfig = (newConfig: ScheduleConfig) => {
    setScheduleConfig(newConfig);
    Storage.setScheduleConfig(user.id, newConfig);
    saveScheduleConfigToFirebase(user.id, newConfig);
  };

  const handleBatchReplaceSchedule = async (
    newLessons: ScheduleLesson[],
    newConfig: ScheduleConfig,
    auditDetails?: string
  ) => {
    // 1. Clear existing lessons in Firebase & State
    await clearAllScheduleLessonsFromFirebase(user.id, scheduleLessons);
    setScheduleLessons(newLessons);
    Storage.setScheduleLessons(user.id, newLessons);
    await batchSaveScheduleLessonsToFirebase(user.id, newLessons);

    // 2. Update config and period times
    setScheduleConfig(newConfig);
    Storage.setScheduleConfig(user.id, newConfig);
    saveScheduleConfigToFirebase(user.id, newConfig);

    // 3. Add audit log
    addAuditLog({
      category: 'schedule',
      actionType: 'bulk_action',
      title: `Fotoğraftan AI ile Haftalık Program Yüklendi`,
      description:
        auditDetails ||
        `${newLessons.length} derslik haftalık program yapay zeka ile başarıyla içe aktarıldı ve ders saatleri güncellendi.`,
      isBulk: true,
      affectedCount: newLessons.length,
    });
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
                  quizDefinitions={quizDefinitions}
                  homeworks={homeworks}
                  homeworkRecords={homeworkRecords}
                  notebookControls={notebookControls}
                  weights={weights}
                  onNavigateTab={handleNavigateTab}
                  onOpenAddStudent={() => {
                    setEditingStudent(null);
                    setIsStudentModalOpen(true);
                  }}
                  onOpenBulkImport={() => setIsBulkImportOpen(true)}
                  onOpenLuckyDraw={() => setIsLuckyDrawOpen(true)}
                  onOpenAddClassModal={() => setIsClassModalOpen(true)}
                  academicYearConfig={academicYearConfig}
                  onOpenAcademicSettings={() => setIsAcademicSettingsOpen(true)}
                  scheduleConfig={scheduleConfig}
                  scheduleLessons={scheduleLessons}
                  annualPlanItems={annualPlanItems}
                  onOpenPlanDetail={(grade, classNameTitle, week) => {
                    setSelectedPlanDetail({ isOpen: true, grade, classNameTitle, week });
                    setActiveTab('outcomes');
                  }}
                  notificationConfig={notificationConfig}
                  onOpenNotificationSettings={() => setIsNotificationSettingsOpen(true)}
                  riskConfig={riskConfig}
                  lessonLogs={lessonLogs}
                  onOpenNewLessonLogModal={handleOpenNewLessonLogModal}
                  onToggleLessonLogActionItem={handleToggleLessonLogAction}
                  onDeleteLessonLog={handleDeleteLessonLog}
                  layoutConfig={dashboardLayout}
                  onOpenCustomizeDashboard={() => setIsDashboardCustomizeOpen(true)}
                />
              )}

              {activeTab === 'quick-score' && (
                currentClass ? (
                  <QuickScoreView
                    currentClass={currentClass}
                    students={students}
                    plusMinusLogs={plusMinusLogs}
                    onAddLog={handleAddPlusMinusLog}
                    onBatchAddLogs={handleBatchAddPlusMinusLogs}
                    onUpdateLog={handleUpdatePlusMinusLog}
                    onDeleteLog={handleDeletePlusMinusLog}
                    onOpenLuckyDraw={() => setIsLuckyDrawOpen(true)}
                    quizzes={quizzes}
                    homeworks={homeworks}
                    homeworkRecords={homeworkRecords}
                    notebookControls={notebookControls}
                    onSaveNotebookControl={handleSaveNotebookControl}
                    onUpdateNotebookControl={handleUpdateNotebookControl}
                    onDeleteNotebookControl={handleDeleteNotebookControl}
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
                    onBatchSaveNotebookControls={handleBatchSaveNotebookControls}
                    onUpdateNotebookControl={handleUpdateNotebookControl}
                    onDeleteNotebookControl={handleDeleteNotebookControl}
                    plusMinusLogs={plusMinusLogs}
                    onAddLog={handleAddPlusMinusLog}
                    onUpdateLog={handleUpdatePlusMinusLog}
                    onDeleteLog={handleDeletePlusMinusLog}
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
                    initialSubTab={activeTab === 'homework' || activeTab === 'quiz-hw' ? 'homeworks' : 'quizzes'}
                    initialHomeworkId={targetHomeworkId}
                    initialQuizId={targetQuizId}
                    hideSubTabs={false}
                    currentUser={user}
                    academicYearConfig={academicYearConfig}
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
                  onNavigateTab={handleNavigateTab}
                  onOpenAddClassModal={() => setIsClassModalOpen(true)}
                  auditLogsCount={auditLogs.length}
                  notificationConfig={notificationConfig}
                  onUpdateNotificationConfig={handleSaveNotificationConfig}
                  onOpenNotificationSettings={() => setIsNotificationSettingsOpen(true)}
                  onOpenDashboardCustomize={() => setIsDashboardCustomizeOpen(true)}
                />
              )}

              {activeTab === 'footprint' && (
                <AuditLogView
                  logs={auditLogs}
                  classes={classes}
                  students={students}
                  currentUser={user}
                  onClearLogs={handleClearAllAuditLogs}
                  onDeleteLog={handleDeleteAuditLog}
                  onBack={() => setActiveTab('feedback')}
                />
              )}

              {activeTab === 'schedule' && (
                <ScheduleView
                  config={scheduleConfig}
                  lessons={scheduleLessons}
                  classes={classes}
                  annualPlanItems={annualPlanItems}
                  academicYearConfig={academicYearConfig}
                  onSaveLesson={handleSaveScheduleLesson}
                  onUpdateLesson={handleUpdateScheduleLesson}
                  onDeleteLesson={handleDeleteScheduleLesson}
                  onClearAllLessons={handleClearAllScheduleLessons}
                  onLoadInitialTemplate={handleLoadInitialScheduleTemplate}
                  onSaveConfig={handleSaveScheduleConfig}
                  onBatchReplaceSchedule={handleBatchReplaceSchedule}
                  onSelectClass={(classId) => {
                    setSelectedClassId(classId);
                    setActiveTab('dashboard');
                  }}
                  onBackToDashboard={() => setActiveTab('dashboard')}
                  onOpenPlanDetail={(grade, classNameTitle, week) => {
                    setSelectedPlanDetail({ isOpen: true, grade, classNameTitle, week });
                    setActiveTab('outcomes');
                  }}
                />
              )}

              {activeTab === 'weekly-summary' && (
                <WeeklySummaryView
                  classes={classes}
                  selectedClassId={selectedClassId}
                  onSelectClass={setSelectedClassId}
                  students={students}
                  plusMinusLogs={plusMinusLogs}
                  quizDefinitions={quizDefinitions}
                  quizzes={quizzes}
                  homeworks={homeworks}
                  homeworkRecords={homeworkRecords}
                  notebookControls={notebookControls}
                  scheduleConfig={scheduleConfig}
                  scheduleLessons={scheduleLessons}
                  academicYearConfig={academicYearConfig}
                  onBackToDashboard={() => setActiveTab('dashboard')}
                  onNavigateTab={handleNavigateTab}
                />
              )}

              {activeTab === 'risk-radar' && (
                <StudentRiskRadarView
                  classes={classes}
                  selectedClassId={selectedClassId}
                  onSelectClass={setSelectedClassId}
                  students={students}
                  plusMinusLogs={plusMinusLogs}
                  homeworks={homeworks}
                  homeworkRecords={homeworkRecords}
                  quizzes={quizDefinitions}
                  quizScores={quizzes}
                  notebookControls={notebookControls}
                  teacherName={user.name}
                  teacherSubject={currentClass?.subject || user.subject}
                  riskConfig={riskConfig}
                  onSaveRiskConfig={handleSaveRiskConfig}
                  onAddFeedbackLog={handleAddFeedbackLog}
                  onAddPlusMinusLog={handleAddPlusMinusLog}
                  onSelectStudentDetail={(student) => {
                    setEditingStudent(student);
                    setIsStudentModalOpen(true);
                  }}
                  onNavigateTab={handleNavigateTab}
                />
              )}

              {activeTab === 'outcomes' && (
                <AnnualPlanDetailView
                  grade={selectedPlanDetail?.grade || currentClass?.grade || currentClass?.name.replace(/\D/g, '') || '9'}
                  classNameTitle={selectedPlanDetail?.classNameTitle || currentClass?.name}
                  currentWeek={selectedPlanDetail?.week || getCurrentAcademicWeek(academicYearConfig)}
                  planItems={annualPlanItems}
                  onUpdatePlanItem={(updatedItem) => {
                    const newItems = annualPlanItems.map((item) => (item.id === updatedItem.id ? updatedItem : item));
                    setAnnualPlanItems(newItems);
                    Storage.setAnnualPlans(user.id, newItems);
                    batchSaveAnnualPlansToFirebase(user.id, newItems);
                  }}
                  onOpenAcademicSettings={() => setIsAcademicSettingsOpen(true)}
                  onBackToDashboard={() => setActiveTab('dashboard')}
                />
              )}

              {activeTab === 'lesson-logs' && (
                <LessonLogTimelineView
                  classes={classes}
                  selectedClassId={selectedClassId}
                  onSelectClass={setSelectedClassId}
                  lessonLogs={lessonLogs}
                  onOpenNewLogModal={handleOpenNewLessonLogModal}
                  onDeleteLog={handleDeleteLessonLog}
                  onToggleActionItem={handleToggleLessonLogAction}
                  onNavigateTab={setActiveTab}
                />
              )}

              {activeTab === 'trash' && (
                <TrashBinView
                  classes={classes}
                  selectedClassId={selectedClassId}
                  students={students}
                  plusMinusLogs={plusMinusLogs}
                  notebookControls={notebookControls}
                  quizDefinitions={quizDefinitions}
                  homeworks={homeworks}
                  onRestorePlusMinusLog={handleRestorePlusMinusLog}
                  onPermanentDeletePlusMinusLog={handlePermanentDeletePlusMinusLog}
                  onRestoreNotebookControl={handleRestoreNotebookControl}
                  onPermanentDeleteNotebookControl={handlePermanentDeleteNotebookControl}
                  onRestoreQuizDefinition={handleRestoreQuizDefinition}
                  onPermanentDeleteQuizDefinition={handlePermanentDeleteQuizDefinition}
                  onRestoreHomework={handleRestoreHomework}
                  onPermanentDeleteHomework={handlePermanentDeleteHomework}
                  onBack={() => setActiveTab('feedback')}
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
        annualPlanItems={annualPlanItems}
        onSaveAnnualPlanItems={(items) => {
          setAnnualPlanItems(items);
          Storage.setAnnualPlans(user.id, items);
          batchSaveAnnualPlansToFirebase(user.id, items);
        }}
        userId={user.id}
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

      <NotificationSettingsModal
        isOpen={isNotificationSettingsOpen}
        onClose={() => setIsNotificationSettingsOpen(false)}
        config={notificationConfig}
        onSaveConfig={handleSaveNotificationConfig}
        homeworks={homeworks}
        homeworkRecords={homeworkRecords}
        quizDefinitions={quizDefinitions}
        quizzes={quizzes}
        notebookControls={notebookControls}
        classes={classes}
        students={students}
      />

      <QuickLessonLogModal
        isOpen={isLessonLogModalOpen}
        onClose={() => {
          setIsLessonLogModalOpen(false);
          setEditingLessonLog(null);
        }}
        classes={classes}
        defaultClassId={lessonLogClassId || selectedClassId}
        onSaveLog={handleSaveLessonLog}
        editLog={editingLessonLog}
        teacherName={user.name}
        userId={user.id}
      />

      <DashboardCustomizeModal
        isOpen={isDashboardCustomizeOpen}
        onClose={() => setIsDashboardCustomizeOpen(false)}
        currentLayout={dashboardLayout}
        onSaveLayout={handleSaveDashboardLayout}
      />

      {/* Live Active Lesson Auto-Switch Toast Notification */}
      {autoSwitchNotice && (
        <div className="fixed bottom-20 sm:bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 text-white px-4 py-3 rounded-2xl shadow-2xl border border-indigo-500/40 flex items-center gap-3 backdrop-blur-md animate-in slide-in-from-bottom-4 duration-300 max-w-[90vw]">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-white flex items-center justify-center font-black text-sm shrink-0 shadow-md">
            ⚡
          </div>
          <div className="text-xs">
            <span className="font-extrabold text-indigo-300">Canlı Ders Başladı:</span>{' '}
            <span className="font-bold text-white">{autoSwitchNotice.lessonTitle}</span>
            <div className="text-emerald-400 font-extrabold text-[11px] mt-0.5">
              ✓ <strong>{autoSwitchNotice.className}</strong> sınıfına otomatik geçildi.
            </div>
          </div>
          <button
            onClick={() => setAutoSwitchNotice(null)}
            className="text-slate-400 hover:text-white ml-2 text-sm cursor-pointer p-1"
            title="Kapat"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}

