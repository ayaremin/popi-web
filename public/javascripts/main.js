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
var title   = document.getElementById('title');
var tags    = document.getElementById('tags');
var videofile   = document.getElementById('video');
var progress = document.getElementById('progress-container');

reviewForm.addEventListener('submit', function(e)  {
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

    var url = "http://localhost:5353/admin/upload";

    progress.style.visibility = 'visible';

    var reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = function () {
        http.open("POST", url, true);
        http.responseType = 'json';
        http.setRequestHeader("Content-Type", "application/json;charset=UTF-8");

        http.onreadystatechange = function() {//Call a function when the state changes.
            if(http.readyState == 4 && http.status == 200) {
                progress.style.visibility = 'hidden';
                saveToFirebase (array, http.response.filename);
            }
        };
        http.send(JSON.stringify({ encoded: reader.result, filename: fileName }));
    };
    //
});

// READ VIDEOS

var reviews = document.getElementById('reviews');
var reviewsRef = db.ref('/videos');

reviewsRef.orderByKey().on('child_added', function(data)  {
  var li = document.createElement('li');
  li.id = data.key;
  var title = data.val().title;
  var tags = data.val().tags;
  var abc = {
	  'title':title,
	  'tags':tags
  }
  li.innerHTML = reviewTemplate(abc);
  reviews.appendChild(li);
});

reviewsRef.on('child_changed', function(data)  {
  var reviewNode = document.getElementById(data.key);
  reviewNode.innerHTML = reviewTemplate(data.val());
});

reviewsRef.on('child_removed', function(data)  {
  var reviewNode = document.getElementById(data.key);
  reviewNode.parentNode.removeChild(reviewNode);
});

reviews.addEventListener('click', function(e)  {
  var reviewNode = e.target.parentNode

  // UPDATE REVEIW
  if (e.target.classList.contains('edit')) {
    title.value = reviewNode.querySelector('.fullName').innerText;
    tags.value  = reviewNode.querySelector('.message').innerText;
    hiddenId.value = reviewNode.id;
  }

  // DELETE REVEIW
  if (e.target.classList.contains('delete')) {
      var x = confirm("Are you sure you want to delete" + reviewNode.title + ' ?');
      if (x) {
          var id = reviewNode.id;
          db.ref('videos/' + id).remove();
      } else {

      }
  }
});

function saveToFirebase (array, filename) {
    var key = db.ref('videos').push();
	var now = Date.now();
    db.ref('videos').child(key.key).set({
  		'createdAt': now,
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
    this.tags.value  = '';
};

function reviewTemplate(data) {
  return `
    <div class='fullName'>${data.title}</div>
    <div class='message'>${data.tags}</div>
    <button class='delete'>Sil</button> `
};
