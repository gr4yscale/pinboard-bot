var Promise = require("bluebird");
var mongoClient = require('mongodb').MongoClient;

function PinboardDataStore() {
  this.db = new Promise(function(resolve, reject) {
    mongoClient.connect(process.env.MONGODB_URL, function(err, db) {
      if (err) {
        reject(err);
      } else {
        console.log('Connected to mongo!');
        resolve(db);
      }
    });
  });
}

PinboardDataStore.prototype.updateWithPosts = function(posts) {
  var self = this;
  return new Promise(function(resolve, reject) {
    self.db.then(function(db) {
      var collection = db.collection('posts');
      var bulkOp = collection.initializeUnorderedBulkOp();
      
      // might can use $in and $set operators here on a bulk upsert operation, will test later
      for (var i = 0; i < posts.length; i++) {
        bulkOp.find({ '_id' : posts[i]['_id'] }).upsert().replaceOne(posts[i]);
      }

      bulkOp.execute(function(err, result) {
        if (err) {
          console.log('Error bulk updating posts collection: ' + err.toString());
          reject(err);
        } else {
          resolve();
        }
      });
    });
  });
};

PinboardDataStore.prototype.findNextPostToTweet = function(tag) {
  var self = this;
  return new Promise(function(resolve, reject) {
    self.db.then(function(db) {
      var collection = db.collection('posts');
      // posts which have not been tweeted do not have the 'hasBeenTweeted' key
      collection.find({hasBeenTweeted:{$exists: false}, tagsArray:tag})
                .toArray(function(err, objects) {
                  if (err) {
                    console.log('Error finding a not-tweeted post! ' + err.toString());
                    reject(err);
                  } else {
                    var randIndex = Math.floor(Math.random() * objects.length);
                    var post = objects[randIndex];
                    resolve(post);
                  }
                });
    });
  });
};

PinboardDataStore.prototype.flagPostAsTweeted = function(post) {
  console.log('Updating post with hasBeenTweeted flag: ' + post);
  var self = this;
  return new Promise(function(resolve, reject) {
    self.db.then(function(db) {
      var collection = db.collection('posts');
      // posts which have not been tweeted do not have the 'hasBeenTweeted' key
      collection.update({"_id" : post['_id']},
                        { $set: {'hasBeenTweeted':true}},
                        function(err, objects) {
                          if (err) {
                            console.log('Error updating hasBeenTweeted flag! ' + err.toString());
                            reject(err);
                          } else {
                            resolve(post);
                          }
                        });
    });
  });
};

PinboardDataStore.prototype.allPosts = function() {
  var self = this;
  return new Promise(function(resolve, reject) {
    self.db.then(function(db) {
      var collection = db.collection('posts');
      // posts which have not been tweeted do not have the 'hasBeenTweeted' key
      collection.find()
                .batchSize(5000)
                .toArray(function(err, objects) {
                  if (err) {
                    console.log('Error finding a not-tweeted post! ' + err.toString());
                    reject(err);
                  } else {
                    resolve(objects);
                  }
                });
    });
  });
};

module.exports = new PinboardDataStore();
