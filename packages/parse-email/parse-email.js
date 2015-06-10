module.exports = function(request, response, options){

  var primaryDomain = options.primaryDomain,
      configObject  = options.emailConfig,
      dataObject    = options.emailData;

  var deferred      = new Parse.Promise();

  var Mandrill = Parse.require('mandrill');
  Mandrill.initialize(configObject.apiKey);

  var fs       = Parse.require('fs');
  var Mustache = require('mustache');
  var template = fs.readFileSync(configObject.templateFile, 'utf8');

  var html = Mustache.render(template, dataObject);
  html = html.replace(/\/images\//ig, configObject.imageFixUrl);

  Mandrill.sendEmail({
    message: {
      html: html,
      subject: configObject.emailSubject,
      from_name: configObject.from.name,
      from_email: configObject.from.email,
      to: configObject.to
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
