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
  const studentLogs = plusMinusLogs.filter(l => l.studentId === student.id && !l.isDeleted);
  const plusCount = studentLogs.filter(l => l.type === 'plus').length;
  const minusCount = studentLogs.filter(l => l.type === 'minus').length;
  
  const hasPlusMinusData = studentLogs.length > 0;
  let plusMinusNormalized: number | null = null;
  if (hasPlusMinusData) {
    const netPlusMinus = plusCount - minusCount;
    // Base 75 + (Net * 5), bounded 0-100
    plusMinusNormalized = Math.min(100, Math.max(0, 75 + (netPlusMinus * 5)));
  }

  // 2. Quiz Average Calculation
  const studentQuizzes = quizzes.filter(q => q.studentId === student.id);
  const hasQuizData = studentQuizzes.length > 0;
  const quizAverage: number | null = hasQuizData
    ? Math.round(studentQuizzes.reduce((acc, q) => acc + q.score, 0) / studentQuizzes.length)
    : null;

  // 3. Homework Score Calculation
  const studentHW = homeworkRecords.filter(h => h.studentId === student.id);
  const hasHomeworkData = studentHW.length > 0;
  let homeworkScore: number | null = null;
  if (hasHomeworkData) {
    const totalHWScore = studentHW.reduce((acc, hw) => {
      if (hw.status === 'completed' || hw.status === 'excused') return acc + 100;
      if (hw.status === 'partial') return acc + 50;
      if (hw.status === 'late') return acc + 70;
      return acc + 0; // missing or unmarked
    }, 0);
    homeworkScore = Math.round(totalHWScore / studentHW.length);
  }

  // 4. Notebook Control Average
  const studentNotebooks = notebookControls.filter(n => n.studentId === student.id && !n.isDeleted);
  const hasNotebookData = studentNotebooks.length > 0;
  const notebookAverage: number | null = hasNotebookData
    ? Math.round(studentNotebooks.reduce((acc, n) => acc + n.percentage, 0) / studentNotebooks.length)
    : null;

  // 5. Final Weighted Term Score (Calculated only with available criteria)
  const hasAnyData = hasPlusMinusData || hasQuizData || hasHomeworkData || hasNotebookData;
  let finalScore: number | null = null;
  let letterGrade = 'Veri Yok';

  if (hasAnyData) {
    let totalWeightedScore = 0;
    let activeWeightsSum = 0;

    if (hasQuizData && quizAverage !== null && weights.quizWeight > 0) {
      totalWeightedScore += quizAverage * weights.quizWeight;
      activeWeightsSum += weights.quizWeight;
    }
    if (hasPlusMinusData && plusMinusNormalized !== null && weights.plusMinusWeight > 0) {
      totalWeightedScore += plusMinusNormalized * weights.plusMinusWeight;
      activeWeightsSum += weights.plusMinusWeight;
    }
    if (hasHomeworkData && homeworkScore !== null && weights.homeworkWeight > 0) {
      totalWeightedScore += homeworkScore * weights.homeworkWeight;
      activeWeightsSum += weights.homeworkWeight;
    }
    if (hasNotebookData && notebookAverage !== null && weights.notebookWeight > 0) {
      totalWeightedScore += notebookAverage * weights.notebookWeight;
      activeWeightsSum += weights.notebookWeight;
    }

    if (activeWeightsSum > 0) {
      let rawFinal = totalWeightedScore / activeWeightsSum;

      if (weights.roundingMode === 'ceil5') {
        // Round UP to nearest multiple of 5 (e.g. 81 -> 85, 86 -> 90)
        rawFinal = rawFinal > 0 ? Math.ceil(rawFinal / 5) * 5 : 0;
      } else if (weights.roundingMode === 'ceil10') {
        // Round UP to nearest multiple of 10 (e.g. 81 -> 90, 85 -> 90)
        rawFinal = rawFinal > 0 ? Math.ceil(rawFinal / 10) * 10 : 0;
      } else {
        rawFinal = Math.round(rawFinal * 10) / 10;
      }

      finalScore = Math.min(100, rawFinal);

      if (finalScore < 45) letterGrade = 'Zayıf (1)';
      else if (finalScore < 55) letterGrade = 'Geçer (2)';
      else if (finalScore < 70) letterGrade = 'Orta (3)';
      else if (finalScore < 85) letterGrade = 'İyi (4)';
      else letterGrade = 'Pekiyi (5)';
    }
  }

  return {
    studentId: student.id,
    studentName: `${student.name} ${student.surname}`,
    studentNumber: student.number,
    plusCount,
    minusCount,
    hasPlusMinusData,
    plusMinusNormalized,
    hasQuizData,
    quizAverage,
    hasHomeworkData,
    homeworkScore,
    hasNotebookData,
    notebookAverage,
    hasAnyData,
    finalScore,
    letterGrade,
  };
}
