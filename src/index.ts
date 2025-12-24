import "dotenv/config";
import express from "express";
import { Bot } from "grammy";
import fetch from "node-fetch";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const XAI_API_KEY = process.env.XAI_API_KEY;
const PORT = Number(process.env.PORT || 3000);

if (!BOT_TOKEN) throw new Error("Missing TELEGRAM_BOT_TOKEN");
if (!XAI_API_KEY) throw new Error("Missing XAI_API_KEY");

const bot = new Bot(BOT_TOKEN);

const SYSTEM_PROMPT =
  "You are BEAR, a smart and friendly AI assistant. " +
  "Reply in English only. " +
  "Be clear, helpful, and respectful.";

async function askGrok(userMessage) {
  const res = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${XAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "grok-4",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userMessage }
      ]
    })
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`xAI API error ${res.status}: ${text}`);
  }

  const data = await res.json();
  return data?.choices?.[0]?.message?.content || "No response.";
}

bot.on("message:text", async (ctx) => {
  try {
    await ctx.reply("BEAR is thinking...");
    const reply = await askGrok(ctx.message.text);
    await ctx.reply(reply);
  } catch (err) {
    console.error(err);
    await ctx.reply("Error occurred. Please try again.");
  }
});

const app = express();
app.use(express.json());

app.get("/", (_req, res) => res.send("OK"));

app.post("/webhook", async (req, res) => {
  try {
    console.log("Webhook hit");
    await bot.handleUpdate(req.body);
    res.sendStatus(200);
  } catch (err) {
    console.error("Webhook error:", err);
    res.sendStatus(200);
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
