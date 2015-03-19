// modeled after: angular.js/test/ng/directive/ngIncludeSpec.js
describe('tm.parse', function() {
  'use strict';

  var Model, tmParse, $window, globalParse = window.Parse;

  beforeEach(function(){
    module('tm.parse');
    module(function(ParseProvider){
      ParseProvider.configure({
        applicationId: 'id',
        javaScriptKey: 'key',
        deps:['$q','$window']
      });
    });

    inject(function(_Parse_, _$window_){
       tmParse = _Parse_;
       $window = _$window_;
       $window.Parse = globalParse;
       Model = tmParse.Object.extend('Model');
    });
  });

  describe('Serialization',function(){

    it('should serialize a simple object', function(){
      var out = new Model({
        name: 'name'
      });
      
      expect(function(){
        out.getNgModel();
      }).not.toThrow();
    });

    it('should serialize an object with null values', function(){
      var out = new Model({
        name: 'name',
        location: null
      });
      
      expect(function(){
        out.getNgModel();
      }).not.toThrow();
    });

    it('should serilize a nested object', function(){
        var ChildModel = tmParse.Object.extend('ChildModel');

        var out = new Model({
          name:'name',
          child: new ChildModel({objectId:'hash',name:'child-name'})
        });

        expect(function(){
          out.getNgModel();
          out.get('child').getNgModel();
        }).not.toThrow();
        expect(out.get('child').getNgModel().name).toBe('child-name');
    });

    it('should not serilize a nested unsaved object', function(){
        var ChildModel = tmParse.Object.extend('ChildModel');

        var out = new Model({
          name:'name',
          child: new ChildModel({name:'child-name'})
        });

        expect(function(){
          out.getNgModel();
        }).toThrow('Can\'t serialize an unsaved Parse.Object');
    });

    it('should not serialize a nested unsaved file', function(){
        var data = {base64: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'};

        var out = new Model({
          name:'name',
          img: new tmParse.File('new-file-name',data)
        });

        expect(function(){
          out.getNgModel();
        }).toThrow('Tried to save an object containing an unsaved file.');
    });

    it('should serilize and deserialize a nested parse geopoint', function(){
        var tmp = new Model({
          name:'name',
          child: new tmParse.GeoPoint({latitude: 40.0, longitude: -30.0})
        });

        expect(tmp.getNgModel().child._latitude).toBe(40.0);

        var out = new Model(tmp.getNgModel(),{
          ngModel:true,
          resetOpsQueue:true
        });

        expect(out.get('child').kilometersTo(new tmParse.GeoPoint(30, 30))).toBe(5473.481602842825);
        expect(out.getNgModel().child._latitude).toBe(40.0);
    });

  });


  describe('Deserialization',function(){

    it('should deserilize a simple object', function(){
      var out = new Model({
        className: 'Model',
        name:'name'
      },{
        ngModel: true,
        resetOpsQueue: true
      });
      
      expect(out).toBeDefined();
    });

    it('should deserilize an object with null values', function(){
      var out = new Model({
        className: 'Model',
        name:'name',
        location: null
      },{
        ngModel: true,
        resetOpsQueue: true
      });

      expect(out.get('name')).toBe('name');
    });

    it('should deserilize a nested object', function(){
      var out = new Model({
        className: 'Model',
        name: 'name',
        child: {
          className: 'ChildModel',
          name: 'child-name'
        }
      },{
        ngModel: true,
        resetOpsQueue: true
      });

      expect(out.get('name')).toBe('name');
      expect(out.get('child').get('name')).toBe('child-name');
    });

    it('should preserve a nested parse object on deserialization', function(){
      var ChildModel = tmParse.Object.extend('ChildModel');

      var out = new Model({
        className: 'Model',
        name:'name',
        child: new ChildModel({objectId: 'hash', name:'child-name'})
      },{
        ngModel: true,
        resetOpsQueue: true
      });

      expect(function(){
        out.getNgModel();
        out.get('child').getNgModel();
      }).not.toThrow();
      expect(out.get('child').get('name')).toBe('child-name');
    });

    // TODO: There is a case which throws and error:
    // Check Creem origin/master #8a33a7c controllers/settings.js for an example
    it('shouldn\'t throw an error if you save a nested file from cache', function(){
      var ChildModel = tmParse.Object.extend('ChildModel');

      var out = new Model({
        className: 'Model',
        name:'name',
        file: {
          '__type':'File',
          'name':'parse-image',
          'url':'http://files.parsetfss.com/parse-image'
        },
        geopoint: {
          '__type': 'GeoPoint',
          'latitude': 40,
          'longitude': -30
        },
        child: new ChildModel({objectId: 'hash', name:'child-name'})
      },{
        ngModel:true,
        resetOpsQueue:false
      });

      expect(function(){
        out.save();
      }).not.toThrow();
    });

    it('should deserilize a nested serialized parse file', function(){
      var out = new Model({
        className: 'Model',
        name:'name',
        child: {
          '__type':'File',
          'name':'parse-image',
          'url':'http://files.parsetfss.com/parse-image'
        }
      },{
        ngModel:true,
        resetOpsQueue: false
      });

      expect(out.get('child').url()).toBe('http://files.parsetfss.com/parse-image');
    });

    it('should deserilize a nested serialized parse geopoint', function(){
        var out = new Model({
          className: 'Model',
          name:'name',
          child: {
            '__type': 'GeoPoint',
            'latitude': 40,
            'longitude': -30
          }
        },{
          ngModel:true,
          resetOpsQueue: false
        });

        expect(function(){
          out.getNgModel();
        }).not.toThrow();
        expect(out.get('child')._longitude).toBe(-30.0);
    });

  });

});