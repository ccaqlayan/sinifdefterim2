import {
  Student,
  ClassRoom,
  PerformanceLog,
  Homework,
  HomeworkRecord,
  Quiz,
  QuizScore,
  NotebookControl,
  StudentRiskProfile,
  StudentRiskReason,
  RiskLevel,
  ClassRiskSummary,
  RiskRadarConfig,
} from '../types';
import { parseDateTimestamp } from './dashboardAlertsUtils';

export const DEFAULT_RISK_RADAR_CONFIG: RiskRadarConfig = {
  enabled: true,
  windowDays: 21, // 3 haftalık kayan pencere (21 gün)
  homeworkThresholdPercent: 50, // %50 altında kalınca
  enableHomeworkAlert: true,
  maxMinusAllowed: 2, // 2 eksi veya eksi > artı durumunda
  enableMinusAlert: true,
  quizScoreThreshold: 50, // 50 ortalama altında
  enableQuizAlert: true,
  notebookThresholdPercent: 50, // %50 altında
  enableNotebookAlert: true,
  sensitivityLevel: 'normal',
};

export interface RiskAnalysisOptions {
  windowDays?: number; // Default: 21 (3 weeks) or from config
  referenceDate?: Date; // Default: new Date()
  classId?: string; // Optional filter
  includeAllStudents?: boolean; // If false, returns only at-risk students
  config?: RiskRadarConfig; // Custom risk threshold settings
}

/**
 * Finds the best reference date for calculating the "Last 3 Weeks" window.
 * If modern dates are present, uses today. If historical/sample data is loaded,
 * checks the most recent activity timestamp to ensure the 3-week window is relevant.
 */
export function getEffectiveReferenceDate(
  logs: PerformanceLog[],
  homeworks: Homework[],
  quizzes: Quiz[],
  notebooks: NotebookControl[],
  fallbackDate: Date = new Date()
): Date {
  const allTimestamps: number[] = [];

  logs.forEach((l) => {
    if (l.date && !l.isDeleted) allTimestamps.push(parseDateTimestamp(l.date));
  });
  homeworks.forEach((h) => {
    if (h.dueDate && !h.isDeleted) allTimestamps.push(parseDateTimestamp(h.dueDate));
  });
  quizzes.forEach((q) => {
    if (q.date && !q.isDeleted) allTimestamps.push(parseDateTimestamp(q.date));
  });
  notebooks.forEach((n) => {
    if (n.date && !n.isDeleted) allTimestamps.push(parseDateTimestamp(n.date));
  });

  if (allTimestamps.length === 0) return fallbackDate;

  const maxTimestamp = Math.max(...allTimestamps);
  const nowMs = fallbackDate.getTime();

  // If latest data is within 90 days of now, use current clock; otherwise align with latest record
  if (Math.abs(nowMs - maxTimestamp) > 90 * 24 * 60 * 60 * 1000) {
    return new Date(maxTimestamp);
  }

  return fallbackDate;
}

/**
 * Calculates risk profiles for all or specific students over the last 3 weeks (21 days)
 */
export function calculateStudentRiskProfiles(
  students: Student[],
  classes: ClassRoom[],
  plusMinusLogs: PerformanceLog[],
  homeworks: Homework[],
  homeworkRecords: HomeworkRecord[],
  quizzes: Quiz[] = [],
  quizScores: QuizScore[] = [],
  notebookControls: NotebookControl[] = [],
  options: RiskAnalysisOptions = {}
): StudentRiskProfile[] {
  const config = options.config || DEFAULT_RISK_RADAR_CONFIG;
  const windowDays = options.windowDays ?? config.windowDays ?? 21;
  const refDate = options.referenceDate ?? getEffectiveReferenceDate(plusMinusLogs, homeworks, quizzes, notebookControls);
  const endWindowMs = refDate.getTime();
  const startWindowMs = endWindowMs - windowDays * 24 * 60 * 60 * 1000;
  const windowWeeksText = `${Math.round(windowDays / 7)} haftada`;

  // If risk feature disabled in settings
  if (config.enabled === false) {
    return students.map((student) => {
      const classRoom = classes.find((c) => c.id === student.classId);
      return {
        student,
        classRoom,
        riskLevel: 'safe',
        overallRiskScore: 0,
        homeworkTotal: 0,
        homeworkCompleted: 0,
        homeworkMissing: 0,
        homeworkCompletionRate: null,
        plusCount3Weeks: 0,
        minusCount3Weeks: 0,
        netPlusMinus3Weeks: 0,
        quizCount3Weeks: 0,
        quizAverage3Weeks: null,
        notebookCount3Weeks: 0,
        notebookAverage3Weeks: null,
        reasons: [],
        isRiskTriggered: false,
        recommendation: 'Risk Radarı devre dışı.',
        suggestedAction: 'Ayarlardan Etkinleştir',
      };
    });
  }

  // Filter homeworks within the configured window
  const activeHomeworks = homeworks.filter((hw) => {
    if (hw.isDeleted) return false;
    const dueMs = parseDateTimestamp(hw.dueDate, true);
    return dueMs >= startWindowMs && dueMs <= endWindowMs + 24 * 60 * 60 * 1000;
  });

  // Filter quizzes within window
  const activeQuizzes = quizzes.filter((q) => {
    if (q.isDeleted) return false;
    const qMs = parseDateTimestamp(q.date, false);
    return qMs >= startWindowMs && qMs <= endWindowMs + 24 * 60 * 60 * 1000;
  });

  // Filter plus/minus logs within window
  const activeLogs = plusMinusLogs.filter((l) => {
    if (l.isDeleted) return false;
    const lMs = parseDateTimestamp(l.date, false);
    return lMs >= startWindowMs && lMs <= endWindowMs + 24 * 60 * 60 * 1000;
  });

  // Filter notebook controls within window
  const activeNotebooks = notebookControls.filter((n) => {
    if (n.isDeleted) return false;
    const nMs = parseDateTimestamp(n.date, false);
    return nMs >= startWindowMs && nMs <= endWindowMs + 24 * 60 * 60 * 1000;
  });

  const targetStudents = options.classId && options.classId !== 'all'
    ? students.filter((s) => s.classId === options.classId)
    : students;

  const profiles: StudentRiskProfile[] = targetStudents.map((student) => {
    const classRoom = classes.find((c) => c.id === student.classId);

    // 1. Homework Analysis
    const studentHwList = activeHomeworks.filter((hw) => hw.classId === student.classId);
    const hwTotal = studentHwList.length;
    let hwCompleted = 0;
    let hwMissing = 0;

    studentHwList.forEach((hw) => {
      const record = homeworkRecords.find((r) => r.homeworkId === hw.id && r.studentId === student.id);
      if (!record || record.status === 'missing') {
        hwMissing++;
      } else if (record.status === 'completed' || record.status === 'excused') {
        hwCompleted++;
      } else if (record.status === 'late') {
        hwCompleted += 0.8;
      } else if (record.status === 'partial') {
        hwCompleted += 0.5;
      }
    });

    const homeworkCompletionRate = hwTotal > 0 ? Math.round((hwCompleted / hwTotal) * 100) : null;

    // 2. Plus / Minus Analysis
    const studentLogs = activeLogs.filter((l) => l.studentId === student.id);
    const plusCount3Weeks = studentLogs.filter((l) => l.type === 'plus').length;
    const minusCount3Weeks = studentLogs.filter((l) => l.type === 'minus').length;
    const netPlusMinus3Weeks = plusCount3Weeks - minusCount3Weeks;

    // 3. Quiz Analysis
    const studentQuizScores = quizScores.filter(
      (qs) => qs.studentId === student.id && activeQuizzes.some((q) => q.id === qs.quizId || (q.classId === qs.classId && q.title === qs.quizTitle))
    );
    const quizCount3Weeks = studentQuizScores.length;
    const quizAverage3Weeks = quizCount3Weeks > 0
      ? Math.round(studentQuizScores.reduce((acc, q) => acc + (q.score || 0), 0) / quizCount3Weeks)
      : null;

    // 4. Notebook Analysis
    const studentNb = activeNotebooks.filter((n) => n.studentId === student.id);
    const notebookCount3Weeks = studentNb.length;
    const notebookAverage3Weeks = notebookCount3Weeks > 0
      ? Math.round(
          studentNb.reduce((acc, n) => {
            const val = typeof n.percentage === 'number'
              ? n.percentage
              : n.status === 'full'
              ? 100
              : n.status === 'partial'
              ? 60
              : 0;
            return acc + val;
          }, 0) / notebookCount3Weeks
        )
      : null;

    // 5. Reasons & Risk Scoring based on Config
    const reasons: StudentRiskReason[] = [];
    let riskScore = 0;

    // Rule A: Homework completion threshold
    if (config.enableHomeworkAlert && hwTotal >= 1 && homeworkCompletionRate !== null) {
      if (homeworkCompletionRate < config.homeworkThresholdPercent) {
        const severity = homeworkCompletionRate < Math.max(20, config.homeworkThresholdPercent - 15) ? 'high' : 'medium';
        riskScore += severity === 'high' ? 45 : 30;
        reasons.push({
          code: 'homework_drop',
          severity,
          title: `Ödev Tamamlama Eşik Altı (< %${config.homeworkThresholdPercent})`,
          description: `Son ${windowWeeksText} verilen ${hwTotal} ödevin ${hwMissing} tanesi teslim edilmedi (Tamamlama: %${homeworkCompletionRate}).`,
        });
      }
    }

    // Rule B: Negative Performance (Minus Count >= Max Allowed or Net < 0)
    if (config.enableMinusAlert && minusCount3Weeks > 0) {
      if (minusCount3Weeks >= config.maxMinusAllowed || (minusCount3Weeks > plusCount3Weeks && minusCount3Weeks >= 2)) {
        const severity = minusCount3Weeks >= config.maxMinusAllowed + 1 ? 'high' : 'medium';
        riskScore += severity === 'high' ? 40 : 25;
        reasons.push({
          code: 'minus_accumulation',
          severity,
          title: `Ders İçi Eksi Birikimi (Eşik: ${config.maxMinusAllowed})`,
          description: `Son ${windowWeeksText} ${minusCount3Weeks} eksi alındı (Net: ${netPlusMinus3Weeks >= 0 ? '+' : ''}${netPlusMinus3Weeks}).`,
        });
      }
    }

    // Rule C: Low Quiz Average
    if (config.enableQuizAlert && quizAverage3Weeks !== null) {
      if (quizAverage3Weeks < config.quizScoreThreshold) {
        const severity = quizAverage3Weeks < Math.max(30, config.quizScoreThreshold - 10) ? 'high' : 'medium';
        riskScore += severity === 'high' ? 35 : 20;
        reasons.push({
          code: 'low_quiz_score',
          severity,
          title: `Düşük Quiz Ortalaması (< ${config.quizScoreThreshold})`,
          description: `Son ${windowWeeksText} quiz ortalaması ${quizAverage3Weeks}/100 olarak eşik değerin altında gerçekleşti.`,
        });
      }
    }

    // Rule D: Low Notebook Control
    if (config.enableNotebookAlert && notebookAverage3Weeks !== null) {
      if (notebookAverage3Weeks < config.notebookThresholdPercent) {
        riskScore += 20;
        reasons.push({
          code: 'notebook_issue',
          severity: 'medium',
          title: `Defter Kontrol Eksikliği (< %${config.notebookThresholdPercent})`,
          description: `Son defter kontrol puanı %${notebookAverage3Weeks} ile belirlenen eşiğin altında kaldı.`,
        });
      }
    }

    // Fallback: If no homeworks in window but term overall homework completion is low
    if (config.enableHomeworkAlert && hwTotal === 0 && homeworkRecords.length > 0) {
      const allStudentHw = homeworkRecords.filter((r) => r.studentId === student.id);
      const allHwCount = allStudentHw.length;
      if (allHwCount >= 2) {
        const completedCount = allStudentHw.filter((r) => r.status === 'completed' || r.status === 'excused').length;
        const rate = Math.round((completedCount / allHwCount) * 100);
        if (rate < config.homeworkThresholdPercent) {
          riskScore += 25;
          reasons.push({
            code: 'homework_drop',
            severity: 'medium',
            title: 'Genel Ödev Aksaklığı',
            description: `Dönem genelinde ödev teslim oranı %${rate} seviyesinde seyrediyor.`,
          });
        }
      }
    }

    // Normalize riskScore to 0-100
    riskScore = Math.min(100, Math.max(0, riskScore));

    // Determine Risk Level based on Sensitivity Level
    const criticalScore = config.sensitivityLevel === 'high' ? 45 : config.sensitivityLevel === 'low' ? 75 : 60;
    const moderateScore = config.sensitivityLevel === 'high' ? 20 : config.sensitivityLevel === 'low' ? 40 : 30;

    let riskLevel: RiskLevel = 'safe';
    if (riskScore >= criticalScore || reasons.some((r) => r.severity === 'high')) {
      riskLevel = 'critical';
    } else if (riskScore >= moderateScore || reasons.length >= 1) {
      riskLevel = 'moderate';
    } else if (riskScore > 0) {
      riskLevel = 'mild';
    }

    const isRiskTriggered = riskLevel === 'critical' || riskLevel === 'moderate';

    // Recommendations & Suggested Actions
    let recommendation = 'Düzenli takip sürdürülmelidir.';
    let suggestedAction = 'Gözlemde kal';

    if (riskLevel === 'critical') {
      recommendation = 'Veli ile ivedilikle iletişime geçilmeli ve ders içi destek planlanmalıdır.';
      suggestedAction = 'Veliye WhatsApp Bildirimi Gönder';
    } else if (riskLevel === 'moderate') {
      recommendation = 'Öğrenciyle birebir görüşülerek eksik ödevler ve katılım durumu hatırlatılmalıdır.';
      suggestedAction = 'Bireysel Görüşme & Hatırlatma';
    } else if (riskLevel === 'mild') {
      recommendation = 'Katılımı artırıcı motivasyonel sorular yöneltilebilir.';
      suggestedAction = 'Ders İçi Söz Hakkı Ver';
    }

    return {
      student,
      classRoom,
      riskLevel,
      overallRiskScore: riskScore,
      homeworkTotal: hwTotal,
      homeworkCompleted: Math.round(hwCompleted),
      homeworkMissing: hwMissing,
      homeworkCompletionRate,
      plusCount3Weeks,
      minusCount3Weeks,
      netPlusMinus3Weeks,
      quizCount3Weeks,
      quizAverage3Weeks,
      notebookCount3Weeks,
      notebookAverage3Weeks,
      reasons,
      isRiskTriggered,
      recommendation,
      suggestedAction,
    };
  });

  // Sort descending by risk score, then by student number
  profiles.sort((a, b) => {
    if (b.overallRiskScore !== a.overallRiskScore) {
      return b.overallRiskScore - a.overallRiskScore;
    }
    return (parseInt(a.student.number, 10) || 0) - (parseInt(b.student.number, 10) || 0);
  });

  return profiles;
}

/**
 * Calculates summary statistics by class for the Early Warning Radar
 */
export function calculateClassRiskSummary(
  classes: ClassRoom[],
  riskProfiles: StudentRiskProfile[]
): ClassRiskSummary[] {
  return classes.map((c) => {
    const classProfiles = riskProfiles.filter((p) => p.student.classId === c.id);
    const totalStudents = classProfiles.length;
    const criticalCount = classProfiles.filter((p) => p.riskLevel === 'critical').length;
    const moderateCount = classProfiles.filter((p) => p.riskLevel === 'moderate').length;
    const mildCount = classProfiles.filter((p) => p.riskLevel === 'mild').length;
    const totalAtRiskCount = criticalCount + moderateCount;

    const homeworkRiskCount = classProfiles.filter((p) =>
      p.reasons.some((r) => r.code === 'homework_drop')
    ).length;

    const behaviorRiskCount = classProfiles.filter((p) =>
      p.reasons.some((r) => r.code === 'minus_accumulation')
    ).length;

    const quizRiskCount = classProfiles.filter((p) =>
      p.reasons.some((r) => r.code === 'low_quiz_score')
    ).length;

    const notebookRiskCount = classProfiles.filter((p) =>
      p.reasons.some((r) => r.code === 'notebook_issue')
    ).length;

    const riskPercentage = totalStudents > 0 ? Math.round((totalAtRiskCount / totalStudents) * 100) : 0;

    return {
      classId: c.id,
      className: c.name,
      totalStudents,
      criticalCount,
      moderateCount,
      mildCount,
      totalAtRiskCount,
      homeworkRiskCount,
      behaviorRiskCount,
      quizRiskCount,
      notebookRiskCount,
      riskPercentage,
    };
  });
}

/**
 * Generates an empathetic, formal, and structured WhatsApp / SMS notification for parents of at-risk students
 */
export function generateParentRiskWhatsAppMessage(
  profile: StudentRiskProfile,
  teacherName?: string,
  subjectName?: string
): string {
  const std = profile.student;
  const parentTitle = std.parentName ? `Sayın ${std.parentName}` : 'Sayın Velimiz';
  const teacherSignature = teacherName ? `${teacherName}` : 'Ders Öğretmeni';
  const lessonTitle = subjectName || profile.classRoom?.subject || 'Dersimiz';

  const bulletPoints: string[] = [];

  if (profile.homeworkCompletionRate !== null && profile.homeworkCompletionRate < 50) {
    bulletPoints.push(
      `📝 Ödev Durumu: Son 3 haftadaki ödevlerin %${profile.homeworkCompletionRate}'i tamamlandı (${profile.homeworkMissing} eksik ödev bulunmaktadır).`
    );
  }

  if (profile.minusCount3Weeks > profile.plusCount3Weeks && profile.minusCount3Weeks > 0) {
    bulletPoints.push(
      `⚡ Ders İçi Katılım: Son haftalarda ders içi odaklanma ve katılımda düşüş gözlenmiştir (${profile.minusCount3Weeks} eksi / ${profile.plusCount3Weeks} artı).`
    );
  }

  if (profile.quizAverage3Weeks !== null && profile.quizAverage3Weeks < 50) {
    bulletPoints.push(
      `📊 Quiz / Sınav Değerlendirmesi: Son mini sınav ortalaması ${profile.quizAverage3Weeks}/100 olarak gerçekleşmiştir.`
    );
  }

  if (profile.notebookAverage3Weeks !== null && profile.notebookAverage3Weeks < 50) {
    bulletPoints.push(
      `📖 Defter Düzeni: Son defter kontrolünde eksiklikler tespit edilmiştir.`
    );
  }

  if (bulletPoints.length === 0) {
    bulletPoints.push(
      `📌 Ders İçi Takip: Öğrencimizin ders başarısını korumak adına evde düzenli tekrar ve ödev takibine önem verilmesi önerilmektedir.`
    );
  }

  return (
`${parentTitle},

${std.name} ${std.surname} isimli öğrencimizin ${lessonTitle} dersindeki son 3 haftalık gelişim ve ders takip durumu hakkında sizi bilgilendirmek isterim:

${bulletPoints.join('\n\n')}

Öğrencimizin başarısının olumsuz etkilenmemesi ve eksiklerini zamanında telafi edebilmesi adına evde ders ve ödev takibine destek olmanızı rica ederim. Konuyla ilgili gerekirse görüşebiliriz.

İyi çalışmalar dilerim,
${teacherSignature}`
  );
}
