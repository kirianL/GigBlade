import createMDX from "@next/mdx";
import path from "node:path";
import type { NextConfig } from "next";

const srcRoot = path.join(process.cwd(), "src");
const landingRoot = path.join(process.cwd(), "ui", "landing");

const platformAliases = {
  "@/domain": path.join(srcRoot, "domain"),
  "@/application": path.join(srcRoot, "application"),
  "@/infrastructure": path.join(srcRoot, "infrastructure"),
  "@/lib/composition": path.join(srcRoot, "lib", "composition"),
  "@/lib/tenant": path.join(srcRoot, "lib", "tenant"),
  "@/lib/env": path.join(srcRoot, "lib", "env"),
  "@/lib/http": path.join(srcRoot, "lib", "http"),
  "@/panel": path.join(srcRoot, "panel"),
  "@": landingRoot,
};

const devFrameSources =
  process.env.NODE_ENV === "production"
    ? ""
    : " http://localhost:3000 http://127.0.0.1:3000";

function contentSecurityPolicy(
  frameAncestors: string,
  frameSrc: string,
  extra?: {
    scriptSrc?: string;
    connectSrc?: string;
    formAction?: string;
  },
) {
  return [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com${extra?.scriptSrc ? ` ${extra.scriptSrc}` : ""}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    `connect-src 'self' data: blob: https://*.supabase.co wss://*.supabase.co https://challenges.cloudflare.com https://*.challenges.cloudflare.com${extra?.connectSrc ? ` ${extra.connectSrc}` : ""}`,
    "worker-src 'self' blob:",
    `frame-src ${frameSrc}`,
    `frame-ancestors ${frameAncestors}`,
    "base-uri 'self'",
    `form-action ${extra?.formAction ?? "'self'"}`,
    "object-src 'none'",
    "upgrade-insecure-requests",
  ].join("; ");
}

const TILOPAY_SCRIPT_SRC =
  "https://app.tilopay.com https://*.tilopay.com https://api.tokenex.com https://storage.googleapis.com https://h.online-metrix.net https://pay.google.com https://applepay.cdn-apple.com";
const TILOPAY_CONNECT_SRC =
  "https://app.tilopay.com https://*.tilopay.com https://api.tokenex.com https://*.kount.net https://h.online-metrix.net https://pay.google.com";

const sharedSecurityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
];

const securityHeaders = [
  ...sharedSecurityHeaders,
  { key: "X-Frame-Options", value: "DENY" },
  {
    key: "Content-Security-Policy",
    value: contentSecurityPolicy(
      "'none'",
      `https://challenges.cloudflare.com https://gigblades.com https://www.gigblades.com 'self' https:${devFrameSources}`,
      {
        scriptSrc: TILOPAY_SCRIPT_SRC,
        connectSrc: TILOPAY_CONNECT_SRC,
        formAction: "'self' https:",
      },
    ),
  },
];

const captchaFrameHeaders = [
  ...sharedSecurityHeaders,
  {
    key: "Content-Security-Policy",
    value: contentSecurityPolicy("*", "https://challenges.cloudflare.com"),
  },
];

if (process.env.NODE_ENV === "production") {
  const hsts = {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains; preload",
  };
  securityHeaders.push(hsts);
  captchaFrameHeaders.push(hsts);
}

const nextConfig: NextConfig = {
  poweredByHeader: false,
  agentRules: false,
  pageExtensions: ["ts", "tsx", "md", "mdx"],
  allowedDevOrigins: [
    "192.168.50.197",
    "localhost:3001",
    "*.localhost",
    "marco.localhost",
    "luna.localhost",
    "nox.localhost",
    "sofia.localhost",
    "vera.localhost",
  ],
  images: {
    formats: ["image/avif", "image/webp"],
    qualities: [75, 90],
  },
  turbopack: {
    root: process.cwd(),
    resolveAlias: {
      "@/domain": "./src/domain",
      "@/application": "./src/application",
      "@/infrastructure": "./src/infrastructure",
      "@/lib/composition": "./src/lib/composition",
      "@/lib/tenant": "./src/lib/tenant",
      "@/lib/env": "./src/lib/env",
      "@/lib/http": "./src/lib/http",
      "@/panel": "./src/panel",
      "@": "./ui/landing",
    },
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      ...platformAliases,
    };
    return config;
  },
  async headers() {
    return [
      {
        source: "/captcha",
        headers: captchaFrameHeaders,
      },
      {
        source: "/((?!captcha$).*)",
        headers: securityHeaders,
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.gigblade.com" }],
        destination: "https://gigblades.com/:path*",
        permanent: true,
      },
      {
        source: "/:path*",
        has: [{ type: "host", value: "gigblade.com" }],
        destination: "https://gigblades.com/:path*",
        permanent: true,
      },
      {
        source: "/dashboard",
        destination: "/overview",
        permanent: false,
      },
      {
        source: "/dashboard/:path*",
        destination: "/overview",
        permanent: false,
      },
      {
        source: "/login",
        destination: "/sign-in",
        permanent: false,
      },
      {
        source: "/pw-sign-in",
        destination: "/sign-in",
        permanent: false,
      },
    ];
  },
};

const withMDX = createMDX({
  options: {
    remarkPlugins: ["remark-frontmatter"],
    rehypePlugins: [
      ["rehype-pretty-code", { theme: "github-dark-dimmed", keepBackground: false }],
      "rehype-slug",
    ],
  },
});

export default withMDX(nextConfig);
