"use strict";
// first time ever to use a test harness, btw

var Sequence = require("../dist/taskrunner.js");

// spec suite
describe("Sequence", function() {
  var mock, tsk1Fn, tsk2Fn, dep1Fn, dep2Fn;

  beforeAll(function(){
    mock = {
      tsk1Fn:     function namedFn() {},
      tsk2Fn:  function(){},
      dep1Fn: function(){return "hi1"},
      dep2Fn: function(){return "hi2"}
    };

    spyOn(mock, "tsk1Fn").and.callThrough();
    spyOn(mock, "tsk2Fn").and.callThrough();
    spyOn(mock, "dep1Fn").and.callThrough();
    spyOn(mock, "dep2Fn").and.callThrough();
  });

  var seq, tsk1, tsk2, dep1, dep2;
  // spec
  it("creates an instance", function() {
    seq = new Sequence
    // actual ... matcher
    expect(seq).toEqual(jasmine.any(Sequence));
  });

  describe("Task", function() {

    var namedFn;
    var anoFn;

    it("addTask: number of tasks, tsks in seq.tasks", function() {
      namedFn = mock.tsk1Fn;
      anoFn = mock.tsk2Fn;
      expect(seq.tasks.length).toBe(0);
      tsk1 = seq.addTask(namedFn, "first", ["second"], {third: null}, 4);
      expect(tsk1).not.toBeUndefined();

      tsk2 = seq.addTask(anoFn);
      expect(seq.tasks.length).toBe(2);
      [tsk1, tsk2].forEach(function(tsk, ind) {
        expect(~seq.tasks.indexOf(tsk)).toBeTruthy();
      }, null);
    });

    it("tsk1 props", function() {
      // expect(tsk1.name).toBe("namedFn"); NOTE does not work with spy
      expect(tsk1.fn).toEqual(jasmine.any(Function));
      expect(tsk1.args).toEqual(jasmine.any(Array));
    });

    it("tsk2 props", function() {
      expect(tsk2.name).toBe("[anonymous]");
      expect(tsk2.fn).toEqual(jasmine.any(Function));
      expect(tsk2.args).toEqual(jasmine.any(Array));
    });

    it("Task.prototype.addDep()", function() {
      var deps = tsk1.dependencies, depsI = tsk1.depIndecees;
      tsk1.addDep(dep1 = mock.dep1Fn, 1);
      expect(deps[0]).toEqual(jasmine.any(Function));
      expect(depsI[0]).toEqual(1);
      dep2 = mock.dep2Fn;
      expect(tsk1.addDep(mock.dep2Fn, 0)).toEqual(tsk1);
    });
/*
  it("Sequence.run()", function() {
    seq.run();
    tsk1Fn = mock.tsk1Fn
    tsk2Fn = mock.tsk2Fn;
    dep1Fn = mock.tsk1Fn;
    dep2Fn = mock.tsk2Fn;
    expect(tsk1Fn).toHaveBeenCalled();
    expect(tsk1Fn).toHaveBeenCalledWith("hi2", "hi1", "first", ["second"], {third: null}, 4);
    expect(tsk2Fn).toHaveBeenCalled();
    expect(tsk2Fn).toHaveBeenCalledWith();
    expect(dep1Fn.calls.count()).toEqual(1);
  });*/

  it ("run() with task as dep", function() {
    var dep = {
      fn: function(){return "first"},
      tsk: new Sequence.Task(function(arg){return arg})
    };
    spyOn(dep, "fn").and.callThrough();
    spyOn(dep.tsk, "fn").and.callThrough();
    dep.tsk.args = ["second"];
    var seq = new Sequence();
    tsk1 = seq.addTask(mock.tsk1Fn);
    tsk1.addDep(dep.fn, 0);
    expect(tsk1.dependencies[0]).toBe(dep.fn);
    expect(tsk1.dependencies.length).toBe(1);
    tsk2 = seq.addTask(mock.tsk2Fn);
    expect(dep.tsk.constructor).toBe(Sequence.Task);
    tsk2.addDep(dep.tsk, 0);
    expect(tsk2.dependencies[0]).toEqual(jasmine.any(Function));
    expect(tsk2.dependencies.length).toBe(1);
    seq.addTask(function(a){return a},"DONE");

    expect(seq.run("pre")).toEqual("DONE");

    expect(seq.tasks[1].fn.constructor).toBe(Function);
    expect(dep.fn).toHaveBeenCalled();
    expect(mock.tsk1Fn).toHaveBeenCalled();
    expect(mock.tsk1Fn).toHaveBeenCalledWith("pre", "first");
    expect(mock.tsk2Fn).toHaveBeenCalled();
    expect(mock.tsk2Fn).toHaveBeenCalledWith("second");

  });
  });
});
