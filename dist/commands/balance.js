"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const { SlashCommandBuilder } = require("discord.js");
const { IP, postJson } = require("../function");

exports.default = {
    data: new SlashCommandBuilder()
        .setName("balance")
        .setDescription("查詢帳戶餘額"),
    
    async execute(_bot, interaction) {
        const userId = interaction.user.id;
        const result = await postJson(`${IP}/get_balance`, { card_holder: userId });

        try {
            await interaction.reply({
                content: result.error
                    ? `❌ 請求失敗：${result.error}`
                    : `💰 您的餘額為 \`${result.balance}\` USD`,
                ephemeral: true
            });
        } catch (e) {
            await interaction.reply({
                content: "⚠️系統錯誤，請通知管理人員。",
                ephemeral: true
            });
        }
    }
};