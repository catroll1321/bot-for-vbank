"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const { SlashCommandBuilder } = require("discord.js");

exports.default = {
    data: new SlashCommandBuilder()
        .setName("clear")
        .setDescription("清除私訊"),
    
    async execute(_bot, interaction) {
        const user = interaction.user;

        try {
            const dm = await user.createDM();
            const messages = await dm.messages.fetch({ limit: 100 });
            const botMessages = messages.filter(m => m.author.id === interaction.client.user.id);

            let count = 0;
            for (const msg of botMessages.values()) {
                await msg.delete().catch(() => null);
                count++;
            }

            await interaction.reply({ content: `✅ 已刪除你和 bot 的 DM 中 ${count} 則訊息。`, ephemeral: true });
        } catch (error) {
            console.error("刪除 DM 訊息失敗：", error);
            await interaction.reply({ content: "❌ 無法清除 DM（可能你沒開啟私訊）。", ephemeral: true });
        }
    }
};