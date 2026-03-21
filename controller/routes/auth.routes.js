// controller/routes/auth.routes.js
const express = require("express");
const router = express.Router();

// Import Logic Files
const registerLogic = require('./register.route');
const loginLogic = require('./login.route');

// Homepage (Marketplace Feed)
router.get('/', (req, res) => {
    res.render('index', {
        layout: 'main',
        title: 'Animarket - DLSU Exclusive',
        stylesheets: ['global.css', 'style.css']
    });
});

// Login Page
router.get('/login', (req, res) => {
    // Check for success message passed from registration redirect
    const successMsg = req.query.registered ? "Registration successful! Please login." : null;

    res.render('login', {
        layout: 'main',
        title: 'Login - Animarket',
        stylesheets: ['global.css', 'style.css'],
        successMessage: successMsg
    });
});

// Register Page
router.get('/register', (req, res) => {
    res.render('register', {
        layout: 'main',
        title: 'Register - Animarket',
        stylesheets: ['global.css', 'style.css']
    });
});


// --- LOGOUT ROUTE ---
router.get('/logout', (req, res) => {
    // 1. Destroy the session in the server memory
    req.session.destroy((err) => {
        if (err) {
            console.error("Error destroying session:", err);
            return res.redirect('/'); // Just send them home if something fails
        }
        
        // 2. Clear the cookie out of the user's browser
        res.clearCookie('connect.sid'); 
        
        // 3. Kick them back to the Home Page seamlessly
        res.redirect('/'); 
    });
});
// Handle Form Submissions
router.use('/register', registerLogic);
router.use('/login', loginLogic);

module.exports = router;