import "server-only";

import type {
  TilopayGateway,
  TilopayPricing,
  TilopaySdkSessionToken,
} from "@/application/ports/tilopay-gateway";
import { serviceUnavailable } from "@/domain/errors";
import type {
  TilopayConsultTransaction,
  TilopayCurrency,
} from "@/domain/tilopay";
import { getServerEnv } from "@/lib/env/server";
import { logPlatformEvent } from "@/lib/http/log";

const TILOPAY_BASE_URL = "https://app.tilopay.com";
const LOGIN_CACHE_TTL_MS = 20 * 60 * 60 * 1000;
const HTTP_TIMEOUT_MS = 15_000;
const DEFAULT_MEETING_AMOUNT = 10;

type TilopayCredentials = {
  apiKey: string;
  apiUser: string;
  apiPassword: string;
};

type CachedApiToken = {
  token: string;
  expiresAt: number;
  credFingerprint: string;
};

export class HttpTilopayGateway implements TilopayGateway {
  private cachedApiToken: CachedApiToken | null = null;

  private readCredentials(): TilopayCredentials | null {
    const env = getServerEnv();
    const apiKey = env.TILOPAY_API_KEY?.trim();
    const apiUser = env.TILOPAY_API_USER?.trim();
    const apiPassword = env.TILOPAY_API_PASSWORD?.trim();
    if (!apiKey || !apiUser || !apiPassword) {
      return null;
    }
    return { apiKey, apiUser, apiPassword };
  }

  isConfigured(): boolean {
    return this.readCredentials() !== null;
  }

  getPricing(): TilopayPricing {
    const env = getServerEnv();
    const currency: TilopayCurrency =
      env.TILOPAY_MEETING_CURRENCY === "CRC" ? "CRC" : "USD";
    const parsedAmount = Number(env.TILOPAY_MEETING_AMOUNT ?? DEFAULT_MEETING_AMOUNT);
    const amount =
      Number.isFinite(parsedAmount) && parsedAmount > 0
        ? Math.round(parsedAmount * 100) / 100
        : DEFAULT_MEETING_AMOUNT;

    return { amount, currency };
  }

  private async getApiBearerToken(
    creds: TilopayCredentials,
    forceRefresh = false,
  ): Promise<string> {
    const fingerprint = `${creds.apiUser}:${creds.apiKey}`;
    if (
      !forceRefresh &&
      this.cachedApiToken &&
      this.cachedApiToken.credFingerprint === fingerprint &&
      Date.now() < this.cachedApiToken.expiresAt
    ) {
      return this.cachedApiToken.token;
    }

    const response = await fetch(`${TILOPAY_BASE_URL}/api/v1/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        apiuser: creds.apiUser,
        password: creds.apiPassword,
      }),
      signal: AbortSignal.timeout(HTTP_TIMEOUT_MS),
      cache: "no-store",
    });

    if (!response.ok) {
      logPlatformEvent({
        level: "error",
        event: "tilopay_login_failed",
        reason: `http_${response.status}`,
      });
      throw serviceUnavailable(
        "No pudimos conectar con Tilopay para verificar el pago.",
      );
    }

    const payload = (await response.json().catch(() => null)) as {
      access_token?: string;
    } | null;

    if (!payload?.access_token) {
      throw serviceUnavailable(
        "La respuesta de autenticación de Tilopay no es válida.",
      );
    }

    this.cachedApiToken = {
      token: payload.access_token,
      expiresAt: Date.now() + LOGIN_CACHE_TTL_MS,
      credFingerprint: fingerprint,
    };

    return payload.access_token;
  }

  async createSdkToken(): Promise<TilopaySdkSessionToken> {
    const creds = this.readCredentials();
    if (!creds) {
      throw serviceUnavailable(
        "La pasarela de pago Tilopay no está configurada.",
      );
    }

    let response: Response;
    try {
      response = await fetch(`${TILOPAY_BASE_URL}/api/v1/loginSdk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiuser: creds.apiUser,
          password: creds.apiPassword,
          key: creds.apiKey,
        }),
        signal: AbortSignal.timeout(HTTP_TIMEOUT_MS),
        cache: "no-store",
      });
    } catch {
      throw serviceUnavailable(
        "No pudimos iniciar la sesión segura con Tilopay. Intentá de nuevo.",
      );
    }

    if (!response.ok) {
      logPlatformEvent({
        level: "error",
        event: "tilopay_sdk_login_failed",
        reason: `http_${response.status}`,
      });
      throw serviceUnavailable(
        "No se pudo iniciar la sesión de pago con Tilopay.",
      );
    }

    const payload = (await response.json().catch(() => null)) as {
      access_token?: string;
      expires_in?: string | number;
    } | null;

    if (!payload?.access_token) {
      throw serviceUnavailable(
        "Tilopay no entregó un token válido para el checkout.",
      );
    }

    return {
      accessToken: payload.access_token,
      expiresIn: String(payload.expires_in ?? ""),
    };
  }

  async consultOrder(orderNumber: string): Promise<TilopayConsultTransaction[]> {
    const creds = this.readCredentials();
    if (!creds) {
      throw serviceUnavailable(
        "La pasarela de pago Tilopay no está configurada.",
      );
    }

    const execute = async (forceRefresh: boolean) => {
      const token = await this.getApiBearerToken(creds, forceRefresh);
      return fetch(`${TILOPAY_BASE_URL}/api/v1/consult`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `bearer ${token}`,
        },
        body: JSON.stringify({
          key: creds.apiKey,
          orderNumber,
        }),
        signal: AbortSignal.timeout(HTTP_TIMEOUT_MS),
        cache: "no-store",
      });
    };

    let response: Response;
    try {
      response = await execute(false);
      if (response.status === 401) {
        this.cachedApiToken = null;
        response = await execute(true);
      }
    } catch {
      throw serviceUnavailable(
        "No pudimos consultar el estado del pago con Tilopay.",
      );
    }

    if (!response.ok) {
      logPlatformEvent({
        level: "error",
        event: "tilopay_consult_failed",
        reason: `http_${response.status}`,
      });
      throw serviceUnavailable(
        "No se pudo verificar la transacción en Tilopay.",
      );
    }

    const payload = (await response.json().catch(() => null)) as {
      type?: string;
      message?: string;
      response?: unknown;
    } | null;

    if (!payload || !Array.isArray(payload.response)) {
      return [];
    }

    return payload.response as TilopayConsultTransaction[];
  }
}
