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
    min_bid: {
        type: Number,
        required: true,
        min: 0
    },
    start_time: {
        type: Date,
        required: true
    },
    state: {
        type: Number,
        required: true,
        default: 0
    },
    completed: {
        type: Boolean,
        required: true,
        default: false
    },
    num_of_players: {
        type: Number,
        required: true,
        default: 0,
        min: 0
    },
    players: [Number],
    game_register: [{
        player_id: {
            type: Number,
        },
        secret: {
            type: Number
        },
        guess: {
            type: Number
        },
        r_one: {
            type: Number
        },
        r_two: {
            type: Number
        }
    }]
});

GameSchema.plugin(autoIncrement.plugin, { model: 'Game', field: 'id', startAt: 1 });

var Game = mongoose.model('Game', GameSchema);

module.exports = Game;
