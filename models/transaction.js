var mongoose = require('mongoose');
var bcrypt = require('bcryptjs');

// Transaction Schema
var TransactionSchema = mongoose.Schema({
    sender: {
        type: String,
        index: true
    },
    reciever: {
        type: String,
        index: true
    },
    amount: {
        type: String,
        index: true
    }
});

var Transaction = module.exports = mongoose.model('Transaction', TransactionSchema);

module.exports.createTransaction = function(newTransaction, callback) {
    newTransaction.save(callback);
}

module.exports.getAllTransactions = function(callback) {
    Transaction.find({}, callback);
}