"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const { SlashCommandBuilder } = require("discord.js");
const { IP, postJson } = require("../function");

exports.default = {
    data: new SlashCommandBuilder()
        .setName("pay")
        .setDescription("支付金額給另一個用戶")
        .addUserOption(option =>
            option.setName("target")
                .setDescription("目標用戶")
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName("amount")
                .setDescription("支付金額")
                .setRequired(true)),
    async execute(_bot, interaction) {
        const targetUser = interaction.options.getUser("target");
        const senderId = interaction.user.id;
        const amount = interaction.options.getInteger("amount");

        if (targetUser.id == senderId) {
            return interaction.reply({
                content: `❌ 你要給自己錢????。`,
                ephemeral: true,
            });
        }

        if (amount <= 0) {
            return interaction.reply({
                content: `❌ 金額必須大於零。`,
                ephemeral: true,
            });
        }

        const senderCheck = await postJson(`${IP}/check_target`, {
            card_holder: senderId
        });
        if (senderCheck.status !== "ok") {
            return interaction.reply({
                content: `❌ 你尚未註冊，請先註冊帳戶。`,
                ephemeral: true
            });
        }

        const targetCheck = await postJson(`${IP}/check_target`, {
            card_holder: targetUser.id
        });
        if (targetCheck.status !== "ok") {
            return interaction.reply({
                content: `❌ 對方尚未註冊，無法完成支付。`,
                ephemeral: true
            });
        }

        const debitPayload = {
            card_holder: senderId,
            target_user: targetUser.id,
            transaction_type: {
                action: "debit",
                amount: amount
            }
        };        
        const debitResult = await postJson(`${IP}/dc_trade`, debitPayload);
        if (debitResult.error) {
            return interaction.reply({
                content: `❌ 扣款失敗：${debitResult.error}`,
                ephemeral: true
            });
        }
        
        const creditPayload = {
            card_holder: targetUser.id,
            target_user: senderId,
            transaction_type: {
                action: "credit",
                amount: amount
            }
        };
        const creditResult = await postJson(`${IP}/dc_trade`, creditPayload);
        if (creditResult.error) {
            return interaction.reply({
                content: `❌ 加款給對方失敗：${creditResult.error}，你可以私訊管理員退款`,
                ephemeral: true
            });
        }        

        await interaction.reply({
            content: `✅ 成功支付 ${amount} 元給 <@${targetUser.id}>！`,
        });

        try {
            const user = await interaction.client.users.fetch(targetUser.id);
            await user.send(`💰 你收到來自 <@${senderId}> 的 ${amount} 元款項！`);
        } catch {
            console.log('❌發送私訊失敗!');
        }

        try {
            const user = await interaction.client.users.fetch(senderId);
            await user.send(`💰 成功轉給 <@${targetUser.id}> 共 ${amount} 元！`);
        } catch {
            console.log('❌發送私訊失敗!');
        }
    }
};
