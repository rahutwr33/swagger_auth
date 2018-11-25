'use strict';

var SwaggerExpress = require('swagger-express-mw');
var app = require('express')();
var express = require('express');
var path = require('path');
var bodyParser = require('body-parser');
module.exports = app; // for testing
//custom files
require('./config/db');
var utils = require('./api/lib/util');
var config = {
    appRoot: __dirname // required config
};

app.use(bodyParser.json());
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));
app.use(express.static(path.join(__dirname, 'public')));

// app.get('/',(req,res)=>{
//     res.redirect('/docs')
// })


SwaggerExpress.create(config, function(err, swaggerExpress) {
    if (err) {
        throw err; 
}

    // All api requests
    app.use(function(req, res, next) {
        // CORS headers
        res.header("Access-Control-Allow-Origin", "*"); // restrict it to the required domain
        res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
        // Set custom headers for CORS
        res.header('Access-Control-Allow-Headers', 'Content-type,Accept,X-Access-Token,X-Key,If-Modified-Since,Authorization');

        if (req.method == 'OPTIONS') {
            res.status(200).end();
        } else {
            next();
        }
    });

    //Check to call web services where token is not required//
    app.use('/api/*', function(req, res, next) {
        var freeAuthPath = [
            '/api/userRegister',
            '/api/userLogin',
            '/api/forgotPassword'          
        ];
        var available = false;
        for (var i = 0; i < freeAuthPath.length; i++) {
            if (freeAuthPath[i] == req.baseUrl) {
                available = true;
                break;
            }
        }
        if (!available) {
            utils.ensureAuthorized(req, res, next);
        } else {
            next();
        }
    });

    // enable SwaggerUI
    app.use(swaggerExpress.runner.swaggerTools.swaggerUi());

    // install middleware
    swaggerExpress.register(app);

    var port = process.env.PORT || 3000;
    app.listen(port);


    if (swaggerExpress.runner.swagger.paths['/hello']) {
        console.log('try this:\ncurl http://127.0.0.1:' + port);
    }

    var authCtrl = require('./api/controllers/auth_ctrl');
    app.get('/auth/verifyLink/:id', function(req, res, next) {
        authCtrl.verifyLink(req, res);
    });


});
