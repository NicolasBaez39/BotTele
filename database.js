const fs = require('fs');
const mysql = require('mysql2');
const conf = JSON.parse(fs.readFileSync('conf.json'));
conf.ssl = {
   ca: fs.readFileSync(__dirname + '/ca.pem')
}
const connection = mysql.createConnection(conf);

const executeQuery = (sql) => {
   return new Promise((resolve, reject) => {
      connection.query(sql, function (err, result) {
         if (err) {
            console.error(err);
            reject();
         }
         console.log('done');
         resolve(result);
      });
   })
}

const database = {
   // Creazione delle tabelle booking e type
   createTable: async () => {
      await executeQuery(`
         CREATE TABLE IF NOT EXISTS type (
            id INT PRIMARY KEY AUTO_INCREMENT,
            name VARCHAR(20) NOT NULL
         )
      `);

      await executeQuery(`
         CREATE TABLE IF NOT EXISTS booking (
            id INT PRIMARY KEY AUTO_INCREMENT,
            idType INT NOT NULL,
            date DATE NOT NULL,
            hour INT NOT NULL,
            name VARCHAR(50),
            FOREIGN KEY (idType) REFERENCES type(id) ON DELETE CASCADE
         )
      `);
   },
   insertType: async (name) => {
      let sql = `
         INSERT INTO type (name)
         VALUES ('${name}')
      `;
      return await executeQuery(sql);
   },
   selectTypes: async () => {
      let sql = `SELECT * FROM type`;
      return await executeQuery(sql);
   },
   // Inserimento di una prenotazione
   insertBooking: async (booking) => {
      const sql = `
         INSERT INTO booking (idType, date, hour, name)
         VALUES (${booking.idType}, '${booking.date}', ${booking.hour}, '${booking.name}')
      `;
      return await executeQuery(sql);
   },

   // Selezionare tutte le prenotazioni con il nome del tipo associato
   selectAllBookings: async () => {
      const sql = `
         SELECT b.id, t.name AS type, b.date, b.hour, b.name
         FROM booking AS b
         JOIN type AS t ON b.idType = t.id
      `;
      return await executeQuery(sql);
   },

   //Seleziona tutte le prenotazioni di un giorno
   selectBookingsByDate: async (date) => {
      const sql = `
         SELECT b.id, t.name AS type, b.date, b.hour, b.name
         FROM booking AS b
         JOIN type AS t ON b.idType = t.id
         WHERE DATE(b.date) = '${date}'
      `;
      return await executeQuery(sql);
   },

   // Eliminare una prenotazione tramite ID
   deleteBooking: async (id) => {
      const sql = `
         DELETE FROM booking WHERE id=${id}
      `;
      return await executeQuery(sql);
   },

   // Eliminare tutte le prenotazioni e i tipi
   dropTables: async () => {
      await executeQuery(`DROP TABLE IF EXISTS booking`);
   },

   // Svuotare le tabelle mantenendone la struttura
   truncateTables: async () => {
      await executeQuery(`TRUNCATE TABLE booking`);
      await executeQuery(`TRUNCATE TABLE type`);
   }
};

module.exports = database;