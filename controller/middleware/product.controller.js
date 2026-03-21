// Assuming db.js exports a mysql2 pool or promise pool
const db = require('../db'); 

// Fetch active products with Search and Filter logic
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

        /*// Render index.hbs and pass dynamic data
        res.render('index', { 
            products: products,
            searchQuery: searchQuery,
            categoryFilter: categoryFilter
        });
        */
       
       // Render index.hbs and pass dynamic data
        res.render('index', { 
            layout: 'main',
            title: 'Animarket - DLSU Exclusive',
            stylesheets: ['global.css', 'style.css'],
            products: products,
            searchQuery: searchQuery,
            categoryFilter: categoryFilter
        });

    } catch (error) {
        console.error("Error fetching marketplace:", error);
        res.status(500).send("Error loading marketplace.");
    }
};

// Handle "Sell an Item" form
exports.createProduct = async (req, res) => {
    try {
        const { productName, category, price, description, imageBase64 } = req.body;
        // Fallback to ID 1 if sessions aren't hooked up to login yet
        const sellerId = req.session?.userId || 1; 

        // BACKEND PRICE CAP ENFORCEMENT: Do not rely solely on the frontend
        if (category === 'Tickets' && parseFloat(price) > 500) {
            return res.status(400).send("Anti-Scalping Rule: UAAP Tickets cannot exceed ₱500.");
        }

        const query = `
            INSERT INTO products 
            (seller_id, product_name, product_category, product_price, product_description, product_stock, product_image) 
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        
        // Insert product with an initial stock of 1
       await db.query(query, [sellerId, productName, category, price, description, 1, imageBase64]);
        
        // Redirect to homepage to see the new listing
        res.redirect('/');
    } catch (error) {
        console.error("Error creating product:", error);
        res.status(500).send("Error posting your item.");
    }
};