const { Schema, model } = require('mongoose');

const schema = new Schema({
    username: String,
    password: String
});

module.exports = model('User', schema);
