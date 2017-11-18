var mongoose = require('mongoose');
var autoIncrement = require('mongoose-auto-increment');

autoIncrement.initialize(mongoose.connection);

var Schema = mongoose.Schema;

var GameSchema = new Schema({
    id: {
        type: Number,
        unique: true,
        dropDups: true
    },
    min_bid_value: {
        type: Number,
        required: true,
        min: 0
    },
    start_time: {
        type: Date,
        required: true,
        default: Date.now
    },
    state: {
        type: Number,
        required: true,
        default: 0
    },
    players: {
        type: [Number],
        default: []
    },
    game_registers: {
        type: [{
            player_id: Number,
            commit_secret: String,
            commit_guess: String,
            bid_value: {
                type: Number,
                min: 1
            }
        }],
        default: []
    },
    reveal_secrets: {
        type: [{
            player_id: Number,
            secret: Number,
            r_one: Number,
            guess: Number,
            r_two: Number
        }],
        default: []
    }
});

GameSchema.plugin(autoIncrement.plugin, { model: 'Game', field: 'id', startAt: 1 });

var Game = mongoose.model('Game', GameSchema);

module.exports = Game;
