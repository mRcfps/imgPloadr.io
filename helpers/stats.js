var async = require('async');
var models = require('../models');

module.exports = function (callback) {
  async.parallel([
    function (next) {
      // find the total number of images
      models.Image.count({}, next);
    },
    function (next) {
      // find the total number of comments
      models.Comment.count({}, next);
    },
    function (next) {
      // sum up views of all images
      models.Image.aggregate(
        {
          $group: {
            _id: '1',
            viewsTotal: { $sum: '$views' }
          }
        },
        function (err, result) {
          var viewsTotal = 0;
          if (result.length > 0) {
            viewsTotal += result[0].viewsTotal;
          }
          next(null, viewsTotal);
        }
      );
    },
    function (next) {
      // sum up likes of all images
      models.Image.aggregate(
        {
          $group: {
            _id: '1',
            likesTotal: { $sum: '$likes' }
          }
        },
        function (err, result) {
          var likesTotal = 0;
          if (result.length > 0) {
            likesTotal += result[0].likesTotal;
          }
          next(null, likesTotal);
        }
      );
    }
  ], function (err, results) {
    callback(null, {
      image: results[0],
      comments: results[1],
      views: results[2],
      likes: results[3],
    });
  });
};
