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
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  agentRules: false,
  pageExtensions: ["ts", "tsx", "md", "mdx"],
  allowedDevOrigins: ["192.168.50.197"],
  images: {
    formats: ["image/avif", "image/webp"],
  },
  turbopack: {
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
