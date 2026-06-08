import { Platform } from 'react-native';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();

const KAKAO_AUTH_ENDPOINT = 'https://kauth.kakao.com/oauth/authorize';
const KAKAO_TOKEN_ENDPOINT = 'https://kauth.kakao.com/oauth/token';
const KAKAO_USER_ENDPOINT = 'https://kapi.kakao.com/v2/user/me';

export type KakaoProfile = {
  id: number;
  email?: string;
  nickname?: string;
  profileImageUrl?: string;
};

export type KakaoLoginResult = {
  kakaoAccessToken: string;
  kakaoRefreshToken?: string;
  profile: KakaoProfile;
};

function encodeState(value: string) {
  // Unicode-safe base64url-ish encoding for web/native.
  const encoded = typeof btoa === 'function'
    ? btoa(unescape(encodeURIComponent(value)))
    : value;
  return encoded.replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
}

export function getKakaoReturnUri() {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    // Expo Web 개발 서버 주소로 돌아오게 한다. 보통 http://localhost:8081
    return window.location.origin;
  }

  return AuthSession.makeRedirectUri({
    scheme: 'signbridge',
    path: 'kakao-login',
  });
}

export function getKakaoRedirectUri() {
  const redirectUri = process.env.EXPO_PUBLIC_KAKAO_REDIRECT_URI;
  if (!redirectUri) {
    throw new Error('EXPO_PUBLIC_KAKAO_REDIRECT_URI가 설정되어 있지 않습니다.');
  }
  return redirectUri;
}

function getRestApiKey() {
  const key = process.env.EXPO_PUBLIC_KAKAO_REST_API_KEY;
  if (!key) {
    throw new Error('EXPO_PUBLIC_KAKAO_REST_API_KEY가 설정되어 있지 않습니다.');
  }
  return key;
}

function getQueryParam(url: string, key: string) {
  const query = url.includes('?') ? url.split('?')[1] : '';
  const params = new URLSearchParams(query);
  return params.get(key);
}

export async function loginWithKakao(): Promise<KakaoLoginResult> {
  const restApiKey = getRestApiKey();
  const redirectUri = getKakaoRedirectUri();
  const returnUri = getKakaoReturnUri();

  const authUrl = `${KAKAO_AUTH_ENDPOINT}?${new URLSearchParams({
    response_type: 'code',
    client_id: restApiKey,
    redirect_uri: redirectUri,
    state: encodeState(returnUri),
  }).toString()}`;

  const authResult = await WebBrowser.openAuthSessionAsync(authUrl, returnUri);

  if (authResult.type !== 'success') {
    throw new Error('카카오 로그인이 취소되었습니다.');
  }

  const code = getQueryParam(authResult.url, 'code');
  const error = getQueryParam(authResult.url, 'error');
  const errorDescription = getQueryParam(authResult.url, 'error_description');

  if (error) {
    throw new Error(errorDescription || error);
  }
  if (!code) {
    throw new Error('카카오 인가 코드를 받지 못했습니다.');
  }

  const tokenBody = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: restApiKey,
    redirect_uri: redirectUri,
    code,
  });

  const tokenRes = await fetch(KAKAO_TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8' },
    body: tokenBody.toString(),
  });

  const tokenJson = await tokenRes.json();
  if (!tokenRes.ok) {
    throw new Error(tokenJson.error_description || tokenJson.msg || '카카오 토큰 발급 실패');
  }

  const userRes = await fetch(KAKAO_USER_ENDPOINT, {
    headers: { Authorization: `Bearer ${tokenJson.access_token}` },
  });
  const userJson = await userRes.json();
  if (!userRes.ok) {
    throw new Error(userJson.msg || '카카오 사용자 정보 조회 실패');
  }

  const account = userJson.kakao_account || {};
  const profile = account.profile || {};

  return {
    kakaoAccessToken: tokenJson.access_token,
    kakaoRefreshToken: tokenJson.refresh_token,
    profile: {
      id: userJson.id,
      email: account.email,
      nickname: profile.nickname,
      profileImageUrl: profile.profile_image_url,
    },
  };
}
