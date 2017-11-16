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
    start_time: Number,  // if we change to epoch, is it still number? or is it Date? Is there a DateTime?
    state: {
        type: Number,
        required: true,
        default: 0
    },
    // We don't need num_of_players, do we?
    players: {
        type: [Number],
        default: []
    },
    game_registers: {
        type: [{
            player_id: Number,
            secret_commit: String,
            guess_commit: String,
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
            r_one: String,
            guess: Number,
            r_two: String
        }],
        default: []
    }
});

GameSchema.plugin(autoIncrement.plugin, { model: 'Game', field: 'id', startAt: 1 });

var Game = mongoose.model('Game', GameSchema);

module.exports = Game;
