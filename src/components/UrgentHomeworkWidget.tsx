import React from 'react';
import { DashboardAlertsWidget } from './DashboardAlertsWidget';
import { Homework, HomeworkRecord, ClassRoom, Student, Quiz, QuizScore, NotebookControl, NotificationSettingsConfig } from '../types';

export interface UrgentHomeworkWidgetProps {
  homeworks: Homework[];
  homeworkRecords: HomeworkRecord[];
  quizzes?: Quiz[];
  quizScores?: QuizScore[];
  notebookControls?: NotebookControl[];
  classes: ClassRoom[];
  students: Student[];
  selectedClassId: string;
  onSelectClass: (id: string) => void;
  onNavigateTab: (tab: string, itemId?: string) => void;
  onOpenAddHomework?: () => void;
  onOpenNotificationSettings?: () => void;
  config?: NotificationSettingsConfig;
}

export const UrgentHomeworkWidget: React.FC<UrgentHomeworkWidgetProps> = (props) => {
  return <DashboardAlertsWidget {...props} />;
};

export { DashboardAlertsWidget };
