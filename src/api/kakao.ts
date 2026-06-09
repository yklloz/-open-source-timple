import { Platform } from 'react-native';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';

import { AuthResponse } from '@/src/api';

WebBrowser.maybeCompleteAuthSession();

const LOCAL_BASE_URL = 'http://127.0.0.1:8001';
const BASE_URL = process.env.EXPO_PUBLIC_API_URL || LOCAL_BASE_URL;

type KakaoConfig = {
  ready: boolean;
  client_secret_required: boolean;
  client_secret_configured: boolean;
  credentials_valid: boolean;
  credential_status: string;
};

function getQueryParam(url: string, key: string) {
  const query = url.includes('?') ? url.split('?')[1].split('#')[0] : '';
  const params = new URLSearchParams(query);
  return params.get(key);
}

export function getKakaoReturnUri() {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return `${window.location.origin}/kakao-login`;
  }

  return AuthSession.makeRedirectUri({
    scheme: 'signbridge',
    path: 'kakao-login',
  });
}

export async function loginWithKakao(): Promise<AuthResponse> {
  let config: KakaoConfig;
  try {
    const configResponse = await fetch(`${BASE_URL}/auth/kakao/config`);
    config = await configResponse.json();
  } catch {
    throw new Error(`Cannot connect to the backend server (${BASE_URL}).`);
  }

  if (!config.ready) {
    if (config.client_secret_required && !config.client_secret_configured) {
      throw new Error('Kakao Client secret is missing. Add KAKAO_CLIENT_SECRET to the backend .env file.');
    }
    if (!config.credentials_valid) {
      throw new Error('The Kakao Client secret does not match the configured REST API key. Check Kakao Developers > Platform key > REST API key > Client secret.');
    }
    throw new Error('Kakao login is not configured on the backend.');
  }

  const returnUri = getKakaoReturnUri();
  const authUrl = `${BASE_URL}/auth/kakao?${new URLSearchParams({
    return_uri: returnUri,
  }).toString()}`;

  const authResult = await WebBrowser.openAuthSessionAsync(authUrl, returnUri);

  if (authResult.type !== 'success') {
    throw new Error('Kakao login was cancelled.');
  }

  const error = getQueryParam(authResult.url, 'error');
  const errorDescription = getQueryParam(authResult.url, 'error_description');
  if (error) {
    throw new Error(errorDescription || error);
  }

  const accessToken = getQueryParam(authResult.url, 'access_token');
  const userId = Number(getQueryParam(authResult.url, 'user_id'));
  const name = getQueryParam(authResult.url, 'name') || 'Kakao user';
  const email = getQueryParam(authResult.url, 'email') || '';

  if (!accessToken || !userId) {
    throw new Error('The backend did not return a valid app token.');
  }

  return {
    access_token: accessToken,
    token_type: getQueryParam(authResult.url, 'token_type') || 'bearer',
    user_id: userId,
    name,
    email,
  };
}
