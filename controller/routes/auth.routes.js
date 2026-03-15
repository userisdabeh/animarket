const express = require("express");
const router = express.Router();

router.get('/', (req, res) => {
    res.render('login', {
        layout: 'main',
        title: 'Login - DLSU Marketplace',
        stylesheets: ['global.css','style.css']
    });
});

module.exports = router;