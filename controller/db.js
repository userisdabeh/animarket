const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    database: process.env.DB_NAME || 'animarket',
    waitForConnections: true,
    connectionLimit: 10,
    password: process.env.DB_PASSWORD || '1234', // enzo password
    port: process.env.DB_PORT || 3307,           // enzo port
    queueLimit: 0
});

module.exports = pool;