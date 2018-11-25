'use strict';

var jwt = require('jsonwebtoken'),
    constantsObj = require('./../../constants'),
    mongoose = require('mongoose'),
    User = mongoose.model('User'),
    Admin = mongoose.model('Admin'),
    config = require('../../config/config.js');
module.exports = {
    ensureAuthorized: ensureAuthorized
}

function ensureAuthorized(req, res, next) {
    var unauthorizedJson = {code: 401, 'message': 'Unauthorized', data: {}};
    if (req.headers.authorization) {
        var token = req.headers.authorization;
        var splitToken = token.split(' ');
        try {
            token = splitToken[1];
            var decoded = jwt.verify(token, constantsObj.config.secret);
            if (splitToken[0] == 'admin_bearer') {
                req.user = decoded;
                Admin.findById(req.user.uid).exec(function(err, admin) {
                    if (err)
                        res.json(unauthorizedJson);
                    else if (!admin)
                          User.findById(req.user.uid).exec(function(err, admin) {
                            next();
                          });  
                    else
                        next();
                });
            } else if (splitToken[0] == 'Bearer') {
                req.user = decoded;
                User.findById(req.user.id,{ deleted: false }).exec(function(err, user) {
                    if (err || !user) {
                        res.json(unauthorizedJson);
                    } else {
                        req.user = user;
                        next();
                    }
                });
            } else {
                res.json(unauthorizedJson);
            }
        } catch (err) {
            console.log('err', err);
            res.json(unauthorizedJson);
        }
    } else {
        // throw err;
        res.json(unauthorizedJson);
    }
}
