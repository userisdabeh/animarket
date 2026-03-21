const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const pool = require('../db');

router.post('/', async (req, res) => {
    const { username, email, password, id_number } = req.body;

    // Define common view data to avoid repetition
    const viewData = {
        layout: 'main',
        title: 'Register - Animarket',
        stylesheets: ['global.css', 'style.css'] // Ensures styles load on re-render
    };

    try {
        // 1. Validation: DLSU Email
        if (!email || !email.endsWith('@dlsu.edu.ph')) {
            return res.render('register', { 
                ...viewData, 
                errorMessage: 'Strictly @dlsu.edu.ph emails only.',
                username, email, id_number // Preserve inputs
            });
        }

        // 2. Hash Password
        const hashedPassword = await bcrypt.hash(password, 10);

        // 3. Insert into Database
        await pool.execute(
            `INSERT INTO users (username, email, password, id_number) 
             VALUES (?, ?, ?, ?)`,
            [username, email, hashedPassword, id_number]
        );

        // Success: Redirect to login with a success flag
        res.redirect('/login?registered=true');

    } catch (err) {
        // 4. Handle Duplicate Entries (Error Code 1062)
        if (err.code === 'ER_DUP_ENTRY') {
            let errorMsg = 'Registration failed.';
            
            // Specifically check which field caused the collision
            if (err.sqlMessage.includes('id_number')) {
                errorMsg = 'This ID Number is already registered. Please re-input or contact support.';
            } else if (err.sqlMessage.includes('email')) {
                errorMsg = 'This Email is already in use. Please use a different one or login.';
            }

            return res.render('register', { 
                ...viewData, 
                errorMessage: errorMsg,
                username, 
                email, 
                id_number 
            });
        }

        console.error("Database Error:", err);
        res.status(500).send("Internal Server Error");
    }
});

module.exports = router;