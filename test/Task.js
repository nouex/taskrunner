"use strict";

var Task = require("../lib/Task.js");
var AsyncTask = require("../lib/AsyncTask.js");
var tool = require("../lib/tool.js");
var common = require("../lib/common.js");

var signals = common.signals;
var EXECUTION_DELAYED = signals.EXECUTION_DELAYED;
var ID_UNRESOLVED = signals.ID_UNRESOLVED;

// basic testing
describe("Task(),", function() {
  var fn = function story() {
    var plot = "";
    [].slice.call(arguments).forEach(function(part) {
      plot += " " + part;
    }, null);
    return plot;
  };

  var tsk = new Task(fn, ["invisible", "man"]);
  // spies`
  beforeEach(function() {
    spyOn(tsk, "addDep").and.callThrough();
    spyOn(tsk, "execute").and.callThrough();
  });

  it("makes function instances", function() {
    expect(typeof tsk).toBe("function");
    expect(tsk.name).toBe("task");
    expect(tsk.fn.name).toBe("story");
    expect(typeof tsk.fn).toBe("function");
  });

  it("can include dependencies via `addDep()`", function() {
    function d1(s) {return s || "am"}
    tsk.addDep(d1, 1, "final");
    expect(tsk.sets.dep.length).toBe(0);
    expect(tsk.sets.final[0].executable).toEqual(true);
    expect(tsk.sets.final[0].index).toEqual(1);

    function d2(s) {return s || "an"};
    tsk.addDep(d2, 2, "final");

    expect(tsk.addDep.calls.count()).toBe(2);
  });

  it("throws on bad function arg", function() {
    expect(tsk.addDep).toThrow();
  });

  it ("throws on bad index, i.e. too large or duplicate", function() {
    // ...FILL IN HEEERRRE
  });

  describe("runs via `execute()`", function() {
    it("without async dependencies", function() {
      var res;
      res = tsk.execute("I");
      expect(res).toBe(" I am an invisible man")
    });

    it("with async dependencies", function() {
      // coming soon
    });
  });

  describe("removeDep()", function() {
    it("removes dep and returns them", function() {
      var dep = function d3(){void 0}, set = "final", index = 3;
      var id = tsk.addDep(dep, index, set);

      expect(tsk.sets.final[2].actual).toBe(dep);
      expect(tsk.removeDep(id)).toBe(dep);
    });
  });
});

// sets and final args order, extensive tests
describe("Task()", function() {
  var t1, t2, tsk, expArgs;

  function d1f(){return "d1"}
  function d2f(){return "d2"}
  function i1f(){return "i1"}
  function f1f(){return "f1"}

  function setup() {
    tsk = new Task(function() {
      expect([].slice.call(arguments)).toEqual(expArgs);
    }, [t1 || "t1", t2 || "t2"]);

    tsk.addDep(d1f);
    tsk.addDep(d2f);
    tsk.addDep(i1f, "internal");
    tsk.addDep(f1f, "final");
  }

  beforeEach(setup);

  describe("arg order", function() {
    it("ordered args in natural set order", function() {
      var sets = tsk.sets;

      expect(sets.task.length).toEqual(2);
      expect(sets.dep.length).toEqual(2);
      expect(sets.internal.length).toEqual(1);
      expArgs = ["f1", "p1", "i1", "t1", "t2", "d1", "d2"];
      tsk.execute("p1");
    });

    it ("forced `index`on d1", function() {
      var id;

      function d3f(){return "d3"};
      id = tsk.addDep(d3f, 0);
      expect(tsk.sets.dep.length).toEqual(3);
      expArgs = ["f1", "p1", "i1", "t1", "t2", "d3", "d1", "d2"];
      tsk.execute("p1");
      expect(tsk.removeDep(id)).toBe(d3f);
    });

    it ("forced `index` on i1", function() {
      var id;

      expArgs = ["f1", "p1", "t1", "t2", "d1", "i1", "d2"];
      // HACK
      id = tsk.sets.internal[0].id;
      expect(tsk.removeDep(id)).toBe(i1f);
      tsk.addDep(i1f, 1, "dep");
      tsk.execute("p1");
    });
  });

  it ("moveDep()", function() {
    var id;
    function t1_5f (){return "t1.5"}
    expArgs = ["f1", "p1", "i1", "t1", "t1.5", "t2", "d1", "d2"];
    id = tsk.addDep(t1_5f, 1, "task");
    tsk.execute("p1");
    expArgs = ["f1", "p1", "i1", "t1", "t2", "t1.5", "d1", "d2"];
    expect(tsk.moveDep(id, 5, "final")).not.toEqual(id);
    tsk.execute("p1");
    expect(tsk.moveDep(-4, 5)).toEqual(jasmine.any(Object));
  });

  describe("_mayExecute()", function() {
    it ("with no asyncTsks via itself", function () {
      var res = tsk._mayExecute();
      expect(res).toBe(true);
    });

    it ("with asyncTsk's via itself", function() {
      var atsk = new AsyncTask(function(){return "atsk1"}, []);
      var cb = atsk.getCb();

      tsk.addDep(atsk);
      tsk.addDep(function(){return "blah"});
      expect(common.isAsyncTask(tsk._mayExecute())).toBe(true);
    });

    it ("with asyncTsks via execute()", function() {
          expArgs = ["f1", "p1", "i1", "t1", "t2", "d1", "d2"];
          var atsk = new AsyncTask(function(){return "atsk1"}, []);
          expect(tsk.execute("p1")).not.toBe(EXECUTION_DELAYED);
          tsk.addDep(atsk);
          expect(tsk.execute()).toBe(EXECUTION_DELAYED);
    });

    it ("depends on deps' _mayExecute()", function () {
      var atsk1 = new AsyncTask(noop, []);
      var atsk2 = new AsyncTask(noop, []);
      var atsk3 = new AsyncTask(noop, []);
      var atsk4 = new AsyncTask(noop, []);
      var tsk = new Task(noop, []);
      var tsk1 = new Task(noop, []);
      var tsk2 = new Task(noop, []);

      tsk2.addDep(atsk2);
      atsk3.addDep(atsk4);

      tsk.addDep(tsk1);
      tsk.addDep(atsk1);
      tsk.addDep(noop);
      tsk.addDep(tsk2);
      tsk.addDep(atsk3);

      expect(tsk._mayExecute()).toBe(atsk1);
      atsk1.getCb()();
      // next to block execution: atsk2 of tsk2
      expect(tsk._mayExecute()).toBe(atsk2);
      atsk2.getCb()();
      // next to block: atsk3
      expect(tsk._mayExecute()).toBe(atsk3)
      // does not exec bc of non exec dep: atsk4
      atsk3.getCb()();
      expect(atsk3._mayExecute()).toBe(atsk4)
      // so next is still: atsk3
      expect(tsk._mayExecute()).toBe(atsk3);
      // not exec the last dep atsk4
      atsk4.getCb()();
      // should be no more blocks
      expect(tsk._mayExecute()).toBe(true);

      function noop(){};
    });
  });

  describe("execute()", function() {
    it("gathers args, and passes to fn", function() {
      var task = new Task(fn, [" blue", " moon"]);
      task.addDep(function(){return " in"}, 0, "task");
      task.addDep(function() {return " a"}, 1, "task");
      expect(task.execute("Once")).toEqual("Once in a blue moon");

      function fn(once, inn, a, blue, moon) {
        return once + inn + a + blue + moon;
      }
    });

    describe("aEC", function() {
      it ("catches an asynchronous return", function() {
        var task;
        var atask = new AsyncTask(afn, []);
        var mocks = {};
        var expThing;

        mocks.fn = fn;
        spyOn(mocks, "fn").and.callThrough();
        task = new Task(mocks.fn, []);

        task.addDep(atask);
        expect(task.execute(expThing = "petty")).toBe(EXECUTION_DELAYED);
        expect(mocks.fn.calls.count()).toBe(0);
        atask.getCb()();
        expect(mocks.fn.calls.count()).toBe(1);

        function afn() {
          //...
        }

        function fn(thing) {
          expect(thing).toBe(expThing);
        }
      });
    });
  });
});
