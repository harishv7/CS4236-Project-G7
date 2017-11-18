var mongoose = require('mongoose');
var autoIncrement = require('mongoose-auto-increment');

autoIncrement.initialize(mongoose.connection);

var Schema = mongoose.Schema;

var PlayerSchema = new Schema({
    id: {
        type: Number,
        unique: true,
        dropDups: true
    },
    balance: {
        type: Number,
        required: true,
        default: 100
    }
});

PlayerSchema.plugin(autoIncrement.plugin, { model: 'Player', field: 'id', startAt: 1 });

var Player = mongoose.model('Player', PlayerSchema);

module.exports = Player;
