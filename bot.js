var Twit = require('twit');
var fs = require('fs');

var T = new Twit({
  consumer_key:         process.env.CONSUMER_KEY,
  consumer_secret:      process.env.CONSUMER_SECRET,
  access_token:         process.env.ACCESS_TOKEN,
  access_token_secret:  process.env.ACCESS_SECRET,
  timeout_ms:           60*1000,  // optional HTTP request timeout to apply to all requests.
});

function getUserObjectFromId(user_id, callback) {
	T.get('users/show', {user_id}, function (err, data, res) {
		callback(data);
	});
}

function getFollowerRatio(firstUser, secondUser) {
	return firstUser.followers_count / secondUser.followers_count;
}

function respondWithImage(userToRespondTo, imagePath, altText, tweetText) {
	var b64content = fs.readFileSync(imagePath, { encoding: 'base64' })
	T.post('media/upload', { media_data: b64content }, function (err, data, response) {
	  var mediaIdStr = data.media_id_string
	  var meta_params = { media_id: mediaIdStr, alt_text: { text: altText } }

	  T.post('media/metadata/create', meta_params, function (err, data, response) {
	    if (!err) {

	      var params = {
	      	status: "@" + userToRespondTo.screen_name + " is all like, " + tweetText,
	      	media_ids: [mediaIdStr],
	      	in_reply_to_status_id: userToRespondTo.id 
	      }

	      T.post('statuses/update', params, function (err, data, response) {
	        console.log(data);
	      })
	    }
	  })
	})
}

var stream = T.stream('statuses/filter', { track: 'test018271231', language:'en' })

stream.on('tweet', function (tweet) {
  if(tweet.text.search(/^test018271231/) !== -1 && tweet.retweeted === false) {

  	getUserObjectFromId(tweet.in_reply_to_user_id_str, function(recipient_data) {
  		console.log("Tweet: " + tweet.text);
  		console.log("Tweeter ID: " + tweet.user.id);
	  	console.log("Followers: " + tweet.user.followers_count);
	  	console.log("Replying to ID: " + tweet.in_reply_to_user_id_str);
	  	console.log("Target followers: " + recipient_data.followers_count);
	  	respondWithImage(tweet.user, 'reply_01.png', 'Meme picture of a guy', 'ACTUALLY...');
  	});
  	
  }
});