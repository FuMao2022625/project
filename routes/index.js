var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

/* GET video monitor page. */
router.get('/video-monitor', function(req, res, next) {
  res.sendFile('video-monitor.html', { root: 'public' });
});

module.exports = router;
