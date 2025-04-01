const fs = require("fs");
const TelegramBot = require("node-telegram-bot-api")
const conf = JSON.parse(fs.readFileSync('conf.json'))
const token = conf.key;

const bot = new TelegramBot (token,{polling: true})

bot.on("message", (msg) =>{
    const chatId = msg.chat.id;
    const text = msg.text;
    if (text === "/start"){
        const chatId = msg.chat.id;
    
        const welcomeMessage = `
        Ciao ${msg.from.first_name}! 👋 Sono il tuo bot manager finanza.
        `;

        const options = {
            reply_markup: {
                inline_keyboard: [
                    [{ text: "💸 Aggiungi un uscita", callback_data: "add_exit" }],
                    [{ text: "💵 Aggiungi entrata", callback_data: "add_incoming" }],
                    [{ text: "📜 Visualizza movimenti", callback_data: "see_movements" }],
                    [{ text: "❌ Termina entrata/uscita periodica", callback_data: "remove_subscriction" }]
                ]
            }
        };

        bot.sendMessage(chatId, welcomeMessage, options);
    }
});

// Gestisci i bottoni
bot.on('callback_query', (callbackQuery) => {
    const msg = callbackQuery.message;
    const data = callbackQuery.data;
    const chatId = msg.chat.id;

    if (data === "add_exit") {
        const welcomeMessage = `
        Puoi scegliere di inserire le tue uscite singole o periodiche, scegli qua sotto.
        `;

        const options = {
            reply_markup: {
                inline_keyboard: [
                    [{ text: "💸 Aggiungi un uscita singola", callback_data: "add_exit_one" }],
                    [{ text: "🔗 Aggiungi un uscita periodica (abbonamento)", callback_data: "add_exit_sub" }]
                ]
            }
        };

        bot.sendMessage(chatId, welcomeMessage, options);
    } else if (data === "add_incoming") {
        const welcomeMessage = `
        Puoi scegliere di inserire le tue entrate singole o periodiche, scegli qua sotto.
        `;

        const options = {
            reply_markup: {
                inline_keyboard: [
                    [{ text: "💸 Aggiungi una entrata singola", callback_data: "add_incoming_one" }],
                    [{ text: "🔗 Aggiungi una entrata periodica (salario)", callback_data: "add_incoming_sub" }]
                ]
            }
        };

        bot.sendMessage(chatId, welcomeMessage, options);
    } else if (data === "see_movements") {
        bot.sendMessage(msg.chat.id, "Funzione per rimuovere un'attività.");
    }else if (data === "remove_subscriction") {
        const welcomeMessage = `
        Puoi scegliere di rimuovere le tue uscite o entrate periodiche, scegli qua sotto.
        `;

        const options = {
            reply_markup: {
                inline_keyboard: [
                    [{ text: "⛓️‍💥 Rimuovi abbonamento", callback_data: "remove_sub" }],
                    [{ text: "⛓️‍💥 Rimuovi salario", callback_data: "remove_salary" }]
                ]
            }
        };

        bot.sendMessage(chatId, welcomeMessage, options);
    }else if (data === "add_exit_one") {
        bot.sendMessage(msg.chat.id, "Funzione per rimuovere un'attività.");
    }else if (data === "add_exit_sub") {
        bot.sendMessage(msg.chat.id, "Funzione per rimuovere un'attività.");
    }else if (data === "add_incoming_one") {
        bot.sendMessage(msg.chat.id, "Funzione per rimuovere un'attività.");
    }else if (data === "add_incoming_sub") {
        bot.sendMessage(msg.chat.id, "Funzione per rimuovere un'attività.");
    }else if (data === "remove_sub") {
        bot.sendMessage(msg.chat.id, "Funzione per rimuovere un'attività.");
    }else if (data === "remove_salary") {
        bot.sendMessage(msg.chat.id, "Funzione per rimuovere un'attività.");
    }

    // Notifica Telegram che il bottone è stato premuto
    bot.answerCallbackQuery(callbackQuery.id);
});
