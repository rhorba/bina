import { defineConfig, devices } from "@playwright/test";

// Bina E2E — drives a real browser through the sprint's user scenarios.
// Sprint Exit Gate (.claude/CLAUDE.md): record a detailed video and save it under
// docs/sprint-<N>/. Video is always on; raw artifacts land in test-results/, the
// sprint-exit step copies the scenario recording into docs/.
const BASE_URL = process.env["E2E_BASE_URL"] ?? "http://localhost:3010";

export default defineConfig({
  testDir: "./e2e",
  outputDir: "./test-results",
  fullyParallel: false,
  forbidOnly: !!process.env["CI"],
  retries: process.env["CI"] ? 1 : 0,
  workers: 1,
  // Dev-mode compiles each route on first navigation — give tests room.
  timeout: 90_000,
  expect: { timeout: 15_000 },
  reporter: [["list"], ["html", { outputFolder: "playwright-report", open: "never" }]],
  use: {
    baseURL: BASE_URL,
    video: "on", // record every scenario — required by the Sprint Exit Gate
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  // Reuse a dev server if one is already on 3010 (matches apps/web/.env.local),
  // otherwise start one. 3010 is required or auth/proxy routes 500 (see memory).
  webServer: {
    command: "pnpm exec next dev -p 3010",
    url: BASE_URL,
    timeout: 120_000,
    reuseExistingServer: !process.env["CI"],
  },
});
