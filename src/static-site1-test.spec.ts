import {test, expect, Locator, Page} from '@playwright/test';

import {StaticHttpServer} from './StaticHttpServer';

const serverPort = 5000;
const targetUrl = `http://127.0.0.1:${serverPort}`;

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

    // strict mode の検証
    try {
      await page.isVisible('ul', {strict: true, timeout: 100});
      throw new Error('isVisible should throw an error with strict option');
    } catch (e: any) {
      expect(e.message).toContain(
        'strict mode violation: "ul" resolved to 2 elements:'
      );
    }

    // expect().toBeTruthy(); // このセレクタでは表示されない要素を指す場合もある
    expect(await page.isVisible('ul:visible')).toBeTruthy();
    expect(await page.isVisible('.select1 ul')).toBeFalsy();
    expect(await page.isVisible('.select2 ul')).toBeTruthy();
  });

  test('lotator使用', async ({page}) => {
    const visibleUl = page.locator('ul:visible');
    const select1 = page.locator('.select1');
    const select1ul = page.locator('.select1 ul');
    const select2 = page.locator('.select2');
    const select2ul = select2.locator('ul'); // locatorからlocatorを作ることも可能

    expect(await visibleUl.isVisible()).toBeFalsy();

    await select1.click();
    await (await select1ul.elementHandle())?.waitForElementState('visible');
    expect(await visibleUl.isVisible()).toBeTruthy();
    expect(await select1ul.isVisible()).toBeTruthy();
    expect(await select2ul.isVisible()).toBeFalsy();

    await page.click('.select1 ul li:has-text("Option 2")');
    await page.waitForSelector('.select1 ul', {state: 'hidden'});
    expect(await page.isVisible('ul')).toBeFalsy();
    expect(await page.isVisible('ul:visible')).toBeFalsy();
    expect(await page.isVisible('.select1 ul')).toBeFalsy();
    expect(await page.isVisible('.select2 ul')).toBeFalsy();

    await select2.click();
    await (await select2ul.elementHandle())?.waitForElementState('visible');

    // locatorを使用しても strict mode が使える検証
    try {
      await page.locator('ul').isVisible();
      throw new Error('isVisible should throw an error with strict option');
    } catch (e: any) {
      expect(e.message).toContain(
        'strict mode violation: "ul" resolved to 2 elements:'
      );
    }
    expect(await visibleUl.isVisible()).toBeTruthy();
    expect(await select1ul.isVisible()).toBeFalsy();
    expect(await select2ul.isVisible()).toBeTruthy();
  });
});

test.describe('nthのテスト', () => {
  const changeNum = async (
    page: Page,
    name: string,
    newValue: number,
    sumExpected: number,
    loc: Locator
  ) => {
    await loc.fill(newValue.toString());
    await loc.press('Enter');
    const sumSelector = `tr:has-text("${name}") td.sum`;
    await page.waitForSelector(`${sumSelector}:has-text("${sumExpected}")`);
  };

  const add = async (
    page: Page,
    name: string,
    sumExpected: number,
    loc: Locator
  ) => {
    await loc.click();
    const sumSelector = `tr:has-text("${name}") td.sum`;
    await page.waitForSelector(`${sumSelector}:has-text("${sumExpected}")`);
  };

  const reset = async (page: Page, name: String, loc: Locator) => {
    await loc.click();
    const sumSelector = `tr:has-text("${name}") td.sum`;
    await page.waitForSelector(`${sumSelector}:has-text("0")`);
  };

  test.describe('with nth method', () => {
    test('Alvin', async ({page}) =>
      await reset(page, 'Alvin', page.locator('button.reset').nth(0)));
    test('Alan', async ({page}) =>
      await add(page, 'Alan', 15.04, page.locator('button.add').nth(1)));
    test('Jonathan', async ({page}) =>
      await changeNum(
        page,
        'Jonathan',
        2,
        14,
        page.locator('input.num').nth(2)
      ));
  });

  test.describe('with nth selector', () => {
    test('Alvin', async ({page}) =>
      await reset(page, 'Alvin', page.locator('button.reset >> nth=0')));
    test('Alan', async ({page}) =>
      await add(page, 'Alan', 15.04, page.locator('button.add >> nth=1')));
    test('Jonathan', async ({page}) =>
      await changeNum(
        page,
        'Jonathan',
        2,
        14,
        page.locator('input.num >> nth=2')
      ));
  });
});
