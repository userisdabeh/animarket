const express = require('express');
const router = express.Router();
const db = require('../db');
const nodemailer = require('nodemailer'); 

// ==========================================
// FIX: Force this file to load the .env variables (Inspired by your friend's code!)
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

// 1. Render Sell Page
router.get('/sell', (req, res) => {
    if (!req.session.userId) return res.redirect('/login');
    
    res.render('sell', {
        layout: 'main',
        title: 'Sell an Item - Animarket',
        stylesheets: ['global.css', 'style.css'],
        user: { id: req.session.userId, username: req.session.username }
    });
});

// 2. Render Cart
router.get('/cart', async (req, res) => {
    if (!req.session || !req.session.userId) return res.redirect('/login');
    
    try {
        const [orders] = await db.query(`
            SELECT o.*, p.product_name, p.product_image 
            FROM orders o 
            JOIN products p ON o.product_id = p.product_id 
            WHERE o.buyer_id = ? 
            ORDER BY o.created_at DESC
        `, [req.session.userId]);

        const processedOrders = orders.map(order => ({
            ...order,
            isPending: order.status === 'Pending'
        }));

        res.render('cart', { 
            layout: 'main',
            title: 'Your Cart - Animarket',
            stylesheets: ['global.css', 'style.css'],
            orders: processedOrders, 
            user: { id: req.session.userId, username: req.session.username } 
        });
    } catch (error) {
        console.error("Cart render error:", error);
        res.status(500).send("Error loading cart.");
    }
});

// 3. Handle + and - buttons (Update Quantity)
router.post('/cart/update-quantity', async (req, res) => {
    const { orderId, productId, action } = req.body;
    const userId = req.session.userId;

    if (!userId) return res.redirect('/login');

    try {
        const [order] = await db.query('SELECT quantity, price_at_purchase FROM orders WHERE order_id = ? AND buyer_id = ?', [orderId, userId]);
        if (!order.length) return res.redirect('/user/cart');

        const currentQty = order[0].quantity;
        const priceEach = order[0].price_at_purchase;

        if (action === 'add') {
            const [prod] = await db.query('SELECT product_stock FROM products WHERE product_id = ?', [productId]);
            if (prod[0].product_stock > 0) {
                await db.query('UPDATE orders SET quantity = quantity + 1, total_purchase_price = (quantity + 1) * ? WHERE order_id = ?', [priceEach, orderId]);
                await db.query('UPDATE products SET product_stock = product_stock - 1 WHERE product_id = ?', [productId]);
            }
        } else if (action === 'subtract') {
            if (currentQty > 1) {
                await db.query('UPDATE orders SET quantity = quantity - 1, total_purchase_price = (quantity - 1) * ? WHERE order_id = ?', [priceEach, orderId]);
            } else {
                await db.query('DELETE FROM orders WHERE order_id = ?', [orderId]);
            }
            await db.query('UPDATE products SET product_stock = product_stock + 1 WHERE product_id = ?', [productId]);
        }
        res.redirect('/user/cart');
    } catch (err) { 
        console.error("Quantity update error:", err);
        res.redirect('/user/cart'); 
    }
});

// 4. Handle Final Checkout & Send Digital Receipt
router.post('/cart/checkout', async (req, res) => {
    const { orderId } = req.body;
    const userId = req.session.userId;

    if (!userId) return res.redirect('/login');

    try {
        // Step 1: Fetch order details AND the buyer's email from the database
        const [orderData] = await db.query(`
            SELECT o.*, p.product_name, u.email as buyer_email, u.username 
            FROM orders o
            JOIN products p ON o.product_id = p.product_id
            JOIN users u ON o.buyer_id = u.user_id
            WHERE o.order_id = ? AND o.buyer_id = ?
        `, [orderId, userId]);

        if (!orderData.length) return res.redirect('/user/cart');
        const order = orderData[0];

        // Step 2: Mark the order as Completed
        await db.query('UPDATE orders SET status = "Completed" WHERE order_id = ? AND buyer_id = ?', [orderId, userId]);

        // Step 3: Draft the Email Receipt
        const mailOptions = {
            from: `"Animarket" <${process.env.EMAIL_USER}>`,
            to: order.buyer_email,
            subject: `Animarket Digital Receipt - ${order.product_name} 🧾`,
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 8px; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
                    <div style="text-align: center; padding-bottom: 20px; border-bottom: 2px solid #006a4e;">
                        <h2 style="color: #006a4e; margin: 0;">Thank you for your purchase, ${order.username}!</h2>
                    </div>
                    
                    <p style="color: #333; font-size: 16px; margin-top: 20px;">Here is your digital receipt for your recent transaction on Animarket:</p>

                    <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
                        <tr style="background-color: #f8f9fa; border-bottom: 2px solid #006a4e;">
                            <th style="padding: 12px; text-align: left; color: #333;">Item</th>
                            <th style="padding: 12px; text-align: center; color: #333;">Qty</th>
                            <th style="padding: 12px; text-align: right; color: #333;">Total Price</th>
                        </tr>
                        <tr>
                            <td style="padding: 15px; border-bottom: 1px solid #eee; color: #555;"><strong>${order.product_name}</strong></td>
                            <td style="padding: 15px; text-align: center; border-bottom: 1px solid #eee; color: #555;">${order.quantity}</td>
                            <td style="padding: 15px; text-align: right; border-bottom: 1px solid #eee; font-weight: bold; color: #006a4e; font-size: 16px;">₱${order.total_purchase_price}</td>
                        </tr>
                    </table>

                    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center;">
                        <p style="font-size: 14px; color: #666; margin: 5px 0;">Please coordinate with the seller to arrange your meetup on campus.</p>
                        <p style="font-size: 14px; color: #006a4e; font-weight: bold; margin: 5px 0;">Animo La Salle! 🏹</p>
                    </div>
                </div>
            `
        };

        // Step 4: Send the Email (using your friend's exact tracking method)
        console.log(`Attempting to send digital receipt to: ${order.buyer_email}...`);
        const info = await transporter.sendMail(mailOptions);
        console.log(`Success! Receipt sent. Message ID: ${info.messageId}`);

        res.redirect('/user/cart');
    } catch (error) {
        console.error("Checkout/Email error:", error);
        res.redirect('/user/cart?error=fail');
    }
});

module.exports = router;
