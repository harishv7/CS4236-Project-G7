var _ = require('lodash');
var mongoose = require('mongoose');
var Transaction = require('./../models/Transaction');

var saveTransaction = function(transaction, callback) {
    // TODO: Validate transaction_id and player_id
    Transaction.create(transaction, callback);
};

var getIncompleteTransactions = function(callback) {
    Transaction.find({ completed: false }, callback);
};

var setTransactionAsCompleted = function(transaction, callback) {
    transaction.completed = true;
    transaction.save(callback);
};

module.exports = {
    saveTransaction: saveTransaction,
    getIncompleteTransactions: getIncompleteTransactions,
    setTransactionAsCompleted: setTransactionAsCompleted
};
