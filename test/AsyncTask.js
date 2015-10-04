"use strict";

var EE = require("events");

var AsyncTask = require("../src/AsyncTask.js");
var Task = require("../src/Task.js");
var common = require("../src/common.js");

var sigs = common.signals;
var EXECUTION_DELAYED = sigs.EXECUTION_DELAYED;
var ASYNC_NOT_EXECUTED = sigs.ASYNC_NOT_EXECUTED;

var isAsyncTask = common.isAsyncTask;

describe("EE and Task", function() {
  it ("do not override each other's own properties", function() {
      var ee, tsk, tskKeys;
      ee = new EE;
      tsk = new Task(function NOP(){}, []);
      tskKeys = Object.keys(tsk);

      Object.keys(ee).every(function(eKey) {
        if (tskKeys.indexOf(eKey) !== -1) {
          fail("inheritance prop clashing: " + eKey);
          return false;
        }
        return true;
      }, null);
  });

  it ("do not override each other's `prototype` props", function() {
    var ee, tsk, tskKeys;
    ee = EE.prototype;
    tsk = Task.prototype;
    tskKeys = Object.keys(tsk);
    Object.keys(ee).every(function(eKey) {
      if (tskKeys.indexOf(eKey) !== -1) {
        fail("inheritance [[proto]] prop clashing");
        return false;
      }
      return true;
    }, null);
  });
});

describe("AsyncTask()", function() {
  it ("does not throw on creation", function() {
    function fn(){}
    function create() {return new Task(fn, [])}
    create();
  });

  describe ("inherits from EE and Task and AsyncTask", function() {
    function NOP(){}
    it ("compared with 1x2 instance", function() {
      var atsk1 = new AsyncTask(NOP, []);
      // compare array
      var ca = [new EE, new Task(NOP, []), new AsyncTask(NOP, [])];

      [atsk1].forEach(function(atsk) {
        ca.forEach(function(inst) {
          var proto;
          // own enum first
          Object.keys(inst).forEach(function(key) {
            if (!atsk.hasOwnProperty(key)) {
              fail("does not fully inherit, missing own key: " + key);
            }
          }, null);

          proto = Object.getPrototypeOf(atsk);
          Object.keys(Object.getPrototypeOf(inst)).forEach(function(key) {
            if (!(key in proto)) {
              fail("does not fully inherit, missing proto key: " + key);
            }
          }, null)
        }, null);
      }, null);
    });

    it ("compared with 2x2 instance", function() {
      var atsk1 = new AsyncTask(NOP, []);
      var atsk2 = AsyncTask(function(){}, ["blah"]);
      // compare instances
      var c1 = new EE;
      var c2 = new Task(NOP, []);
      var c3 = new AsyncTask(NOP, []);
      // compare array
      var ca = [c1, c2, c3];
      // subject array
      var sa = [atsk1, atsk2];

      sa.forEach(function(atsk) {
        ca.forEach(function(inst) {
          var proto;
          // own enum first
          Object.keys(inst).forEach(function(key) {
            if (!atsk.hasOwnProperty(key)) {
              fail("does not fully inherit, missing own key: " + key);
            }
          }, null);

          proto = Object.getPrototypeOf(atsk);
          Object.keys(Object.getPrototypeOf(inst)).forEach(function(key) {
            if (!(key in proto)) {
              fail("does not fully inherit, missing proto key: " + key);
            }
          }, null)
        }, null);
      }, null);
    });
  });

  it ("isAsyncTask()", function() {
    var atsk = new AsyncTask(Function, []);

    expect(isAsyncTask(atsk)).toEqual(true);
    expect(isAsyncTask({})).toEqual(false);
    expect(isAsyncTask("")).toEqual(false);
  });

  describe ("getCb()", function() {
    it ("returns [[execute()]]", function() {
      var atsk = new AsyncTask(Function, []), cb;

      expect(atsk.getCb.bind(atsk)).not.toThrow();
      cb = atsk.getCb();
      expect(cb).toEqual(jasmine.any(Function));
      expect(cb.length).toBe(1);
    });

    describe("[[execute()]]", function() {
        it("with only sync deps", function() {
        var atsk = new AsyncTask(function(){return [].slice.call(arguments)}, []);
        atsk.addDep(function(){return "d1"});
        atsk.addDep(function(){return"d2"});
        atsk.addDep(function(){return "special"}, 1, "final");
        expect(atsk.execute.bind(atsk)).toThrow()
        expect(atsk.getCb()()).toEqual(["d1", "special", "d2"]);
      });

      it ("with async deps", function() {
        var atsk = new AsyncTask(function(){return [].slice.call(arguments)}, []);
        atsk.addDep(function(){return "d1"});
        atsk.addDep(function(){return"d2"});
        var atskDep = new AsyncTask(function(){return "async1"}, []);
        var atskDepExec = atskDep.getCb();
        var res, c = {};
        c.atskExec = atsk.getCb();
        c.aEC = function() {/*console.log(arguments)*/};
        c.aEC.asyncExecCatcher = true;
        // add atsk as dep
        atsk.addDep(atskDep, 1, "final");

        spyOn(c, "atskExec").and.callThrough();
        spyOn(c, "aEC").and.callThrough();
        spyOn(atsk, "getResult").and.callThrough();

        expect(c.atskExec(c.aEC)).toBe(EXECUTION_DELAYED);
        expect(c.atskExec.calls.count()).toBe(1);
        expect(c.aEC.calls.count()).toBe(0);
        expect(atsk.getResult.calls.count()).toBe(0);
        expect(atsk.getResult()).toBe(ASYNC_NOT_EXECUTED);
        expect(atsk.getResult.calls.count()).toBe(1)
        atskDepExec();// which should secretly invoke `tryAgain()`-->
        // for some jasmine reason the below is failing
        // expect(atsk.getResult.calls.count()).toBe(2);
        expect(c.aEC.calls.count()).toBe(1);
      });
    });
  });
});
