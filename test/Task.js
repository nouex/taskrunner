var Task = require("../src/Task.js");

// basic testing
describe("Task()", function() {
  var fn = function story() {
    var plot = "";
    [].slice.call(arguments).forEach(function(part) {
      plot += " " + part;
    }, null);
    return plot;
  };

  var tsk = new Task(fn, ["invisible", "man"]);
  // spies
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
      tsk.addDep(dep, index, set);

      expect(tsk.sets.final[2].actual).toBe(dep);
      expect(tsk.removeDep(set, index, dep)).toBe(dep);
    });
  });
});

// sets and final args order, extensive tests
describe("Task()", function() {
  function d1(){return "d1"}
  function d2(){return "d2"}
  function i1(){return "i1"}
  function f1(){return "f1"}

  it("order args in natural set order", function() {
    var res, tsk = new Task(function() {
      expect([].slice.call(arguments)).toEqual(["f1", "p1", "i1", "t1", "t2",
      "d1", "d2"]);
    }, ["t1", "t2"]),
        sets = tsk.sets;

    expect(sets.task.length).toEqual(2);
    tsk.addDep(d1);
    tsk.addDep(d2);
    expect(sets.dep.length).toEqual(2);
    tsk.addDep(i1, "internal");
    expect(sets.internal.length).toEqual(1);
    tsk.addDep(f1, "final");
    res = tsk.execute("p1");

    it ("throws on bad index, i.e. too large or duplicate", function() {
      // ...FILL IN HEEERRRE
    })
  });

  it ("natural set order", function() {
    var expRes, tsk = new Task(function() {
      expect([].slice.call(arguments)).toEqual(expRes);
      }, ["t1", "t2"]),
      sets = tsk.sets;

    expect(sets.task.length).toEqual(2);
    tsk.addDep(d1);
    tsk.addDep(d2);
    expect(sets.dep.length).toEqual(2);
    tsk.addDep(i1, "internal");
    expect(sets.internal.length).toEqual(1);
    tsk.addDep(f1, "final");

    it ("with forced `index`on d1", function() {
      var set = "dep", index = null, dep;
      expRes = ["f1", "p1", "i1", "t1", "t2", "d2", "d1"];
      dep = tsk.removeDep(set, index, d1);
      expect(dep).toBe(d1);
      tsk.addDep(d1, 1);
      tsk.execute("p1");
    });
  });
});
