"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const packageJson_1 = __importDefault(require("../shared/packageJson"));
module.exports = function checkProtocolVersion(req) {
    const reqProtocolVersion = req.body.protocolVersion;
    if (reqProtocolVersion !== packageJson_1.default.protocolVersion) {
        return {
            headers: { 'Cache-Control': 'no-cache, no-store, max-age=0, must-revalidate' },
            status: 412,
            data: `Unsupported renderer protocol version ${reqProtocolVersion
                ? `request protocol ${reqProtocolVersion}`
                : `MISSING with body ${JSON.stringify(req.body)}`} does not
match installed renderer protocol ${packageJson_1.default.protocolVersion} for version ${packageJson_1.default.version}.
Update either the renderer or the Rails server`,
        };
    }
    return undefined;
};
//# sourceMappingURL=checkProtocolVersionHandler.js.map