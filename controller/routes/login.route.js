const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const pool = require('../db');

// POST /login
router.post('/', async (req, res) => {
    const { email, password } = req.body;

    try {
        // 1. Fetch the user from the database
        const [rows] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);
        
        // rows is an array, so we take the first element
        const user = rows;

        // 2. Check if user exists and verify hashed password
        if (user && await bcrypt.compare(password, user.password)) {
            
            // OPTIONAL: Check if the user has activated their account via email
            // If you want to block login until they click the link, uncomment below:
            /*
            if (!user.is_verified) {
                return res.render('login', { 
                    layout: 'main', 
                    errorMessage: 'Please activate your account via the email link first.' 
                });
            }
            */

            // 3. SECURE: Set up the Express Session
            // This data stays on the server; only a cookie ID is sent to the user
            req.session.userId = user.id;
            req.session.email = user.email;
            
            // 4. Redirect to the marketplace homepage
            res.redirect('/'); 
        } else {
            // 5. Authentication failed
            res.render('login', { 
                layout: 'main', 
                errorMessage: 'Invalid DLSU email or password.',
                title: 'Login - Animarket'
            });
        }
    } catch (err) {
        console.error('Login Error:', err);
        res.status(500).render('login', { 
            layout: 'main', 
            errorMessage: 'A server error occurred. Please try again later.' 
        });
    }
});

module.exports = router;