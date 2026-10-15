import "server-only";

import type {
  ProjectDomains,
  ProjectDomainStatus,
} from "@/application/ports/project-domains";
import { assertAllowedUrl } from "@/lib/http/allowed-url";
import { getServerEnv } from "@/lib/env/server";

export class VercelProjectDomains implements ProjectDomains {
  async add(domain: string): Promise<ProjectDomainStatus> {
    const env = requireVercelConfig();
    const url = assertAllowedUrl(
      `https://api.vercel.com/v10/projects/${env.PLATFORM_VERCEL_PROJECT_ID}/domains`,
    );

    if (env.PLATFORM_VERCEL_TEAM_ID) {
      url.searchParams.set("teamId", env.PLATFORM_VERCEL_TEAM_ID);
    }

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.PLATFORM_VERCEL_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name: domain }),
      signal: AbortSignal.timeout(10_000),
    });

    const data = await response.json().catch(() => null);

    // If already added (409 conflict), fetch current status instead of throwing
    if (response.status === 409) {
      return this.getStatus(domain);
    }

    if (!response.ok) {
      const msg = data?.error?.message || `Vercel Domains API error: ${response.status}`;
      return {
        name: domain,
        verified: false,
        error: msg,
      };
    }

    return {
      name: domain,
      verified: Boolean(data?.verified),
      configured: Boolean(data?.configured),
      verification: data?.verification,
    };
  }

  async getStatus(domain: string): Promise<ProjectDomainStatus> {
    const env = requireVercelConfig();
    const url = assertAllowedUrl(
      `https://api.vercel.com/v9/projects/${env.PLATFORM_VERCEL_PROJECT_ID}/domains/${encodeURIComponent(domain)}`,
    );

    if (env.PLATFORM_VERCEL_TEAM_ID) {
      url.searchParams.set("teamId", env.PLATFORM_VERCEL_TEAM_ID);
    }

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${env.PLATFORM_VERCEL_TOKEN}`,
      },
      signal: AbortSignal.timeout(10_000),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      return {
        name: domain,
        verified: false,
        error: data?.error?.message || `Error ${response.status}`,
      };
    }

    return {
      name: domain,
      verified: Boolean(data?.verified),
      configured: Boolean(data?.configured),
      verification: data?.verification,
    };
  }

  async verify(domain: string): Promise<ProjectDomainStatus> {
    const env = requireVercelConfig();
    const url = assertAllowedUrl(
      `https://api.vercel.com/v9/projects/${env.PLATFORM_VERCEL_PROJECT_ID}/domains/${encodeURIComponent(domain)}/verify`,
    );

    if (env.PLATFORM_VERCEL_TEAM_ID) {
      url.searchParams.set("teamId", env.PLATFORM_VERCEL_TEAM_ID);
    }

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.PLATFORM_VERCEL_TOKEN}`,
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(10_000),
    });

    const data = await response.json().catch(() => null);

    // Domain assigned in GigBlade but never registered in the Vercel project
    // (e.g. token was missing at assignment time): register it now.
    if (response.status === 404) {
      return this.add(domain);
    }

    // If verification failed (e.g. missing_txt_record), fetch status to get verification challenges
    let verification = data?.verification;
    let configured = Boolean(data?.configured);
    if (!response.ok && !verification) {
      const current = await this.getStatus(domain).catch(() => null);
      if (current?.verification) {
        verification = current.verification;
      }
      if (current?.configured !== undefined) {
        configured = current.configured;
      }
    }

    return {
      name: domain,
      verified: Boolean(data?.verified),
      configured,
      verification,
      error: response.ok ? undefined : data?.error?.message,
    };
  }
}

function requireVercelConfig() {
  const env = getServerEnv();

  if (!env.PLATFORM_VERCEL_TOKEN || !env.PLATFORM_VERCEL_PROJECT_ID) {
    throw new Error("Faltan PLATFORM_VERCEL_TOKEN o PLATFORM_VERCEL_PROJECT_ID");
  }

  return env;
}
