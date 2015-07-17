var mongoClient = require('mongodb').MongoClient;

function connect (callback) {
  var url = 'mongodb://localhost:27017/pinboardTweeter';
  mongoClient.connect(url, function(err, db) {
    if (!err) {
      console.log('connected!');
      callback(db);
    }
  });
}

function PinboardDataStore() {}

PinboardDataStore.prototype.updateWithPosts = function(posts) {
  connect(function(db) {
    var collection = db.collection('posts');
    var bulkOp = collection.initializeUnorderedBulkOp();
    // might can use $in and $set operators here on a bulk upsert operation, will test later
    for (var i = 0; i < posts.length; i++) {
      bulkOp.find({ '_id' : posts[i]['_id'] }).upsert().replaceOne(posts[i]);
    }

    bulkOp.execute(function(err, result) {
      if (err) console.log(err.toString()); // TODO handle error better
      db.close();
    });
  });
};

PinboardDataStore.prototype.findPostWhichHasNotBeenTweetedWithTag = function(tag, callback) {
  connect(function(db) {
    var collection = db.collection('posts');
    // posts which have not been tweeted do not have the 'hasBeenTweeted' key
    collection.find({hasBeenTweeted:{$exists: false}, tagsArray:tag})
              .toArray(function(err, objects) {
                if (err) { console.log(err); return; } // handle better in the future
                var randIndex = Math.floor(Math.random() * objects.length);
                if (callback) callback(objects[randIndex]);
                db.close();
              });
  });
};

PinboardDataStore.prototype.updatePostWithHasBeenTweetedFlag = function(post) {
  connect(function(db) {
    var collection = db.collection('posts');
    // posts which have not been tweeted do not have the 'hasBeenTweeted' key
    collection.update({"_id" : post['_id']},
                      { $set: {'hasBeenTweeted':true}},
                      function(err, objects) {
                        if (err) { console.log(err); return; } // TODO: handle better in the future
                        db.close();
                      });
  });
};

module.exports = new PinboardDataStore();
