import { check } from 'k6';
import { browser } from 'k6/browser';
import { defaultOptions, url } from './lib/util.js';

const streamingUrl = url('stream_async_components?delay=5');

export const options = {
  scenarios: {
    browser: defaultOptions({ isBrowser: true }),
  },
};

export default async () => {
  const page = await browser.newPage();
  try {
    const response = await page.goto(streamingUrl);
    check(response, {
      'status was 200': (res) => res.status() === 200,
    });
    await page.waitForFunction(() => !document.body.textContent.includes('Loading'), {
      // in milliseconds
      timeout: 5000,
    });
    check(await page.locator('html').textContent(), {
      'has all comments': (text) => {
        // can't define commentIds as a constant outside, this runs in browser context
        const commentIds = [1, 2, 3, 4];
        return commentIds.every((id) => text.includes(`Comment ${id}`));
      },
    });
  } finally {
    await page.close();
  }
};
