import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const TOKEN_KEY = 'auth_token';
const LOCAL_BASE_URL = 'http://127.0.0.1:8001';
const BASE_URL = process.env.EXPO_PUBLIC_API_URL || LOCAL_BASE_URL;

export type AuthResponse = {
  access_token: string;
  token_type: string;
  user_id: number;
  name: string;
  email: string;
};

async function readErrorMessage(res: Response, fallback: string) {
  try {
    const body = await res.json();
    return body.detail || body.message || fallback;
  } catch {
    return fallback;
  }
}

async function requestJson<T>(path: string, options: RequestInit, fallback: string): Promise<T> {
  let res: Response;

  try {
    res = await fetch(`${BASE_URL}${path}`, options);
  } catch {
    throw new Error(`Cannot connect to the backend server (${BASE_URL}).`);
  }

  if (!res.ok) {
    throw new Error(await readErrorMessage(res, fallback));
  }

  return res.json();
}

export async function setToken(token: string) {
  await AsyncStorage.setItem(TOKEN_KEY, token);
}

export async function getToken(): Promise<string> {
  return (await AsyncStorage.getItem(TOKEN_KEY)) || '';
}

export async function clearToken() {
  await AsyncStorage.removeItem(TOKEN_KEY);
}

export async function signup(name: string, email: string, password: string) {
  return requestJson<AuthResponse>(
    '/auth/signup',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
      }),
    },
    'Signup failed.',
  );
}

export async function login(email: string, password: string) {
  return requestJson<AuthResponse>(
    '/auth/login',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: email.trim().toLowerCase(),
        password,
      }),
    },
    'Login failed.',
  );
}

export async function getMe() {
  const token = await getToken();
  if (!token) throw new Error('Login is required.');

  return requestJson(
    '/users/me',
    {
      headers: { Authorization: `Bearer ${token}` },
    },
    'Authentication failed.',
  );
}

export async function saveProgress(lessonId: string, score: number) {
  const token = await getToken();
  if (!token) throw new Error('Login is required.');

  return requestJson(
    '/progress',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ lesson_id: lessonId, score }),
    },
    'Failed to save progress.',
  );
}

export async function getMyProgress() {
  const token = await getToken();
  if (!token) throw new Error('Login is required.');

  return requestJson<{ completed: string[] }>(
    '/progress/me',
    {
      headers: { Authorization: `Bearer ${token}` },
    },
    'Failed to load progress.',
  );
}
