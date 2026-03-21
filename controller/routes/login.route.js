const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const pool = require('../db');

router.post('/', async (req, res) => {
    const { email, password } = req.body;

    try {
        // 1. Get the RAW result. We are NOT destructuring it with [rows] this time.
        const rawResult = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);
        
        // Let's print exactly what MySQL is doing to your data
        console.log("\n--- RAW DATABASE REPLY ---");
        console.log(JSON.stringify(rawResult, null, 2).substring(0, 300) + "... [TRUNCATED]");
        console.log("--------------------------\n");

        // 2. THE NUCLEAR OPTION: A recursive function that digs through anything
        function findUserTarget(data) {
            if (!data) return null;
            
            // If it's an array, search every item inside it
            if (Array.isArray(data)) {
                for (let item of data) {
                    const found = findUserTarget(item);
                    if (found) return found;
                }
            } 
            // If it's an object, check if it's our actual user!
            else if (typeof data === 'object' && data !== null) {
                // If this object has a password and email, WE CAUGHT IT.
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
            console.log("--> MISSILE FAILED: No user found for that email.");
            return res.render('login', { 
                layout: 'main', 
                stylesheets: ['global.css', 'style.css'],
                errorMessage: 'Invalid DLSU credentials. (Email not found)' 
            });
        }

        console.log("SUCCESS! FOUND USER:", user.email, "| HASH:", user.password);

        // 5. Compare the typed password against the DB hash
        const isMatch = await bcrypt.compare(password, user.password);

        if (isMatch) {
            req.session.userId = user.user_id; 
            req.session.email = user.email;
            req.session.username = user.username;
            return res.redirect('/');
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