"use strict";
/**
 * Isolates logic for request authentication. We don't want this module to know about
 * Fastify server and its Request and Reply objects. This allows to test module in isolation
 * and without async calls.
 * @module worker/authHandler
 */
// TODO: Replace with fastify-basic-auth per https://github.com/shakacode/react_on_rails_pro/issues/110
const configBuilder_1 = require("../shared/configBuilder");
module.exports = function authenticate(req) {
    const { password } = (0, configBuilder_1.getConfig)();
    if (password && password !== req.body.password) {
        return {
            headers: { 'Cache-Control': 'no-cache, no-store, max-age=0, must-revalidate' },
            status: 401,
            data: 'Wrong password',
        };
    }
    return undefined;
};
//# sourceMappingURL=authHandler.js.map