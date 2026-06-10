import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const config: NextConfig = {
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
