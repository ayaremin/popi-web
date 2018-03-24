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
    isPremium: { type: Boolean, default: true },
    gender: Number,
    profilePicture: String,
    firebaseToken: String,
    popiPoint: Number,
    followees: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    followers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    videosLiked: [{ type: Schema.Types.ObjectId, ref: 'Video' }],
    videosDisliked: [{ type: Schema.Types.ObjectId, ref: 'Video' }],
    loc :  { type: {type:String}, coordinates: [Number]},
    createdAt: {
        type: Date,
        default: Date.now
    },
    preferences: {
        email:  { type: Boolean, default: true },
        interaction:  { type: Boolean, default: true },
        showEmail:  { type: Boolean, default: true },
        showAge:  { type: Boolean, default: true },
        showEducation:  { type: Boolean, default: true }
    }
});

sch.index({loc: '2dsphere'});
var User = mongoose.model('User', sch);

module.exports = User; // this is what you want