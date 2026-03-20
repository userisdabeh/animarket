const express = require('express');
const router = express.Router();

router.get('/dashboard', (req, res) => {
    res.render('partials/admin/dashboard', {
        layout: 'admin',
        styles: ['/styles/admin/global.css', '/styles/global.css'],
        activeDashboard: true
    });
});

module.exports = router;