/**
 * This file is meant for giving the custom errors
 * params @status | @message | @description
 */

module.exports = function(code,status,message,data,token) {
  var response = {};

  response.code = code;
  response.status = status;
  response.message = message;
  response.data = data;
  // response.token = token;
  return response;
}
