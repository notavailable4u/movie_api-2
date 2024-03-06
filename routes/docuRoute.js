var express = require('express');
var router = express.Router();


router.get('/documentation', function (req, res,) {
  res.redirect('/public');
});

module.exports = router;
