const express = require('express');
const router = express.Router();
const { getProducts, getProductByAsin, getProductsByAsins } = require('../controllers/productController');

router.get('/', getProducts);
router.post('/bulk-fetch', getProductsByAsins);
router.get('/:asin', getProductByAsin);

module.exports = router;