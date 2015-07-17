// grab variables from the .env

require('dotenv').load();

var Twit = require('twit');
var Bitly = require('bitly');
var fetchPinboardData = require('./fetch-pinboard-data.js');
var pinboardDataStore = require('./pinboard-datastore.js');

// config vars (cleanup later)

var pinboardFetchInterval = 1000 * 60 * 60; // every hour
var tweetInterval = 1000 * 60 * 30; // every 30 mins
var tweetIntervalVariance =  1000 * 60 * 5; // 5 mins
var currentTagToPost = 'techart';

var T = new Twit({
  consumer_key: process.env.TWITTER_CONSUMER_KEY,
  consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
  access_token: process.env.TWITTER_ACCESS_TOKEN,
  access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET
});

var bitly = new Bitly('gr4yscalebitly', process.env.BITLY_API_KEY);

setInterval(function() {
  console.log('Fetching pinboard data');
  fetchPinboardDataAndUpdateDataStore();
}, pinboardFetchInterval);

fetchPinboardDataAndUpdateDataStore();
tweetRandomPostForCurrentTag();

function fetchPinboardDataAndUpdateDataStore() {
  fetchPinboardData(function(posts){
    pinboardDataStore.updateWithPosts(posts);
  });
}

function formattedTweetWithPostAndURL(post, url) {
  var tweet = '';
  var shortenedurl = url;
  var truncatedTitle = post.description.substring(0, 137 - shortenedurl.length); // 137 to make room for hyphens and a space
  // do we need to truncate more for ellipses?
  if (truncatedTitle.length > (134 - shortenedurl.length)) {
    tweet = truncatedTitle + '... - ' + shortenedurl;
  } else {
    tweet = truncatedTitle + ' - ' + shortenedurl;
  }
  return tweet;
}

function tweetRandomPostForCurrentTag() {
  pinboardDataStore.findPostWhichHasNotBeenTweetedWithTag(currentTagToPost, function(post) {
    if (post !== undefined) {
      bitly.shorten(post.href, function(err, response) {
        if (err) console.log(err); // TODO: hande better
        
        var tweet = formattedTweetWithPostAndURL(post, response.data.url);
        T.post('statuses/update', { status: tweet }, function(err, data, response){
          if (err) console.log(err); // TODO: hande better
          pinboardDataStore.updatePostWithHasBeenTweetedFlag(post);
          console.log('tweeted!');
        });
      });
    } else {
      // DM or otherwise notify me that we've tweeted all of the posts for this tag
    }
  });
  setTimeout(tweetRandomPostForCurrentTag, tweetInterval + Math.floor(Math.random() * tweetIntervalVariance));
}
