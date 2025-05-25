"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const structures_1 = require("./structures");
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = "0";
const bot = new structures_1.Bot();
bot.init();