// grab variables from the .env

require('dotenv').load();

var Twit = require('twit');
var Bitly = require('bitly');

var T = new Twit({
  consumer_key: process.env.TWITTER_CONSUMER_KEY,
  consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
  access_token: process.env.TWITTER_ACCESS_TOKEN,
  access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET
});

var bitly = new Bitly('gr4yscalebitly', process.env.BITLY_API_KEY);



//T.post('statuses/update', { status: '*yawn*' }, function(err, data, response){
  //console.log(data);
//});

bitly.shorten('https://github.com/gr4yscale', function(err, response) {
if (err) throw err;

  var shortenedurl = response.data.url;
  console.log(shortenedurl);
});
