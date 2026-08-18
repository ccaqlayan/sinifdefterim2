import { AuditLog, AuditLogCategory, AuditLogActionType, AuditLogStudentDetail, User } from '../types';

export interface CreateAuditLogParams {
  category: AuditLogCategory;
  actionType: AuditLogActionType;
  title: string;
  description: string;
  classId?: string;
  className?: string;
  isBulk?: boolean;
  affectedCount?: number;
  studentDetails?: AuditLogStudentDetail[];
  metadata?: Record<string, any>;
  user?: User;
}

export function buildAuditLog(params: CreateAuditLogParams): AuditLog {
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const timeStr = `${hours}:${minutes}`;

  const normalizedStudentDetails = params.studentDetails?.map((sd) => {
    const summary =
      sd.actionSummary ||
      sd.changeSummary ||
      (sd.newValue !== undefined ? `Değer: ${sd.newValue}` : '') ||
      (sd.oldValue !== undefined ? `Eski: ${sd.oldValue}` : '') ||
      'İşlem Kaydedildi';

    let badgeType = sd.badgeType;
    if (!badgeType) {
      const lower = summary.toLowerCase();
      if (
        lower.includes('+1') ||
        lower.includes('artı') ||
        lower.includes('tam (%100)') ||
        lower.includes('eksiksiz') ||
        lower.includes('tam yapıldı') ||
        lower.includes('tamamlandı') ||
        lower.includes('%100') ||
        lower.includes('100 puan')
      ) {
        badgeType = 'success';
      } else if (
        lower.includes('-1') ||
        lower.includes('eksi') ||
        lower.includes('eksik') ||
        lower.includes('yapmadı') ||
        lower.includes('teslim edilmedi') ||
        lower.includes('silindi') ||
        lower.includes('%0') ||
        lower.includes('%35')
      ) {
        badgeType = 'danger';
      } else if (
        lower.includes('yarım') ||
        lower.includes('geç') ||
        lower.includes('%60') ||
        lower.includes('%75') ||
        lower.includes('%50')
      ) {
        badgeType = 'warning';
      } else if (
        lower.includes('quiz') ||
        lower.includes('not:') ||
        lower.includes('puan') ||
        lower.includes('mesaj') ||
        lower.includes('whatsapp') ||
        lower.includes('sms')
      ) {
        badgeType = 'info';
      } else {
        badgeType = 'neutral';
      }
    }

    return {
      ...sd,
      actionSummary: summary,
      changeSummary: summary,
      badgeType,
    };
  });

  return {
    id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    timestamp: now.toISOString(),
    date: dateStr,
    time: timeStr,
    category: params.category,
    actionType: params.actionType,
    title: params.title,
    description: params.description,
    classId: params.classId,
    className: params.className,
    isBulk: params.isBulk ?? (normalizedStudentDetails && normalizedStudentDetails.length > 1),
    affectedCount: params.affectedCount ?? (normalizedStudentDetails ? normalizedStudentDetails.length : 1),
    studentDetails: normalizedStudentDetails,
    metadata: params.metadata,
    performedBy: params.user ? {
      userId: params.user.id,
      userName: params.user.name,
      role: params.user.role,
    } : undefined,
  };
}
