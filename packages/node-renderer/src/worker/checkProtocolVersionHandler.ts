/**
 * Logic for checking protocol version.
 * @module worker/checkProtocVersionHandler
 */
import type { FastifyRequest } from './types';
import packageJson from '../shared/packageJson';

export = function checkProtocolVersion(req: FastifyRequest) {
  const reqProtocolVersion = (req.body as { protocolVersion?: string }).protocolVersion;
  const { supportsProtocolVersions } = packageJson;
  if (!reqProtocolVersion || !supportsProtocolVersions.includes(reqProtocolVersion)) {
    return {
      headers: { 'Cache-Control': 'no-cache, no-store, max-age=0, must-revalidate' },
      status: 412,
      data: `Unsupported renderer protocol version ${
        reqProtocolVersion
          ? `request protocol ${reqProtocolVersion}`
          : `MISSING with body ${JSON.stringify(req.body)}`
      } does not match installed renderer protocols ${supportsProtocolVersions.join(', ')} for version ${packageJson.version}.installed
match installed renderer protocols \`${supportsProtocolVersions.join(', ')}\` for version \`${packageJson.version}\`.
Update either the renderer or the Rails server`,
    };
  }

  return undefined;
};
