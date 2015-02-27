if(typeof Parse.require === "undefined"){Parse.require = require;}(function (global) {
    function require(file, parentModule) {
        if ({}.hasOwnProperty.call(require.cache, file))
            return require.cache[file];
        var resolved = require.resolve(file);
        if (!resolved)
            throw new Error('Failed to resolve module ' + file);
        var module$ = {
                id: file,
                require: require,
                filename: file,
                exports: {},
                loaded: false,
                parent: parentModule,
                children: []
            };
        if (parentModule)
            parentModule.children.push(module$);
        var dirname = file.slice(0, file.lastIndexOf('/') + 1);
        require.cache[file] = module$.exports;
        resolved.call(module$.exports, module$, module$.exports, dirname, file);
        module$.loaded = true;
        return require.cache[file] = module$.exports;
    }
    require.modules = {};
    require.cache = {};
    require.resolve = function (file) {
        return {}.hasOwnProperty.call(require.modules, file) ? require.modules[file] : void 0;
    };
    require.define = function (file, fn) {
        require.modules[file] = fn;
    };
    require.define('/packages/parse-create-account/parse-create-account.js', function (module, exports, __dirname, __filename) {
        'use strict';
        function createAccount(Parse, beforeProfileSave, beforeSettingsSave) {
            this.beforeUserSave = function (user) {
                var deferred = new Parse.Promise();
                createProfile(user).then(function (profile) {
                    createProfileSettings(profile).then(function (settings) {
                        var parseSettings = settings;
                        setSettingsPointerToProfile(profile, parseSettings).then(function () {
                            user.set('profile', profile);
                            deferred.resolve(user);
                        }, fail);
                    }, fail);
                }, fail);
                function fail(err) {
                    console.log(err);
                    deferred.reject(err);
                }
                return deferred;
            };
            this.afterUserSave = setProfileUserPointer;
            function createProfile(user) {
                var Profile = Parse.Object.extend('Profile'), profile = new Profile(), deferred = new Parse.Promise();
                beforeProfileSave(profile, user).then(function (profile) {
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
            function createProfileSettings(parseProfile) {
                var Settings = Parse.Object.extend('Settings'), settings = new Settings(), deferred = new Parse.Promise();
                beforeSettingsSave(settings).then(function (settings) {
                    settings.set('profile', parseProfile);
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
        module.exports = function (Parse, beforeProfileSave, beforeSettingsSave) {
            return new createAccount(Parse, beforeProfileSave, beforeSettingsSave);
        };
    });
    global.exports = require('/packages/parse-create-account/parse-create-account.js');
}.call(this, module));