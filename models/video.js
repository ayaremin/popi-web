/**
 * Created by EminAyar on 1.03.2018.
 */
var mongoose = require('mongoose');

var Schema = mongoose.Schema;

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
    user: String,
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

sch.virtual('userObject', {
    ref: 'User',
    localField: 'user',
    foreignField: 'fbId',
    justOne: true
});

sch.set('toObject', { virtuals: true });
sch.set('toJSON', { virtuals: true });

var Video = mongoose.model('Video', sch);

module.exports = Video;