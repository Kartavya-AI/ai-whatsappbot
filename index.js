const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

// Display QR code in terminal
client.on('qr', (qr) => {
    console.log('📲 Scan this QR code in WhatsApp:');
    qrcode.generate(qr, { small: true });
});

// Bot is ready
client.on('ready', () => {
    console.log('✅ KartavyaAI WhatsApp Bot is ready!');
});

// Handle incoming messages
client.on('message', async (msg) => {
    const incoming = msg.body.toLowerCase().trim();

    if (incoming === '!ping') {
        await msg.reply('pong 🏓');
    } else if (incoming === 'hi' || incoming === 'hello') {
        await msg.reply(
            `👋 Hello! This is *KartavyaAI*, your AI & web solutions partner.\n\nType *menu* to explore what we offer.`
        );
    } else if (incoming === 'help' || incoming === 'menu') {
        await msg.reply(
            `🛠️ *KartavyaAI Services:*\n` +
            `1. Custom AI Solutions 🤖\n` +
            `2. Website & Web App Development 🌐\n` +
            `3. Chatbot Integration 💬\n` +
            `4. Automation & Workflow Tools ⚙️\n` +
            `5. API & Backend Services 🔌\n\n` +
            `Reply with a number (e.g., 1) to learn more.`
        );
    } else if (incoming === '1') {
        await msg.reply(
            `🤖 *Custom AI Solutions*\nWe build intelligent tools tailored to your business — from analytics to recommendation engines and process automation.`
        );
    } else if (incoming === '2') {
        await msg.reply(
            `🌐 *Web & App Development*\nWe design and develop responsive websites, dashboards, and web apps with modern tech stacks like React, Next.js, and Node.js.`
        );
    } else if (incoming === '3') {
        await msg.reply(
            `💬 *Chatbot Integration*\nWe create smart WhatsApp, Telegram, or website chatbots using GPT, LangChain, Dialogflow, and more.`
        );
    } else if (incoming === '4') {
        await msg.reply(
            `⚙️ *Automation Tools*\nWe automate repetitive business tasks using custom scripts, Zapier, or AI-driven workflow builders.`
        );
    } else if (incoming === '5') {
        await msg.reply(
            `🔌 *API & Backend Services*\nSecure and scalable APIs for mobile/web apps, integrated with databases, third-party services, and admin tools.`
        );
    } else {
        await msg.reply("🤖 I'm not sure how to respond to that. Type *menu* to see available options.");
    }
});

client.initialize();
