var TwitterBot = require('./twitter-bot.js');
var bot = new TwitterBot();
var tweetInterval = 1000 * 60 * 30; // every 10 mins
var tweetIntervalVariance = 1000 * 60 * 5;

var express = require('express');
var app = express();

app.get('/tagsToPost/:tagsToPost', function(req, res) {
  bot.config.currentTagsToPost = req.params.tagsToPost.split(',').map(function(str){ return str.trim(); });
  res.send('Updated tags to post: ' + bot.config.currentTagsToPost);
});

app.get('/interval/:interval', function(req, res) {
  tweetInterval = parseFloat(req.params.interval) * 1000 * 60;
  res.send('Updated tweet interval: ' + tweetInterval / 1000 / 60);
  updateInterval();
});

app.get('/intervalVariance/:intervalVariance', function(req, res) {
  tweetIntervalVariance = parseFloat(req.params.intervalVariance) * 1000 * 60;
  res.send('Updated tweet interval variance: ' + tweetIntervalVariance / 1000 / 60);
  updateInterval();
});

function tweet() {
  bot.tweetRandomPostForCurrentTag();
  updateInterval();
}

function updateInterval() {
  setTimeout(tweet, tweetInterval + Math.floor(Math.random() * tweetIntervalVariance));
}

var server = app.listen(3000);
tweet();
