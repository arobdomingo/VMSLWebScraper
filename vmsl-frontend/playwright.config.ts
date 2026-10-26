import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
    testDir: './e2e', fullyParallel: true, forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 1 : 0, reporter: 'list',
    use: { baseURL: 'http://127.0.0.1:4173', trace: 'retain-on-failure' },
    projects: [
        { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
        { name: 'tablet', use: { ...devices['Desktop Chrome'], viewport: { width: 768, height: 1024 } } },
        { name: 'mobile', use: { ...devices['Desktop Chrome'], viewport: { width: 390, height: 844 } } },
    ],
    webServer: { env: { VITE_API_BASE_URL: 'http://127.0.0.1:8000' }, command: 'node node_modules/vite/bin/vite.js --host 127.0.0.1 --port 4173 --strictPort', url: 'http://127.0.0.1:4173', reuseExistingServer: !process.env.CI },
});
