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
    .setName("sellstock")
    .setDescription("賣出股票")
    .addStringOption(option =>
        option.setName("symbol")
            .setDescription("股票代號或公司名稱")
            .setRequired(true)
            .setAutocomplete(true)
    )
    .addStringOption(option =>
        option.setName("stock")
            .setDescription("持有該公司的股票")
            .setRequired(true)
            .setAutocomplete(true)
    ),

    async execute(_bot, interaction) {
        const senderId = interaction.user.id;
        const symbol = interaction.options.getString("symbol");
        const timestampStr = interaction.options.getString("stock");
        const timestamp = parseInt(timestampStr);
        const token = getToken(senderId);

        if (!token) {
            await interaction.reply({
                content: "❌ 尚未綁定唐人銀行帳戶，請先使用 `/connect`。",
                ephemeral: true
            });
            return;
        }

        const sellinfo = {
            symbol,
            timestamp,
            token,
            target: "Tang Stock",
            card_holder: senderId,
        };

        const result = await postJson(`${IP}/sell_stock`, sellinfo);

        try {
            await interaction.reply({
                content: result.error
                    ? `❌ 請求失敗：${result.error}`
                    : `📈 股票代號：${result.symbol}\n` +
                      `🧾 賣出張數：${result.hand} 張\n` +
                      `⚙️ 槓桿倍數：${result.leverage}x\n` +
                      `💵 最終盈餘：$${result.earning}`,
                ephemeral: true
            });
        } catch (e) {
            await interaction.reply({
                content: "⚠️ 無法處理請求!。",
                ephemeral: true
            });
            return;
        }
    },

    async autocomplete(_bot, interaction) {
        const userId = interaction.user.id;
        const result = await postJson(`${IP}/check_stock`, { card_holder: userId });
        const symbol = interaction.options.getString("symbol");

        if (!Array.isArray(result)) {
            await interaction.respond([]);
            return;
        }

        const focusedOption = interaction.options.getFocused(true);
        const focusedValue = focusedOption.value.toLowerCase();

        if (focusedOption.name === "symbol") {
            const allSymbols = result
                .filter(entry => entry.stock && entry.stock.symbol)
                .map(entry => entry.stock.symbol);

            const uniqueSymbols = [...new Set(allSymbols)];

            const choices = uniqueSymbols
                .filter(sym => sym.toLowerCase().includes(focusedValue))
                .slice(0, 25)
                .map(sym => ({
                    name: sym,
                    value: sym
                }));

            await interaction.respond(choices);

        } else if (focusedOption.name === "stock") {
            const stock_info = await postJson(`${IP}/get_price`, { symbol }); 
            const price = parseFloat(stock_info.price);

            const filtered = result
                .filter(entry => entry.stock && entry.stock.symbol === symbol)
                .slice(0, 25)
                .map(entry => {
                    const buy_type = entry.stock.buy_type;
                    const buy_type_show = buy_type === "Long" ? "📈買漲(做多)" : "📉買跌(做空)";
                    const entryPrice = parseFloat(entry.stock.price);
                    const hand = parseInt(entry.stock.hand);
                    const leverage = parseInt(entry.stock.leverage);
                    const timestamp = entry.timestamp;
                    const raw_profit = buy_type === "Short"
                        ? (entryPrice - price) * hand * leverage
                        : (price - entryPrice) * hand * leverage;
                    const profit = raw_profit.toFixed(2);

                    return {
                        name: `${buy_type_show}｜💰$${entryPrice}｜${hand} 股｜${leverage}x｜當前盈虧 $${profit}`,
                        value: `${timestamp}`
                    };
                });
            await interaction.respond(filtered);

        } else {
            await interaction.respond([]);
        }
    }
};
