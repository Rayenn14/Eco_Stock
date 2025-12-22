const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'ecostock_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
});

pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Impossible de se connecter à PostgreSQL:', err.message);
  } else {
    console.log('Connexion PostgreSQL établie');
  }
});

module.exports = {
  query: (text, params) => pool.query(text, params),
};
