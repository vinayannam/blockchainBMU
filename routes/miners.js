var express = require('express');
var router = express.Router();

var Transaction = require('../models/transaction');

var Miner = require('../models/miner');


router.get('/register', function(req, res) {
    res.render('miner')
});


router.post('/register', function(req, res) {
    var ip = req.ip.split(':')[req.ip.split(':').length - 1];
    console.log(ip);
    Miner.getAllMiners(function(err, miners) {
        var flag = 0;
        miners.forEach(function(miner) {
            if (ip === miner.ipaddress) {
                flag = 1;
            }
        });
        if (flag == 0) {
            var newMiner = new Miner({
                ipaddress: ip
            });
            Miner.createMiner(newMiner, function(err, miner) {
                if (err) throw err;
            });
            req.flash('success_msg', 'You are successfully registered as miner.');
            res.redirect('/users/login');
        } else {
            req.flash('error_msg', 'Miner already registered.');
            res.redirect('/users/login');
        }
    });
});

module.exports = router;