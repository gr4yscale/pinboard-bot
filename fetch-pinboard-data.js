var request = require('request');
var fs = require('fs');


function addTagsArrayToPosts(posts) {
  for (var i = 0; i < posts.length; i++) {
    var post = posts[i];
    post.tagsArray = post.tags.split(' ');
  }
  return posts;
}

module.exports = function(callback) {
  // fetch data locally during dev
  var mockDataPosts = JSON.parse(fs.readFileSync('./posts-sampledata.json', 'utf8'));
  if(callback) {
      callback(addTagsArrayToPosts(mockDataPosts));
  }
  return;

  var user = process.env.PINBOARD_USER;
  var token = process.env.PINBOARD_OAUTH_TOKEN;

  request('https://api.pinboard.in/v1/posts/all?auth_token=' + user + ':' + token + '&format=json', function (error, response, body) {
    if (!error && response.statusCode == 200) {
      if(callback) {
        var posts = JSON.parse(body);
        callback(addTagsArrayToPosts(posts));
      }
      // TODO: handle error condition
    }
  });
};
