const express = require('express');
const router = express.Router();

// Render the Sell Item Page
router.get('/sell', (req, res) => {
    res.render('sell', {
        layout: 'main',
        title: 'Sell an Item - Animarket',
        stylesheets: ['global.css', 'style.css']
    });
});

router.get('/cart', (req, res) => {
    res.render('cart', {
        layout: 'main',
        title: 'Your Cart - Animarket',
        stylesheets: ['global.css', 'style.css']
    });
});

module.exports = router;
