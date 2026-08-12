import React, { useState, useEffect } from 'react';
import { Storage } from './utils/storage';
import {
  User,
  ClassRoom,
  Student,
  PerformanceLog,
  QuizScore,
  Homework,
  HomeworkRecord,
  NotebookControl,
  WeightSettings,
  NotificationSetting,
  ParentFeedbackLog,
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

import { AuthModal } from './components/AuthModal';
import { StudentModal } from './components/StudentModal';
import { BulkImportModal } from './components/BulkImportModal';
import { ClassModal } from './components/ClassModal';

import { PlusCircle, Wifi } from 'lucide-react';
import { 
  seedInitialDataIfEmpty,
  subscribeClasses,
  subscribeStudents,
  subscribePlusMinusLogs,
  subscribeQuizzes,
  subscribeHomeworks,
  subscribeHomeworkRecords,
  subscribeNotebookControls,
  subscribeWeights,
  subscribeNotifications,
  subscribeFeedbacks,
  saveClassToFirebase,
  saveStudentToFirebase,
  savePlusMinusLogToFirebase,
  deletePlusMinusLogFromFirebase,
  saveQuizScoreToFirebase,
  saveHomeworkToFirebase,
  saveHomeworkRecordToFirebase,
  saveNotebookControlToFirebase,
  saveWeightsToFirebase,
  saveNotificationSettingToFirebase,
  saveFeedbackLogToFirebase,
} from './services/firebaseSync';

export default function App() {
  // State Initialization from Persistent Storage
  const [user, setUser] = useState<User>(Storage.getUser());
  const [classes, setClasses] = useState<ClassRoom[]>(Storage.getClasses());
  const [selectedClassId, setSelectedClassId] = useState<string>(classes[0]?.id || 'class-1');
  const [students, setStudents] = useState<Student[]>(Storage.getStudents());
  const [plusMinusLogs, setPlusMinusLogs] = useState<PerformanceLog[]>(Storage.getPlusMinusLogs());
  const [quizzes, setQuizzes] = useState<QuizScore[]>(Storage.getQuizzes());
  const [homeworks, setHomeworks] = useState<Homework[]>(Storage.getHomeworks());
  const [homeworkRecords, setHomeworkRecords] = useState<HomeworkRecord[]>(Storage.getHomeworkRecords());
  const [notebookControls, setNotebookControls] = useState<NotebookControl[]>(Storage.getNotebookControls());
  const [weights, setWeights] = useState<WeightSettings>(Storage.getWeights());
  const [notifications, setNotifications] = useState<NotificationSetting[]>(Storage.getNotifications());
  const [feedbackLogs, setFeedbackLogs] = useState<ParentFeedbackLog[]>(Storage.getFeedbacks());

  // Cloud sync state
  const [isCloudConnected, setIsCloudConnected] = useState<boolean>(true);

  // Navigation State
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // Modals
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);
  const [isStudentModalOpen, setIsStudentModalOpen] = useState<boolean>(false);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState<boolean>(false);
  const [isClassModalOpen, setIsClassModalOpen] = useState<boolean>(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  const currentClass = classes.find((c) => c.id === selectedClassId) || classes[0];

  // Auto-sync state to LocalStorage backup
  useEffect(() => Storage.setUser(user), [user]);
  useEffect(() => Storage.setClasses(classes), [classes]);
  useEffect(() => Storage.setStudents(students), [students]);
  useEffect(() => Storage.setPlusMinusLogs(plusMinusLogs), [plusMinusLogs]);
  useEffect(() => Storage.setQuizzes(quizzes), [quizzes]);
  useEffect(() => Storage.setHomeworks(homeworks), [homeworks]);
  useEffect(() => Storage.setHomeworkRecords(homeworkRecords), [homeworkRecords]);
  useEffect(() => Storage.setNotebookControls(notebookControls), [notebookControls]);
  useEffect(() => Storage.setWeights(weights), [weights]);
  useEffect(() => Storage.setNotifications(notifications), [notifications]);
  useEffect(() => Storage.setFeedbacks(feedbackLogs), [feedbackLogs]);

  // Firebase Real-time Subscriptions & Initial Seeding
  useEffect(() => {
    seedInitialDataIfEmpty().then(() => setIsCloudConnected(true));

    const unsubClasses = subscribeClasses((data) => {
      if (data && data.length > 0) setClasses(data);
    });
    const unsubStudents = subscribeStudents((data) => {
      setStudents(data);
    });
    const unsubLogs = subscribePlusMinusLogs((data) => setPlusMinusLogs(data));
    const unsubQuizzes = subscribeQuizzes((data) => setQuizzes(data));
    const unsubHws = subscribeHomeworks((data) => setHomeworks(data));
    const unsubHwRecs = subscribeHomeworkRecords((data) => setHomeworkRecords(data));
    const unsubNotebooks = subscribeNotebookControls((data) => setNotebookControls(data));
    const unsubWeights = subscribeWeights((data) => setWeights(data));
    const unsubNotifs = subscribeNotifications((data) => setNotifications(data));
    const unsubFeedbacks = subscribeFeedbacks((data) => setFeedbackLogs(data));

    return () => {
      unsubClasses();
      unsubStudents();
      unsubLogs();
      unsubQuizzes();
      unsubHws();
      unsubHwRecs();
      unsubNotebooks();
      unsubWeights();
      unsubNotifs();
      unsubFeedbacks();
    };
  }, []);

  // Handlers for Data Mutations (Synchronized to Firebase + Local State)
  const handleAddPlusMinusLog = (log: Omit<PerformanceLog, 'id'>) => {
    const newLog: PerformanceLog = { ...log, id: 'pm-' + Date.now() + Math.random().toString(36).substring(2, 5) };
    setPlusMinusLogs((prev) => [...prev, newLog]);
    savePlusMinusLogToFirebase(newLog);
  };

  const handleDeletePlusMinusLog = (id: string) => {
    setPlusMinusLogs((prev) => prev.filter((l) => l.id !== id));
    deletePlusMinusLogFromFirebase(id);
  };

  const handleSaveNotebookControl = (control: Omit<NotebookControl, 'id'>) => {
    const newCtrl: NotebookControl = { ...control, id: 'nb-' + Date.now() + Math.random().toString(36).substring(2, 5) };
    setNotebookControls((prev) => [...prev, newCtrl]);
    saveNotebookControlToFirebase(newCtrl);
  };

  const handleAddQuizScore = (score: Omit<QuizScore, 'id'>) => {
    const newQuiz: QuizScore = { ...score, id: 'qz-' + Date.now() + Math.random().toString(36).substring(2, 5) };
    setQuizzes((prev) => [...prev, newQuiz]);
    saveQuizScoreToFirebase(newQuiz);
  };

  const handleAddHomework = (hw: Omit<Homework, 'id'>) => {
    const newHW: Homework = { ...hw, id: 'hw-' + Date.now() };
    setHomeworks((prev) => [...prev, newHW]);
    saveHomeworkToFirebase(newHW);
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
      recToSave = { ...record, id: 'hwr-' + Date.now() };
      return [...prev, recToSave];
    });
    setTimeout(() => {
      if (recToSave) saveHomeworkRecordToFirebase(recToSave);
    }, 50);
  };

  const handleSaveStudent = (studentData: Omit<Student, 'id'> | Student) => {
    if ('id' in studentData && studentData.id) {
      const updatedStd = studentData as Student;
      setStudents((prev) => prev.map((s) => (s.id === studentData.id ? updatedStd : s)));
      saveStudentToFirebase(updatedStd);
    } else {
      const newStd: Student = {
        ...(studentData as Omit<Student, 'id'>),
        id: 'std-' + Date.now(),
      };
      setStudents((prev) => [...prev, newStd]);
      saveStudentToFirebase(newStd);
    }
  };

  const handleBulkAddStudents = (newStudents: Omit<Student, 'id'>[]) => {
    const prepared: Student[] = newStudents.map((s, idx) => ({
      ...s,
      id: 'std-bulk-' + Date.now() + '-' + idx,
    }));
    setStudents((prev) => [...prev, ...prepared]);
    prepared.forEach((st) => saveStudentToFirebase(st));
  };

  const handleAddClass = (newClass: Omit<ClassRoom, 'id' | 'createdAt'>) => {
    const created: ClassRoom = {
      ...newClass,
      id: 'class-' + Date.now(),
      createdAt: new Date().toISOString().slice(0, 10),
    };
    setClasses((prev) => [...prev, created]);
    setSelectedClassId(created.id);
    saveClassToFirebase(created);
  };

  const handleUpdateWeights = (newWeights: WeightSettings) => {
    setWeights(newWeights);
    saveWeightsToFirebase(newWeights);
  };

  const handleUpdateNotifications = (newNotifs: NotificationSetting[]) => {
    setNotifications(newNotifs);
    newNotifs.forEach((n) => saveNotificationSettingToFirebase(n));
  };

  const handleAddFeedbackLog = (log: ParentFeedbackLog) => {
    setFeedbackLogs((prev) => [log, ...prev]);
    saveFeedbackLogToFirebase(log);
  };

  const handleResetData = () => {
    if (window.confirm('Tüm veriler varsayılan simülasyon ayarlarına sıfırlansın mı?')) {
      Storage.resetToDefaults();
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-800 antialiased selection:bg-indigo-100 selection:text-indigo-900">
      <div className="flex-1 w-full max-w-md mx-auto bg-slate-50 min-h-screen shadow-xl border-x border-slate-200/80 flex flex-col relative">
        {/* Top Sticky Header */}
        <Header
          user={user}
          classes={classes}
          selectedClassId={selectedClassId}
          onSelectClass={setSelectedClassId}
          onOpenAuth={() => setIsAuthOpen(true)}
          onResetData={handleResetData}
          activeTab={activeTab}
          onSelectTab={setActiveTab}
        />

        {/* Real-time Firebase Sync Status Bar & Action button */}
        <div className="px-4 py-1.5 bg-emerald-50 border-b border-emerald-100 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-emerald-800 font-semibold">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <Wifi className="w-3.5 h-3.5 text-emerald-600" />
            <span>Firebase Anlık Bulut Eşitleme Aktif</span>
          </div>
          {user.role === 'teacher' && (
            <button
              onClick={() => setIsClassModalOpen(true)}
              className="text-indigo-600 font-extrabold hover:underline flex items-center gap-1"
            >
              <PlusCircle className="w-3.5 h-3.5" /> Yeni Sınıf
            </button>
          )}
        </div>

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
                />
              )}

              {activeTab === 'quick-score' && currentClass && (
                <QuickScoreView
                  currentClass={currentClass}
                  students={students}
                  plusMinusLogs={plusMinusLogs}
                  onAddLog={handleAddPlusMinusLog}
                  onDeleteLog={handleDeletePlusMinusLog}
                />
              )}

              {activeTab === 'notebook' && currentClass && (
                <NotebookView
                  currentClass={currentClass}
                  students={students}
                  notebookControls={notebookControls}
                  onSaveNotebookControl={handleSaveNotebookControl}
                />
              )}

              {activeTab === 'quiz-hw' && currentClass && (
                <QuizAndHomeworkView
                  currentClass={currentClass}
                  students={students}
                  quizzes={quizzes}
                  homeworks={homeworks}
                  homeworkRecords={homeworkRecords}
                  onAddQuizScore={handleAddQuizScore}
                  onAddHomework={handleAddHomework}
                  onUpdateHomeworkRecord={handleUpdateHomeworkRecord}
                />
              )}

              {activeTab === 'reports' && currentClass && (
                <ReportsView
                  currentClass={currentClass}
                  students={students}
                  plusMinusLogs={plusMinusLogs}
                  quizzes={quizzes}
                  homeworkRecords={homeworkRecords}
                  notebookControls={notebookControls}
                  weights={weights}
                  onUpdateWeights={handleUpdateWeights}
                />
              )}

              {activeTab === 'feedback' && currentClass && (
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
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        currentUser={user}
        onLogin={(loggedInUser) => {
          setUser(loggedInUser);
          if (loggedInUser.role === 'parent') {
            setActiveTab('parent-portal');
          } else {
            setActiveTab('dashboard');
          }
        }}
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

      <ClassModal
        isOpen={isClassModalOpen}
        onClose={() => setIsClassModalOpen(false)}
        onAddClass={handleAddClass}
      />
    </div>
  );
}

