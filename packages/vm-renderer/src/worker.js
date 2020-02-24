/**
 * Entry point for worker process that handles requests.
 * @module worker
 */

const path = require('path');
const fs = require('fs');
const cluster = require('cluster');
const express = require('express');
const busBoy = require('express-busboy');
const log = require('./shared/log');
const packageJson = require('./shared/packageJson');
const { buildConfig, getConfig } = require('./shared/configBuilder');
const checkProtocolVersion = require('./worker/checkProtocolVersionHandler');
const authenticate = require('./worker/authHandler');
const handleRenderRequest = require('./worker/handleRenderRequest');
const { errorResponseResult, formatExceptionMessage } = require('./shared/utils');
const errorReporter = require('./shared/errorReporter');

function setHeaders(headers, res) {
  Object.keys(headers).forEach(key => res.set(key, headers[key]));
}

const setResponse = (result, res) => {
  const { status, data, headers } = result;
  if (status !== 200 && status !== 410) {
    log.info(data);
  }
  setHeaders(headers, res);
  res.status(status);
  res.send(data);
};

module.exports = function run(config) {
  // Store config in app state. From now it can be loaded by any module using
  // getConfig():
  buildConfig(config);

  const { bundlePath, uploadAssetPath, port } = getConfig();

  const app = express();

  // 10 MB limit for code including props
  const fieldSizeLimit = 1024 * 1024 * 10;

  busBoy.extend(app, {
    upload: true,
    path: path.join(bundlePath, 'uploads'),
    limits: {
      fieldSize: fieldSizeLimit,
    },
  });

  const isProtocolVersionMatch = (req, res) => {
    // Check protocol version
    const protocolVersionCheckingResult = checkProtocolVersion(req);

    if (typeof protocolVersionCheckingResult === 'object') {
      setResponse(protocolVersionCheckingResult, res);
      return false;
    }

    return true;
  };

  const isAuthenticated = (req, res) => {
    // Authenticate Ruby client
    const authResult = authenticate(req);

    if (typeof authResult === 'object') {
      setResponse(authResult, res);
      return false;
    }

    return true;
  };

  const requestPrechecks = (req, res) => {
    if (!isProtocolVersionMatch(req, res)) {
      return false;
    }

    if (!isAuthenticated(req, res)) {
      return false;
    }

    return true;
  };

  //
  app.route('/bundles/:bundleTimestamp/render/:renderRequestDigest').post((req, res) => {
    if (!requestPrechecks(req, res)) {
      return;
    }

    const { renderingRequest } = req.body;
    const { bundleTimestamp } = req.params;
    const { bundle: providedNewBundle } = req.files;

    try {
      handleRenderRequest({ renderingRequest, bundleTimestamp, providedNewBundle })
        .then(result => {
          setResponse(result, res);
        })
        .catch(err => {
          const exceptionMessage = formatExceptionMessage(
            renderingRequest,
            err,
            'UNHANDLED error in handleRenderRequest',
          );
          log.error(exceptionMessage);
          errorReporter.notify(exceptionMessage);
          setResponse(errorResponseResult(exceptionMessage), res);
        });
    } catch (theErr) {
      const exceptionMessage = formatExceptionMessage(renderingRequest, theErr);
      log.error(`UNHANDLED TOP LEVEL error ${exceptionMessage}`);
      errorReporter.notify(exceptionMessage);
      setResponse(errorResponseResult(exceptionMessage), res);
    }
  });

  // There can be additional files that might be required
  // in the runtime. Since remote renderer doesn't contain
  // any assets, they must be uploaded manually.
  app.route('/upload-asset').post((req, res) => {
    if (!requestPrechecks(req, res)) {
      return;
    }

    const { asset } = req.files;
    log.info(`Uploading asset ${asset.filename} to ${uploadAssetPath}`);
    try {
      fs.copyFileSync(asset.file, path.join(uploadAssetPath, asset.filename));
      setResponse(
        {
          status: 200,
          data: {
            status: 'Uploaded',
          },
          headers: {},
        },
        res,
      );
    } catch (err) {
      const message = `ERROR when trying to copy asset. ${err}`;
      log.info(message);
      setResponse(errorResponseResult(message), res);
    }
  });

  // Checks if file exist
  app.route('/asset-exists').post((req, res) => {
    if (!requestPrechecks(req, res)) {
      return;
    }

    const { filePath } = req.query;

    if (!filePath) {
      const message = `ERROR: filePath param not provided to /asset-exists`;
      log.info(message);
      setResponse(errorResponseResult(message), res);
      return;
    }

    const assetPath = path.join(uploadAssetPath, filePath);

    log.info(`Checking that ${assetPath} exists`);
    if (fs.existsSync(assetPath)) {
      log.info(`asset-exists: ${assetPath} exists`);
      setResponse({ status: 200, data: { exists: true }, headers: {} }, res);
    } else {
      log.info(`asset-exists: ${assetPath} not exists`);
      setResponse({ status: 200, data: { exists: false }, headers: {} }, res);
    }
  });

  // There can be additional files that might be required
  // in the runtime. Since remote renderer doesn't contain
  // any assets, they must be uploaded manually.
  app.route('/upload-asset').post((req, res) => {
    if (!requestPrechecks(req, res)) {
      return;
    }

    const { asset } = req.files;
    log.info(`Uploading asset ${asset.filename} to ${bundlePath}`);
    try {
      fs.copyFileSync(asset.file, path.join(bundlePath, asset.filename));
      setResponse(
        {
          status: 200,
          data: {
            status: 'Uploaded',
          },
          headers: {},
        },
        res,
      );
    } catch (err) {
      const message = `ERROR when trying to copy asset. ${err}`;
      log.info(message);
      setResponse(errorResponseResult(message), res);
    }
  });

  // Checks if file exist
  app.route('/asset-exists').post((req, res) => {
    if (!requestPrechecks(req, res)) {
      return;
    }

    const { filePath } = req.query;

    if (!filePath) {
      const message = `ERROR: filePath param not provided to /asset-exists`;
      log.info(message);
      setResponse(errorResponseResult(message), res);
      return;
    }

    const assetPath = path.join(bundlePath, filePath);

    log.info(`Checking that ${assetPath} exists`);
    if (fs.existsSync(assetPath)) {
      log.info(`asset-exists: ${assetPath} exists`);
      setResponse({ status: 200, data: { exists: true }, headers: {} }, res);
    } else {
      log.info(`asset-exists: ${assetPath} does not exist`);
      setResponse({ status: 200, data: { exists: false }, headers: {} }, res);
    }
  });

  // There can be additional files that might be required
  // in the runtime. Since remote renderer doesn't contain
  // any assets, they must be uploaded manually.
  app.route('/upload-asset').post((req, res) => {
    if (!requestPrechecks(req, res)) {
      return;
    }

    const { asset } = req.files;
    log.info(`Uploading asset ${asset.filename} to ${bundlePath}`);
    try {
      fs.copyFileSync(asset.file, path.join(bundlePath, asset.filename));
      setResponse(
        {
          status: 200,
          data: {
            status: 'Uploaded',
          },
          headers: {},
        },
        res,
      );
    } catch (err) {
      const message = `ERROR when trying to copy asset. ${err}`;
      log.info(message);
      setResponse(errorResponseResult(message), res);
    }
  });

  // Checks if file exist
  app.route('/asset-exists').post((req, res) => {
    if (!requestPrechecks(req, res)) {
      return;
    }

    const { filePath } = req.query;

    if (!filePath) {
      const message = `ERROR: filePath param not provided to /asset-exists`;
      log.info(message);
      setResponse(errorResponseResult(message), res);
      return;
    }

    const assetPath = path.join(bundlePath, filePath);

    log.info(`Checking that ${assetPath} exists`);
    if (fs.existsSync(assetPath)) {
      log.info(`asset-exists: ${assetPath} exists`);
      setResponse({ status: 200, data: { exists: true }, headers: {} }, res);
    } else {
      log.info(`asset-exists: ${assetPath} does not exist`);
      setResponse({ status: 200, data: { exists: false }, headers: {} }, res);
    }
  });

  app.get('/info', (_req, res) => {
    res.send({
      node_version: process.version,
      renderer_version: packageJson.version,
    });
  });

  // In tests we will run worker in master thread, so we need to ensure server
  // will not listen:
  if (!cluster.isMaster) {
    app.listen(port, () => {
      log.info(`Node renderer worker #${cluster.worker.id} listening on port ${port}!`);
    });
  }

  return app;
};
