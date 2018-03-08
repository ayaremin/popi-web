var config = {
    apiKey: 'AIzaSyCbcgJi0iXxJRJTL1pG2FOKjeF0qaIU3cQ',
    authDomain: 'popi-3b329.firebaseio.com/',
    databaseURL: 'https://popi-3b329.firebaseio.com/',
    storageBucket: ''
};

firebase.initializeApp(config);
var db = firebase.database();

// CREATE REWIEW

var reviewForm = document.getElementById('reviewForm');
var title = document.getElementById('title');
var tags = document.getElementById('tags');
var videofile = document.getElementById('video');
var progress = document.getElementById('progress-container');

reviewForm.addEventListener('submit', function (e) {
    e.preventDefault();

    if (!title.value || !tags.value) {
        return null;
    }

    var array = this.tags.value.split(',');

    var files = videofile.files;

    if (!files.length) {
        return alert('Please choose a file to upload first.');
    }

    var file = files[0];
    var fileName = file.name;

    var http = new XMLHttpRequest();

    var url = "http://popiapp.com/admin/upload";

    progress.style.visibility = 'visible';

    var reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = function () {
        http.open("POST", url, true);
        http.responseType = 'json';
        http.setRequestHeader("Content-Type", "application/json;charset=UTF-8");

        http.onreadystatechange = function () {//Call a function when the state changes.
            if (http.readyState == 4 && http.status == 200) {
                progress.style.visibility = 'hidden';
                saveToFirebase(array, http.response.filename);
            }
        };
        http.send(JSON.stringify({encoded: reader.result, filename: fileName}));
    };
    //
});

// READ VIDEOS

var reviews = document.getElementById('reviews');
var promoteds = document.getElementById('promoted-videos');
var videosRef = db.ref('/videos');
var promotedsRef = db.ref('/videos').orderByChild('isPromoted').equalTo(true);


videosRef.orderByKey().on('child_added', function (data) {
    var card = document.createElement('div');
    card.id = data.key;
    card.innerHTML = createVideoItem(data.val());
    card.classList.add('pure-padding');
    card.classList.add('col-lg-4');
    card.classList.add('col-md-4');
    card.classList.add('col-sm-4');
    card.classList.add('col-xs-12');
    reviews.appendChild(card);
});

videosRef.on('child_changed', function (data) {
    var reviewNode = document.getElementById(data.key);
    reviewNode.innerHTML = createVideoItem(data.val());
});

videosRef.on('child_removed', function (data) {
    var reviewNode = document.getElementById(data.key);
    reviewNode.parentNode.removeChild(reviewNode);
});

promotedsRef.on('child_added', function (data) {
    var cardTrend = document.createElement('div');
    //cardTrend.id = data.key;
    cardTrend.classList.add(data.key);
    cardTrend.innerHTML = createTrendVideoItem(data.val());
    promoteds.appendChild(cardTrend);
});

promotedsRef.on('child_removed', function (data) {
    var reviewNode = document.getElementsByClassName(data.key)[0];
    console.log(reviewNode);
    reviewNode.parentNode.removeChild(reviewNode);
});

promoteds.addEventListener('click', function (e) {
    var reviewNode = e.target.parentNode.parentNode.parentNode;
    if (e.target.classList.contains('unpromote')) {
        var x = confirm("Bu postu öne çıkarılanlardan kaldırmak istediğinize emin misiniz ?");
        if (x) {
            var id = reviewNode.classList[0];
            db.ref('videos/' + id).child('isPromoted').set(false);
        }
    }
});

reviews.addEventListener('click', function (e) {
    var reviewNode = e.target.parentNode.parentNode.parentNode.parentNode;
    // UPDATE REVEIW
    if (e.target.classList.contains('edit')) {
        title.value = reviewNode.querySelector('.title').innerText;
        tags.value = reviewNode.querySelector('.tags').innerText;
        hiddenId.value = reviewNode.id;
    }

    // DELETE VIDEO
    if (e.target.classList.contains('delete')) {
        var x = confirm("" + reviewNode.title + ' silmek istediğinize emin misiniz ?');
        if (x) {
            var id = reviewNode.id;
            videosRef.child(id).child('isDeleted').set(true);
        }
    }

    if (e.target.classList.contains('activate')) {
        var x = confirm("Bu postu aktifleştirmek istediğinize eminmisiniz ?" );
        if (x) {
            var id = reviewNode.id;
            db.ref('videos/' + id).child('isDeleted').set(false);
        }
    }

    if (e.target.classList.contains('promote')) {
        var x = confirm("Bu postu öne çıkarılanlara eklemek istediğinize emin misiniz ?");
        if (x) {
            var id = reviewNode.parentNode.id;
            db.ref('videos/' + id).child('isPromoted').set(true);
        }
    }

    if (e.target.classList.contains('unpromote')) {
        var x = confirm("Bu postu öne çıkarılanlardan kaldırmak istediğinize emin misiniz ?");
        if (x) {
            var id = reviewNode.parentNode.id;
            db.ref('videos/' + id).child('isPromoted').set(false);
        }
    }
});

function saveToFirebase(array, filename) {
    var key = db.ref('videos').push();
    var now = Date.now();
    db.ref('videos').child(key.key).set({
        'createdAt': now,
        'isDeleted': false,
        'dislike': 0,
        'id': key.key,
        'like': 0,
        'tags': array,
        'title': this.title.value,
        'url': 'https://s3.amazonaws.com/popiapp-hosting-mobilehub-496562667/videos/' + filename,
        'user': {
            'email': 'info@happycoderz.com',
            'fbId': '000000',
            'name': 'Popi-Admin',
            'profilePicture': ''
        }
    });

    this.title.value = '';
    this.tags.value = '';
};

function createTrendVideoItem (data) {
    var template;

    template = `<div class="card">
        <div class="container">
        <h4><b>${data.title}</b></h4>
    <button class="btn btn-lg btn-primary-new btn-block red unpromote" type="submit">Çıkar</button>
        <button class="btn btn-lg btn-primary-new btn-block" onclick="location.href='${data.url}';" type="submit">İzle</button>
        </div>
        </div>`;

    return template;
};

function createVideoItem (data) {
    var template;

    template = `<div class="card-auto">
        <div class="container">
            <h4 id="text"><b>${data.title}</b></h4>
            <h6>${data.tags}</b></h6>
            ${data.isDeleted && data.isDeleted === true ?
                '<div class="col-lg-12 col-md-12 col-sm-12 col-xs-12"> <button class="btn btn-lg btn-primary-new btn-block green activate" type="submit">Postu Aktifleştir</button> </div>'
            :
                '<div class="col-lg-12 col-md-12 col-sm-12 col-xs-12"> <button class="btn btn-lg btn-primary-new btn-block red delete" type="submit">Sil</button> </div>' }
            <br>
            <br>
            <div class="margin-top">
                <div class="col-lg-6 col-md-6 col-sm-6 col-xs-12"> <button onclick="location.href='${data.url}'" class="btn btn-lg btn-primary-new btn-block watch" type="submit">İzle</button> </div>
                ${data.isPromoted  && data.isPromoted === true ?
                    '<div class="col-lg-6 col-md-6 col-sm-6 col-xs-12"> <button class="btn btn-lg btn-primary-new btn-block unpromote red" type="submit">Öne Çıkarma</button> </div>' 
                :
                    '<div class="col-lg-6 col-md-6 col-sm-6 col-xs-12"> <button class="btn btn-lg btn-primary-new btn-block promote green" type="submit">Öne Çıkar</button> </div>' }
            </div>  
        </div>`;

    return template;
};


