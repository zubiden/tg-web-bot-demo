# Telegram Web Bots Demo
Simple working example of [Telegram Web Apps](https://core.telegram.org/bots/webapps).

![image](https://user-images.githubusercontent.com/19638254/164005414-e98dfb49-4dc6-4ddb-bc26-b4463667f6b5.png)

## Setup
- Create `.env` file with your bot token.
- Run `npm install`
- Change `APP_BASE_URL` inside `index.js` to your domain.
- Run `npm start`

## Usage
This demo simulates [@asmico_attach_bot](https://t.me/asmico_attach_bot) backend. Since this is a basic example, bot will only respond to `/demo` or `/simple` commands every 3 seconds. If you're working on implementing Web Apps to your bot, your library probably already updated and provides better interfaces for the Telegram Bot API.

This demo was done in 1 hour and is not meant to be running in a production environment.
Tip: Use [localtunnel](https://localtunnel.org/) or [ngrok](https://ngrok.com/) to make local setup available to the Internet.

## Thanks
[@asmico](https://t.me/asmico) for [@asmico_attach_bot](https://t.me/asmico_attach_bot) demo. Parts of https://webappcontent.telegram.org/demo were used in this repo
