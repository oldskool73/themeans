'use strict';
/**
   This component is responsible for create a Parse User, Profile, & Settings
   on account creation.
   @Parse (required): the parse object from the sdk on the parse server
   @beforeProfileSave (required): a function that returns a promise
   @beforeSettingsSave (required): a function that returns a promise
**/

function CreateAccount(Parse, beforeProfileSave, beforeSettingsSave) {

    this.beforeUserSave = function (user) {
        var deferred = new Parse.Promise(),
            userACL  = new Parse.ACL();

        createProfile(user)
        .then(function (profile) {

            user.set('profile', profile);

            createSettings(user)
            .then(function (settings) {

                userACL.setPublicReadAccess(false);
                userACL.setPublicWriteAccess(false);

                user.set('settings', settings);
                user.setACL(userACL);

                deferred.resolve(user);

            },
            fail);
        },
        fail);
        function fail(err) {
            console.log(err);
            deferred.reject(err);
        }
        return deferred;
    };
    this.afterUserSave = function (user) {
        var deferred = new Parse.Promise();

        setUserPointersToProfile(user)
        .then(function (profile) {

            setSettingsUserPointer(user)
            .then(function (settings) {

                deferred.resolve(profile, settings);
            },
            deferred.reject);
        },
        deferred.reject);

        return deferred;
    };
    function createProfile(user) {
        var Profile     = Parse.Object.extend('Profile'),
            profile     = new Profile(),
            deferred    = new Parse.Promise();

        beforeProfileSave(profile, user)
        .then(function (profile) {

            profile.save(profile, {
                success: function (response) {
                    deferred.resolve(response);
                },
                error: function (response, error) {
                    deferred.reject(error);
                }
            });
        }, function (err) {
            deferred.reject(err);
        });
        return deferred;
    }
    function createSettings(user) {
        var Settings = Parse.Object.extend('Settings'),
            settings = new Settings(),
            deferred = new Parse.Promise();

        beforeSettingsSave(settings, user)
        .then(function (settings) {

            settings.save({
                success: function (response) {
                    deferred.resolve(response);
                },
                error: function (response, err) {
                    deferred.reject(err);
                }
            });
        }, function (err) {
            deferred.reject(err);
        });
        return deferred;
    }
    function setUserPointersToProfile(parseUser) {
        // REQUIRED: MasterKey is needed when settings a User as the ACL of another
        //////////// Parse object when _User class is locked down to public create only.
        Parse.Cloud.useMasterKey();
        var deferred        = new Parse.Promise(),
            parseProfileRef = parseUser.get('profile'),
            profileACL;

        parseProfileRef.fetch()
        .then(function (parseProfile){

            profileACL = parseProfile.getACL();

            if (!profileACL) {
                profileACL = new Parse.ACL();
            }

            profileACL.setReadAccess(parseUser, true);
            profileACL.setWriteAccess(parseUser, true);

            parseProfile.set('user', parseUser);
            parseProfile.setACL(profileACL);

            parseProfile.save(null, {
                success: function (response) {
                    deferred.resolve(response);
                },
                error: function (response, error) {
                    deferred.reject(error);
                }
            });
        },function (error) {
            deferred.reject(error);
        });

        return deferred;
    }
    function setSettingsUserPointer(parseUser) {
        // REQUIRED: MasterKey is needed when settings a User as the ACL of another
        //////////// Parse object when _User class is locked down to public create only.
        Parse.Cloud.useMasterKey();
        var deferred      = new Parse.Promise(),
            parseSettings = parseUser.get('settings'),
            settingsACL   = new Parse.ACL();

        settingsACL.setReadAccess(parseUser, true);
        settingsACL.setWriteAccess(parseUser, true);

        parseSettings.set('user', parseUser);
        parseSettings.setACL(settingsACL);

        parseSettings.save(null, {
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
module.exports = function (Parse, beforeProfileSave, beforeSettingsSave) {
    return new CreateAccount(Parse, beforeProfileSave, beforeSettingsSave);
};
