"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const { SlashCommandBuilder } = require("discord.js");
const { IP, postJson } = require("../function");
const fs = require("fs");
const path = require("path");
const CONNECTION_FILE = path.join(__dirname, "..", "connection.json");

function saveToken(senderId, token) {
    let data = {};

    if (fs.existsSync(CONNECTION_FILE)) {
        try {
            const raw = fs.readFileSync(CONNECTION_FILE, "utf8");
            data = JSON.parse(raw);
        } catch (e) {
            console.error("無法讀取舊的 connection.json：", e);
        }
    }

    data[senderId] = { token };

    try {
        fs.writeFileSync(CONNECTION_FILE, JSON.stringify(data, null, 2), "utf8");
        console.log(`已儲存 ${senderId} 的 token`);
    } catch (e) {
        console.error("寫入 connection.json 失敗：", e);
    }
}

exports.default = {
    data: new SlashCommandBuilder()
        .setName("connect")
        .setDescription("將帳戶連結至唐人銀行")
        .addStringOption(option =>
        option.setName("card")
            .setDescription("持有的卡片")
            .setRequired(true)
            .setAutocomplete(true)
    ),

    async execute(_bot, interaction) {
        const senderId = interaction.user.id;
        const verify = {
            card_holder: senderId,
            target: "Tang Stock"
        }; 

        const result = await postJson(`${IP}/connect`, verify);

        if (result.status === "ok") {
            await interaction.reply({
                content: `✅ 連結成功!`,
                ephemeral: true
            });
            saveToken(senderId, result.token);
        } else if (result.status === "exists") {
            await interaction.reply({
                content: `⚠️ 您已連結過!`,
                ephemeral: true
            });
            saveToken(senderId, result.token);
        } else {
            await interaction.reply({
                content: `❌ 連結失敗：${result.error || "未知錯誤"}`,
                ephemeral: true
            });
        }
    },

    async autocomplete(_bot, interaction) {
        const senderId = interaction.user.id;
        const result = await postJson(`${IP}/get_card`, { card_holder: senderId });
        const focused = interaction.options.getFocused();
        const results = result.cards
            .filter(c => c.toLowerCase().includes(focused.toLowerCase()))
            .slice(0, 25)
            .map(c => ({ name: c, value: c }));
        await interaction.respond(results);
    }
};