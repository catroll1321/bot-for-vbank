"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Bot = void 0;
const discord_js_1 = require("discord.js");
const path_1 = __importDefault(require("path"));
const fs_1 = require("fs");
const _1 = require(".");

class Bot extends discord_js_1.Client {
    events = new discord_js_1.Collection();
    commands = new discord_js_1.Collection();
    logger = new _1.Logger();
    _config;
    constructor() {
        super({
            intents: discord_js_1.GatewayIntentBits.Guilds,
            makeCache: discord_js_1.Options.cacheWithLimits({
                ...discord_js_1.Options.DefaultMakeCacheSettings,
                StageInstanceManager: 0,
                ThreadManager: 0,
                ThreadMemberManager: 0
            })
        });
    }
    get config() {
        return this._config;
    }
    async init() {
        this._config = (await import("file://" + path_1.default.join(process.cwd(), "config.json"), {
            with: {
                type: "json"
            }
        })).default;

        await this.loadEvents();
        await this.loadCommands();

        await this.login(this._config.token);

        process
            .on("unhandledRejection", (reason) => this.logger.error(reason))
            .on("uncaughtException", (error, origin) => this.logger.error(error, origin));
    }

    async loadEvents() {
        const dir = path_1.default.join(process.cwd(), "dist", "events");
        const files = (0, fs_1.readdirSync)(dir).filter((file) => file.endsWith(".js"));
        for (const file of files) {
            const event = (await import("file://" + path_1.default.join(dir, file))).default.default;
            this.on(event.name, event.listener.bind(null, this));
            this.events.set(event.name, event);
        }
        this.logger.info(`載入 ${this.events.size} 項事件。`);
    }

    async loadCommands() {
        const dir = path_1.default.join(process.cwd(), "dist", "commands");
        const files = (0, fs_1.readdirSync)(dir).filter((file) => file.endsWith(".js"));
        for (const file of files) {
            const command = (await import("file://" + path_1.default.join(dir, file)))
                .default.default;
            this.commands.set(command.data.name, command);
        }
        this.logger.info(`載入 ${this.commands.size} 條指令。`);
    }

    async registerCommands() {
        if (!this.isReady()) {
            return;
        }
        await this.application.commands.set(this.commands.map((cmd) => cmd.data.setDMPermission(false).toJSON()));
        this.logger.info("完成指令註冊。");
    }
}

exports.Bot = Bot;