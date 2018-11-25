'use strict';

// var constantsObj = require('./../../constants');
var fs = require("fs");
var path = require('path');
var schedule = require('node-schedule');
// var moment = require('moment');
var mongoose = require('mongoose');
var User = mongoose.model('User');
var Subscribe_amount = mongoose.model('Subscribe_amount');
var config = require('../../config/config.js');
var co = require('co');
var moment = require('moment');
var utility = require('../lib/utility.js');
var constantsObj = require('./../../constants');
var stripe = require("stripe")(config.STRIPEKEY); 

function chargeAmount() {
    co(function*() {
        // let userData = yield User.findById(req.user._id);
            let userAllData = yield User.find({trial_period: true,status: 'Activate', deleted: false});
            if (userAllData.length > 0) {
                for(let i = 0; i < userAllData.length; i++) {
                    var userData = userAllData[i];
                    var chargeAmount = parseFloat(userData.bill_amount).toFixed(2);
                    stripe.charges.create({
                      amount: Math.round(chargeAmount*100),
                      currency: "usd",
                      customer: userData.stripe_customer_id, // obtained with Stripe.js
                      description: "Charge for subscription plan"
                    }, function(err, charge) {
                        if(charge){
                           var model = new Subscribe_amount();
                            model.users_id = userData._id;
                            model.charge_id = charge.id;
                            model.amount = charge.amount;
                            model.payment_date = charge.created;
                            model.currency = charge.currency;
                            model.status = 'Paid';
                            model.save(function(err, paidData) {
                                if (err) {
                                    //return res.json(Response(500, "failed", utility.validationErrorHandler(err), {}));
                                    console.log('Err : ',err)
                                } else {
                                    console.log('Paid Done')
                                }
                            }); 
                        }
                      // asynchronously called
                    });
                }
            }

    }).catch(function(err) {
        console.log(err, '---------------');
        // return res.json({ code: 402, message: utility.validationErrorHandler(err), data: {} });
    });
}

function deactivateAccount() {
    co(function*() { 
         var now = moment().toDate();                 //(new Date((new Date()).getTime() - (1000*60*60*24*30)))
         let userAllData = yield User.find({trial_period: false,status: 'Activate', deleted: false});
        // console.log('deactivateAccount',userAllData);
         if (userAllData.length > 0) {
            for(let i = 0; i < userAllData.length; i++) {
                var userData = userAllData[i]; 
                let currentDate = moment().format('LL');
                let expiryDate = moment(userData.expiry_date, "MM-DD-YYYY").format('LL');
                console.log('Helloooo',userData.email);
                if(expiryDate === currentDate){
                    var model = new User();
                    model = userData;
                    model.status = "Deactivate";
                    model.save(function(err, paidData) {
                        if (err) {
                            console.log('Err : ',err)
                        } else {
                            var userMailData = { email: paidData.email, firstname: paidData.firstname, lastname: paidData.lastname };
                            utility.readTemplateSendMail(paidData.email, constantsObj.emailSubjects.verify_email, userMailData, 'subscription_plan', function(err, resp) {});
                        }
                    });
                }else{
                    console.log('Else');
                }
            }
            
         }   

    }).catch(function(err) {
        console.log(err, '---------------');
        // return res.json({ code: 402, message: utility.validationErrorHandler(err), data: {} });
    });
}

function reminderNotification() {
    co(function*() { 
         var now = moment().toDate();                 //(new Date((new Date()).getTime() - (1000*60*60*24*30)))
         let userAllData = yield User.find({trial_period: false,status: 'Activate', deleted: false});
         //console.log('userAllData',userAllData);
         if (userAllData.length > 0) {
            for(let i = 0; i < userAllData.length; i++) {
                var userData = userAllData[i]; 
                let currentDate = moment().format('LL');
                let reminderDate = moment(userData.reminder_date, "MM-DD-YYYY").format('LL');
               // console.log('Helloooowwww',userData.email);
                if(reminderDate === currentDate){
                   var userMailData = { email: userData.email, firstname: userData.firstname, lastname: userData.lastname };
                   utility.readTemplateSendMail(userData.email, constantsObj.emailSubjects.verify_email, userMailData, 'subscription_plan', function(err, resp) {});
                }else{
                    console.log('Else');
                }
            }
            
         }   

    }).catch(function(err) {
        console.log(err, '---------------');
        // return res.json({ code: 402, message: utility.validationErrorHandler(err), data: {} });
    });
}

schedule.scheduleJob('0 0 1 * *', function() {
    //console.log('Cron started');
    chargeAmount();

});

schedule.scheduleJob("30 * * * * *", function() {
    //console.log('Last Date');
    deactivateAccount();
    reminderNotification();
});