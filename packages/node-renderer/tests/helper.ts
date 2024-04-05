/* eslint-disable */
// @ts-nocheck
// NOTE: The tmp bundle directory for each test file must be different due to the fact that
// jest will run multiple test files synchronously.
import path from 'path';
import fs from 'fs';
import { promisify } from 'util';
import fsExtra from 'fs-extra';
import { buildVM, resetVM } from '../src/worker/vm';
import { buildConfig } from '../src/shared/configBuilder';

const fsCopyFileAsync = promisify(fs.copyFile);

export const BUNDLE_TIMESTAMP = 1495063024898;

export const ASSET_UPLOAD_FILE = 'loadable-stats.json';
export const ASSET_UPLOAD_OTHER_FILE = 'loadable-stats-other.json';

export function getFixtureBundle() {
  return path.resolve(__dirname, './fixtures/bundle.js');
}

export function getFixtureAsset() {
  return path.resolve(__dirname, `./fixtures/${ASSET_UPLOAD_FILE}`);
}

export function getOtherFixtureAsset() {
  return path.resolve(__dirname, `./fixtures/${ASSET_UPLOAD_OTHER_FILE}`);
}

export function bundlePath(testName) {
  return path.resolve(__dirname, 'tmp', testName);
}

export function setConfig(testName) {
  buildConfig({
    bundlePath: exports.bundlePath(testName),
  });
}

/**
 *
 * @returns {Promise<void>}
 */
export async function createVmBundle(testName) {
  await fsCopyFileAsync(exports.getFixtureBundle(), exports.vmBundlePath(testName));
  return buildVM(exports.vmBundlePath(testName));
}

export function lockfilePath(testName) {
  return `${exports.vmBundlePath(testName)}.lock`;
}

export function uploadedBundleDir(testName) {
  return path.resolve(exports.bundlePath(testName), 'uploads');
}

export function uploadedBundlePath(testName) {
  return path.resolve(exports.uploadedBundleDir(testName), `${exports.BUNDLE_TIMESTAMP}.js`);
}

export function vmBundlePath(testName) {
  return path.resolve(exports.bundlePath(testName), `${exports.BUNDLE_TIMESTAMP}.js`);
}

export function assetPath(testName) {
  return path.resolve(exports.bundlePath(testName), exports.ASSET_UPLOAD_FILE);
}

export function assetPathOther(testName) {
  return path.resolve(exports.bundlePath(testName), exports.ASSET_UPLOAD_OTHER_FILE);
}

export async function createUploadedBundle(testName) {
  const mkdirAsync = promisify(fs.mkdir);
  await mkdirAsync(exports.uploadedBundleDir(testName), { recursive: true });
  return fsCopyFileAsync(exports.getFixtureBundle(), exports.uploadedBundlePath(testName));
}

export async function createAsset(testName) {
  return fsCopyFileAsync(exports.getFixtureAsset(), exports.assetPath(testName));
}

export async function resetForTest(testName) {
  await fsExtra.emptyDir(exports.bundlePath(testName));
  resetVM();
  exports.setConfig(testName);
}

export function readRenderingRequest(projectName, commit, requestDumpFileName) {
  const renderingRequestRelativePath = path.join(
    './fixtures/projects/',
    projectName,
    commit,
    requestDumpFileName,
  );
  return fs.readFileSync(path.resolve(__dirname, renderingRequestRelativePath), 'utf8');
}

export function createResponse(validate) {
  const result = {
    headers: {},
    data: '',
    status: null,
  };

  return {
    set: (key, value) => {
      result.headers[key] = value;
    },
    status: (value) => {
      result.status = value;
    },
    send: (data) => {
      result.data = data;
      validate(result);
    },
  };
}

setConfig('helper');
