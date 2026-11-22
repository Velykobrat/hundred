export const BACKUP_REMINDER_KEY = "hundred.backup-reminder.v1";
export const REMIND_LATER_MS = 7 * 24 * 60 * 60 * 1000;
export const BACKUP_INTERVAL_MS = 30 * 24 * 60 * 60 * 1000;

export type BackupReminderMetadata = { lastBackupAt: number | null; remindAfter: number | null };
export const emptyBackupReminder: BackupReminderMetadata = { lastBackupAt: null, remindAfter: null };

export function decodeBackupReminder(raw: string | null): BackupReminderMetadata {
  try {
    const data: unknown = raw === null ? null : JSON.parse(raw);
    if (!data || typeof data !== "object" || Array.isArray(data)) return { ...emptyBackupReminder };
    const value = data as Record<string, unknown>;
    const timestamp = (input: unknown) => typeof input === "number" && Number.isSafeInteger(input) && input >= 0 && input <= 8_640_000_000_000_000 - BACKUP_INTERVAL_MS ? input : null;
    return { lastBackupAt: timestamp(value.lastBackupAt), remindAfter: timestamp(value.remindAfter) };
  } catch {
    return { ...emptyBackupReminder };
  }
}

export function nextBackupReminderAt(metadata: BackupReminderMetadata): number {
  return Math.max(metadata.remindAfter ?? 0, metadata.lastBackupAt === null ? 0 : metadata.lastBackupAt + BACKUP_INTERVAL_MS);
}

export function shouldRemindBackup(wholeCount: number, metadata: BackupReminderMetadata, now: number): boolean {
  return wholeCount > 0 && now >= nextBackupReminderAt(metadata);
}

export function postponeBackupReminder(metadata: BackupReminderMetadata, now: number): BackupReminderMetadata {
  return { ...metadata, remindAfter: now + REMIND_LATER_MS };
}

export function recordBackup(now: number): BackupReminderMetadata {
  return { lastBackupAt: now, remindAfter: null };
}
