import createMDX from "@next/mdx";

const isProd = process.env.NODE_ENV === "production";
const isPages = process.env.GITHUB_PAGES === "1";
const pagesBasePath = process.env.PAGES_BASE_PATH || "/GigBlade";

// This landing app lives at ui/landing inside GigBlade. Pin Turbopack to
// this folder so Next does not treat the platform repo root as the workspace.
const monorepoRoot = import.meta.dirname;

// RB2B's loader fans out to several identity/data providers (and LiveIntent
// loads a second script of its own), so every host is allowed on each
// directive the chain touches rather than mapped one-by-one.
const RB2B_HOSTS = [
  "https://ddwl4m2hdecbv.cloudfront.net",
  "https://app.rb2b.com",
  "https://b2bjsstore.s3.us-west-2.amazonaws.com",
  "https://s3-us-west-2.amazonaws.com",
  "https://a.usbrowserspeed.com",
  "https://alocdn.com",
  "https://pro.ip-api.com",
  // *.liadm.com does not match the apex, which RB2B also calls.
  "https://liadm.com",
  "https://*.liadm.com",
  // Subdomain comes from the account's apiGateway config and is concatenated
  // at runtime, so it never appears as a literal in the bundle.
  "https://9xgnrndqve.execute-api.us-west-2.amazonaws.com",
];

const rehypePrettyCodeOptions = {
  theme: "github-dark-dimmed",
  keepBackground: false,
};

/** @type {import('next').NextConfig} */
const nextConfig = {
  pageExtensions: ["ts", "tsx", "md", "mdx"],
  allowedDevOrigins: ["*.ngrok-free.dev"],
  outputFileTracingRoot: monorepoRoot,
  turbopack: {
    root: monorepoRoot,
  },
  experimental: {
    viewTransition: true,
    optimizePackageImports: ["motion", "gsap", "@gsap/react"],
    optimizeCss: isProd && !isPages,
  },
  images: isPages
    ? { unoptimized: true }
    : {
        formats: ["image/avif", "image/webp"],
      },
};

if (isPages) {
  nextConfig.output = "export";
  nextConfig.trailingSlash = true;
  nextConfig.basePath = pagesBasePath;
  nextConfig.assetPrefix = `${pagesBasePath}/`;
} else {
  nextConfig.rewrites = async () => [
    {
      source: "/alog/:slug.md",
      destination: "/api/alog-md/:slug",
    },
    {
      source: "/blog/:slug.md",
      destination: "/api/blog-md/:slug",
    },
  ];
  nextConfig.redirects = async () => [
    {
      source: "/docs",
      destination: "https://docs.useautumn.com",
      permanent: false,
    },
    {
      source: "/blog/how-we-built-a-multi-region-architecture-and-why-we-went-back",
      destination: "/blog/active-active-redis-cache",
      permanent: true,
    },
  ];
  nextConfig.headers = async () => {
    if (!isProd) return [];

    return [
      {
        source: "/_next/static/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/animation/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/images/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=604800, stale-while-revalidate=86400",
          },
        ],
      },
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              [
                "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
                "https://vercel.live",
                ...RB2B_HOSTS,
              ].join(" "),
              "style-src 'self' 'unsafe-inline'",
              [
                "img-src 'self' data: blob:",
                "https://framerusercontent.com",
                ...RB2B_HOSTS,
              ].join(" "),
              "font-src 'self' data:",
              "media-src 'self'",
              [
                "connect-src 'self' https://*.vercel.app",
                "https://vitals.vercel-insights.com",
                ...RB2B_HOSTS,
              ].join(" "),
              ["frame-src 'self'", ...RB2B_HOSTS].join(" "),
              "frame-ancestors 'none'",
            ].join("; "),
          },
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
        ],
      },
    ];
  };
}

const withMDX = createMDX({
  options: {
    remarkPlugins: ["remark-frontmatter"],
    rehypePlugins: [
      ["rehype-pretty-code", rehypePrettyCodeOptions],
      "rehype-slug",
    ],
  },
});

export default withMDX(nextConfig);
