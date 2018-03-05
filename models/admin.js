/**
 * Created by EminAyar on 1.03.2018.
 */
var mongoose = require('mongoose');

var Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId;

var sch = new Schema({
    email: String,
    password: String,
});

var Admin = mongoose.model('Admin', sch);

module.exports = Admin;