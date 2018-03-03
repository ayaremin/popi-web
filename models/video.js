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
    viewStarted: Number,
    viewCompleted: Number,
    title: String,
    url: String,
    ownerId: String,
    videoOwner: String,
    createdAt: Date,
    user: { type: String, ref: 'User' },
    tags: Array,
    isPromoted: {
        type: Boolean,
        default: false
    },
    isDeleted: {
        type: Boolean,
        default: false
    }
});

var Video = mongoose.model('Video', sch);

module.exports = Video;