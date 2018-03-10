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
    unread: { type: Number, default: 0 },
    isPremium: { type: Boolean, default: false },
    gender: Number,
    profilePicture: String,
    popiPoint: Number,
    videosLiked: [{ type: Schema.Types.ObjectId, ref: 'Video' }],
    videosDisliked: [{ type: Schema.Types.ObjectId, ref: 'Video' }]
});

var User = mongoose.model('User', sch);

module.exports = User; // this is what you want