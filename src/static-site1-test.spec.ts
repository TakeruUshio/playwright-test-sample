import {test, expect, Page} from '@playwright/test';

import {Locator} from 'playwright';

import {StaticHttpServer} from './StaticHttpServer';

const serverPort = 5000;
const targetUrl = `http://localhost:${serverPort}`;

const server = new StaticHttpServer(serverPort);

test.beforeAll(() => server.start());
test.afterAll(() => server.stop());

test.beforeEach(async ({page}) => {
    await page.goto(targetUrl);
    await page.waitForLoadState();
});

// See https://playwright.dev/docs/release-notes#version-114
test.describe(':visibleを使って2つのセレクターの操作', () => {
    test('locator不使用', async ({page}) => {
      expect(await page.isVisible('ul:visible')).toBeFalsy();
      
      await page.click('.select1');
      await page.waitForSelector('.select1 ul');

      expect(await page.isVisible('ul:visible')).toBeTruthy();
      expect(await page.isVisible('.select1 ul')).toBeTruthy();
      expect(await page.isVisible('.select2 ul')).toBeFalsy();

      await page.click('.select1 ul li:has-text("Option 2")');
      await page.waitForSelector('.select1 ul', {state: 'hidden'});
      expect(await page.isVisible('ul')).toBeFalsy();
      expect(await page.isVisible('ul:visible')).toBeFalsy();
      expect(await page.isVisible('.select1 ul')).toBeFalsy();
      expect(await page.isVisible('.select2 ul')).toBeFalsy();

      await page.click('.select2');
      await page.waitForSelector('.select2 ul');

      // strict mode
      try {
          await page.isVisible('ul', {strict: true, timeout: 100});
          throw new Error('isVisible should throw an error with strict option');
      } catch (e) {
          expect(e.message).toContain(
              'strict mode violation: selector resolved to 2 elements'
          );
      }

      // expect().toBeTruthy(); // このセレクタでは表示されない要素を指す場合もある
      expect(await page.isVisible('ul:visible')).toBeTruthy();
      expect(await page.isVisible('.select1 ul')).toBeFalsy();
      expect(await page.isVisible('.select2 ul')).toBeTruthy();
    });
});