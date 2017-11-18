var mongoose = require('mongoose');
var Player = require('./../models/Player');

var getPlayerBalance = function(playerId, callback) {
    Player.findOne({id: playerId}).then(function(player) {
        if (!player) return callback("Player not found");
        else return callback(null, player.balance);
    })
    .catch(function(err) {
        return callback(err);
    });
};

var createPlayer = function(callback) {
    new Player().save().then(function(player) {
        return callback(null, player);
    })
    .catch(function(err) {
        return callback(err);
    });
};


var updatePlayerBalance = function(playerId, balance, callback) {
    Player.findOneAndUpdate({id: playerId}, {$set: {balance: balance}}, {new: true}).then(function(player) {
        if (!player) return callback("Player not found");
        return callback(null, player);
    })
    .catch(function(err) {
        return callback(err);
    });
};

module.exports = {
    getPlayerBalance,
    createPlayer,
    updatePlayerBalance,
}
