import { createContext, useContext, useState } from 'react';

// 나중에 zustand 대신 Context API로 대체
// 웹 호환성 문제 없음

export interface ProgressState {
  hasOnboarded:     boolean;
  xp:               number;
  streak:           number;
  completedLessons: string[];
}

// 전역 상태 (간단하게 모듈 레벨 변수로)
let state: ProgressState = {
  hasOnboarded:     false,
  xp:               0,
  streak:           0,
  completedLessons: [],
};

export function getProgress() {
  return state;
}

export function finishOnboarding() {
  state = { ...state, hasOnboarded: true };
}

export function completeLesson(lessonId: string, earnedXP: number) {
  if (state.completedLessons.includes(lessonId)) return;
  state = {
    ...state,
    xp:               state.xp + earnedXP,
    completedLessons: [...state.completedLessons, lessonId],
  };
}

// zustand처럼 쓸 수 있는 훅 (간단 버전)
export function useProgressStore<T>(selector: (s: ProgressState) => T): T {
  return selector(state);
}