// playwright.config.ts
import { PlaywrightTestConfig } from '@playwright/test';

const config: PlaywrightTestConfig = {
  reporter: [
    [ process.env.GITHUB_ACTIONS ? 'github' : (process.env.CI ? 'dot' : 'list') ],
    ['json', { outputFile: 'reports/json/results.json' }],
    ['html', { outputFolder: 'reports/html/' }],
    ['junit', { outputFile: 'reports/junit/results.xml' }],
  ],
};
export default config;
