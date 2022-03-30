// playwright.config.ts
// https://playwright.dev/docs/test-configuration

import { PlaywrightTestConfig } from '@playwright/test';

const config: PlaywrightTestConfig = {
  use: {
    channel: 'chrome',
  },
  reporter: [
    [ process.env.GITHUB_ACTIONS ? 'github' : (process.env.CI ? 'dot' : 'list') ],
    ['json', { outputFile: 'reports/json/results.json' }],
    ['html', { outputFolder: 'reports/html/' }],
    ['junit', { outputFile: 'reports/junit/results.xml' }],
  ],
};
export default config;
