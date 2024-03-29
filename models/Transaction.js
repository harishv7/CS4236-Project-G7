var mongoose = require('mongoose');
var autoIncrement = require('mongoose-auto-increment');

autoIncrement.initialize(mongoose.connection);

var Schema = mongoose.Schema;

var TransactionSchema = new Schema({
    transaction_id: {
        type: String,
        required: true
    },
    player_id: {
        type: Number,
        min: 1
    },
    completed: {
        type: Boolean,
        default: false
    },
    min_bid_value: {
        type: Number,
        min: 1
    },
    game_id: {
        type: Number,
        min: 1
    },
    commit_secret: String,
    commit_guess: String,
    bid_value: {
        type: Number,
        min: 1
    },
    secret: Number,
    r_one: String,
    guess: Number,
    r_two: String
});

TransactionSchema.plugin(autoIncrement.plugin, { model: 'Transaction', field: 'id', startAt: 1 });

var Transaction = mongoose.model('Transaction', TransactionSchema);

module.exports = Transaction;
