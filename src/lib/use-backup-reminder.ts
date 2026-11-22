"use client";

import { useEffect, useReducer } from "react";
import { BACKUP_REMINDER_KEY, decodeBackupReminder, emptyBackupReminder, nextBackupReminderAt, postponeBackupReminder, recordBackup, shouldRemindBackup, type BackupReminderMetadata } from "./backup-reminder";

type State = { metadata: BackupReminderMetadata; now: number; ready: boolean };
type Action = { type: "load"; metadata: BackupReminderMetadata; now: number } | { type: "tick"; now: number };

function reducer(state: State, action: Action): State {
  return action.type === "load" ? { metadata: action.metadata, now: action.now, ready: true } : { ...state, now: action.now };
}

export function useBackupReminder(wholeCount: number) {
  const [state, dispatch] = useReducer(reducer, { metadata: emptyBackupReminder, now: 0, ready: false });

  useEffect(() => {
    function load() {
      let metadata = emptyBackupReminder;
      try { metadata = decodeBackupReminder(localStorage.getItem(BACKUP_REMINDER_KEY)); } catch { /* Keep the reminder usable for this tab. */ }
      dispatch({ type: "load", metadata, now: Date.now() });
    }
    function onStorage(event: StorageEvent) {
      if (event.key === BACKUP_REMINDER_KEY || event.key === null) load();
    }
    function onVisibility() { if (document.visibilityState === "visible") dispatch({ type: "tick", now: Date.now() }); }
    load();
    window.addEventListener("storage", onStorage);
    document.addEventListener("visibilitychange", onVisibility);
    return () => { window.removeEventListener("storage", onStorage); document.removeEventListener("visibilitychange", onVisibility); };
  }, []);

  useEffect(() => {
    if (!state.ready || wholeCount < 1) return;
    const delay = nextBackupReminderAt(state.metadata) - state.now;
    if (delay <= 0) return;
    const timer = window.setTimeout(() => dispatch({ type: "tick", now: Date.now() }), Math.min(delay, 2_147_483_647));
    return () => window.clearTimeout(timer);
  }, [state.metadata, state.now, state.ready, wholeCount]);

  function save(metadata: BackupReminderMetadata, now: number) {
    try { localStorage.setItem(BACKUP_REMINDER_KEY, JSON.stringify(metadata)); } catch { /* Keep the choice in memory until this tab closes. */ }
    dispatch({ type: "load", metadata, now });
  }

  return {
    visible: state.ready && shouldRemindBackup(wholeCount, state.metadata, state.now),
    remindLater: () => { const now = Date.now(); save(postponeBackupReminder(state.metadata, now), now); },
    backupStarted: () => { const now = Date.now(); save(recordBackup(now), now); },
  };
}
