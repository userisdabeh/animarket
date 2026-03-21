const express = require('express');
const router = express.Router();
const productController = require('../middleware/product.controller');

// GET request for homepage (Search & Fetch Active Products)
router.get('/', productController.getAllProducts);

// POST request for selling an item
router.post('/api/products', productController.createProduct);

// ADDED: Route for Buying/Reserving an item
router.post('/buy', productController.buyProduct);

module.exports = router;
