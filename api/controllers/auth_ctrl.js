'use strict';
var mongoose = require('mongoose'),
    Admin = mongoose.model('Admin'),
    User = mongoose.model('User'),
    formidable = require('formidable'),
    jwt = require('jsonwebtoken'),
    validator = require('validator'),
    Response = require('../lib/response.js'),
    utility = require('../lib/utility.js'),
    co = require('co'),
    constantsObj = require('./../../constants'),
    common = require('../../config/common.js');

module.exports = {
  userRegister: userRegister,
  userLogin: userLogin,
  forgotPassword: forgotPassword,
  verifyLink:verifyLink,
  getuserProfile:getuserProfile,
  uploadImage:uploadImage

};

function userRegister(req, res) {
  if (!req.body.firstname || !req.body.lastname || !req.body.email || !req.body.password) {
    return res.json(Response(402, "failed", constantsObj.validationMessages.requiredFieldsMissing));
  } else if (req.body.email && !validator.isEmail(req.body.email)) {
    return res.json(Response(402, "failed", constantsObj.validationMessages.invalidEmail));
  } else {
    User.existCheck(req.body.email, '', function (err, exist) {
      if (err) {
        return res.json(Response(500, "failed", constantsObj.validationMessages.internalError, err));
      } else {
        if (exist != true) {
          return res.json(Response(402, "failed", exist));
        } else {
          var date = new Date();
          var verifingLink = utility.getEncryptText(Math.random().toString(4).slice(2) + date.getTime());
          var obj = {
            firstname: req.body.firstname,
            lastname: req.body.lastname,
            email: req.body.email.toLowerCase(),
            password: utility.getEncryptText(req.body.password),
            verifying_token: verifingLink
          };
          new User(obj).save(function (err, userData) {
            if (err) {
              return res.json(Response(500, "failed", utility.validationErrorHandler(err), err));
            } else {
              var userMailData = { email: userData.email, firstname: userData.firstname, lastname: userData.lastname, verifying_token: userData.verifying_token, password: req.body.password };
              utility.readTemplateSendMail(userData.email, constantsObj.emailSubjects.verify_email, userMailData, 'verify_email', function (err, resp) { });
              return res.json(Response(200, "success", constantsObj.messages.signupSuccess, { _id: userData._id }));
            }
          });
        }
      }
    });
  }
}

function verifyLink(req, res) {  
  User.findOne({
      verifying_token: req.params.id,
      deleted:false
  }, function(err, user) {
      if (err || !user) {
          res.redirect("/admin/#/verifying-link?success=false");
      } else {
          if (!user) {
              res.redirect("/admin/#/verifying-link?success=verified");
          } else {
              user.status = 'Activate';
              user.verifying_token = null;
              user.save(function(err, data) {
                  if (err)
                      res.redirect("/admin/#/verifying-link?success=false");
                  else {
                      res.redirect("/admin/#/verifying-link?success=true");
                  }
              });
          }
      }

  })
}


function userLogin(req, res) {
  if (!req.body.email || !req.body.password) {
    return res.json(Response(402, "failed", constantsObj.validationMessages.requiredFieldsMissing));;
} else if (req.body.email && !validator.isEmail(req.body.email)) {
    return res.json(Response(402, "failed", constantsObj.validationMessages.invalidEmail));
} else {
        var jwtToken = null;
        var passEnc = utility.getEncryptText(req.body.password);
        var userData = {
            email: req.body.email.toLowerCase(),
            password: passEnc,
            deleted: false
        };
        User.findOne(userData, { password: 0,__v:0, updatedAt: 0, createdAt: 0, verifying_token: 0, deleted: 0,updatedAt: 0,saved_card: 0 ,is_stripe_acc_verified: 0})
            .exec(function(err, userInfo) {
                if (err) {
                    res.json({ code: 402, message: 'Request could not be processed. Please try again.', data: {} });
                } else {
                    if (userInfo != null) {
                        if (userInfo.status == 'Deactivate') {
                            res.json({ code: 402, message: 'Your account not activated yet.', data: {} });
                        } else if (userInfo.deleted == true) {
                            res.json({ code: 402, message: 'Your account has been deleted.', data: {} });
                        } else {
                            var expirationDuration = 1000 * 60 * 60 * 48 * 2; 
                            var params = {
                                id: userInfo._id
                            }
                            jwtToken = jwt.sign(params, constantsObj.config.secret, {
                                expiresIn: expirationDuration
                            });
                            let token = 'Bearer ' + jwtToken;
                            let userData={}
                             userData.token=token
                             userData.user=userInfo
                            return res.json({ code: 200, message: 'User info fetched successfully.', data: userData });
                        }
                    } else {
                        res.json({ code: 402, message: 'User email or password are not correct.', data: {} });
                    }

                }
            });
        // }
    } 
}


function forgotPassword(req, res) {
  if (validator.isNull(req.body.email)) {
    return res.json(Response(402, "failed", constantsObj.validationMessages.requiredFieldsMissing));
} else {
    Admin.findOne({ "email": req.body.email }, function(err, adminData) {
        if (err) {
            return res.json(Response(500, "failed", constantsObj.validationMessages.internalError, err));
        } else {
            if (adminData) {
                if (req.body.email == adminData.email) {
                    var userMailData = { email: adminData.email, firstname: adminData.firstname, lastname: adminData.lastname, password: utility.getDecryptText(adminData.password)};
                    utility.readTemplateSendMail(adminData.email, constantsObj.emailSubjects.forgotPassword, userMailData, 'forgot_password', function(err, resp) {

                    });
                    return res.json(Response(200, "success", constantsObj.messages.forgotPasswordSuccess, {}));
                }
            } else {
                User.findOne({ "email": req.body.email }, function(err, userData) {
                    if (err) {
                        return res.json(Response(500, "failed", constantsObj.validationMessages.internalError, err));
                    } else {
                        if (!userData) {
                             return res.json({ code: 402, message: 'No Account found.', data: {} });
                        } else {
                            if (userData.email == req.body.email) {
                                if (userData.status == 'Deactivate') {
                                    return res.json({ code: 402, message: 'Your account not activated yet.', data: {} });
                                } else if (userData.deleted == true) {
                                    return res.json({ code: 402, message: 'Your account has been deleted.', data: {} });
                                }
                                var userMailData = { email: userData.email, firstname: userData.firstname, lastname: userData.lastname, password: utility.getDecryptText(userData.password)};
                                utility.readTemplateSendMail(userData.email, constantsObj.emailSubjects.forgotPassword, userMailData, 'forgot_password', function(err, resp) {

                                });
                                return res.json(Response(200, "success", constantsObj.messages.forgotPasswordSuccess, {}));
                            }
                        }

                    }
                })
            }
        }
    });
  }
}

function getuserProfile(req,res){
    let user = req.user;
    return res.json(user)
}


function uploadImage(req,res){
    co(function*(){
        var timestamp = Number(new Date());
        // var form = new formidable.IncomingForm();
        var file = req.swagger.params.file.value;
        var userId = req.user._id;
        var splitFile = file.originalname.split('.');
        var filename = +timestamp + '_' + common.randomToken(6) + '.'  + ((splitFile.length > 0) ? splitFile[splitFile.length - 1] : file.originalname);
        var imagePath = "./public/images/" + filename;
         let imageUploaded = yield utility.fileUpload(imagePath, file.buffer);
        let userData = yield User.findById(userId);
        if (userData) {
            let oldFileName = userData.profile_image;
            userData.profile_image = "/images/" + filename;
            let userUpdated = yield userData.save();
            if (oldFileName) {
                var fs = require('fs');
                var filePath =  oldFileName;
                fs.unlinkSync(filePath);
            }
            return res.json({ code: 200, message: 'User profile pic updated successfully.', data: { profile_image: "assets/uploads/" + filename}});
        } else {
            return res.json({ code: 402, message: 'User not found' , data:{}});
        }
    }).catch(function(err){
        console.log(err);
        res.json({ code: 402, 'message': 'Request could not be processed. Please try again.' , data: {}});        
    });
}

