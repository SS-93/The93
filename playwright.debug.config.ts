
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
    testDir: './tests/e2e',
    testMatch: 'debug-passport.spec.ts',
    reporter: 'list',

    use: {
        baseURL: 'http://localhost:3000',
        trace: 'on',
        screenshot: 'on',
    },

    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
    ],

    webServer: {
        command: 'BROWSER=none npm start',
        url: 'http://localhost:3000',
        reuseExistingServer: true,
        timeout: 120 * 1000,
    },
});
