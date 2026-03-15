const exxpress = require("express");
const router = exxpress.Router();

router.get('/', (req, res) => {
    res.render('login');
});

module.exports = router;