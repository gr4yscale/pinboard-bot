// grab variables from the .env
require('dotenv').load();

var Twit = require('twit');
var Bitly = require('bitly');
var fetchPinboardData = require('./fetch-pinboard-data.js');
var pinboardDataStore = require('./pinboard-datastore.js');

var defaultConfig = {
  pinboardFetchInterval : 1000 * 60 * 60,
  currentTagsToPost : ['open-frameworks','techart-group','creative-agency', 'projection-mapping']
};

function TwitterBot(config) {
  var self = this;

  this.config = defaultConfig;
  if (config) {
    for (var key in defaultConfig) this.config[key] = config[key];
  }

  this.fetchPinboardDataAndUpdateDataStore();
  
  setInterval(function() {
    console.log('Fetching Pinboard data');
    self.fetchPinboardDataAndUpdateDataStore();
  },
  self.config.pinboardFetchInterval);
}

TwitterBot.prototype.fetchPinboardDataAndUpdateDataStore = function() {
  fetchPinboardData(function(posts){
    pinboardDataStore.updateWithPosts(posts);
  });
};

TwitterBot.prototype.tweetRandomPostForCurrentTag = function () {
  if (!this.config.currentTagsToPost) return;

  var bitly = new Bitly(process.env.BITLY_USERNAME, process.env.BITLY_API_KEY);
  
  var T = new Twit({
    consumer_key: process.env.TWITTER_CONSUMER_KEY,
    consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
    access_token: process.env.TWITTER_ACCESS_TOKEN,
    access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET
  });

  var tag = tagToPost(this.config.currentTagsToPost);

  pinboardDataStore.findPostWhichHasNotBeenTweetedWithTag(tag, function(post) {
    if (post !== undefined) {
      bitly.shorten(post.href, function(err, response) {
        if (err) {
          console.log('Error getting a shortened URL from bit.ly: ' + err.toString());
        } else {
          var tweet = formattedTweetWithPostAndURL(post, response.data.url);
          T.post('statuses/update', { status: tweet }, function(err, data, response){
            if (err) {
              console.log('Error tweeting: ' + err.toString());
            } else {
              pinboardDataStore.updatePostWithHasBeenTweetedFlag(post);
              console.log('Tweeted! ' + tweet);
            }
          });
        }
      });
    } else {
      console.log('There were no posts for this tag:' + tag);
      // DM or otherwise notify me that we've tweeted all of the posts for this tag; for now papertrail notifies me of this log message
    }
  });
};

var tagToPost = function(currentTagsToPost) {
  var tag;
  if (Array.isArray(currentTagsToPost)) {
    var randIndex = Math.floor(Math.random() * currentTagsToPost.length);
    tag = currentTagsToPost[randIndex];
  } else {
    tag = currentTagsToPost;
  }
  return tag;
};

var formattedTweetWithPostAndURL = function(post, url) {
  var tweet = '';
  var shortenedurl = url;
  var truncatedTitle = post.description.substring(0, 134 - shortenedurl.length); // 137 to make room for hyphens and a space
  
  if (truncatedTitle.length > (134 - shortenedurl.length)) {
    tweet = truncatedTitle + '... - ' + shortenedurl;
  } else {
    tweet = truncatedTitle + ' - ' + shortenedurl;
  }
  return tweet;
};

module.exports = TwitterBot;
