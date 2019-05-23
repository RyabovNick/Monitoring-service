const sql = require('mssql');

const pool = new sql.ConnectionPool({
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE,
});

module.exports = pool;
