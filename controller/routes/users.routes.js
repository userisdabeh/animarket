const express = require('express');
const router = express.Router();
const db = require('../db'); // Import the database connection

// 1. Render the Sell Item Page
router.get('/sell', (req, res) => {
    // Security check: ensure only logged-in users can sell
    if (!req.session.userId) return res.redirect('/login');

    res.render('sell', {
        layout: 'main',
        title: 'Sell an Item - Animarket',
        stylesheets: ['global.css', 'style.css'],
        // FIX: Pass the user object structure that main.hbs expects
        user: { 
            id: req.session.userId, 
            username: req.session.username 
        }
    });
});


// 2. Render the Cart / Purchase History Page (Requirement Fulfillment)

router.get('/cart', async (req, res) => {
    // Security Check: Redirect if not logged in
    if (!req.session || !req.session.userId) {
        return res.redirect('/login?error=Please login to view your cart');
    }

    try {
        // Query: Get orders for this specific user
        // JOIN with products so we can show the Name and Image in the cart
        const [orders] = await db.query(`
            SELECT 
                o.*, 
                p.product_name, 
                p.product_image 
            FROM orders o 
            JOIN products p ON o.product_id = p.product_id 
            WHERE o.buyer_id = ? 
            ORDER BY o.created_at DESC
        `, [req.session.userId]);

        // Render the cart.hbs file and pass the real database data
        res.render('cart', {
            layout: 'main',
            title: 'Your Cart - Animarket',
            stylesheets: ['global.css', 'style.css'],
            orders: orders, // This feeds the {{#each orders}} loop in cart.hbs
            // FIX: Pass the user object structure that main.hbs expects
            user: { 
                id: req.session.userId, 
                username: req.session.username 
            }
        });

    } catch (error) {
        console.error("Cart Error:", error);
        res.status(500).send("Error loading your purchase history.");
    }
});

module.exports = router;
