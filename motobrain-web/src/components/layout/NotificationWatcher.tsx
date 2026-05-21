'use client';

import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useNotifications, type AppNotification } from '@/hooks/use-notifications';

const STORAGE_KEY = 'mb_shown_notifications';

function getShown(): Set<string> {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}

function markShown(ids: Set<string>) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(ids)));
  } catch {}
}

function requestBrowserPermission() {
  if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
    Notification.requestPermission().catch(() => {});
  }
}

function fireBrowserNotification(n: AppNotification) {
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
  try {
    new Notification(`MotoBrain — ${n.title}`, { body: n.body, silent: false });
  } catch {}
}

function showToast(n: AppNotification) {
  const opts = { description: n.body, duration: 7_000 };
  if (n.severity === 'error') toast.error(n.title, opts);
  else if (n.severity === 'warning') toast.warning(n.title, opts);
  else toast.info(n.title, opts);
}

export function NotificationWatcher() {
  const [active, setActive] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setActive(true), 8_000);
    return () => clearTimeout(t);
  }, []);

  const { notifications } = useNotifications(active);
  const shownRef = useRef<Set<string>>(new Set());
  const ready = useRef(false);

  useEffect(() => {
    shownRef.current = getShown();
    requestBrowserPermission();
    const t = setTimeout(() => { ready.current = true; }, 3_000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!ready.current) return;
    const shown = shownRef.current;
    let changed = false;
    for (const n of notifications) {
      if (!shown.has(n.id)) {
        shown.add(n.id);
        changed = true;
        showToast(n);
        fireBrowserNotification(n);
      }
    }
    if (changed) markShown(shown);
  }, [notifications]);

  return null;
}
