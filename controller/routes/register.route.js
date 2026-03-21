const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const pool = require('../db');

router.post('/', async (req, res) => {
    // We now need username and id_number from the form as well
    const { username, email, password, id_number } = req.body;

    try {
        // 1. DLSU Email Validation
        if (!email || !email.endsWith('@dlsu.edu.ph')) {
            return res.render('register', { 
                layout: 'main', 
                errorMessage: 'Strictly @dlsu.edu.ph emails only.' 
            });
        }

        // 2. Hash Password
        const hashedPassword = await bcrypt.hash(password, 10);

        // 3. Insert into Database using your specific columns
        // Note: account_status defaults to 'Active' per your SQL
        await pool.execute(
            `INSERT INTO users (username, email, password, id_number) 
             VALUES (?, ?, ?, ?)`,
            [username, email, hashedPassword, id_number]
        );

        res.redirect('/login?registered=true');

    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.render('register', { 
                layout: 'main', 
                errorMessage: 'Email or ID Number already exists.' 
            });
        }
        console.error(err);
        res.status(500).send("Internal Server Error");
    }
});

module.exports = router;