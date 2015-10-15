var TwitterBot = require('./twitter-bot.js');
var bot = new TwitterBot();

var tweetInterval = 1000 * 30; // every 30 secs
var tweetIntervalVariance = 0; // default to no variance
var timeouts = [];

var express = require('express');
var app = express();

app.get('/tagsToPost/:tagsToPost', function(req, res) {
  bot.config.currentTagsToPost = req.params.tagsToPost.split(',').map(function(str){ return str.trim(); });
  res.send('Updated tags to post: ' + bot.config.currentTagsToPost);
});

app.get('/interval/:interval', function(req, res) {
  tweetInterval = parseFloat(req.params.interval) * 1000 * 60;
  res.send('Updated tweet interval: ' + tweetInterval / 1000 / 60);
  updateTweetInterval();
});

app.get('/intervalVariance/:intervalVariance', function(req, res) {
  tweetIntervalVariance = parseFloat(req.params.intervalVariance) * 1000 * 60;
  res.send('Updated tweet interval variance: ' + tweetIntervalVariance / 1000 / 60);
  updateTweetInterval();
});

function tweet() {
  bot.tweetRandomPostForCurrentTag();
  updateTweetInterval();
}

function updateTweetInterval() {
  clearTimeouts();
  var intervalWithVariance = tweetInterval + Math.floor(Math.random() * tweetIntervalVariance);
  timeouts.push(setTimeout(tweet, intervalWithVariance));
  console.log('Updated tweet interval: ' + (intervalWithVariance / 1000 / 60));
}

function clearTimeouts() {
  for (var i = 0; i < timeouts.length; i++) {
    clearTimeout(timeouts[i]);
  }
  timeouts = [];
}

//tweet();

bot.logRandomTweetForDebug();

module.exports = app;
