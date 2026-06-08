import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';

import { loadSettings } from '@/src/store/settingsStore';

function notificationKey(time: string) {
  const now = new Date();
  return `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}-${time}`;
}

export default function LearningReminder() {
  const sentKeyRef = useRef('');

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined' || !('Notification' in window)) return;

    const timer = window.setInterval(async () => {
      const settings = await loadSettings();
      if (!settings.learningAlert || Notification.permission !== 'granted') return;

      const now = new Date();
      const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      if (currentTime !== settings.learningReminderTime) return;

      const key = notificationKey(settings.learningReminderTime);
      if (sentKeyRef.current === key) return;
      sentKeyRef.current = key;

      new Notification('SignBridge 학습 알림', {
        body: `오늘의 목표 ${settings.dailyGoal}점! 수어 표현을 복습해볼까요?`,
      });
    }, 30000);

    return () => window.clearInterval(timer);
  }, []);

  return null;
}
