"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const { SlashCommandBuilder } = require("discord.js");
const { IP, postJson } = require("../function");

exports.default = {
    data: new SlashCommandBuilder()
        .setName("stockprice")
        .setDescription("查詢股票現價")
        .addStringOption(option =>
            option.setName('symbol')
              .setDescription('股票代號或名稱')
              .setRequired(true)),
    async execute(_bot, interaction) {
        const symbol = interaction.options.getString('symbol');
        const result = await postJson(`${IP}/get_price`, { symbol });

        try {
            await interaction.reply({
                content: result.error
                    ? `❌ 請求失敗：${result.error}`
                    : `📈 **股票代號**：\`${result.symbol}\`\n💵 **當前價格**：\`$${result.price}\``
            });
        } catch (e) {
            await interaction.reply({
                content: "⚠️ 無法處理請求!。",
                ephemeral: true
            });
            return;
        }
    }
};