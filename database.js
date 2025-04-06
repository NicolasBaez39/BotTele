const fs = require('fs');
const mysql = require('mysql2');
const conf = JSON.parse(fs.readFileSync('conf.json'));
const mysqlConfig = conf.mysql;
mysqlConfig.ssl = {
   ca: fs.readFileSync(__dirname + '/ca.pem')
};
const connection = mysql.createConnection(mysqlConfig);

connection.connect((err) => {
   if (err) {
      console.error("Errore di connessione al database:", err);
      process.exit(1);
   }
   console.log("Connesso al database!");
});

const executeQuery = (sql, params = []) => {
   return new Promise((resolve, reject) => {
      connection.query(sql, params, function (err, result) {
         if (err) {
            console.error(err);
            reject(err);
         }
         resolve(result);
      });
   });
};

const database = {
   createTable: async () => {
      await executeQuery(`
         CREATE TABLE IF NOT EXISTS movements (
         id INT PRIMARY KEY AUTO_INCREMENT,
         chatId BIGINT NOT NULL, 
         type ENUM('income', 'expense') NOT NULL,
         amount DECIMAL(10,2) NOT NULL,
         description VARCHAR(100),
         date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
      `);
      await executeQuery(`
         CREATE TABLE IF NOT EXISTS subscriptions (
             id INT PRIMARY KEY AUTO_INCREMENT,
             chatId BIGINT NOT NULL, 
             type ENUM('income', 'expense') NOT NULL,
             amount DECIMAL(10,2) NOT NULL,
             description VARCHAR(100),
             frequency_days INT NOT NULL,
             last_payment DATE NOT NULL
         );
     `);
   },

   insertMovement: async (chatId, type, amount, description) => {
      const sql = `
         INSERT INTO movements (chatId, type, amount, description) 
         VALUES (?, ?, ?, ?)
      `;
      return await executeQuery(sql, [chatId, type, amount, description]);
   },

   selectMovements: async (chatId, period) => {
      let sql;

      switch (period) {
         case "day":
             sql = `SELECT * FROM movements WHERE chatId = ? AND DATE(date) = CURDATE() ORDER BY date DESC`;
             break;
         case "week":
             sql = `SELECT * FROM movements WHERE chatId = ? AND YEARWEEK(date, 1) = YEARWEEK(CURDATE(), 1) ORDER BY date DESC`;
             break;
         case "month":
             sql = `SELECT * FROM movements WHERE chatId = ? AND YEAR(date) = YEAR(CURDATE()) AND MONTH(date) = MONTH(CURDATE()) ORDER BY date DESC`;
             break;
         default:
             return [];
     }

      return await executeQuery(sql, [chatId]);
   },

   selectMovementsType: async (chatId,type,period) => {
      let sql;

      switch (period) {
         case "day":
             sql = `SELECT * FROM movements WHERE chatId = ? AND type = ? AND DATE(date) = CURDATE() ORDER BY date DESC`;
             break;
         case "week":
             sql = `SELECT * FROM movements WHERE chatId = ? AND type = ? AND YEARWEEK(date, 1) = YEARWEEK(CURDATE(), 1) ORDER BY date DESC`;
             break;
         case "month":
             sql = `SELECT * FROM movements WHERE chatId = ? AND type = ? AND YEAR(date) = YEAR(CURDATE()) AND MONTH(date) = MONTH(CURDATE()) ORDER BY date DESC`;
             break;
         default:
             return [];
     }

      return await executeQuery(sql, [chatId,type]);
   },
   addSubscription: async (chatId, type, amount, description, frequency_days) => {
      const sql = `
         INSERT INTO subscriptions (chatId, type, amount, description, frequency_days, last_payment) 
         VALUES (?, ?, ?, ?, ?, CURDATE())
      `;
      return await executeQuery(sql, [chatId, type, amount, description, frequency_days]);
  },
   checkRecurringPayments: async () => {
      const sql = `
         SELECT * FROM subscriptions 
         WHERE DATE_ADD(last_payment, INTERVAL frequency_days DAY) <= CURDATE()
      `;
      const subscriptions = await executeQuery(sql);

      for (let sub of subscriptions) {
         await database.insertMovement(sub.chatId, sub.type, sub.amount, sub.description);

         await executeQuery(`
            UPDATE subscriptions 
            SET last_payment = CURDATE() 
            WHERE id = ?
         `, [sub.id]);
      }
   }
};

module.exports = database;
