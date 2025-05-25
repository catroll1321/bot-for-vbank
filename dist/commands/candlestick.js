"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const { SlashCommandBuilder, AttachmentBuilder } = require("discord.js");
const { CandlestickImage } = require("../function");

exports.default = {
    data: new SlashCommandBuilder()
        .setName("candlestick")
        .setDescription("生成K線圖")
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
        .addStringOption(option =>
            option.setName("period")
                .setDescription("查詢期間")
                .setRequired(true)
                .addChoices(
                    { name: '一小時', value: '1h' },
                    { name: '半天', value: '12h' },
                    { name: '一天', value: '1d' },
                    { name: '一週', value: '1wk' },
                    { name: '一月', value: '1mo' },
                    { name: '三月', value: '3mo' },
                    { name: '半年', value: '6mo' },
                    { name: '一年', value: '1y' },
                )
        )
        .addStringOption(option =>
            option.setName("interval")
                .setDescription("選擇每個時間單位")
                .setRequired(true)
                .addChoices(
                    { name: '5分', value: '5m' },
                    { name: '30分', value: '30m' },
                    { name: '1時', value: '1h' },
                    { name: '1天', value: '1d' },
                    { name: '1週', value: '1wk' },
                )
        ),

    async execute(_bot, interaction) {
        const symbol = interaction.options.getString("symbol");
        const period = interaction.options.getString("period");
        const interval = interaction.options.getString("interval");
        await interaction.deferReply();

        if ((period == '1h' || period == '12h' || period == '1d') && (interval == '1d' || interval == '1wk')) {
            await interaction.editReply("這個期間與間隔的組合不被支援，請重新選擇。");
                return;
        }

        if (period == '1wk' && interval == '1wk') {
            await interaction.editReply("這個期間與間隔的組合不被支援，請重新選擇。");
                return;
        }

        try {
            const imageBuffer = await CandlestickImage(symbol, period, interval);
            const attachment = new AttachmentBuilder(imageBuffer, {
                name: `${symbol}_${period}_candlestick.png`
            });
            await interaction.editReply({ files: [attachment] });
        } catch (error) {
            console.error(error);
            await interaction.editReply("生成圖表時發生錯誤，請稍後再試。");
        }
    }
};