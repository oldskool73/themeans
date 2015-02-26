'use strict';
/**
   This component is responsible for create a Parse User, Profile, & Settings
   on account creation.
   @Parse (required): the parse object from the sdk on the parse server
   @beforeProfileSave (required): a function that returns a promise
   @beforeSettingsSave (required): a function that returns a promise
**/

function createAccount(Parse, beforeProfileSave, beforeSettingsSave){

  this.beforeUserSave = function(user){
    var deferred = new Parse.Promise();

    createProfile(user)
    .then(function(profile) {
      createProfileSettings(profile)
      .then(function(settings) {

        var parseSettings = settings;

        setSettingsPointerToProfile(profile, parseSettings)
        .then(function(){

          user.set('profile', profile);

          deferred.resolve(user);

        }, fail);

      }, fail);

    }, fail);

    function fail(err){
      console.log(err);
      deferred.reject(err);
    }

    return deferred;
  };

  this.afterUserSave = setProfileUserPointer;


  function createProfile(user) {
    var Profile   = Parse.Object.extend('Profile'),
        profile   = new Profile(),
        deferred  = new Parse.Promise();

    beforeProfileSave(profile, user)
    .then(function(profile){
      profile.save(profile, {
        success: function(response) {
          // The object was saved successfully.
          deferred.resolve(response);
        },
        error: function(response, error) {
          deferred.reject(error);
        }
      });
    },function(err){
      deferred.reject(err);
    });

    return deferred;
  }

  function createProfileSettings(parseProfile) {

    var Settings = Parse.Object.extend('Settings'),
        settings = new Settings(),
        deferred = new Parse.Promise();

    beforeSettingsSave(settings)
    .then(function (settings){
      settings.set('profile', parseProfile);
      settings.save({
        success: function (response) {
          deferred.resolve(response);
        },
        error: function (response, err) {
          deferred.reject(err);
        }
      });
    },function(err){
      deferred.reject(err);
    });

    return deferred;
  }

  function setSettingsPointerToProfile(parseProfile, parseSettings) {
    var deferred = new Parse.Promise();

    parseProfile.set('settings', parseSettings);
    parseProfile.save({
      success: function (response) {
        deferred.resolve(response);
      },
      error: function (response, err) {
        deferred.reject(err);
      }
    });

    return deferred;
  }

  function setProfileUserPointer(parseUser, parseProfile) {
    var deferred = new Parse.Promise();

    parseProfile.set('user', parseUser);
    parseProfile.save(null, {
      success: function (response) {
        deferred.resolve(response);
      },
      error: function (response, error) {
        deferred.reject(error);
      }
    });

    return deferred;
  }

  return this;
}

module.exports = function(Parse, beforeProfileSave, beforeSettingsSave){
  return new createAccount(Parse, beforeProfileSave, beforeSettingsSave);
};
