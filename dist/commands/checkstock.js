"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const { SlashCommandBuilder } = require("discord.js");
const { IP, postJson } = require("../function");

function formatStocks(stocks) {
    let message = "📈 你目前的持股如下：\n```\nBuy Type | Symbol | Hand | Leverage | Buy Price | Time\n";
    for (const entry of stocks) {
        const stock = entry.stock;
        const time = new Date(entry.timestamp * 1000).toISOString().replace("T", " ").slice(0, 19);
        message += `${stock.buy_type.padEnd(8)} | ${stock.symbol.padEnd(6)} | ${stock.hand.padEnd(4)} | ${stock.leverage.padEnd(8)} | ${stock.price.padEnd(9)} | ${time}\n`;
    }
    message += "```";
    return message;
}

exports.default = {
    data: new SlashCommandBuilder()
        .setName("checkstock")
        .setDescription("查詢持有股票"),
    
    async execute(_bot, interaction) {
        const userId = interaction.user.id;
        const result = await postJson(`${IP}/check_stock`, { card_holder: userId});

        try {
            await interaction.reply({
                content: result.error
                    ? `❌ 請求失敗：${result.error}`
                    : formatStocks(result),
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