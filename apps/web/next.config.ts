import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

// Baseline security headers applied to every route (Sprint 7 hardening).
// CSP is intentionally pragmatic: Next injects inline styles and (in dev) inline
// scripts, so 'unsafe-inline' is required for style-src; 'unsafe-eval' is dev-only.
// Compliance docs are served from R2 via short-lived signed URLs, allowed here.
const isDev = process.env.NODE_ENV !== "production";
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://pub.bina.ma",
  "font-src 'self' data:",
  "connect-src 'self' https://*.r2.cloudflarestorage.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
]
  .join("; ")
  .concat(isDev ? "" : "; upgrade-insecure-requests");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

const config: NextConfig = {
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  // standalone output needs symlinks — fails on Windows hosts without
  // Developer Mode, and is only consumed by the Docker image anyway
  output: process.env["BUILD_STANDALONE"] === "1" ? "standalone" : undefined,
  // native module — must not be bundled by webpack
  serverExternalPackages: ["argon2"],
  // typedRoutes stays off until v0.1 routes all exist: the nav links to
  // Sprint 2–7 pages (tenders, groupements, dossier…) cannot type-check yet
  webpack: (webpackConfig) => {
    // workspace packages use ESM ".js" import specifiers for ".ts" sources;
    // the client bundle needs this alias to resolve them (server already does)
    webpackConfig.resolve.extensionAlias = {
      ".js": [".ts", ".tsx", ".js"],
    };
    return webpackConfig;
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "pub.bina.ma",
      },
    ],
  },
};

export default withNextIntl(config);
