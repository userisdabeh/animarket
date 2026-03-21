const express = require('express');
const router = express.Router();
const db = require('../db');

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

// 4. Handle Final Checkout
router.post('/cart/checkout', async (req, res) => {
    const { orderId } = req.body;
    const userId = req.session.userId;

    if (!userId) return res.redirect('/login');

    try {
        await db.query('UPDATE orders SET status = "Completed" WHERE order_id = ? AND buyer_id = ?', [orderId, userId]);
        res.redirect('/user/cart');
    } catch (error) {
        console.error("Checkout error:", error);
        res.redirect('/user/cart?error=fail');
    }
});

module.exports = router;
