"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const { SlashCommandBuilder, AttachmentBuilder } = require("discord.js");
const { createCanvas, loadImage } = require("canvas");
const { IP, postJson } = require("../function");
const roleID = "1330438539544100948";
const path = require("path");

async function generateCard(card, scheme, card_type) {
    const width = 1000, height = 600;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    const radius = 40;
    ctx.beginPath();
    ctx.moveTo(radius, 0);
    ctx.lineTo(width - radius, 0);
    ctx.quadraticCurveTo(width, 0, width, radius);
    ctx.lineTo(width, height - radius);
    ctx.quadraticCurveTo(width, height, width - radius, height);
    ctx.lineTo(radius, height);
    ctx.quadraticCurveTo(0, height, 0, height - radius);
    ctx.lineTo(0, radius);
    ctx.quadraticCurveTo(0, 0, radius, 0);
    ctx.closePath();
    ctx.clip();

    const gradient = ctx.createLinearGradient(0, 0, width, height);

    if (card_type == 'Infinite') {
        gradient.addColorStop(0, "#2a2a2a");
        gradient.addColorStop(1, "#5c5c5c");
    } else if (card_type == 'Platinum') {
        gradient.addColorStop(0, '#a6a6a6');    
        gradient.addColorStop(0.5, '#d9d9d9'); 
        gradient.addColorStop(1, '#f0f0f0'); 
    } else if (card_type == 'Classic') {
        gradient.addColorStop(0, '#b88a00');
        gradient.addColorStop(0.5, '#f8b500');
        gradient.addColorStop(1, '#fceabb'); 
    }

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    for (let i = 0; i < height; i += 4) {
        ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.02})`;
        ctx.fillRect(0, i, width, 2);
    }

    ctx.fillStyle = "#f0f0f0";
    ctx.font = "bold 48px sans-serif";
    ctx.fillText("TANG BANK", 50, 80);

    try {
        const chip = await loadImage(path.join(__dirname, "..", "icons", "chip.png"));
        ctx.drawImage(chip, 50, 120, 140, 100);
    } catch {
        ctx.fillStyle = "#c0c0c0";
        ctx.fillRect(50, 120, 100, 70);
    }

    ctx.font = "bold 60px monospace";
    ctx.fillStyle = "#ffffff";
    const grouped = card.number.match(/.{1,4}/g).join(" ");
    ctx.fillText(grouped, 50, 300);

    ctx.font = "30px sans-serif";
    ctx.fillStyle = "#dddddd";
    ctx.fillText("GOOD THRU", 50, 390);

    ctx.font = "bold 40px sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(card.goodThru, 300, 390);

    ctx.font = "bold 36px sans-serif";
    ctx.fillText(card.holder.toUpperCase(), 50, 500);

    ctx.font = "28px sans-serif";
    ctx.fillText(`CVV: ${card.cvv}`, 50, 550);

    if (scheme == 'MasterCard') {
        const logo = await loadImage(path.join(__dirname, "..", "icons", "master_card_logo.png"));
        ctx.drawImage(logo, width - 308 - 50, height - 100 - 120, 333, 200);
    } else if (scheme == 'Visa') {
        const logo = await loadImage(path.join(__dirname, "..", "icons", "visa_logo.png"));
        ctx.drawImage(logo, width - 308 - 50, height - 100 - 20, 308, 100);
    }

    return canvas.toBuffer("image/png");
}

exports.default = {
    data: new SlashCommandBuilder()
        .setName("register")
        .setDescription("註冊新帳戶")
        .addStringOption(option =>
            option.setName("scheme")
                .setDescription("選擇發卡組織")
                .setRequired(true)
                .addChoices(
                    { name: 'Visa', value: 'Visa' },
                    { name: 'Master Card', value: 'MasterCard' },
                )
        )
        .addStringOption(option =>
            option.setName("card-type")
                .setDescription("選擇卡片類型")
                .setRequired(true)
                .addChoices(
                    { name: '黑卡', value: 'Infinite' },
                    { name: '白金卡', value: 'Platinum' },
                    { name: '一般卡', value: 'Classic' },
                )
        ),

    async execute(bot, interaction) {
        const scheme = interaction.options.getString("scheme");
        const card_type = interaction.options.getString("card-type");
        const userId = interaction.user.id;
        await interaction.deferReply({ ephemeral: true });

        const result = await postJson(`${IP}/signup`, { discord_id: userId, scheme, card_type});

        if (result.error) {
            return await interaction.editReply(`❌ 註冊失敗：${result.error}`);
        }

        const signup_reward = {
            card_holder: userId,
            target_user: "Tang Bank!",
            transaction_type: {
                action: "credit",
                amount: 10000,
            },
        };

        const creditResult = await postJson(`${IP}/dc_trade`, signup_reward);
        if (creditResult.error) {
            return await interaction.editReply(`✅ 註冊成功！但加款失敗：${creditResult.error}，請聯絡管理員`);
        }

        const user = await interaction.client.users.fetch(userId);
        const username = user.username;
        const imageBuffer = await generateCard({number: String(result.card_number), goodThru: result.good_thru, cvv: result.verify_number, holder: username}, scheme, card_type);
        const attachment = new AttachmentBuilder(imageBuffer, { name: "card.png" });

        const guild = await bot.guilds.fetch(interaction.guildId);
        const member = await guild.members.fetch(interaction.user.id);

        try {
            await user.send({
                content: "✅ 註冊成功！以下是你的卡片資訊：",
                files: [attachment],
            });
        } catch (e) {
            console.error("私訊失敗：", e);
            return await interaction.editReply("✅ 註冊成功，但無法私訊你，請確認已開啟私訊。");
        }

        try {
            await member.roles.add(roleID);
        } catch (e) {
            return await interaction.editReply("✅ 註冊成功，但無法新增身分組，請通知管理員。");
        }

        await interaction.editReply("📬 註冊成功結果已透過私訊傳送！");
    },
};