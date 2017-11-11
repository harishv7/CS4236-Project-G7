var mongoose = require('mongoose');
var autoIncrement = require('mongoose-auto-increment');

autoIncrement.initialize(mongoose.connection);

var Schema = mongoose.Schema;

var GameSchema = new Schema({
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

GameSchema.plugin(autoIncrement.plugin, { model: 'Game', field: 'id', startAt: 1 });

var Game = mongoose.model('Game', GameSchema);

module.exports = Game;
