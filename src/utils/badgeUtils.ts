import { StudentBadge } from '../types';

/**
 * Calculates expiration date (YYYY-MM-DD) based on awardedAt date and duration in days.
 * If durationDays is 0 or undefined, returns undefined (permanent).
 */
export const calculateBadgeExpiration = (awardedAtDate: string, durationDays: number): string | undefined => {
  if (!durationDays || durationDays <= 0) return undefined;
  const date = new Date(awardedAtDate);
  if (isNaN(date.getTime())) return undefined;
  date.setDate(date.getDate() + durationDays);
  return date.toISOString().slice(0, 10);
};

/**
 * Checks if a badge is currently active.
 * Permanent badges or badges whose expiresAt >= today are active.
 */
export const isBadgeActive = (badge: StudentBadge): boolean => {
  if (!badge.expiresAt) return true;
  const today = new Date().toISOString().slice(0, 10);
  return badge.expiresAt >= today;
};

/**
 * Returns remaining days for an active badge, or 0 if expired, or null if permanent.
 */
export const getBadgeRemainingDays = (badge: StudentBadge): number | null => {
  if (!badge.expiresAt) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const exp = new Date(badge.expiresAt);
  exp.setHours(0, 0, 0, 0);
  const diffTime = exp.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays >= 0 ? diffDays : 0;
};
