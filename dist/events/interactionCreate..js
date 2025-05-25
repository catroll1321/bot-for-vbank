"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = {
    name: "interactionCreate",
    async listener(bot, interaction) {
        if (!interaction.inGuild()) return;

        if (interaction.isAutocomplete()) {
            const command = bot.commands.get(interaction.commandName);
            if (!command || !command.autocomplete) return;

            try {
                await command.autocomplete(bot, interaction);
            } catch (err) {
                bot.logger.error(`Autocomplete 錯誤: ${err}`);
            }
            return;
        }

        if (interaction.isChatInputCommand()) {
            const command = bot.commands.get(interaction.commandName);
            if (!command) return;

            bot.logger.info(`@${interaction.user.username} 執行了 /${interaction.commandName}`);
            try {
                await command.execute(bot, interaction);
            } catch (err) {
                bot.logger.error(`Command 錯誤: ${err}`);
            }
        }
    }
};