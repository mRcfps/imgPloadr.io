var express = require('express');
var path = require('path');

var config = require('./server/configure');

app = express();

app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));

app = config(app);

app.listen(app.get('port'), function () {
    console.log('Server up: http://localhost:' + app.get('port'));
});
