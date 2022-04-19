import 'dotenv/config'
import express from 'express';
import fetch from 'node-fetch';
import bodyParser from 'body-parser';
import { Crypto } from '@peculiar/webcrypto';

const app = express()
const port = 80
const crypto = new Crypto();

const BOT_API_URL = "https://api.telegram.org/bot";
const APP_BASE_URL = "https://YOUR_HOST_URL_HERE/"; // Used to tell bot what page to open

// App logic

app.use(express.urlencoded({ extended: true }))
app.use(bodyParser.json());
app.use(express.static('public'));

app.post('/demo/checkData', async (req, res) => {
    const initData = req.body._auth;
    if (!initData) {
        res.sendStatus(400);
        return;
    }

    const data = transformInitData(initData);
    const isOk = await validate(data, process.env.BOT_TOKEN);
    res.send({
        ok: isOk,
        error: isOk ? null : "Invalid hash",
    })
});

app.post('/demo/sendMessage', async (req, res) => {
    const initData = req.body._auth;
    if (!initData) {
        res.sendStatus(400);
        return;
    }

    const data = transformInitData(initData);
    const isOk = await validate(data, process.env.BOT_TOKEN);
    if (!isOk) {
        res.sendStatus(403);
        return;
    }

    if (req.body.with_webview) {
        makeBotRequest("answerWebAppQuery", {
            web_app_query_id: data.query_id,
            result: {
                type: 'photo',
                id: '42',
                photo_url: 'https://picsum.photos/600/300.jpg',
                thumb_url: 'https://picsum.photos/600/300.jpg',
                reply_markup: {
                    inline_keyboard: [[
                        {
                            text: 'Open',
                            web_app: { url: APP_BASE_URL + "demo.html" },
                        },
                    ]],
                }
            }
        })
    } else {
        makeBotRequest("answerWebAppQuery", {
            web_app_query_id: data.query_id,
            result: {
                type: 'article',
                id: '1',
                title: 'Title',
                input_message_content: {
                    message_text: 'Message sent from webview',
                }
            }
        })
    }
});

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})

// https://gist.github.com/zubiden/175bfed36ac186664de41f54c55e4327
function transformInitData(initData) {
    return Object.fromEntries(new URLSearchParams(initData));
}

async function validate(data, botToken) {
    const encoder = new TextEncoder()

    const checkString = Object.keys(data)
        .filter((key) => key !== "hash")
        .map((key) => `${key}=${data[key]}`)
        .sort()
        .join("\n")

    const secretKey = await crypto.subtle.importKey("raw", encoder.encode('WebAppData'), { name: "HMAC", hash: "SHA-256" }, true, ["sign"])
    const secret = await crypto.subtle.sign("HMAC", secretKey, encoder.encode(botToken))
    const signatureKey = await crypto.subtle.importKey("raw", secret, { name: "HMAC", hash: "SHA-256" }, true, ["sign"])
    const signature = await crypto.subtle.sign("HMAC", signatureKey, encoder.encode(checkString))

    const hex = [...new Uint8Array(signature)].map(b => b.toString(16).padStart(2, '0')).join('')

    return data.hash === hex
}

// Bot logic

// Your bot library probably does this for you
// This is just a simple request-based mockup
function sendDemoButton(chatId) {
    makeBotRequest("sendMessage", {
        chat_id: chatId,
        text: "You can open demo with button below",
        reply_markup: {
            inline_keyboard: [[
                {
                    text: "Open demo",
                    web_app: { url: APP_BASE_URL + "demo.html" }
                },
            ]],
        },
    }).catch(err => {
        console.log(err);
    });
}

function sendSimpleModeButton(chatId) {
    makeBotRequest("sendMessage", {
        chat_id: chatId,
        text: "You can open simple mode with your keyboard button",
        reply_markup: {
            keyboard: [[
                {
                    text: "Open simple mode",
                    web_app: { url: APP_BASE_URL + "simple.html" }
                },
            ]],
        },
    }).catch(err => {
        console.log(err);
    });
}

let lastUpdateId = 0;
function checkUpdates() {
    makeBotRequest("getUpdates", {
        offset: lastUpdateId + 1,
        limit: 1,
    }).then(data => {
        if (data.ok) {
            const update = data.result[0];
            if (update) {
                lastUpdateId = update.update_id;
                // console.log(update);
                const message = update.message;
                const chatId = message.chat.id;
                const messageId = message.message_id;
                if (message.web_app_data) {
                    const { button_text, data } = message.web_app_data;
                    makeBotRequest("sendMessage", {
                        chat_id: chatId,
                        text: `Got data from button "${button_text}": \n\`${data}\``,
                        parse_mode: "Markdown",
                        reply_to_message_id: messageId,
                    });
                    return;
                }

                if (message.via_bot) return; // Ignore our messages

                if (message.text === "/demo") {
                    sendDemoButton(chatId);
                } else if (message.text === "/simple") {
                    sendSimpleModeButton(chatId);
                } else {
                    makeBotRequest("sendMessage", {
                        chat_id: chatId,
                        text: "Supported commands: /demo, /simple",
                        reply_to_message_id: messageId,
                    });
                }
            } else {
                lastUpdateId = 0;
            }
        }
    }).catch(err => {
        console.log(err);
    });
}

setInterval(checkUpdates, 3000);

function makeBotRequest(method, params) {
    return new Promise((resolve, reject) => {
        const url = BOT_API_URL + process.env.BOT_TOKEN + "/" + method;
        fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(params)
        }).then(response => {
            if (response.status !== 200) {
                reject(`${url.replace(process.env.BOT_TOKEN, "TOKEN")} with parameters ${JSON.stringify(params)} responded with code ${response.status}`);
            }
            return response.json();
        }).then(data => {
            resolve(data);
        }).catch(err => {
            reject(err);
        });
    });
}
