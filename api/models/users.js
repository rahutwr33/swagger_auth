'use strict';

var mongoose = require('mongoose'),
        constantsObj = require('./../../constants');
var Schema = mongoose.Schema;

var UserSchema = new mongoose.Schema({
    customer_id:{type: String},
    company_name : {type: String},
    firstname: { type: String, required: [true, 'First name is required'], maxlength: [50, 'First name length should be less than or equal to 50 character'] },
    lastname: { type: String, required: [true, 'Last name is required'], maxlength: [50, 'Last name length should be less than or equal to 50 character'] },
    email: { type: String, required: [true, 'Email name is required'], maxlength: [50, 'Email length should be less than or equal to 50 character'] },
    password: { type: String, require: true },
    verifying_token: { type: String},
    role: {type: mongoose.Schema.Types.ObjectId, ref: 'Role'},
    parent_id: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
    stripe_customer_id: { type: String},//Stripe customer id
    is_stripe_acc_verified: { type: Boolean, default: false},//Quick bloq id
    profile_image: { type: String},
    stripe_status: { type: String},
    bill_amount:{type: String},
    initial_user :{type: String}, // 1=> Inital we allocate 5 users per registrat
    user_level:{type: String}, // 1=> Contrcator 2=> Sub Contrcator 3=> Sub Sub Contrcator
    availability:{type: String}, // 1=> Only Me 0=> Only Others
    expiry_date: {type:Date},
    reminder_date: {type:Date},
    trial_period:{
        type: Boolean,
        default: false
    },
     paid_status:{
        type: Boolean,
        default: false
    },
    saved_card: [{
        customer_id: { type: String},
        last4: { type: String},
        brand: { type: String}
    }],
    deviceInfo: [{
        deviceType: { type: String},
        deviceId: { type: String},
        deviceToken: { type: String},
        access_token: { type: String},
    }],
    status: { type: String, enum: ['Activate', 'Deactivate'], default: 'Deactivate' },
    deleted: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});


UserSchema.statics.existCheck = function(email, id, callback) {
    var where = {};
    if (id) {
        where = {
            $or: [ { email: new RegExp('^' + email + '$', "i") }], deleted: { $ne: true }, _id: { $ne: id }};
    } else {
        where = {$or: [ { email: new RegExp('^' + email + '$', "i") }], deleted: { $ne: true }};
    }
    User.findOne(where, function(err, userdata) {
        if (err) {
            callback(err)
        } else {
            if (userdata) {
                callback(null, constantsObj.validationMessages.emailAlreadyExist);
            } else {
                callback(null, true);
            }
        }
    });
};

UserSchema.statics.addDevice = function(email, id, callback) {
    
};

var User = mongoose.model('User', UserSchema);
module.exports = User;
    