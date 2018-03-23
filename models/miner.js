var mongoose = require('mongoose');

// User Schema
var MinerSchema = mongoose.Schema({
    ipaddress: {
        type: String,
        index: true
    }
});

var Miner = module.exports = mongoose.model('Miner', MinerSchema);

module.exports.createMiner = function(newMiner, callback) {
    newMiner.save(callback);
}

module.exports.getAllMiners = function(callback) {
    Miner.find({}, callback);
}