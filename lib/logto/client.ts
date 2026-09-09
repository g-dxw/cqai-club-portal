/**
 * Logto 客户端方法封装
 * 基于 @logto/next 的 Server Actions
 */

import {
  getLogtoContext as _getLogtoContext,
  signIn as _signIn,
  signOut as _signOut,
  getAccessTokenRSC as _getAccessTokenRSC,
  handleSignIn as _handleSignIn,
} from "@logto/next/server-actions";

import { logtoConfig } from "./config";

type LogtoContext = Awaited<ReturnType<typeof _getLogtoContext>>;

async function canFetchAccountInfo(accessToken: string): Promise<boolean> {
  try {
    const res = await fetch(`${logtoConfig.endpoint}/api/my-account`, {
      method: "GET",
      headers: {
        authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    });

    if (res.status === 401 || res.status === 403) {
      return false;
    }

    return true;
  } catch {
    // 网络抖动等场景不直接判定为未登录，避免误伤有效会话
    return true;
  }
}

/**
 * 获取 Logto 上下文（认证状态）
 */
export async function getLogtoContext(): Promise<LogtoContext> {
  const context = await _getLogtoContext(logtoConfig);

  if (!context.isAuthenticated) {
    return context;
  }

  const accessToken = await _getAccessTokenRSC(logtoConfig);
  if (!accessToken) {
    return {
      ...context,
      isAuthenticated: false,
    };
  }

  const accountAccessible = await canFetchAccountInfo(accessToken);
  if (!accountAccessible) {
    return {
      ...context,
      isAuthenticated: false,
      claims: undefined,
    };
  }

  return context;
}

/**
 * 登录。`redirectUri` 不为空时作为显式回调地址传给 Logto（覆盖默认
 * `${baseUrl}/callback`），用于把回调固定在 /member 前缀下。
 */
export const signIn = (redirectUri?: string) =>
  _signIn(logtoConfig, redirectUri);

/**
 * 登出
 */
export const signOut = () => _signOut(logtoConfig, process.env.HOME_URL );

/**
 * 处理登录回调。
 *
 */
export const handleSignIn = (callbackUrl: URLSearchParams) =>
  _handleSignIn(logtoConfig, callbackUrl);

/**
 * 获取 Access Token (RSC)
 */
export const getAccessTokenRSC = () => _getAccessTokenRSC(logtoConfig);

/**
 * 获取带认证的请求头
 */
export async function getAuthHeaders(): Promise<Record<string, string>> {
  const accessToken = await getAccessTokenRSC();
  return {
    authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  };
}
