const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const axios = require('axios');
require('dotenv').config(); // Load environment variables from .env file
// FastAPI endpoint configuration
const FASTAPI_BASE_URL = process.env.FAST_API_BASE_URL || 'http://127.0.0.1:8000'; // Change this to your FastAPI server URL

// Initialize WhatsApp client
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

// Function to call FastAPI query endpoint
async function queryBotCrewAPI(query) {
    try {
        console.log(`🔄 Calling FastAPI with query: "${query}"`);
        
        const response = await axios.post(`${FASTAPI_BASE_URL}/query`, {
            query: query
        }, {
            headers: {
                'Content-Type': 'application/json'
            },
            timeout: 30000 // 30 second timeout
        });

        if (response.data && response.data.result) {
            return {
                reply: response.data.result,
                status: response.data.status
            };
        } else {
            throw new Error('Invalid response format from API');
        }
        
    } catch (error) {
        console.error(`❌ API call failed: ${error.message}`);
        
        if (error.code === 'ECONNREFUSED') {
            return {
                reply: "⚠️ Sorry, the AI service is currently unavailable. Please try again later.",
                status: "error"
            };
        } else if (error.code === 'ETIMEDOUT') {
            return {
                reply: "⚠️ The request is taking longer than expected. Please try again with a simpler question.",
                status: "error"
            };
        } else {
            return {
                reply: "⚠️ Sorry, something went wrong while processing your question. Please try again.",
                status: "error"
            };
        }
    }
}

// Function to check API health
async function checkAPIHealth() {
    try {
        const response = await axios.get(`${FASTAPI_BASE_URL}/health`, {
            timeout: 5000
        });
        console.log('✅ FastAPI service is healthy');
        return true;
    } catch (error) {
        console.error('❌ FastAPI service is not available:', error.message);
        return false;
    }
}

// Show QR code
client.on('qr', (qr) => {
    console.log('📲 Scan this QR code with WhatsApp:');
    qrcode.generate(qr, { small: true });
});

// WhatsApp client ready
client.on('ready', async () => {
    console.log('✅ KartavyaAI WhatsApp Bot is ready!');
    
    // Check API health on startup
    const isHealthy = await checkAPIHealth();
    if (!isHealthy) {
        console.log('⚠️ Warning: FastAPI service is not available. Bot will still start but queries will fail.');
    }
});

// Handle messages from any number (text and voice)
client.on('message', async (msg) => {
    const sender = msg.from; // Format: '91xxxxxxxxxx@c.us'

    try {
        // Handle voice messages
        if (msg.hasMedia && (msg.type === 'audio' || msg.type === 'ptt')) {
            console.log(`📥 Voice message from ${sender}`);
            await msg.reply("🎵 I can see you sent a voice message. Currently, I only process text messages. Please send your question as text.");
            return;
        }

        // Handle text messages
        else if (msg.body) {
            const messageContent = msg.body.trim();
            console.log(`📥 Text message from ${sender}: ${messageContent}`);
            
            // Show typing/processing message
            await msg.reply("🤖 Processing your question...");

            // Call FastAPI instead of Gemini
            const apiResponse = await queryBotCrewAPI(messageContent, sender);
            console.log(`🤖 API reply: ${apiResponse.result}`);
            await msg.reply(apiResponse.result);
        }

        // Handle other media types
        else if (msg.hasMedia) {
            await msg.reply("📷 I can see you sent media, but I can only process text messages at the moment.");
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


// Handle client disconnection
client.on('disconnected', (reason) => {
    console.log('❌ WhatsApp client disconnected:', reason);
});

// Initialize client
client.initialize();