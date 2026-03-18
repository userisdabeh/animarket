// controller/routes/auth.routes.js
const express = require("express");
const router = express.Router();

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
    res.render('login', {
        layout: 'main',
        title: 'Login - Animarket',
        stylesheets: ['global.css', 'style.css']
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

module.exports = router;
