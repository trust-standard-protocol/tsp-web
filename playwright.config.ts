import { defineConfig, devices } from "@playwright/test";

// A11y gate: serves the *built* static site (astro preview) and runs axe-core
// against every page. `test:a11y` builds first, then runs this. Kept boring:
// one Chromium project, the repo's own preview server, no extra infra.
const PORT = 4321;
const HOST = "127.0.0.1";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [["list"]],
  use: {
    baseURL: `http://${HOST}:${PORT}`,
    trace: "off"
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `npm run preview -- --port ${PORT} --host ${HOST}`,
    url: `http://${HOST}:${PORT}/`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000
  }
});
