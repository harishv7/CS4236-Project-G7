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
    name: {
        type: String,
        required: true,
        minlength: 1,
        trim: true
    },
    balance: {
        type: Number,
        required: true,
        default: 1000
    }
});

PlayerSchema.plugin(autoIncrement.plugin, { model: 'Player', field: 'id', startAt: 1 });

var Player = mongoose.model('Player', PlayerSchema);

module.exports = Player;
