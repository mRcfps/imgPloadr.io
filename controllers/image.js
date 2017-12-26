var fs = require('fs');
var path = require('path');
var md5 = require('md5');
var sidebar = require('../helpers/sidebar');
var Models = require('../models');

module.exports = {
  index: function (req, res) {
    var viewModel = {
      image: {},
      comments: []
    };

    // find the image by searching the filename matching the url parameter
    Models.Image.findOne({ filename: { $regex: req.params.image_id }}, function (err, image) {
      if (err) throw err;
      if (image) {
        // increment its views counter
        image.views += 1;
        viewModel.image = image;
        image.save();

        // get comments for this image
        Models.Comment.find(
          { image_id: image._id },
          {},
          { sort: { timestamp: 1 }},
          function (err, comments) {
            if (err) throw err;
            viewModel.comments = comments;
            sidebar(viewModel, function (viewModel) {
              res.render('image', viewModel);
            });
          }
        );
      } else {
        res.redirect('/');
      }
    });
  },
  create: function (req, res) {
    var saveImage = function () {
      // generate random filename
      var possible = 'abcdefghijklmnopqrstuvwxyz0123456789';
      var imgUrl = '';
      for (var i = 0; i < 6; i += 1) {
        imgUrl += possible.charAt(Math.floor(Math.random() * possible.length));
      }

      // search for an image with the same filename by performing a find
      Models.Image.find({ filename: imgUrl }, function (err, images) {
        if (images.length > 0) {
          // a matching image was found, try again (start over)
          saveImage();
        } else {
          var tempPath = req.files.file.path;
          var ext = path.extname(req.files.file.name).toLowerCase();
          var targetPath = path.resolve('./public/upload/' + imgUrl + ext);

          if (ext === '.png' || ext === '.jpg' || ext === '.jpeg' || ext === '.gif') {
            fs.rename(tempPath, targetPath, function (err) {
              if (err) throw err;
              var newImg = new Models.Image({
                title: req.body.title,
                description: req.body.description,
                filename: imgUrl + ext
              });
              newImg.save(function (err, image) {
                console.log('Successfully inserted image: ' + image.filename);
                res.redirect('/images/' + image.uniqueId);
              });
            });
          } else {
            fs.unlink(tempPath, function (err) {
              if (err) throw err;
              res.json(500, { error: 'Only image files are allowed.' });
            });
          }
        }
      });
    };
    saveImage();
  },
  like: function (req, res) {
    Models.Image.findOne(
      { filename: { $regex: req.params.image_id }},
      function (err, image) {
        if (!err && image) {
          image.likes += 1;
          image.save(function (err) {
            if (err) res.json(err);
            else res.json({ likes: image.likes });
          });
        }
      }
    );
  },
  comment: function (req, res) {
    Models.Image.findOne(
      { filename: { $regex: req.params.image_id }},
      function (err, image) {
        if (!err && image) {
          var newComment = new Models.Comment(req.body);
          newComment.gravatar = md5(newComment.email);
          newComment.image_id = image._id;
          newComment.save(function (err, comment) {
            if (err) throw err;
            res.redirect('/images/' + image.uniqueId + '#' + comment._id);
          });
        } else {
          res.redirect('/');
        }
      }
    );
  },
  remove: function (req, res) {
    Models.Image.findOne(
      { filename: { $regex: req.params.image_id }},
      function (err, image) {
        if (err) throw err;
        fs.unlink(path.resolve('./public/upload/' + image.filename), function (err) {
          if (err) throw err;
          Models.Comment.remove({ image_id: image._id}, function (err) {
            image.remove(function (err) {
              if (!err) {
                res.json(true);
              } else {
                res.json(false);
              }
            });
          });
        });
      }
    );
  }
};
