var express = require('express');
var router = express.Router();

var AWS = require('aws-sdk');
var fs = require('fs');

// For dev purposes only
AWS.config.update({ accessKeyId: 'AKIAJRC7DLNEHD2NRRMQ', secretAccessKey: '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' });

var s3 = new AWS.S3();

var myBucket = 'popiapp-hosting-mobilehub-496562667/videos';

/* UPLOAD*/
router.post('/upload', function(req, res, next) {
    var fname =  appendToFilename(req.body.filename, new Date().getTime());
    var params = {Bucket: myBucket, Key:fname, Body: _base64ToArrayBuffer(req.body.encoded)};
    s3.putObject(params, function(err, data) {
        console.log(data);
        if (err) {
            console.log(err);
            return res.status(400).send({success:false});
        } else {
            return res.status(200).send({success:true, filename:fname});
        }
    });
});

function _base64ToArrayBuffer(base64) {
    var b64string = base64;
    var str = b64string.replace(/^data:video\/[a-z]+;base64,/, "");
    var buf = Buffer.from(b64string.split("base64,")[1], 'base64');
    return buf;
}

function appendToFilename(filename, string){
    var dotIndex = filename.lastIndexOf(".");
    if (dotIndex == -1) return filename + string;
    else return filename.substring(0, dotIndex) + string + filename.substring(dotIndex);
}

module.exports = router;
