import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = 'auth_token';

function getBaseUrl() {
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envUrl) return envUrl.replace(/\/$/, '');

  if (typeof window !== 'undefined' && window.location?.hostname) {
    const { protocol, hostname } = window.location;
    const localHosts = ['localhost', '127.0.0.1', '0.0.0.0'];
    const apiHost = localHosts.includes(hostname) ? '127.0.0.1' : hostname;
    return `${protocol}//${apiHost}:8000`;
  }

  return 'http://127.0.0.1:8000';
}

export const BASE_URL = getBaseUrl();

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user_id: number;
  name: string;
  email: string;
}

export interface UserResponse {
  id: number;
  name: string;
  email: string;
  language: string;
  xp: number;
  streak: number;
}

export interface ProgressResponse {
  completed: string[];
}

type RequestOptions = RequestInit & {
  auth?: boolean;
};

export async function setToken(token: string) {
  try {
    await AsyncStorage.setItem(TOKEN_KEY, token);
  } catch {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(TOKEN_KEY, token);
      return;
    }
    throw new Error('로그인 정보를 저장하지 못했어요');
  }
}

export async function getToken(): Promise<string> {
  try {
    return (await AsyncStorage.getItem(TOKEN_KEY)) || '';
  } catch {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem(TOKEN_KEY) || '';
    }
    return '';
  }
}

export async function clearToken() {
  await AsyncStorage.removeItem(TOKEN_KEY).catch(() => {});
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem(TOKEN_KEY);
  }
}

async function getErrorMessage(res: Response) {
  try {
    const body = await res.json();
    if (typeof body.detail === 'string') return body.detail;
    if (Array.isArray(body.detail)) return '입력값을 다시 확인해주세요';
  } catch {
    // Ignore non-JSON error responses.
  }

  return '요청을 처리하지 못했어요';
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers = new Headers(options.headers);
  const token = options.auth ? await getToken() : '';

  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (options.auth) {
    if (!token) throw new Error('로그인이 필요해요');
    headers.set('Authorization', `Bearer ${token}`);
  }

  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers,
    });

    if (!res.ok) {
      throw new Error(await getErrorMessage(res));
    }

    return res.json();
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Network request failed' || error.name === 'TypeError') {
        throw new Error(`서버에 연결할 수 없어요. 백엔드 주소(${BASE_URL})와 실행 상태를 확인해주세요.`);
      }
      throw error;
    }

    throw new Error('알 수 없는 오류가 발생했어요');
  }
}

export async function signup(name: string, email: string, password: string) {
  return request<TokenResponse>('/auth/signup', {
    method: 'POST',
    body: JSON.stringify({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
    }),
  });
}

export async function login(email: string, password: string) {
  return request<TokenResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: email.trim().toLowerCase(),
      password,
    }),
  });
}

export async function getMe() {
  return request<UserResponse>('/users/me', { auth: true });
}

export async function saveProgress(lessonId: string, score: number) {
  return request<{ status: string }>('/progress', {
    method: 'POST',
    auth: true,
    body: JSON.stringify({ lesson_id: lessonId, score }),
  });
}

export async function getMyProgress() {
  return request<ProgressResponse>('/progress/me', { auth: true });
}

export function getKakaoLoginUrl() {
  return `${BASE_URL}/auth/kakao`;
}

export function getGoogleLoginUrl() {
  return `${BASE_URL}/auth/google`;
}
