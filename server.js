var express = require('express');
var mongoose = require('mongoose');
var path = require('path');

var config = require('./server/configure');

app = express();

app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));

app = config(app);
mongoose.connect('mongodb://localhost/imgPloadr');
mongoose.connection.on('open', function () {
  console.log('Mongoose connected.');
});

app.listen(app.get('port'), function () {
    console.log('Server up: http://localhost:' + app.get('port'));
});
