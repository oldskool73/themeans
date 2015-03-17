// modeled after: angular.js/test/ng/directive/ngIncludeSpec.js
describe('tm.parse', function() {
  'use strict';

  var Model, tmParse, $window, globalParse = window.Parse;

  beforeEach(function(){
    module('tm.parse');
    module(function(ParseProvider){
      ParseProvider.configure({
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

  // Serialization
  it('should serialize a simple object', function(){
    var out = new Model({
      name: 'name'
    });
    
    expect(function(){
      return out.getNgModel();
    }).not.toThrow();
  });

  // Deserialization
  it('should instantiate a simple object', function(){
    // Setup a default object
    var out = new Model({
      className: 'Model',
      name:null
    },{
      ngModel: true,
      resetOpsQueue: true
    });
    
    expect(out).toBeDefined();
  });

  it('should instantiate an object with null keys', function(){
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

  it('should instantiate an object with parse object children', function(){
      var ChildModel = tmParse.Object.extend('ChildModel'),
        child = new ChildModel({name:'child-name'});

      var out = new Model({
        name:'name',
        child: child.getNgModel()
      },{
        ngModel: true,
        resetOpsQueue: true
      });

      expect(function(){
        return out.get('child').getNgModel();
      }).not.toThrow();
  });

  it('should serilize a nested deserialized object', function(){
      var ChildModel = tmParse.Object.extend('ChildModel'),
        child = new ChildModel({name:'child-name'});

      var out = new Model({
        className: 'Model',
        name:'name',
        child: child.getNgModel()
      });

      expect(out.getNgModel().child.name).toBe('child-name');
  });

  it('shoudn\'t serilize an unsaved file object', function(){
      var data = {base64: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'};

      var out = new Model({
        name:'name',
        img: new tmParse.File('new-file-name',data)
      });

      expect(function(){
        return out.getNgModel();
      }).toThrow();
  });


});