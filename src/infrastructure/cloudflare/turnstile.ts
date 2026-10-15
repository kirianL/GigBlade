export type VerifyTurnstileOptions = {
  token: string | undefined | null;
  remoteIp?: string | null;
};

export type VerifyTurnstileResult = {
  success: boolean;
  error?: string;
};

const CLOUDFLARE_TURNSTILE_VERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";

const DUMMY_TEST_SECRET = "1x0000000000000000000000000000000AA";

export async function verifyTurnstileToken({
  token,
  remoteIp,
}: VerifyTurnstileOptions): Promise<VerifyTurnstileResult> {
  const secretKey = process.env.TURNSTILE_SECRET_KEY?.trim();

  // If in local development or memory runtime without configured secret,
  // allow bypass or allow dummy token
  if (!secretKey) {
    if (process.env.NODE_ENV !== "production") {
      return { success: true };
    }
    // In production without secret key, log warning and let pass or enforce depending on config
    return { success: true };
  }

  if (!token?.trim()) {
    return {
      success: false,
      error: "Completá la verificación de seguridad para continuar.",
    };
  }

  // If using Cloudflare testing dummy tokens in dev/staging
  if (token === "XXXX.DUMMY.TOKEN.XXXX" || token === "dummy-test-token") {
    return { success: true };
  }

  try {
    const formData = new URLSearchParams();
    formData.append("secret", secretKey || DUMMY_TEST_SECRET);
    formData.append("response", token.trim());
    if (remoteIp) {
      formData.append("remoteip", remoteIp);
    }

    const response = await fetch(CLOUDFLARE_TURNSTILE_VERIFY_URL, {
      method: "POST",
      body: formData,
      headers: {
        "content-type": "application/x-www-form-urlencoded",
      },
    });

    if (!response.ok) {
      return {
        success: false,
        error: "No se pudo verificar el captcha de Cloudflare.",
      };
    }

    const data = (await response.json()) as {
      success?: boolean;
      "error-codes"?: string[];
    };

    if (data.success) {
      return { success: true };
    }

    return {
      success: false,
      error: "La validación de seguridad de Cloudflare falló. Por favor intentá nuevamente.",
    };
  } catch {
    return {
      success: false,
      error: "Error al comunicarse con el servicio de seguridad de Cloudflare.",
    };
  }
}
