"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const { SlashCommandBuilder } = require("discord.js");
const { IP, postJson } = require("../function");

function formatTradeHistory(tradeHistory) {
    const entries = Object.entries(tradeHistory).sort(([a], [b]) => Number(a) - Number(b));
    let message = "📜 你的交易紀錄如下：\n```\nNo. | Type   | Amount      | Target & Discord ID | Time\n";

    for (const [key, value] of entries) {
        const { target_user, timestamp, transaction_type } = value;
        const time = new Date(timestamp * 1000).toISOString().replace("T", " ").slice(0, 19);
        const type = transaction_type.action;
        const amount = Number(transaction_type.amount).toFixed(2);

        message += `${key.padEnd(4)}| ${type.padEnd(7)}| $${amount.padEnd(11)}| ${target_user.padEnd(20)}| ${time}\n`;
    }

    message += "```";
    return message;
}

exports.default = {
    data: new SlashCommandBuilder()
        .setName("trade-history")
        .setDescription("查詢7日內交易紀錄"),
    
    async execute(_bot, interaction) {
        const userId = interaction.user.id;
        const result = await postJson(`${IP}/check_trade`, { card_holder: userId });

        try {
            await interaction.reply({
                content: result.error
                    ? `❌ 請求失敗：${result.error}`
                    : formatTradeHistory(result),
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