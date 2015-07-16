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

module.exports = new PinboardDataStore();
