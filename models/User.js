var mongoose = require('mongoose');
var autoIncrement = require('mongoose-auto-increment');

autoIncrement.initialize(mongoose.connection);

var Schema = mongoose.Schema;

// TODO: Change User to Player? To make it consistent with other parts of the code
var UserSchema = new Schema({
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

UserSchema.plugin(autoIncrement.plugin, { model: 'User', field: 'id', startAt: 1 });

var User = mongoose.model('User', UserSchema);

module.exports = User;
