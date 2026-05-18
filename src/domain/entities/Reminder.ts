export const REMINDER_STATUS = ['pending', 'sent', 'failed', 'cancelled'] as const;
export type ReminderStatus = (typeof REMINDER_STATUS)[number];

export type Reminder = {
  id: string;
  customerId: string;
  motorcycleId: string;
  type: string;
  scheduledDate: Date;
  status: ReminderStatus;
  channel: string;
  templateId?: string;
  attempts: number;
  lastAttemptAt?: Date;
  createdAt: Date;
};
