/**
 * Created by EminAyar on 1.03.2018.
 */
var mongoose = require('mongoose');

var Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId;

var sch = new Schema({
    fbId: String,
    email: String,
    education: String,
    name: String,
    birthDate: String,
    gender: Number,
    profilePicture: String,
    popiPoint: Number,
});

var User = mongoose.model('User', sch);

module.exports = User; // this is what you want