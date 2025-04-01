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
   },

   insertMovement: async (chatId, type, amount, description) => {
      const sql = `
         INSERT INTO movements (chatId, type, amount, description) 
         VALUES (?, ?, ?, ?)
      `;
      return await executeQuery(sql, [chatId, type, amount, description]);
   },

   selectMovements: async (chatId) => {
      const sql = `SELECT * FROM movements WHERE chatId = ? ORDER BY date DESC`;
      return await executeQuery(sql, [chatId]);
   },

   selectMovementsType: async (chatId,type) => {
      const sql = `SELECT * FROM movements WHERE chatId = ? AND type = ? ORDER BY date DESC`;
      return await executeQuery(sql, [chatId,type]);
   }
   
};

module.exports = database;
