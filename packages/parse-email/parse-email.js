module.exports = function(request, response, options){

  var primaryDomain = options.primaryDomain,
      configObject  = options.emailConfig,
      dataObject    = options.emailData;

  var deferred      = new Parse.Promise();

  var Mandrill = require('mandrill');
  Mandrill.initialize('X7_fibq-tCUbHXVe4cfNVw');

  var fs       = require('fs');
  var Mustache = require('cloud/node_modules/mustache/mustache');
  var template = fs.readFileSync(configObject.templateFile, 'utf8');

  var html = Mustache.render(template, dataObject);
  html = html.replace(/\/images\//ig, configObject.imageFixUrl);

  Mandrill.sendEmail({
    message: {
      html: html,
      subject: configObject.emailSubject,
      from_email: configObject.fromEmail,
      from_name: configObject.fromName,
      to: [
        {
          email: dataObject.receiverEmail,
          name: dataObject.receiverName
        }
      ]
    },
    async: true
  }, {
    success: function(httpResponse) {
      // console.log('SUCCESS');
      // console.log(httpResponse);
      deferred.resolve(httpResponse);
      // response.success();
    },
    error: function(httpResponse) {
      // console.error('ERROR');
      // console.log(httpResponse);
      deferred.resolve(httpResponse);
      // response.success();
    }
  });
  return deferred;
};
