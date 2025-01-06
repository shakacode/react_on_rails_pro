"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.configureLogger = configureLogger;
const winston = require("winston");
const { combine, splat, colorize, label, printf } = winston.format;
const myFormat = printf((info) => `[${info.label}] ${info.level}: ${info.message}`);
const transports = [
    new winston.transports.Console({
        handleExceptions: true,
    }),
];
exports.default = winston.createLogger({
    transports,
    format: combine(label({ label: 'RORP' }), splat(), colorize(), myFormat),
    exitOnError: false,
});
function configureLogger(theLogger, logLevel) {
    theLogger.configure({
        level: logLevel,
        transports,
        format: combine(label({ label: 'RORP' }), splat(), colorize(), myFormat),
        exitOnError: false,
    });
}
//# sourceMappingURL=log.js.map