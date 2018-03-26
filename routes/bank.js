var express = require('express');
var router = express.Router();
var EC = require('elliptic').ec;
var ec = new EC('secp256k1');

var User = require('../models/user');

var Transaction = require('../models/transaction');

router.get('/send', function(req, res) {
    var user = req.user;
    res.render('send', { 'publicKey': user.publicKey });
})

router.get('/recieve', function(req, res) {
    var user = req.user;
    Transaction.getAllTransactions(function(err, transactions) {
        var validTransactions = [];
        var count = 0;
        transactions.forEach(function(transaction) {
            if (transaction.reciever == req.user.publicKey && transaction.verified == false) {
                count = count + 1;
                var edit = transaction;
                edit.number = count;
                validTransactions.push(edit);
            }
        });
        res.render('recieve', { 'publicKey': user.publicKey, 'transactions': validTransactions });
    });
})

// Send Transaction
router.post('/send', function(req, res) {

    var user = req.user;
    var publicKey = user.publicKey;
    var privateKey = user.privateKey;
    var reciever = req.body.reciever;
    var amount = req.body.amount;

    // Validation
    req.checkBody('reciever', 'Reciever username is required').notEmpty();
    req.checkBody('amount', 'Amount is required').notEmpty();

    var errors = req.validationErrors();

    if (errors) {
        var user = req.user;
        res.render('send', { errors: errors, 'publicKey': user.publicKey });
    } else {

        var newKeypair = ec.keyFromPrivate(privateKey);
        var sign = new Buffer(newKeypair.sign(amount).toDER()).toString('hex');

        var newTransaction = new Transaction({
            sender: publicKey,
            reciever: reciever,
            amount: 0,
            sign: sign,
            verified: false
        });

        Transaction.createTransaction(newTransaction, function(err, transaction) {
            if (err) throw err;
        });

        req.flash('success_msg', 'You succesfully sent.');

        res.redirect('/');
    }
});

router.post('/recieve', function(req, res) {

    req.checkBody('amount', 'Amount is required').notEmpty();

    var errors = req.validationErrors();

    if (errors) {
        var user = req.user;
        Transaction.getAllTransactions(function(err, transactions) {
            var validTransactions = [];
            var count = 0;
            transactions.forEach(function(transaction) {
                if (transaction.reciever == req.user.publicKey) {
                    count = count + 1;
                    var edit = transaction;
                    edit.number = count;
                    validTransactions.push(edit);
                }
            });
            res.render('recieve', { errors: errors, 'publicKey': user.publicKey, 'transactions': validTransactions });
        });
    } else {
        var selectedSign = req.body.sign;
        var amount = req.body.amount;
        Transaction.getAllTransactions(function(err, transactions) {
            transactions.forEach(function(transaction) {
                if (transaction.sign == selectedSign && transaction.verified == false) {
                    var keypair = ec.keyFromPublic(transaction.sender, 'hex');
                    if (keypair.verify(amount, selectedSign) == true) {
                        Transaction.findByIdAndUpdate(transaction._id, { 'amount': amount, 'verified': true }, function(err, res) {});
                    } else {
                        Transaction.findByIdAndRemove(transaction._id, function(err, res) {});
                    }
                }
            });
        });
        res.redirect('/bank/recieve');
    }
});

module.exports = router;