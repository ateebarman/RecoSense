const express = require('express');
const router = express.Router();
const { getProducts, getProductByAsin } = require('../controllers/productController');

router.get('/', getProducts);
router.get('/:asin', getProductByAsin);

module.exports = router;