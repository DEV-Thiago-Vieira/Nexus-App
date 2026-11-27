"use client";

import { useEffect, useState } from "react";
import { msUntilTime, toTimeKey, type DayKey } from "@/lib/dates.ts";
import { nextReminderTime, remindersAt } from "@/lib/reminders.ts";
import type { Task } from "@/lib/types.ts";

const canNotify = () => typeof window !== "undefined" && "Notification" in window;

export function askReminderPermission() {
  if (canNotify() && Notification.permission === "default") Notification.requestPermission().catch(() => undefined);
}

async function notify(task: Task, time: string) {
  if (!canNotify() || Notification.permission !== "granted") return;
  const options = { body: `Nexus · ${time}`, icon: "/icon/192", tag: `${task.id}:${time}` };
  try {
    const registration = await navigator.serviceWorker?.getRegistration();
    if (registration) await registration.showNotification(task.text, options);
    else new Notification(task.text, options);
  } catch {
    return;
  }
}

export function useReminders(tasks: Task[], today: DayKey) {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    navigator.serviceWorker?.register("/sw.js", { scope: "/", updateViaCache: "none" }).catch(() => undefined);
  }, []);

  useEffect(() => {
    const next = nextReminderTime(tasks, today, toTimeKey(new Date()));
    if (!next) return;
    const timer = window.setTimeout(() => {
      for (const task of remindersAt(tasks, today, next)) notify(task, next);
      setTick((t) => t + 1);
    }, Math.max(0, msUntilTime(next, new Date())));
    return () => window.clearTimeout(timer);
  }, [tasks, today, tick]);
}
