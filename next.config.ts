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
  "@": landingRoot,
};

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://challenges.cloudflare.com",
      "frame-src https://challenges.cloudflare.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
      "upgrade-insecure-requests",
    ].join("; "),
  },
];

if (process.env.NODE_ENV === "production") {
  securityHeaders.push({
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains; preload",
  });
}

const nextConfig: NextConfig = {
  poweredByHeader: false,
  agentRules: false,
  pageExtensions: ["ts", "tsx", "md", "mdx"],
  allowedDevOrigins: [
    "192.168.50.197",
    "localhost:3001",
    "demo.localhost",
    "marco.localhost",
    "luna.localhost",
    "nox.localhost",
    "sofia.localhost",
    "vera.localhost",
  ],
  images: {
    formats: ["image/avif", "image/webp"],
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
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
  async redirects() {
    const dashboard =
      process.env.NEXT_PUBLIC_DASHBOARD_URL?.replace(/\/$/, "") ||
      "http://localhost:3001";
    return [
      {
        source: "/dashboard",
        destination: dashboard,
        permanent: false,
      },
      {
        source: "/dashboard/:path*",
        destination: dashboard,
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
