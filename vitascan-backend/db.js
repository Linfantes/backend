const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: 'localhost',
  user: 'vitascan_admin',
  password: 'Mv!P4ssw0rd#2026',
  database: 'sistema_triaje',
  waitForConnections: true,
  connectionLimit: 10
});

(async () => {
  try {
    const connection = await pool.getConnection();
    console.log(' CONECTADO A MYSQL');
    connection.release();
  } catch (err) {
    console.error('ERROR MYSQL:', err);
  }
})();
module.exports = pool;