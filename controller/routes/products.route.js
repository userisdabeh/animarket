const express = require('express');
const router = express.Router();
const productController = require('../middleware/product.controller');

// GET request for homepage (Search & Fetch Active Products)
router.get('/', productController.getAllProducts);

// POST request for selling an item
router.post('/api/products', productController.createProduct);

module.exports = router;