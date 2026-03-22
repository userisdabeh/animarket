const express = require('express');
const router = express.Router();
const pool = require('../db'); 

router.get('/', async (req, res) => {
    const { token } = req.query; 

    if (!token) {
        return res.status(400).send("No verification token provided. Please click the exact link in your email.");
    }

    try {
        // 1. Get the RAW result
        const rawResult = await pool.execute('SELECT * FROM users WHERE verification_token = ?', [token]);
        
        // 2. THE NUCLEAR OPTION: Dig through the arrays to find the user object
        function findUserTarget(data) {
            if (!data) return null;
            if (Array.isArray(data)) {
                for (let item of data) {
                    const found = findUserTarget(item);
                    if (found) return found;
                }
            } 
            else if (typeof data === 'object' && data !== null) {
                // If this object has a user_id and an email, we found our target!
                if (data.user_id && data.email) {
                    return data;
                }
            }
            return null;
        }

        // 3. Strip away formatting and launch the missile
        const cleanData = JSON.parse(JSON.stringify(rawResult));
        const user = findUserTarget(cleanData);

        if (!user) {
            return res.status(400).send("Invalid or expired verification link. Please register again or contact support.");
        }

        console.log(`Verification target acquired: ${user.email} (ID: ${user.user_id})`);

        // 4. Update their account using the safely extracted ID!
        await pool.execute(
            'UPDATE users SET is_verified = 1, verification_token = NULL WHERE user_id = ?',
            [user.user_id]
        );

        console.log(`Success! ${user.email} has been verified.`);

        // 5. Send them to the login page
        res.redirect('/login?verified=true');

    } catch (err) {
        console.error("Verification Error:", err);
        res.status(500).send("Server Error during verification.");
    }
});

module.exports = router;