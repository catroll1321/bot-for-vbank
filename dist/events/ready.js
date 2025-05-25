"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = {
    name: "ready",
    async listener(bot) {
        await bot.registerCommands();
        bot.logger.info(`${bot.user.tag} 啟動完成。`);
    }
}