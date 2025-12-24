import "dotenv/config";
import express from "express";
import { Bot } from "grammy";
import fetch from "node-fetch";

// ================== ENV ==================
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const GROK_API_KEY = process.env.XAI_API_KEY;
const PORT = Number(process.env.PORT || 3000);

if (!BOT_TOKEN || !GROK_API_KEY) {
  throw new Error("Missing TELEGRAM_BOT_TOKEN or XAI_API_KEY");
}

// ================== TELEGRAM BOT ==================
const bot = new Bot(BOT_TOKEN);

// BEAR personality (multilingual)
const SYSTEM_PROMPT = `
You are BEAR 🐻, a smart and friendly AI assistant.

Rules:
- Always reply in the same language the user uses.
- You can understand and speak ALL languages.
- Be helpful, clear, and respectful.
`;

// Call Grok AI
async function askGrok(userMessage: string): Promise<string> {
  const response = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${GROK_API_KEY}`,
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

  const data: any = await response.json();
  return data.choices[0].message.content;
}

// Handle incoming messages
bot.on("message:text", async (ctx) => {
  try {
    const userText = ctx.message.text;
    await ctx.reply("🐻 BEAR is thinking...");
    const reply = await askGrok(userText);
    await ctx.reply(reply);
  } catch (error) {
    await ctx.reply("❌ Khalad ayaa dhacay, fadlan mar kale isku day.");
  }
});

// ================== EXPRESS SERVER (Railway) ==================
const app = express();
app.use(express.json());

app.post("/webhook", (req, res) => {
  bot.handleUpdate(req.body);
  res.sendStatus(200);
});

app.get("/", (_req, res) => {
  res.send("BEAR 🐻 is running");
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
