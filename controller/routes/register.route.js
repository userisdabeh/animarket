const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const pool = require('../db');
const crypto = require('crypto'); 
const nodemailer = require('nodemailer'); 

// ==========================================
// FIX: Force this file to load the .env variables!
require('dotenv').config(); 
// ==========================================

// Create the Email Transporter using your .env credentials
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

router.post('/', async (req, res) => {
    const { username, email, password, id_number } = req.body;

    // Define common view data to avoid repetition
    const viewData = {
        layout: 'main',
        title: 'Register - Animarket',
        stylesheets: ['global.css', 'style.css'] 
    };

    try {
        // 1. Validation: DLSU Email
        if (!email || !email.endsWith('@dlsu.edu.ph')) {
            return res.render('register', { 
                ...viewData, 
                errorMessage: 'Strictly @dlsu.edu.ph emails only.',
                username, email, id_number 
            });
        }

        // 2. Hash Password
        const hashedPassword = await bcrypt.hash(password, 10);

        // 3. Generate Token and Insert to DB
        const token = crypto.randomBytes(32).toString('hex');

        await pool.execute(
            `INSERT INTO users (username, email, password, id_number, verification_token) 
             VALUES (?, ?, ?, ?, ?)`,
            [username, email, hashedPassword, id_number, token]
        );

        // 4. Send the Verification Email
        const verificationLink = `http://localhost:3000/verify?token=${token}`;
        
        const mailOptions = {
            from: `"Animarket" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Verify your Animarket Account 🏹',
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px;">
                    <h2>Welcome to Animarket, ${username}!</h2>
                    <p>Thank you for registering. Please verify your DLSU email address by clicking the button below:</p>
                    <a href="${verificationLink}" style="display: inline-block; padding: 10px 20px; color: white; background-color: #0066cc; text-decoration: none; border-radius: 5px; margin-top: 10px;">Verify My Account</a>
                    <p style="margin-top: 20px; font-size: 12px; color: #666;">If you did not create this account, you can safely ignore this email.</p>
                </div>
            `
        };

        console.log(`Attempting to send verification email to: ${email}...`);
        const info = await transporter.sendMail(mailOptions);
        console.log(`Success! Email sent. Message ID: ${info.messageId}`);

        // ==========================================
        // NEW: Tell Handlebars to show the modal!
        // ==========================================
        return res.render('register', { 
            ...viewData, 
            showVerificationModal: true,
            registeredEmail: email
        });

    } catch (err) {
        // Handle Duplicate Entries (Error Code 1062)
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
                username, email, id_number 
            });
        }

        console.error("Database Error:", err);
        res.status(500).send("Internal Server Error");
    }
});

module.exports = router;