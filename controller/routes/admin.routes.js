const express = require('express');
const router = express.Router();

const dashboardController = require('../middleware/admin/dashboard.controller');

router.get('/dashboard', dashboardController.getDashboardDetails);
router.get('/products', dashboardController.getProductsPage);
router.get('/orders', dashboardController.getOrdersPage);
router.get('/users', dashboardController.getUsersPage);
router.get('/tickets', dashboardController.getTicketsPage);

router.post('/products', dashboardController.addProductAdmin);
router.post('/users', dashboardController.addUserAdmin);

router.post('/users/update', dashboardController.editUserAdmin);

// Delete routes
router.get('/products/delete/:id', dashboardController.deleteProductAdmin);

module.exports = router;