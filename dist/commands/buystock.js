"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const { SlashCommandBuilder } = require("discord.js");
const { IP, postJson } = require("../function");
const fs = require("fs");
const path = require("path");
const CONNECTION_FILE = path.join(__dirname, "..", "connection.json");

function getToken(senderId) {
    if (!fs.existsSync(CONNECTION_FILE)) {
        return null;
    }

    try {
        const raw = fs.readFileSync(CONNECTION_FILE, "utf8");
        const data = JSON.parse(raw);
        return data[senderId]?.token ?? null;
    } catch (e) {
        console.error("讀取 token 發生錯誤：", e);
        return null;
    }
}

exports.default = {
    data: new SlashCommandBuilder()
    .setName("buystock")
    .setDescription("買入股票")
    .addStringOption(option =>
        option.setName("type")
            .setDescription("買漲或買跌")
            .setRequired(true)
            .addChoices(
                { name: '📈買漲(做多)', value: 'Long' },
                { name: '📉買跌(做空)', value: 'Short' },
            )
    )
    .addStringOption(option =>
        option.setName("symbol")
            .setDescription("股票代號或公司名稱")
            .setRequired(true)
            .addChoices(
                { name: 'Apple (AAPL)', value: 'AAPL' },
                { name: 'Nvidia (NVDA)', value: 'NVDA' },
                { name: 'Tesla (TSLA)', value: 'TSLA' },
                { name: 'Amazon (AMZN)', value: 'AMZN' },
                { name: 'Google (GOOG)', value: 'GOOG' },
                { name: 'Meta (META)', value: 'META' },
                { name: 'Netflix (NFLX)', value: 'NFLX' },
                { name: 'Microsoft (MSFT)', value: 'MSFT' },
                { name: 'Intel (INTC)', value: 'INTC' },
                { name: 'AMD (AMD)', value: 'AMD' },
                { name: 'Oracle (ORCL)', value: 'ORCL' },
            )
    )
    .addIntegerOption(option =>
        option.setName("hand")
            .setDescription("購買手數")
            .setRequired(true)
            .addChoices(
                { name: '1 手', value: 1 },
                { name: '5 手', value: 5 },
                { name: '10 手', value: 10 },
                { name: '20 手', value: 20 },
                { name: '50 手', value: 50 },
                { name: '100 手', value: 100 },
            )
    )
    .addIntegerOption(option =>
        option.setName("leverage")
            .setDescription("槓桿倍數")
            .setRequired(true)
            .addChoices(
                { name: '1 倍', value: 1 },
                { name: '5 倍', value: 5 },
                { name: '10 倍', value: 10 },
                { name: '20 倍', value: 20 },
                { name: '50 倍', value: 50 },
                { name: '100 倍', value: 100 },
            )
    ),
    async execute(_bot, interaction) {
        const senderId = interaction.user.id;
        const buy_type = interaction.options.getString("type");
        const symbol = interaction.options.getString("symbol");
        const hand = interaction.options.getInteger("hand");
        const leverage = interaction.options.getInteger("leverage");
        const token = getToken(senderId);

        if (!token) {
            await interaction.reply({
                content: "❌ 尚未綁定唐人銀行帳戶，請先使用 `/connect`。",
                ephemeral: true
            });
            return;
        }

        if (leverage > 100 || leverage < 1) {
            return interaction.reply({
                content: `❌ 槓桿必須介於 1 到 100 之間 (包含 1 和 100)!`,
                ephemeral: true,
            });
        }

        if (hand < 1) {
            return interaction.reply({
                content: `❌ 買入手數必須大於 1 手 (包含 1)!`,
                ephemeral: true,
            });
        }

        const buyinfo = {
            buy_type,
            symbol,
            hand,
            leverage,
            token,
            target: "Tang Stock",
            card_holder: senderId,
        };

        const result = await postJson(`${IP}/buy_stock`, buyinfo);

        try {
            await interaction.reply({
                content: result.error
                    ? `❌ 請求失敗：${result.error}`
                    : `📈 股票代號：${result.symbol}\n` +
                      `🧾 買入張數：${result.hand} 張\n` +
                      `⚙️ 槓桿倍數：${result.leverage}x\n` +
                      `💵 最終花費：$${result.cost}`,
                ephemeral: true
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
