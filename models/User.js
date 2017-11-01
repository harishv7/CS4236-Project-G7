var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var userSchema = new Schema({
    id: {
        type: String,
        required: true,
        unique: true,
        dropDups: true
    },
    name: {
        type: String,
        required: true,
        minlength: 1,
        trim: true
    }
});

var User = mongoose.model('User', userSchema);

module.exports = User;
