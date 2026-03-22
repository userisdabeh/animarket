const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const pool = require('../db');

router.post('/', async (req, res) => {
    const { email, password } = req.body;

    try {
        // 1. Get the RAW result
        const rawResult = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);
        
        // 2. THE NUCLEAR OPTION: A recursive function that digs through anything
        function findUserTarget(data) {
            if (!data) return null;
            if (Array.isArray(data)) {
                for (let item of data) {
                    const found = findUserTarget(item);
                    if (found) return found;
                }
            } 
            else if (typeof data === 'object' && data !== null) {
                if (data.email && data.password) {
                    return data;
                }
            }
            return null;
        }

        // 3. Strip away any weird MySQL formatting and launch the missile
        const cleanData = JSON.parse(JSON.stringify(rawResult));
        const user = findUserTarget(cleanData);

        // 4. If the missile found nothing, the email truly isn't in the DB
        if (!user) {
            return res.render('login', { 
                layout: 'main', 
                stylesheets: ['global.css', 'style.css'],
                errorMessage: 'Invalid DLSU credentials. (Email not found)' 
            });
        }

        // 5. Compare the typed password against the DB hash
        const isMatch = await bcrypt.compare(password, user.password);

        if (isMatch) {
            // ==========================================
            // NEW: IS THE USER VERIFIED?
            // ==========================================
            // MySQL stores booleans as 0 (false) and 1 (true)
            if (user.is_verified === 0 || user.is_verified === false) {
                return res.render('login', {
                    layout: 'main',
                    stylesheets: ['global.css', 'style.css'],
                    errorMessage: 'Please check your DLSU email and click the verification link before logging in.'
                });
            }

            // 6. If verified AND password matches, log them in!
            req.session.userId = user.user_id; 
            req.session.email = user.email;
            req.session.username = user.username;
            req.session.isAdmin = user.role === 'Admin'; // Store admin status in session
            
            if (user.role === 'Admin') {
                return res.redirect('/admin/dashboard');
            } else {
                return res.redirect('/');
            }

        } else {
            return res.render('login', { 
                layout: 'main', 
                stylesheets: ['global.css', 'style.css'],
                errorMessage: 'Invalid DLSU credentials. (Password mismatch)' 
            });
        }

    } catch (err) {
        console.error("Login Error: ", err);
        return res.status(500).render('login', { 
            layout: 'main', 
            stylesheets: ['global.css', 'style.css'],
            errorMessage: 'Server Error' 
        });
    }
});

module.exports = router;