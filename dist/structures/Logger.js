"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = void 0;
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
const util_1 = __importDefault(require("util"));

class Logger {
    constructor() {
        const logDir = path_1.default.join(process.cwd(), "logs");
        if (!(0, fs_1.existsSync)(logDir)) {
            (0, fs_1.mkdirSync)(logDir);
        }
        if ((0, fs_1.existsSync)(path_1.default.join(logDir, "latest.log"))) {
            const logFile = path_1.default.join(logDir, "latest.log");
            const fileDate = this.getUTCTime((0, fs_1.statSync)(logFile).mtimeMs);
            (0, fs_1.renameSync)(logFile, path_1.default.join(logDir, `${Object.values(fileDate).join("")}.log`));
        }
    }

    static LogLevel = {
        INFO: "info",
        WARN: "warn",
        ERROR: "error",
        DEBUG: "debug"
    };

    info(...messages) {
        this.writeLog(Logger.LogLevel.INFO, ...messages);
    }

    warn(...messages) {
        this.writeLog(Logger.LogLevel.WARN, ...messages);
    }

    error(...messages) {
        this.writeLog(Logger.LogLevel.ERROR, ...messages);
    }

    debug(...messages) {
        this.writeLog(Logger.LogLevel.DEBUG, ...messages);
    }

    writeLog(level, ...messages) {
        const time = this.getUTCTime();
        let content = `[${time.year}/${time.month}/${time.date}-${time.hours}:${time.minutes}:${time.seconds}]`.padEnd(23) + `[${level.toUpperCase()}]`.padEnd(8);
        for (const msg of messages) {
            if (msg !== "") {
                content += " ";
            }
            if (typeof msg === "object") {
                content += util_1.default.inspect(msg);
            }
            else {
                content += msg;
            }
        }
        console.log(content);
        (0, fs_1.writeFileSync)(path_1.default.join(process.cwd(), "logs", "latest.log"), `${content}\n`, { flag: "a+" });
    }

    getUTCTime(timestamp) {
        if (typeof timestamp !== "number") {
            timestamp = Date.now();
        }
        const formatInt = (n) => (n < 10 ? `0${n}` : `${n}`);
        const tz = process.env["TZ"] && !isNaN(parseInt(process.env["TZ"]))
            ? parseInt(process.env["TZ"])
            : 8;
        const date = new Date(timestamp + tz * 36e5);
        return {
            year: `${date.getUTCFullYear()}`,
            month: formatInt(date.getUTCMonth() + 1),
            date: formatInt(date.getUTCDate()),
            hours: formatInt(date.getUTCHours()),
            minutes: formatInt(date.getUTCMinutes()),
            seconds: formatInt(date.getUTCSeconds())
        };
    }
}
exports.Logger = Logger;