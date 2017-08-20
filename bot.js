var Twit = require('twit');
var fs = require('fs');

var T = new Twit({
  consumer_key:         process.env.CONSUMER_KEY,
  consumer_secret:      process.env.CONSUMER_SECRET,
  access_token:         process.env.ACCESS_TOKEN,
  access_token_secret:  process.env.ACCESS_SECRET,
  timeout_ms:           60*1000,
});

function getUserObjectFromId(user_id, callback) {
	T.get('users/show', {user_id}, function (err, data, res) {
		callback(data);
	});
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

var stream = T.stream('statuses/filter', { track: 'actually', language:'en' })

stream.on('tweet', function (tweet) {

  // Limit to tweets that start "Actually," (including punctuation) to reduce false positives
  // Exclude retweets, because they're not the target
  // Only include tweets that are replies to other tweets, again to reduce false positives
  if(tweet.text.search(/^Actually\,/) !== -1 && tweet.retweeted === false && tweet.in_reply_to_user_id_str !== null) {
    console.log("Potential pedantry detected...");
  	getUserObjectFromId(tweet.in_reply_to_user_id_str, function(recipient_data) {
        console.log(tweet);
      // Only trigger if there is a substantial differential in follower count (punching up only!)
      if (tweet.user.followers_count / recipient_data.followers_count > 10) {
        respondWithImage(tweet.user, 'reply_01.png', 'Meme picture of a guy', 'ACTUALLY...');
      } else {
          console.log("Follower ratio too low. Aborting...");
      }
  	});
  	
  }
});