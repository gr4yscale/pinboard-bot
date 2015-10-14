var Promise = require("bluebird");
var request = require("request");
var fs = require('fs');

// ugly hack where we remove the space-delimted property 'tags' and add an array property 'tagsArray'
function addTagsArrayToPosts(posts) {
  posts.map(function(post){
    post.tagsArray = post.tags.split(' ');
    // rename hash key to _id
    Object.defineProperty(post, '_id', Object.getOwnPropertyDescriptor(post, 'hash'));
    delete post['hash'];
  });
  return posts;
}

module.exports = function() {
  // fetch data locally during dev
  // resolve(JSON.parse(fs.readFileSync('./posts-sampledata.json', 'utf8')));

  var user = process.env.PINBOARD_USER;
  var token = process.env.PINBOARD_OAUTH_TOKEN;
  var uri = 'https://api.pinboard.in/v1/posts/all?auth_token=' + user + ':' + token + '&format=json';

  console.log('Fetching Pinboard data');

  return new Promise(function(resolve, reject) {
    request(uri, function (error, response, body) {
      if (error) {
        reject(error);
      } else {
        console.log('fetched pinboard data!');
        var posts = addTagsArrayToPosts(JSON.parse(body));
        resolve(posts);
      }
    });
  });
};
