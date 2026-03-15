// Import required modules
const express = require('express');
const hbs = require('express-hbs');
const mysql = require('mysql2');
const session = require('express-session');
const path = require('path');
require('dotenv').config(); // Loads environment variables from a .env file

const app = express();
const PORT = process.env.PORT || 3000;

// ==========================================
// 1. Template Engine Setup (Handlebars)
// ==========================================
app.engine('hbs', hbs.express4({
  partialsDir: path.join(__dirname, 'views/partials'),
  layoutsDir: path.join(__dirname, 'views/layouts'),
  extname: '.hbs'
}));
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));

// ==========================================
// 2. Middleware Setup
// ==========================================
// Serve static files (CSS, images, client-side JS) from the 'public' folder
app.use(express.static(path.join(__dirname, 'public')));

// Parse URL-encoded bodies (as sent by HTML forms)
app.use(express.urlencoded({ extended: true }));
// Parse JSON bodies (as sent by API clients)
app.use(express.json());

// Setup session management for logging in users
app.use(session({
    secret: process.env.SESSION_SECRET || 'animarket-super-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } // Set to true if using HTTPS later
}));

// ==========================================
// 3. Database Connection (MySQL)
// ==========================================
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'animarket',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Test the database connection
pool.getConnection((err, connection) => {
    if (err) {
        console.error('Error connecting to the database:', err.message);
    } else {
        console.log('Successfully connected to the Animarket database.');
        connection.release();
    }
});

// ==========================================
// 4. Routes
// ==========================================
const authRoutes = require('./controller/routes/auth.routes');
app.use('/', authRoutes);

// ==========================================
// 5. Start the Server
// ==========================================
app.listen(PORT, () => {
    console.log(`🚀 Animarket server is running on http://localhost:${PORT}`);
});