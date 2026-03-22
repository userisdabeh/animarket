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
        // ADDED: Extract stock and limitPerUser from req.body
        const { productName, category, price, description, imageBase64, stock, limitPerUser } = req.body;
        const sellerId = req.session?.userId; 

        if (!sellerId) {
            return res.redirect('/login?error=You must be logged in to sell.');
        }

        // Anti-Scalping Rule
        if (category === 'Tickets' && parseFloat(price) > 700) {
            return res.status(400).send("Anti-Scalping Rule: UAAP Tickets cannot exceed ₱700.");
        }

        // FORMAT: Convert string inputs to integers, and handle empty optional limits
        const parsedStock = parseInt(stock) || 1;
        const parsedLimit = limitPerUser ? parseInt(limitPerUser) : null;

        // UPDATED: Added product_stock and product_limit_per_user to the query
        const query = `
            INSERT INTO products 
            (seller_id, product_name, product_category, product_price, product_description, product_stock, product_limit_per_user, product_image) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        await db.query(query, [sellerId, productName, category, price, description, parsedStock, parsedLimit, imageBase64]);
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

    if (!buyerId) return res.redirect('/login?error=Please login');

    try {
        const [products] = await db.query('SELECT seller_id, product_price, product_stock FROM products WHERE product_id = ?', [productId]);
        const product = products[0];

        if (!product || product.product_stock <= 0) return res.status(400).send("Out of stock");

        // CHECK: Does item already exist in cart?
        const [existing] = await db.query(
            'SELECT order_id, quantity FROM orders WHERE buyer_id = ? AND product_id = ? AND status = "Pending"',
            [buyerId, productId]
        );

        if (existing.length > 0) {
            // Update quantity of the EXISTING box
            await db.query(
                'UPDATE orders SET quantity = quantity + 1, total_purchase_price = (quantity + 1) * ? WHERE order_id = ?',
                [product.product_price, existing[0].order_id]
            );
        } else {
            // Create a NEW box only if it's not there yet
            await db.query(
                `INSERT INTO orders (seller_id, buyer_id, product_id, quantity, price_at_purchase, total_purchase_price, status) 
                 VALUES (?, ?, ?, 1, ?, ?, 'Pending')`,
                [product.seller_id, buyerId, productId, product.product_price, product.product_price]
            );
        }

        await db.query('UPDATE products SET product_stock = product_stock - 1 WHERE product_id = ?', [productId]);
        res.redirect('/user/cart');
    } catch (error) {
        res.status(500).send("Error");
    }
};
