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
    require.define('/packages/parse-email/parse-email.js', function (module, exports, __dirname, __filename) {
        module.exports = function (request, response, options) {
            var primaryDomain = options.primaryDomain, configObject = options.emailConfig, dataObject = options.emailData;
            var deferred = new Parse.Promise();
            var Mandrill = Parse.require('mandrill');
            Mandrill.initialize('X7_fibq-tCUbHXVe4cfNVw');
            var fs = Parse.require('fs');
            var Mustache = require('/node_modules/mustache/mustache.js', module);
            var template = fs.readFileSync(configObject.templateFile, 'utf8');
            var html = Mustache.render(template, dataObject);
            html = html.replace(/\/images\//gi, configObject.imageFixUrl);
            Mandrill.sendEmail({
                message: {
                    html: html,
                    subject: configObject.emailSubject,
                    from_email: configObject.fromEmail,
                    from_name: configObject.fromName,
                    to: [{
                            email: dataObject.receiverEmail,
                            name: dataObject.receiverName
                        }]
                },
                async: true
            }, {
                success: function (httpResponse) {
                    deferred.resolve(httpResponse);
                },
                error: function (httpResponse) {
                    deferred.resolve(httpResponse);
                }
            });
            return deferred;
        };
    });
    require.define('/node_modules/mustache/mustache.js', function (module, exports, __dirname, __filename) {
        (function (global, factory) {
            if (typeof exports === 'object' && exports) {
                factory(exports);
            } else if (typeof define === 'function' && define.amd) {
                define(['exports'], factory);
            } else {
                factory(global.Mustache = {});
            }
        }(this, function (mustache) {
            var Object_toString = Object.prototype.toString;
            var isArray = Array.isArray || function (object) {
                    return Object_toString.call(object) === '[object Array]';
                };
            function isFunction(object) {
                return typeof object === 'function';
            }
            function escapeRegExp(string) {
                return string.replace(/[\-\[\]{}()*+?.,\\\^$|#\s]/g, '\\$&');
            }
            var RegExp_test = RegExp.prototype.test;
            function testRegExp(re, string) {
                return RegExp_test.call(re, string);
            }
            var nonSpaceRe = /\S/;
            function isWhitespace(string) {
                return !testRegExp(nonSpaceRe, string);
            }
            var entityMap = {
                    '&': '&amp;',
                    '<': '&lt;',
                    '>': '&gt;',
                    '"': '&quot;',
                    '\'': '&#39;',
                    '/': '&#x2F;'
                };
            function escapeHtml(string) {
                return String(string).replace(/[&<>"'\/]/g, function (s) {
                    return entityMap[s];
                });
            }
            var whiteRe = /\s*/;
            var spaceRe = /\s+/;
            var equalsRe = /\s*=/;
            var curlyRe = /\s*\}/;
            var tagRe = /#|\^|\/|>|\{|&|=|!/;
            function parseTemplate(template, tags) {
                if (!template)
                    return [];
                var sections = [];
                var tokens = [];
                var spaces = [];
                var hasTag = false;
                var nonSpace = false;
                function stripSpace() {
                    if (hasTag && !nonSpace) {
                        while (spaces.length)
                            delete tokens[spaces.pop()];
                    } else {
                        spaces = [];
                    }
                    hasTag = false;
                    nonSpace = false;
                }
                var openingTagRe, closingTagRe, closingCurlyRe;
                function compileTags(tags) {
                    if (typeof tags === 'string')
                        tags = tags.split(spaceRe, 2);
                    if (!isArray(tags) || tags.length !== 2)
                        throw new Error('Invalid tags: ' + tags);
                    openingTagRe = new RegExp(escapeRegExp(tags[0]) + '\\s*');
                    closingTagRe = new RegExp('\\s*' + escapeRegExp(tags[1]));
                    closingCurlyRe = new RegExp('\\s*' + escapeRegExp('}' + tags[1]));
                }
                compileTags(tags || mustache.tags);
                var scanner = new Scanner(template);
                var start, type, value, chr, token, openSection;
                while (!scanner.eos()) {
                    start = scanner.pos;
                    value = scanner.scanUntil(openingTagRe);
                    if (value) {
                        for (var i = 0, valueLength = value.length; i < valueLength; ++i) {
                            chr = value.charAt(i);
                            if (isWhitespace(chr)) {
                                spaces.push(tokens.length);
                            } else {
                                nonSpace = true;
                            }
                            tokens.push([
                                'text',
                                chr,
                                start,
                                start + 1
                            ]);
                            start += 1;
                            if (chr === '\n')
                                stripSpace();
                        }
                    }
                    if (!scanner.scan(openingTagRe))
                        break;
                    hasTag = true;
                    type = scanner.scan(tagRe) || 'name';
                    scanner.scan(whiteRe);
                    if (type === '=') {
                        value = scanner.scanUntil(equalsRe);
                        scanner.scan(equalsRe);
                        scanner.scanUntil(closingTagRe);
                    } else if (type === '{') {
                        value = scanner.scanUntil(closingCurlyRe);
                        scanner.scan(curlyRe);
                        scanner.scanUntil(closingTagRe);
                        type = '&';
                    } else {
                        value = scanner.scanUntil(closingTagRe);
                    }
                    if (!scanner.scan(closingTagRe))
                        throw new Error('Unclosed tag at ' + scanner.pos);
                    token = [
                        type,
                        value,
                        start,
                        scanner.pos
                    ];
                    tokens.push(token);
                    if (type === '#' || type === '^') {
                        sections.push(token);
                    } else if (type === '/') {
                        openSection = sections.pop();
                        if (!openSection)
                            throw new Error('Unopened section "' + value + '" at ' + start);
                        if (openSection[1] !== value)
                            throw new Error('Unclosed section "' + openSection[1] + '" at ' + start);
                    } else if (type === 'name' || type === '{' || type === '&') {
                        nonSpace = true;
                    } else if (type === '=') {
                        compileTags(value);
                    }
                }
                openSection = sections.pop();
                if (openSection)
                    throw new Error('Unclosed section "' + openSection[1] + '" at ' + scanner.pos);
                return nestTokens(squashTokens(tokens));
            }
            function squashTokens(tokens) {
                var squashedTokens = [];
                var token, lastToken;
                for (var i = 0, numTokens = tokens.length; i < numTokens; ++i) {
                    token = tokens[i];
                    if (token) {
                        if (token[0] === 'text' && lastToken && lastToken[0] === 'text') {
                            lastToken[1] += token[1];
                            lastToken[3] = token[3];
                        } else {
                            squashedTokens.push(token);
                            lastToken = token;
                        }
                    }
                }
                return squashedTokens;
            }
            function nestTokens(tokens) {
                var nestedTokens = [];
                var collector = nestedTokens;
                var sections = [];
                var token, section;
                for (var i = 0, numTokens = tokens.length; i < numTokens; ++i) {
                    token = tokens[i];
                    switch (token[0]) {
                    case '#':
                    case '^':
                        collector.push(token);
                        sections.push(token);
                        collector = token[4] = [];
                        break;
                    case '/':
                        section = sections.pop();
                        section[5] = token[2];
                        collector = sections.length > 0 ? sections[sections.length - 1][4] : nestedTokens;
                        break;
                    default:
                        collector.push(token);
                    }
                }
                return nestedTokens;
            }
            function Scanner(string) {
                this.string = string;
                this.tail = string;
                this.pos = 0;
            }
            Scanner.prototype.eos = function () {
                return this.tail === '';
            };
            Scanner.prototype.scan = function (re) {
                var match = this.tail.match(re);
                if (!match || match.index !== 0)
                    return '';
                var string = match[0];
                this.tail = this.tail.substring(string.length);
                this.pos += string.length;
                return string;
            };
            Scanner.prototype.scanUntil = function (re) {
                var index = this.tail.search(re), match;
                switch (index) {
                case -1:
                    match = this.tail;
                    this.tail = '';
                    break;
                case 0:
                    match = '';
                    break;
                default:
                    match = this.tail.substring(0, index);
                    this.tail = this.tail.substring(index);
                }
                this.pos += match.length;
                return match;
            };
            function Context(view, parentContext) {
                this.view = view == null ? {} : view;
                this.cache = { '.': this.view };
                this.parent = parentContext;
            }
            Context.prototype.push = function (view) {
                return new Context(view, this);
            };
            Context.prototype.lookup = function (name) {
                var cache = this.cache;
                var value;
                if (name in cache) {
                    value = cache[name];
                } else {
                    var context = this, names, index;
                    while (context) {
                        if (name.indexOf('.') > 0) {
                            value = context.view;
                            names = name.split('.');
                            index = 0;
                            while (value != null && index < names.length)
                                value = value[names[index++]];
                        } else if (typeof context.view == 'object') {
                            value = context.view[name];
                        }
                        if (value != null)
                            break;
                        context = context.parent;
                    }
                    cache[name] = value;
                }
                if (isFunction(value))
                    value = value.call(this.view);
                return value;
            };
            function Writer() {
                this.cache = {};
            }
            Writer.prototype.clearCache = function () {
                this.cache = {};
            };
            Writer.prototype.parse = function (template, tags) {
                var cache = this.cache;
                var tokens = cache[template];
                if (tokens == null)
                    tokens = cache[template] = parseTemplate(template, tags);
                return tokens;
            };
            Writer.prototype.render = function (template, view, partials) {
                var tokens = this.parse(template);
                var context = view instanceof Context ? view : new Context(view);
                return this.renderTokens(tokens, context, partials, template);
            };
            Writer.prototype.renderTokens = function (tokens, context, partials, originalTemplate) {
                var buffer = '';
                var token, symbol, value;
                for (var i = 0, numTokens = tokens.length; i < numTokens; ++i) {
                    value = undefined;
                    token = tokens[i];
                    symbol = token[0];
                    if (symbol === '#')
                        value = this._renderSection(token, context, partials, originalTemplate);
                    else if (symbol === '^')
                        value = this._renderInverted(token, context, partials, originalTemplate);
                    else if (symbol === '>')
                        value = this._renderPartial(token, context, partials, originalTemplate);
                    else if (symbol === '&')
                        value = this._unescapedValue(token, context);
                    else if (symbol === 'name')
                        value = this._escapedValue(token, context);
                    else if (symbol === 'text')
                        value = this._rawValue(token);
                    if (value !== undefined)
                        buffer += value;
                }
                return buffer;
            };
            Writer.prototype._renderSection = function (token, context, partials, originalTemplate) {
                var self = this;
                var buffer = '';
                var value = context.lookup(token[1]);
                function subRender(template) {
                    return self.render(template, context, partials);
                }
                if (!value)
                    return;
                if (isArray(value)) {
                    for (var j = 0, valueLength = value.length; j < valueLength; ++j) {
                        buffer += this.renderTokens(token[4], context.push(value[j]), partials, originalTemplate);
                    }
                } else if (typeof value === 'object' || typeof value === 'string') {
                    buffer += this.renderTokens(token[4], context.push(value), partials, originalTemplate);
                } else if (isFunction(value)) {
                    if (typeof originalTemplate !== 'string')
                        throw new Error('Cannot use higher-order sections without the original template');
                    value = value.call(context.view, originalTemplate.slice(token[3], token[5]), subRender);
                    if (value != null)
                        buffer += value;
                } else {
                    buffer += this.renderTokens(token[4], context, partials, originalTemplate);
                }
                return buffer;
            };
            Writer.prototype._renderInverted = function (token, context, partials, originalTemplate) {
                var value = context.lookup(token[1]);
                if (!value || isArray(value) && value.length === 0)
                    return this.renderTokens(token[4], context, partials, originalTemplate);
            };
            Writer.prototype._renderPartial = function (token, context, partials) {
                if (!partials)
                    return;
                var value = isFunction(partials) ? partials(token[1]) : partials[token[1]];
                if (value != null)
                    return this.renderTokens(this.parse(value), context, partials, value);
            };
            Writer.prototype._unescapedValue = function (token, context) {
                var value = context.lookup(token[1]);
                if (value != null)
                    return value;
            };
            Writer.prototype._escapedValue = function (token, context) {
                var value = context.lookup(token[1]);
                if (value != null)
                    return mustache.escape(value);
            };
            Writer.prototype._rawValue = function (token) {
                return token[1];
            };
            mustache.name = 'mustache.js';
            mustache.version = '1.1.0';
            mustache.tags = [
                '{{',
                '}}'
            ];
            var defaultWriter = new Writer();
            mustache.clearCache = function () {
                return defaultWriter.clearCache();
            };
            mustache.parse = function (template, tags) {
                return defaultWriter.parse(template, tags);
            };
            mustache.render = function (template, view, partials) {
                return defaultWriter.render(template, view, partials);
            };
            mustache.to_html = function (template, view, partials, send) {
                var result = mustache.render(template, view, partials);
                if (isFunction(send)) {
                    send(result);
                } else {
                    return result;
                }
            };
            mustache.escape = escapeHtml;
            mustache.Scanner = Scanner;
            mustache.Context = Context;
            mustache.Writer = Writer;
        }));
    });
    global.exports = require('/packages/parse-email/parse-email.js');
}.call(this, module));