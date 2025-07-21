const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const csv = require('csv-parser');
const { generateReplyFromGemini } = require('./messengar.js'); // Custom Gemini function

// Initialize WhatsApp client
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

const allowedNumbers = new Set();
const nameMap = new Map(); // Optional: to personalize responses if needed

// Show QR code
client.on('qr', (qr) => {
    console.log('📲 Scan this QR code with WhatsApp:');
    qrcode.generate(qr, { small: true });
});

// WhatsApp client ready
client.on('ready', async () => {
    console.log('✅ KartavyaAI WhatsApp Bot is ready!');
    await loadContactsAndSendGreetings();
});

// Handle messages only from allowed numbers
client.on('message', async (msg) => {
    const sender = msg.from; // Format: '91xxxxxxxxxx@c.us'

    if (!allowedNumbers.has(sender)) {
        console.log(`⛔ Ignored message from unauthorized number: ${sender}`);
        return;
    }

    const incoming = msg.body.trim();
    console.log(`📥 Message from ${sender}: ${incoming}`);

    try {
        const reply = await generateReplyFromGemini(incoming);
        console.log(`🤖 Gemini reply: ${reply}`);
        await msg.reply(reply.reply || "I'm here to help you with KartavyaAI services.");
    } catch (err) {
        console.error(`❌ Gemini reply failed: ${err.message}`);
        await msg.reply("⚠️ Sorry, something went wrong while generating a response.");
    }
});

// Load contacts and send welcome messages
async function loadContactsAndSendGreetings() {
    const contacts = [];

    fs.createReadStream('customers.csv')
        .pipe(csv())
        .on('data', (row) => {
            const phone = row.phone.replace(/\s+/g, '');
            const name = row.name || 'there';
            const chatId = `${phone}@c.us`;

            allowedNumbers.add(chatId);
            nameMap.set(chatId, name);
            contacts.push({ chatId, name });
        })
        .on('end', async () => {
            console.log(`📄 Loaded ${contacts.length} contacts from CSV.`);

            for (const contact of contacts) {
                try {
                    const message = `Hi ${contact.name}, this is *KartavyaAI* – your AI and web solutions partner. How may I help you today?`;
                    await client.sendMessage(contact.chatId, message);
                    console.log(`✅ Sent greeting to ${contact.name}`);
                } catch (err) {
                    console.error(`❌ Failed to message ${contact.chatId}: ${err.message}`);
                }
            }
        });
}

client.initialize();
