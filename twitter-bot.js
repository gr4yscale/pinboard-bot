// grab variables from the .env
require('dotenv').load();

var Twit = require('twit');
var Bitly = require('bitly');
var fetchData = require('./fetch-pinboard-data.js');
var ds = require('./pinboard-datastore.js');
var fs = require('fs');

var defaultConfig = {
  pinboardFetchInterval : 1000 * 60 * 60,
  currentTagsToPost : ['open-frameworks','techart-group','creative-agency', 'projection-mapping']
};

function TwitterBot(config) {

  this.config = defaultConfig;
  if (config) {
    for (var key in defaultConfig) this.config[key] = config[key];
  }

  var self = this;
  self.refreshData();
  
  setInterval(function() {
    self.refreshData();
  },self.config.pinboardFetchInterval);
}

// public

TwitterBot.prototype.refreshData = function() {
  fetchData()
  .then(function(posts){
    return ds.updateWithPosts(posts);
  })
  .catch(function(err) {
    console.log('Error fetching pinboard data and updating data store ' + err);
  });
};

TwitterBot.prototype.tweetRandomPostForCurrentTag = function () {
  if (!this.config.currentTagsToPost) return;
  var tag = tagToPost(this.config.currentTagsToPost);
  
  ds.findNextPostToTweet(tag)
    .then(function(post) {
        return shortenUrl(post)
        .then(function(shortenedUrl) {
          return tweetPost(post, shortenedUrl);
        })
        .then(function(post) {
          return ds.flagPostAsTweeted(post);
        });
    })
    .catch(function(err) {
      // on 'no post found / we've tweeted all of the posts for this tag' error, DM me on twitter or ensure papertrail notification
      console.log('Error tweeting random post for current tag! ' + err);
      console.log('or....maybe... ');
      console.log('There were no posts for this tag:' + tag); // TOFIX: being lazy and not checking the exact error for now
    });
};

TwitterBot.prototype.logRandomTweetForDebug = function () {
  var logString = '';
  ds.allPosts()
    .then(function(posts) {
      for (i = 0; i < posts.length; i++) {
        var post = posts[i];
        var tweet = formattedTweetWithPostAndURL(post, 'bit.ly/1VhlCog');
        logString = logString + tweet + '\n' + post.description + '\n' + JSON.stringify(post.tagsArray) + '\n' + post.href + '\n\n';
        //console.log(logString);
      }
      fs.writeFileSync('./debugTweetsPreviews3.txt', logString);
    })
    .catch(function(err) {
      console.log('Error logging random tweet ' + err);
    });
};

// private

var tweetPost = function(post, shortenedUrl) {
  return new Promise(function(resolve, reject) {
      var tweet = formattedTweetWithPostAndURL(post, shortenedUrl);
      console.log('Tweet preview before posting: ' + tweet);

      var T = new Twit({
        consumer_key: process.env.TWITTER_CONSUMER_KEY,
        consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
        access_token: process.env.TWITTER_ACCESS_TOKEN,
        access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET
      });

      T.post('statuses/update', { status: tweet }, function(err, data, post, shortenedUrl){
        if (err) {
          console.log('Error tweeting: ' + err.toString());
          reject(err);
        } else {
          console.log('Tweeted! ' + tweet);
          resolve(post);
        }
      });
  });
};

var shortenUrl = function(post) {
  console.log('Going to create a short url for post: ' + post);
  return new Promise(function(resolve, reject) {
      if (post === undefined) reject(); // TOFIX: appropriate error here

      var bitly = new Bitly(process.env.BITLY_USERNAME, process.env.BITLY_API_KEY);
      
      bitly.shorten(post.href, function(err, response) {
        if (err) {
          console.log('Error getting a shortened URL from bit.ly: ' + err.toString());
          reject(err);
        } else {
          resolve(response.data.url);
        }
    });
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
