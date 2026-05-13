const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: 'yamabiko.proxy.rlwy.net',
  port: 11871,
  user: 'root',
  password: 'VGnQvFfcXxeOppTbTDZldKhOLXLQSyCN',
  database: 'railway',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  dateStrings: true,
  ssl: {
    // Esta es la clave: con rejectUnauthorized: false aceptará certificados autofirmados
    rejectUnauthorized: false
  }
});

(async () => {

  try {

    const connection = await pool.getConnection();

    console.log('✅ CONECTADO A MYSQL');

    connection.release();

  } catch (err) {

    console.error('❌ ERROR MYSQL:', err);

  }

})();

module.exports = pool;
