var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var gameSchema = new Schema({
    id: {
        type: String,
        required: true,
        unique: true,
        dropDups: true
    },
    min_bid: {
        type: Number,
        required: true,
        min: 0
    },
    start_time: {
        type: Date,
        required: true
    }
});

var Game = mongoose.model('Game', gameSchema);

module.exports = Game;
