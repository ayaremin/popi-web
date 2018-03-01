/**
 * Created by EminAyar on 1.03.2018.
 */
var mongoose = require('mongoose');

var Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId;

var sch = new Schema({
    fbId: String,
    like: Number,
    dislike: Number,
    title: String,
    url: String,
    ownerId: String,
    videoOwner: String,
    createdAt: Date,
    user: String,
    tags: Array,
    isDeleted: Boolean
});

var Video = mongoose.model('Video', sch);

module.exports = Video;