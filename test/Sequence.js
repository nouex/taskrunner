"use strict";

var Sequence = require("../lib/Sequence.js");
var common = require("../lib/common.js");

var sigs = common.signals;
var EXECUTION_DELAYED = sigs.EXECUTION_DELAYED;

var isAEC = common.isAEC;
var labAEC = common.labAEC;
var isAsyncTask = common.isAsyncTask;
var isTask = common.isTask;

describe("Sequence()", function() {
  describe("instance", function() {
    it("creation does not throw", function() {
      expect(Sequence).not.toThrow();
    });

    it("creation returns a function", function() {
      expect(Sequence).toEqual(jasmine.any(Function));
    });

    it("[[prototype]]", function() {
      expect(Object.getPrototypeOf(new Sequence)).toBe(Sequence.prototype);
    });
  });
  describe("_addTask()", function() {
    var seq = new Sequence;

    it("returns `undefined` on bad `fn`", function () {
      expect(seq._addTask("blah", false)).toBeUndefined();
    });

    it("uses `taskDefAEC` if it is an AEC", function() {
      var tsk1, tsk2, newTaskDefAEC;
      tsk1 = seq._addTask(Function, false, Function);
      expect(tsk1.defAEC).toBe(seq.taskDefAEC);
      tsk2 = seq._addTask(Function, false, newTaskDefAEC = labAEC(Function));
      expect(tsk2.defAEC).toBe(newTaskDefAEC);
    });

    it("determines user inputed args correctly", function () {
      var tsk1, tsk2, set;
      // with taskDefAEC
      tsk1 = seq._addTask(Function, false, labAEC(Function), "arg1", "arg2");
      set = tsk1.sets.task;
      expect(set[0].actual).toBe("arg1");
      expect(set[1].actual).toBe("arg2");
      expect(set.length).toBe(2);
      // without taskDefAEC
      tsk2 = seq._addTask(Function, false, function(){}, "arg2");
      set = tsk2.sets.task;
      expect(set[0].actual).toEqual(jasmine.any(Function));
      expect(set[1].actual).toEqual("arg2");
      expect(set.length).toEqual(2);
    });

    it("creates Task/AsyncTask instances", function () {
      var tsk, atsk;

      tsk = seq._addTask(Function, false);
      expect(isTask(tsk)).toBe(true);
      atsk = seq._addTask(Function, true);
      expect(isAsyncTask(atsk)).toBe(true);
    });
  });
  describe("addTask()", function() {
    var seq = new Sequence;

    it("creates and returns a Task instance", function() {
      var tsk = seq.addTask(Function);
      expect(tsk).not.toBeUndefined();
      expect(isTask(tsk)).toBe(true);
      expect(isAsyncTask(tsk)).toBe(false);
    });
  });

  describe("addAsyncTask()", function() {
    var seq = new Sequence;

    it("creates and returns an AsyncTask instance", function() {
      var tsk = seq.addAsyncTask(Function);
      expect(isAsyncTask(tsk)).toBe(true);
    });
  });

  describe("_mayExecute()", function() {
    it("return atsk if it has one and is un-executed", function () {
      var tsk, atsk, seq;

      seq = new Sequence;
      tsk = seq.addTask(Function);
      atsk = seq.addAsyncTask(Function);
      expect(isAsyncTask(seq._mayExecute())).toBe(true);
      expect(atsk.getCb()()).not.toBe(EXECUTION_DELAYED);
      expect(isAsyncTask(seq._mayExecute())).not.toBe(true);
      expect(seq._mayExecute()).toBe(true);
    });

    it ("depends on tasks _mayExecute()", function() {
      var seq = new Sequence;
      var tsk1 = seq.addTask(noop);
      var atsk1 = seq.addAsyncTask(noop);
      var atsk2 = seq.addAsyncTask(noop);
      var tsk2 = seq.addTask(noop);

      expect(seq._mayExecute()).toBe(atsk1);
      atsk1.getCb()();
      expect(seq._mayExecute()).toBe(atsk2);
      atsk2.getCb()();
      expect(seq._mayExecute()).toBe(true);

      function noop(){};
    });
  });

  describe("run()", function() {
    it("executes in order of addition", function() {
      var seq = new Sequence, nextId = 1, prevId = 0;
      var atsk

      // 3 tasks
      seq.addTask(crtFn());
      seq.addTask(crtFn());
      seq.addTask(crtFn());

      seq.run();

      function assert(id) {
        if (id !== prevId +1)
          fail("bad order " + id + " came after prev " + prevId);
        prevId = id;
      }

      function crtFn() {
        var id = nextId++;
        return function() {
          assert(id);
        };
      }
    });
    // NOTE becuase of the nature of the setup, the above is not
    // reproducable with asyncs, so a diff approach is taken here
    it("executes in order of addition", function() {
      var seq = new Sequence, results = [], nextId = 1, asyncId;

      seq.addTask(logId, nextId++);
      seq.addTask(logId, nextId++);
      seq.addAsyncTask(function(re) {return re}, nextId++);

      logId(seq.run());
      assert();

      function assert() {
        results.forEach(function(n, ind, arr) {
          if ((ind+1) in arr && (n !== arr[ind+1] -1))
            fail("wrong order: " + results);
        });
      }

      function logId(id) {
        results.push(id);
      }
    });

    describe("aEC", function() {
      it("is used in async re-tries", function() {
        var seq = new Sequence, aExec, expRes;

        seq.addTask(function(b) {expect(b).toBe("blue")});
        aExec = seq.addAsyncTask(noop).getCb();
        // in sequences, the last return is always the sequence return
        seq.addTask(function(thing) {return thing}, "bullsh*t");
        seq.run(labAEC(catcher1), "blue");
        aExec()
        aExec = seq.addAsyncTask(noop).getCb();
        seq.addTask(function(thing) {return thing}, "banana");
        seq.run(labAEC(catcher2), "blue");
        aExec();
        // syncrhonous, just because
        expect(seq.run("blue")).toBe("banana");

        function catcher1(res) {
          expect(res).toBe("bullsh*t");
        }

        function catcher2(res1, res2) {
          expect(res1).toBe("banana");
        }

        function noop(){};
      });
    });
  });
});
