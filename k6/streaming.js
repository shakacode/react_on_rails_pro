/* eslint-disable import/no-unresolved */
import { check } from 'k6';
import { browser } from 'k6/browser';
/* eslint-enable import/no-unresolved */
import { defaultOptions, url } from './_util.js';

export const options = defaultOptions(true);

export default async () => {
  const streamingUrl = url('stream_async_components?delay=0');
  const page = await browser.newPage();
  try {
    await page.goto(streamingUrl);
    await page.waitForFunction(
      () => !document.body.textContent.includes('Loading'),
      {
        // in milliseconds
        timeout: 5000,
      },
    );
    check(await page.locator('html').textContent(), {
      'has all comments': (text) => {
        const commentIds = [1, 2, 3, 4];
        return commentIds.every((id) => text.includes(`Comment ${id}`));
      },
    });
  } finally {
    await page.close();
  }
};
