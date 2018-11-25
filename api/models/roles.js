'use strict';

var mongoose = require('mongoose');

var rolesSchema = new mongoose.Schema({
    type:{type:String }, 
	code: {type: String},
	status: {type: String},
	isdeleted:{type:Boolean, default: false },
	created:{type: Date}, //created Date
	modified:{type: Date} //modified Date
});

var Role = mongoose.model('Role', rolesSchema);
module.exports = Role;