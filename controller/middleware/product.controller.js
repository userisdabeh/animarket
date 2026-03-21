// Assuming db.js exports a mysql2 promise pool
const db = require('../db'); 

// 1. Fetch active products with Search and Filter logic
exports.getAllProducts = async (req, res) => {
    try {
        const searchQuery = req.query.search || '';
        const categoryFilter = req.query.category || '';

        // Only fetch items that are in stock
        let query = 'SELECT * FROM products WHERE product_stock > 0';
        let queryParams = [];

        // Apply Search Filter
        if (searchQuery) {
            query += ' AND (product_name LIKE ? OR product_description LIKE ?)';
            queryParams.push(`%${searchQuery}%`, `%${searchQuery}%`);
        }

        // Apply Category Filter
        if (categoryFilter) {
            query += ' AND product_category = ?';
            queryParams.push(categoryFilter);
        }

        query += ' ORDER BY created_at DESC';

        // Execute query
        const [products] = await db.query(query, queryParams);

        // Render index.hbs and pass dynamic data
        res.render('index', { 
            layout: 'main',
            title: 'Animarket - DLSU Exclusive',
            stylesheets: ['global.css', 'style.css'],
            products: products,
            searchQuery: searchQuery,
            categoryFilter: categoryFilter,
            
            // FIX: Match the object structure expected by main.hbs
            user: req.session.userId ? { 
                id: req.session.userId, 
                username: req.session.username,
                email: req.session.email 
            } : null
        });

    } catch (error) {
        console.error("Error fetching marketplace:", error);
        res.status(500).send("Error loading marketplace.");
    }
};

// 2. Handle "Sell an Item" form
exports.createProduct = async (req, res) => {
    try {
        const { productName, category, price, description, imageBase64 } = req.body;
        const sellerId = req.session?.userId; 

        if (!sellerId) {
            return res.redirect('/login?error=You must be logged in to sell.');
        }

        // Anti-Scalping Rule
        if (category === 'Tickets' && parseFloat(price) > 500) {
            return res.status(400).send("Anti-Scalping Rule: UAAP Tickets cannot exceed ₱500.");
        }

        const query = `
            INSERT INTO products 
            (seller_id, product_name, product_category, product_price, product_description, product_stock, product_image) 
            VALUES (?, ?, ?, ?, ?, 1, ?)
        `;
        
        await db.query(query, [sellerId, productName, category, price, description, imageBase64]);
        res.redirect('/');
    } catch (error) {
        console.error("Error creating product:", error);
        res.status(500).send("Error posting your item.");
    }
};

// 3. Logic for the "Buy/Reserve" Requirement
exports.buyProduct = async (req, res) => {
    const { productId } = req.body;
    const buyerId = req.session.userId;

    // Security check: must be logged in to buy
    if (!buyerId) {
        return res.redirect('/login?error=Please login to purchase items');
    }

    try {
        // 1. Get the current product details
        const [products] = await db.query(
            'SELECT seller_id, product_price, product_stock FROM products WHERE product_id = ?', 
            [productId]
        );
        const product = products[0];

        // Check if item exists and is still in stock
        if (!product || product.product_stock <= 0) {
            return res.status(400).send("Sorry, this item is no longer available.");
        }

        // 2. INSERT into the orders table
        const orderQuery = `
            INSERT INTO orders 
            (seller_id, buyer_id, product_id, quantity, price_at_purchase, total_purchase_price, status) 
            VALUES (?, ?, ?, 1, ?, ?, 'Pending')
        `;
        
        await db.query(orderQuery, [
            product.seller_id, 
            buyerId, 
            productId, 
            product.product_price, 
            product.product_price
        ]);

        // 3. Update the product stock
        await db.query(
            'UPDATE products SET product_stock = product_stock - 1 WHERE product_id = ?', 
            [productId]
        );

        // 4. Success! Redirect to cart
        res.redirect('/user/cart');

    } catch (error) {
        console.error("Purchase Error:", error);
        res.status(500).send("There was an error processing your reservation.");
    }
};
