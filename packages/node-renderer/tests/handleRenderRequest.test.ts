import path from 'path';
import touch from 'touch';
import { lockSync } from 'proper-lockfile';
import {
  BUNDLE_TIMESTAMP,
  createUploadedBundle,
  createVmBundle,
  lockfilePath,
  resetForTest,
  uploadedBundlePath,
} from './helper';
import { hasVMContextForBundle } from '../src/worker/vm';
import handleRenderRequest from '../src/worker/handleRenderRequest';
import { Asset, delay } from '../src/shared/utils';

const testName = 'handleRenderRequest';
const uploadedBundleForTest = (): Asset => ({
  filename: '', // Not used in these tests
  savedFilePath: uploadedBundlePath(testName),
  type: 'asset',
});
const createUploadedBundleForTest = () => createUploadedBundle(testName);
const lockfilePathForTest = () => lockfilePath(testName);
const createVmBundleForTest = () => createVmBundle(testName);
const renderResult = {
  status: 200,
  headers: { 'Cache-Control': 'public, max-age=31536000' },
  data: JSON.stringify({ html: 'Dummy Object' }),
};

describe(testName, () => {
  beforeEach(async () => {
    await resetForTest(testName);
  });

  afterAll(async () => {
    await resetForTest(testName);
  });

  test('If gem has posted updated bundle and no prior bundle', async () => {
    expect.assertions(2);
    await createUploadedBundleForTest();

    const result = await handleRenderRequest({
      renderingRequest: 'ReactOnRails.dummy',
      bundleTimestamp: BUNDLE_TIMESTAMP,
      providedNewBundle: uploadedBundleForTest(),
    });

    expect(result).toEqual(renderResult);
    expect(hasVMContextForBundle(path.resolve(__dirname, `./tmp/${testName}/1495063024898.js`))).toBeTruthy();
  });

  test('If bundle was not uploaded yet and not provided', async () => {
    expect.assertions(1);

    const result = await handleRenderRequest({
      renderingRequest: 'ReactOnRails.dummy',
      bundleTimestamp: BUNDLE_TIMESTAMP,
    });

    expect(result).toEqual({
      status: 410,
      headers: { 'Cache-Control': 'no-cache, no-store, max-age=0, must-revalidate' },
      data: 'No bundle uploaded',
    });
  });

  test('If bundle was already uploaded by another thread', async () => {
    expect.assertions(1);
    await createVmBundleForTest();

    const result = await handleRenderRequest({
      renderingRequest: 'ReactOnRails.dummy',
      bundleTimestamp: BUNDLE_TIMESTAMP,
    });

    expect(result).toEqual(renderResult);
  });

  test('If lockfile exists, and is stale', async () => {
    expect.assertions(2);
    touch.sync(lockfilePathForTest(), { time: '1979-07-01T19:10:00.000Z' });
    await createUploadedBundleForTest();

    const result = await handleRenderRequest({
      renderingRequest: 'ReactOnRails.dummy',
      bundleTimestamp: BUNDLE_TIMESTAMP,
      providedNewBundle: uploadedBundleForTest(),
    });

    expect(result).toEqual(renderResult);
    expect(hasVMContextForBundle(path.resolve(__dirname, `./tmp/${testName}/1495063024898.js`))).toBeTruthy();
  });

  test('If lockfile exists from another thread and bundle provided.', async () => {
    expect.assertions(2);
    await createUploadedBundleForTest();

    const release = lockSync(
      lockfilePathForTest(),
      { stale: 10000, realpath: false },
    );

    await delay(5);
    console.log('TEST building VM from sleep');
    await createVmBundleForTest();
    console.log('TEST DONE building VM from sleep');
    release();
    console.log('TEST unlocked lockfile');

    const result = await handleRenderRequest({
      renderingRequest: 'ReactOnRails.dummy',
      bundleTimestamp: BUNDLE_TIMESTAMP,
      providedNewBundle: uploadedBundleForTest(),
    });

    expect(result).toEqual(renderResult);
    expect(hasVMContextForBundle(path.resolve(__dirname, `./tmp/${testName}/1495063024898.js`))).toBeTruthy();
  });
});
