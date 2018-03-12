/**
 * Created by EminAyar on 13.03.2018.
 */
var FCM = require('fcm-push');

var serverKey = '';
var fcm = new FCM('AAAA3phqtZM:APA91bEbftz4XVoasqZk0LcmyPADOUSd2u8vaPxcCRP1sfV7M0k4sPFYNGU3mh0lB_zTadY6VEjCoLpQFZOaXXnOTk0inEd7Vq2MaokzWIkky738Cscqlprpo6zXJ3xDxPx2ZH7zgPi5');

exports.sendNotification = function (token, title, body) {
    var message = {
        to: token,
        data: {
            your_custom_data_key: 'your_custom_data_value'
        },
        notification: {
            title: title,
            body: body
        }
    };

//callback style
    fcm.send(message, function(err, response){
        if (err) {
            console.log("Something has gone wrong!");
        } else {
            console.log("Successfully sent with response: ", response);
        }
    });
};
