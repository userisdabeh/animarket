const db = require('../../db.js');

exports.getDashboardDetails = async (req, res) => {
    // 1. Fetch total new users this month
    const searchQuery = 'SELECT COUNT(*) AS newUsers FROM users WHERE MONTH(created_at) = MONTH(CURRENT_DATE()) AND YEAR(created_at) = YEAR(CURRENT_DATE())';
    const [newUsersResult] = await db.query(searchQuery);
    const newUsers = newUsersResult[0].newUsers;

    // 2. Fetch total new products this month
    const productQuery = 'SELECT COUNT(*) AS newProducts FROM products WHERE MONTH(created_at) = MONTH(CURRENT_DATE()) AND YEAR(created_at) = YEAR(CURRENT_DATE())';
    const [newProductsResult] = await db.query(productQuery);
    const newProducts = newProductsResult[0].newProducts;

    // 3. Fetch total orders this month
    const ordersQuery = 'SELECT COUNT(*) AS newOrders FROM orders WHERE MONTH(created_at) = MONTH(CURRENT_DATE()) AND YEAR(created_at) = YEAR(CURRENT_DATE())';
    const [newOrdersResult] = await db.query(ordersQuery);
    const newOrders = newOrdersResult[0].newOrders;

    // 4. Fetch total products in the marketplace
    const totalProductsQuery = 'SELECT COUNT(*) AS totalProducts FROM products';
    const [totalProductsResult] = await db.query(totalProductsQuery);
    const totalProducts = totalProductsResult[0].totalProducts;

    res.render('partials/admin/dashboard', {
        layout: 'admin',
        styles: ['/styles/admin/global.css', '/styles/admin/pages/landing.css', '/styles/global.css'],
        activeDashboard: true,
        newUsers,
        newProducts,
        newOrders,
        totalProducts
    })
};

exports.getProductsPage = async (req, res) => {
    // Fetch all products with their category names
    const searchQuery = 'SELECT p.product_id, p.product_name, p.product_category, p.product_price, u.username FROM products p JOIN users u on p.seller_id = u.user_id';
    const [products] = await db.query(searchQuery);

    res.render('partials/admin/products', {
        layout: 'admin',
        styles: ['/styles/admin/global.css', '/styles/admin/pages/products.css', '/styles/global.css'],
        scripts: ['/src/adminProducts.js'],
        activeProducts: true,
        products
    });
};

exports.getOrdersPage = async (req, res) => {
    // Fetch all orders with their details
    const searchQuery = 'SELECT o.order_id, seller.username AS seller_name, buyer.username AS buyer_name, p.product_name, o.quantity, o.total_purchase_price FROM orders o JOIN users seller ON seller.user_id = o.seller_id JOIN users buyer ON buyer.user_id = o.buyer_id JOIN products p ON p.product_id = o.product_id ORDER BY o.created_at DESC;'
    const [orders] = await db.query(searchQuery);

    res.render('partials/admin/orders', {
        layout: 'admin',
        styles: ['/styles/admin/global.css', '/styles/admin/pages/orders.css', '/styles/global.css'],
        activeOrders: true,
        orders
    });
};

exports.getUsersPage = async (req, res) => {
    // Fetch all users with their details
    const searchQuery = 'SELECT user_id, username, email, id_number, role, account_status FROM users';
    const [users] = await db.query(searchQuery);


    res.render('partials/admin/users', {
        layout: 'admin',
        styles: ['/styles/admin/global.css', '/styles/admin/pages/users.css', '/styles/global.css'],
        scripts: ['/src/adminUsers.js'],
        activeUsers: true,
        users
    });
};

exports.getTicketsPage = async (req, res) => {
    res.render('partials/admin/tickets', {
        layout: 'admin',
        styles: ['/styles/admin/global.css', '/styles/admin/pages/tickets.css', '/styles/global.css'],
        activeTickets: true
    });
};

// Add products form from admin page
exports.addProductAdmin = async (req, res) => {
    try {
        const { productName, productCategory, productPrice, productDescription, imageBase64, productStock, productLimit } = req.body;
        const seller_id = req.session.userId; // Assuming the admin is also a user

        // Insert new product into the database
        const insertQuery = 'INSERT INTO products (product_name, product_category, product_price, product_description, product_image, product_stock, product_limit_per_user, seller_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
        await db.query(insertQuery, [productName, productCategory, productPrice, productDescription, imageBase64, productStock, productLimit || null, seller_id]);
        res.redirect('/admin/products');
    } catch (error) {
        console.error("Error adding product:", error);
        res.status(500).send("Error adding product.");
    }
}

// Delete product (Admin)
exports.deleteProductAdmin = async (req, res) => {
    try {
        const productId = req.params.id;
        const deleteQuery = 'DELETE FROM products WHERE product_id = ?';
        await db.query(deleteQuery, [productId]);
        res.redirect('/admin/products');
    } catch (error) {
        console.error("Error deleting product:", error);
        res.status(500).send("Error deleting product.");
    }
}

// Add New User form from admin page
exports.addUserAdmin = async (req, res) => {
    try {
        const { userName, userEmail, userPassword, userIdNumber, userRole } = req.body;
        const is_verified = 1; // Admin-created accounts are automatically verified
        const account_status = 'Active'; // Admin-created accounts are active by default

        const insertQuery = 'INSERT INTO users (username, email, password, id_number, role, is_verified, account_status) VALUES (?, ?, ?, ?, ?, ?, ?)';
        await db.query(insertQuery, [userName, userEmail, userPassword, userIdNumber, userRole, is_verified, account_status]);
        res.redirect('/admin/users');
    } catch (error) {
        console.error("Error adding user:", error);
        res.status(500).send("Error adding user.");
    }
}

exports.editUserAdmin = async (req, res) => {
    try {
        const { userId, editUserRole, editUserStatus } = req.body;
        
        const updateQuery = 'UPDATE users SET role = ?, account_status = ? WHERE user_id = ?';
        await db.query(updateQuery, [editUserRole, editUserStatus, userId]);
        res.redirect('/admin/users');
    } catch (error) {
        console.error("Error editing user:", error);
        res.status(500).send("Error editing user.");
    }
}