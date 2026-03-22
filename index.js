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

// NEW: Register the 'eq' helper so your profile badges change colors!
hbs.registerHelper('eq', function (v1, v2) {
    return v1 === v2;
});

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

/*
// Parse URL-encoded bodies (as sent by HTML forms)
app.use(express.urlencoded({ extended: true }));
// Parse JSON bodies (as sent by API clients)
app.use(express.json());
*/

// Change these two lines:
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.json({ limit: '10mb' }));

// Setup session management for logging in users
app.use(session({
    secret: process.env.SESSION_SECRET || 'animarket-super-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } // Set to true if using HTTPS later
}));

// ==========================================
// NEW: Global Variables for Handlebars
// ==========================================
app.use((req, res, next) => {
    // If a user is logged in, pass their data to 'res.locals.user'
    // Anything in res.locals is automatically visible to EVERY .hbs file!
    if (req.session.userId) {
        res.locals.user = {
            id: req.session.userId,
            username: req.session.username,
            email: req.session.email
        };
    } else {
        res.locals.user = null;
    }
    next(); // Tell Express to move on to the next step
});

// ==========================================
// 3. Database Connection (MySQL)
// ==========================================
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
const userRoutes = require('./controller/routes/users.routes');
const adminRoutes = require('./controller/routes/admin.routes');
const productRoutes = require('./controller/routes/products.route');

// NEW: Separated Authentication Routes
const registerRouter = require('./controller/routes/register.route');
const loginRouter = require('./controller/routes/login.route');
const verifyRouter = require('./controller/routes/verify.route');

app.use('/', authRoutes);
app.use('/user', userRoutes);
app.use('/admin', adminRoutes);
app.use('/', productRoutes); // Connect dynamic marketplace

// NEW: Connect the separated Authentication Routes
app.use('/register', registerRouter);
app.use('/login', loginRouter);
app.use('/verify', verifyRouter);

// ==========================================
// 5. Start the Server
// ==========================================
app.listen(PORT, () => {
    console.log(`🚀 Animarket server is running on http://localhost:${PORT}`);
});