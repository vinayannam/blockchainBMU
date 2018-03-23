var express = require('express');
var router = express.Router();
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;

var User = require('../models/user');

var Transaction = require('../models/transaction');

passport.use('local.one', new LocalStrategy({
    usernameField: 'sender',
    passwordField: 'password',
    passReqToCallback: true
}, function(req, username, password, done) {
    User.getUserByUsername(username, function(err, sender) {
        if (err) throw err;
        if (!sender) {
            return done(null, false, { message: 'Unknown Sender' });
        }
        if (req.user.username != sender.username) {
            return done(null, false, { message: 'Unknown Sender' });
        }
        User.getUserByUsername(req.body.reciever, function(err, reciever) {
            if (err) throw err;
            if (!reciever) {
                return done(null, false, { message: 'Unknown Reciever' });
            }
            User.comparePassword(password, sender.password, function(err, isMatch) {
                if (err) throw err;
                if (isMatch) {
                    return done(null, sender);
                } else {
                    return done(null, false, { message: 'Invalid password' });
                }
            });
        });
    });
}));

passport.serializeUser(function(user, done) {
    done(null, user.id);
});

passport.deserializeUser(function(id, done) {
    User.getUserById(id, function(err, user) {
        done(err, user);
    });
});

// Send Transaction
router.post('/send',
    passport.authenticate('local.one', { failureRedirect: '../', failureFlash: true }),
    function(req, res) {
        var sender = req.body.sender;
        var reciever = req.body.reciever;
        var amount = req.body.amount;
        var password = req.body.password;

        // Validation
        req.checkBody('sender', 'Sender username is required').notEmpty();
        req.checkBody('reciever', 'Reciever username is required').notEmpty();
        req.checkBody('amount', 'Amount is required').notEmpty();
        req.checkBody('password', 'Password is required').notEmpty();

        var errors = req.validationErrors();

        if (errors) {
            res.render('index', {
                errors: errors
            });
        } else {
            var newTransaction = new Transaction({
                sender: sender,
                reciever: reciever,
                amount: amount
            });

            Transaction.createTransaction(newTransaction, function(err, transaction) {
                if (err) throw err;
            });

            req.flash('success_msg', 'You succesfully sent.');

            res.redirect('/');
        }
    });

module.exports = router;