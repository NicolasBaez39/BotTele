const fs = require("fs");
const TelegramBot = require("node-telegram-bot-api");
const database = require("./database");

const conf = JSON.parse(fs.readFileSync("conf.json"));
const telegramConfig = conf.telegram;


const token = telegramConfig.key;
const bot = new TelegramBot(token, { polling: true });
const userSessions = {};
database.createTable(); 

bot.on("message",async (msg) =>{
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
    }else if (userSessions[chatId]?.step === "waiting_amount") {
        const amount = parseFloat(text);
        if (isNaN(amount)) {
            bot.sendMessage(chatId, "Errore: devi inserire un numero valido.");
            return;
        }

        userSessions[chatId].amount = amount;
        userSessions[chatId].step = "waiting_description";

        bot.sendMessage(chatId, "Inserisci una descrizione per l'importo:");
    } else if (userSessions[chatId]?.step === "waiting_description") {
        const description = text;
        const { type, amount } = userSessions[chatId];

        if (type === "expense") {
            await database.insertMovement(chatId,"expense" ,amount, description);
            bot.sendMessage(chatId, `✅ Uscita di ${amount}€ registrata con descrizione: "${description}".`);
        } else if (type === "income") {
            await database.insertMovement(chatId,"income" ,amount, description);
            bot.sendMessage(chatId, `✅ Entrata di ${amount}€ registrata con descrizione: "${description}".`);
        }

        delete userSessions[chatId]; 
    }
});

// Gestisci i bottoni
bot.on('callback_query', async(callbackQuery) => {
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
                    [{ text: "💵 Aggiungi una entrata singola", callback_data: "add_incoming_one" }],
                    [{ text: "🔗 Aggiungi una entrata periodica (salario)", callback_data: "add_incoming_sub" }]
                ]
            }
        };

        bot.sendMessage(chatId, welcomeMessage, options);
    } else if (data === "see_movements") {
        const welcomeMessage = `
        Puoi scegliere di vedere solo le entrare o uscite o tutti movimenti, scegli qua sotto.
        `;

        const options = {
            reply_markup: {
                inline_keyboard: [
                    [{ text: "💵 Visualizza uscite", callback_data: "see_exit" }],
                    [{ text: "💸 Visualizza entrate", callback_data: "see_income" }],
                    [{ text: "📜 Visualizza movimenti", callback_data: "see_all_movements" }]
                ]
            }
        };

        bot.sendMessage(chatId, welcomeMessage, options);
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
        userSessions[chatId] = { step: "waiting_amount", type: "expense" };
        bot.sendMessage(chatId, "Inserisci l'importo dell'uscita:");
    }else if (data === "add_exit_sub") {
        //abbonamento
    }else if (data === "add_incoming_one") {
        userSessions[chatId] = { step: "waiting_amount", type: "income" };
        bot.sendMessage(chatId, "Inserisci l'importo dell'entrata:");
    }else if (data === "add_incoming_sub") {
        //abbonamente
    }else if (data === "remove_sub") {
        bot.sendMessage(msg.chat.id, "Funzione per rimuovere un'attività.");
    }else if (data === "remove_salary") {
        bot.sendMessage(msg.chat.id, "Funzione per rimuovere un'attività.");
    }else if (data === "see_exit") {
        const movements = await database.selectMovementsType(chatId,"expense");
        if (movements.length === 0) {
            bot.sendMessage(chatId, "Nessuna uscita registrata.");
        } else {
            let response = "📊 Uscite registrate:\n";
            movements.forEach(m => {
                const date = new Date(m.date); 
                const formattedDate = date.toLocaleDateString();
                const formattedTime = date.toLocaleTimeString();
                response += `${m.type === 'income' ? "➕" : "➖"} ${m.amount}€ - ${m.description} - ${formattedDate} - ${formattedTime}\n`;
            });
            bot.sendMessage(chatId, response);
        }
    }else if (data === "see_income") {
        const movements = await database.selectMovementsType(chatId,"income");
        if (movements.length === 0) {
            bot.sendMessage(chatId, "Nessuna entrata registrata.");
        } else {
            let response = "📊 Entrate registrate:\n";
            movements.forEach(m => {
                const date = new Date(m.date); 
                const formattedDate = date.toLocaleDateString();
                const formattedTime = date.toLocaleTimeString();
                response += `${m.type === 'income' ? "➕" : "➖"} ${m.amount}€ - ${m.description} - ${formattedDate} - ${formattedTime}\n`;
            });
            bot.sendMessage(chatId, response);
        }
    }else if (data === "see_all_movements") {
        const movements = await database.selectMovements(chatId);
        if (movements.length === 0) {
            bot.sendMessage(chatId, "Nessun movimento registrato.");
        } else {
            let response = "📊 Movimenti registrati:\n";
            movements.forEach(m => {
                const date = new Date(m.date); 
                const formattedDate = date.toLocaleDateString();
                const formattedTime = date.toLocaleTimeString();
                response += `${m.type === 'income' ? "➕" : "➖"} ${m.amount}€ - ${m.description} - ${formattedDate} - ${formattedTime}\n`;
            });
            bot.sendMessage(chatId, response);
        }
    }

    // Notifica Telegram che il bottone è stato premuto
    bot.answerCallbackQuery(callbackQuery.id);
});
