const BASE_URL = 'http://127.0.0.1:8000';

// 토큰 저장 (localStorage로 새로고침해도 유지)
export function setToken(token: string) {
  localStorage.setItem('auth_token', token);
}

export function getToken(): string {
  return localStorage.getItem('auth_token') || '';
}

export function clearToken() {
  localStorage.removeItem('auth_token');
}

// ── 회원가입 ──────────────────────────────────────────
export async function signup(name: string, email: string, password: string) {
  const res = await fetch(`${BASE_URL}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || '회원가입 실패');
  }
  return res.json();
}

// ── 로그인 ────────────────────────────────────────────
export async function login(email: string, password: string) {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || '로그인 실패');
  }
  return res.json();
}

// ── 내 정보 ───────────────────────────────────────────
export async function getMe() {
  const res = await fetch(`${BASE_URL}/users/me`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  if (!res.ok) throw new Error('인증 실패');
  return res.json();
}

// ── 진도 저장 ─────────────────────────────────────────
export async function saveProgress(lessonId: string, score: number) {
  const res = await fetch(`${BASE_URL}/progress`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify({ lesson_id: lessonId, score }),
  });
  if (!res.ok) throw new Error('진도 저장 실패');
  return res.json();
}

// ── 내 진도 조회 ──────────────────────────────────────
export async function getMyProgress() {
  const res = await fetch(`${BASE_URL}/progress/me`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  if (!res.ok) throw new Error('진도 조회 실패');
  return res.json();
}

// ── 카카오 로그인 ─────────────────────────────────────
export function kakaoLogin() {
  window.location.href = 'http://127.0.0.1:8000/auth/kakao';
}
