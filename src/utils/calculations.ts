import { Student, PerformanceLog, QuizScore, HomeworkRecord, NotebookControl, WeightSettings, OverallTermScore } from '../types';

export function calculateStudentOverallScore(
  student: Student,
  plusMinusLogs: PerformanceLog[],
  quizzes: QuizScore[],
  homeworkRecords: HomeworkRecord[],
  notebookControls: NotebookControl[],
  weights: WeightSettings
): OverallTermScore {
  // 1. Plus Minus Calculation
  const studentLogs = plusMinusLogs.filter(l => l.studentId === student.id);
  const plusCount = studentLogs.filter(l => l.type === 'plus').length;
  const minusCount = studentLogs.filter(l => l.type === 'minus').length;
  
  const netPlusMinus = plusCount - minusCount;
  // Base 75 + (Net * 5), bounded 0-100
  let plusMinusNormalized = Math.min(100, Math.max(0, 75 + (netPlusMinus * 5)));
  if (studentLogs.length === 0) {
    plusMinusNormalized = 80; // Default neutral baseline
  }

  // 2. Quiz Average Calculation
  const studentQuizzes = quizzes.filter(q => q.studentId === student.id);
  const quizAverage = studentQuizzes.length > 0
    ? Math.round(studentQuizzes.reduce((acc, q) => acc + q.score, 0) / studentQuizzes.length)
    : 85;

  // 3. Homework Score Calculation
  const studentHW = homeworkRecords.filter(h => h.studentId === student.id);
  let homeworkScore = 85;
  if (studentHW.length > 0) {
    const totalHWScore = studentHW.reduce((acc, hw) => {
      if (hw.status === 'completed' || hw.status === 'excused') return acc + 100;
      if (hw.status === 'late') return acc + 70;
      return acc + 0; // missing
    }, 0);
    homeworkScore = Math.round(totalHWScore / studentHW.length);
  }

  // 4. Notebook Control Average
  const studentNotebooks = notebookControls.filter(n => n.studentId === student.id);
  const notebookAverage = studentNotebooks.length > 0
    ? Math.round(studentNotebooks.reduce((acc, n) => acc + n.percentage, 0) / studentNotebooks.length)
    : 80;

  // 5. Final Weighted Term Score
  const qw = weights.quizWeight / 100;
  const pmw = weights.plusMinusWeight / 100;
  const hww = weights.homeworkWeight / 100;
  const nbw = weights.notebookWeight / 100;

  const rawFinal = (quizAverage * qw) + (plusMinusNormalized * pmw) + (homeworkScore * hww) + (notebookAverage * nbw);
  const finalScore = Math.round(rawFinal * 10) / 10;

  // Letter Grade / Evaluation
  let letterGrade = 'Pekiyi (5)';
  if (finalScore < 45) letterGrade = 'Zayıf (1)';
  else if (finalScore < 55) letterGrade = 'Geçer (2)';
  else if (finalScore < 70) letterGrade = 'Orta (3)';
  else if (finalScore < 85) letterGrade = 'İyi (4)';

  return {
    studentId: student.id,
    studentName: `${student.name} ${student.surname}`,
    studentNumber: student.number,
    plusCount,
    minusCount,
    plusMinusNormalized,
    quizAverage,
    homeworkScore,
    notebookAverage,
    finalScore,
    letterGrade,
  };
}
