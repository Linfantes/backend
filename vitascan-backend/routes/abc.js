const express = require('express');

const router = express.Router();

router.get('/', (req, res) => {

  res.send('🔥 ABC FUNCIONANDO');

});

module.exports = router;