'use strict';
var mongoose = require('mongoose'),
    utility = require('../lib/utility.js');
var Schema = mongoose.Schema;
var AdminSchema = new mongoose.Schema({
    firstname: { type: String },
    lastname: { type: String },
    email: { type: String, required: true},
    role: {type: mongoose.Schema.Types.ObjectId, ref: 'Role'},
    password: { type: String, require: true},
    access_token: [{ type: String}],
    profile_image: { type: String},
});

var Admin = mongoose.model('Admin', AdminSchema);
module.exports = Admin;

Admin.find({}).exec(function(err, data) {
	if (data.length == 0) {
		Admin({firstname : 'neo', lastname: 'book', email : 'admin.neo@yopmail.com', password : utility.getEncryptText('Asdf!234')}).save(function(err, adminData){
		});
	}
});		
