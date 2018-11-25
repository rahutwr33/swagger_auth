'use strict';

var mongoose = require('mongoose');

/* DB */
var mongoose = require('mongoose');
require('../api/models/admin')
require('../api/models/users');
require('../api/models/roles');



mongoose.connect("mongodb://localhost:27017/swaggerauth");

mongoose.Promise = global.Promise;
var db = mongoose.connection;
db.on('error', console.error.bind(console, "connection failed"));
db.once('open', function() {
    console.log("Database conencted successfully!");
});
//mongoose.set('debug', true);

/* end DB */
