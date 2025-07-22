const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const { generateReplyFromGemini, processVoiceWithGemini } = require('./messengar.js'); // Custom Gemini function

// Initialize WhatsApp client
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

// Show QR code
client.on('qr', (qr) => {
    console.log('📲 Scan this QR code with WhatsApp:');
    qrcode.generate(qr, { small: true });
});

// WhatsApp client ready
client.on('ready', () => {
    console.log('✅ KartavyaAI WhatsApp Bot is ready!');
});

// Handle messages from any number (text and voice)
client.on('message', async (msg) => {
    const sender = msg.from; // Format: '91xxxxxxxxxx@c.us'
    
    try {
        // Handle voice messages - Direct processing with Gemini
        if (msg.hasMedia && (msg.type === 'audio' || msg.type === 'ptt')) {
            console.log(`📥 Voice message from ${sender}`);
            
            try {
                const media = await msg.downloadMedia();
                
                // Process voice directly with Gemini (no transcription)
                const reply = await processVoiceWithGemini(
                    Buffer.from(media.data, 'base64'), 
                    media.mimetype || 'audio/ogg',
                    [] // Add chat history here if needed
                );
                
                console.log(`🤖 Gemini voice reply: ${reply.reply}`);
                await msg.reply(reply.reply);
                
            } catch (voiceErr) {
                console.error(`❌ Voice processing failed: ${voiceErr.message}`);
                await msg.reply("⚠️ Sorry, I couldn't process your voice message. Please try again or send a text message.");
                return;
            }
        } 
        // Handle text messages
        else if (msg.body) {
            const messageContent = msg.body.trim();
            console.log(`📥 Text message from ${sender}: ${messageContent}`);
            
            const incoming = messageContent.toLowerCase();
            
            // Check if message is a greeting
            const greetings = ['hi', 'hello', 'hey', 'good morning', 'good afternoon', 'good evening', 'namaste'];
            const isGreeting = greetings.some(greeting => incoming.includes(greeting));
            
            if (isGreeting) {
                // Send personalized greeting for KartavyaAI
                const greetingMessage = `Hi there! 👋 This is *KartavyaBot* from *KartavyaAI* – your AI and web solutions partner. How may I help you today?`;
                await msg.reply(greetingMessage);
                console.log(`✅ Sent greeting to ${sender}`);
            } else {
                // Generate response using Gemini for non-greeting messages
                const reply = await generateReplyFromGemini(messageContent, []);
                console.log(`🤖 Gemini text reply: ${reply.reply}`);
                await msg.reply(reply.reply);
            }
        }
        // Handle other media types
        else if (msg.hasMedia) {
            await msg.reply("📷 I can see you sent media, but I can only process text and voice messages at the moment.");
            return;
        }
        // Handle empty messages
        else {
            await msg.reply("⚠️ I didn't receive any message content. Please try again.");
            return;
        }
        
    } catch (err) {
        console.error(`❌ Reply failed: ${err.message}`);
        await msg.reply("⚠️ Sorry, something went wrong while processing your message. Please try again.");
    }
});

client.initialize();