import AsyncStorage from '@react-native-async-storage/async-storage';

export interface LocalUser {
  name: string;
  email: string;
  password: string;
  createdAt: string;
}

const USERS_KEY = 'signbridge_local_users_v1';
const SESSION_KEY = 'signbridge_current_user_v1';

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

async function loadUsers(): Promise<LocalUser[]> {
  try {
    const raw = await AsyncStorage.getItem(USERS_KEY);
    return raw ? JSON.parse(raw) as LocalUser[] : [];
  } catch {
    return [];
  }
}

async function saveUsers(users: LocalUser[]) {
  await AsyncStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export async function registerLocalUser(name: string, email: string, password: string) {
  const normalizedEmail = normalizeEmail(email);
  const users = await loadUsers();
  const exists = users.some(user => normalizeEmail(user.email) === normalizedEmail);

  if (exists) {
    throw new Error('이미 가입된 이메일이에요. 로그인 화면에서 로그인해 주세요.');
  }

  const user: LocalUser = {
    name: name.trim(),
    email: normalizedEmail,
    password,
    createdAt: new Date().toISOString(),
  };

  await saveUsers([...users, user]);
  await AsyncStorage.setItem(SESSION_KEY, JSON.stringify({ name: user.name, email: user.email }));
  return user;
}

export async function loginLocalUser(email: string, password: string) {
  const normalizedEmail = normalizeEmail(email);
  const users = await loadUsers();
  const user = users.find(item => normalizeEmail(item.email) === normalizedEmail);

  if (!user) {
    throw new Error('등록되지 않은 계정입니다.');
  }

  if (user.password !== password) {
    throw new Error('비밀번호가 일치하지 않아요.');
  }

  await AsyncStorage.setItem(SESSION_KEY, JSON.stringify({ name: user.name, email: user.email }));
  return user;
}

export async function getCurrentLocalUser() {
  try {
    const raw = await AsyncStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) as Pick<LocalUser, 'name' | 'email'> : null;
  } catch {
    return null;
  }
}

export async function logoutLocalUser() {
  await AsyncStorage.removeItem(SESSION_KEY);
}
