'use strict';

var mongoose = require('mongoose'),
    Product = mongoose.model('Product'),
    User = mongoose.model('User'),
    constantsObj = require('./../../constants'),
    Response = require('../lib/response.js'),
    util = require('util'),
    fs = require('fs-extra'),
    path = require('path'),
    async = require('async'),
    validator = require('validator'),
    utility = require('../lib/utility.js'),
    co = require('co'),
    config = require('../../config/config.js');


var stripe = require("stripe")("sk_test_3cqt1vfQLQaqXe8DT9MSQoeH"); /*test account*/

module.exports = {
    verifyStripeAccount: verifyStripeAccount
}

/**
 * Function is use to verify stripe account
 * @access private
 * @return json
 * Created by Udit
 * @smartData Enterprises (I) Ltd
 * Created Date 21-March-2017
 */
function verifyStripeAccount(req) {
    co(function*() {
        let userData = yield User.findById(req.user._id);
        console.log(userData, 'userDatauserDatauserData');
        if (!userData) {
            // throw {errors: [{message: constantsObj.validationMessages.userNotFound}]};
            return Promise.reject({errors: [{message: constantsObj.validationMessages.userNotFound}]});
        } else {
            var d = new Date();
            var currentYear = d.getFullYear();
            var splitDob = req.body.dob.split("-");
            if (splitDob[2] == currentYear) {
                throw {errors: [{message: 'Birth year should be greater than current year.'}]};
            } else {
                if (!userData.stripe_account_id) {
                    let stripeAccount = yield stripe.accounts.create({managed: true, country: 'US', email: userData.email});
                    console.log(stripeAccount, 'stripeAccountstripeAccountstripeAccount');
                    userData = stripeAccount.id;
                    userData = yield userData.save();
                }

                let customer = yield stripe.accounts.update(userData.stripe_account_id, {
                    "external_account": {
                        "object": "bank_account",
                        "account_number": req.body.account_number,
                        "country": req.body.country,
                        "currency": "usd",
                        "account_holder_type": "individual",
                        "routing_number": req.body.routing_number, //"110000000"
                        "email": userData.email,
                        //"statement_descriptor":'Pick purchased'
                    },
                    "legal_entity": {
                        "address": {
                            "city": req.body.city,
                            "country": req.body.country,
                            "line1": req.body.address,
                            "postal_code": req.body.postal_code,
                            "state": req.body.state
                        },
                        "dob": {
                            "day": splitDob[0],
                            "month": splitDob[1],
                            "year": splitDob[2]
                        },
                        "business_name": 'Prodigy League',
                        "first_name": req.body.first_name,
                        "last_name": req.body.last_name,
                        "ssn_last_4": req.body.ssn_last_4,
                        "type": "individual"
                    },
                    "tos_acceptance": {
                        "date": Math.floor(new Date().valueOf() / 1000),
                        "ip": req.connection.remoteAddress,
                        "user_agent": null
                    }
                });
                return customer;
            }
        }


    }).catch(function(err) {
        console.log(err, '---------------');
        var errMsg = utility.validationErrorHandler(err);
        if (err) {
            if (err.raw) {
                errMsg = err && err.raw && err.raw.message ? err.raw.message : "Something went wrong, Please try again";
            }
        }
        return res.json({ code: 402, message: errMsg, data: {} });
    });
}