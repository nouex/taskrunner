var Task = require("../src/Task.js");


describe("`Task`", function() {
  var fn = function story(setting, subj1, desc, does, subj2, fin) {
    var plot = "";
    [].slice.call(arguments).forEach(function(part) {
      plot += " " + part;
    }, null);
    return plot;
  };

  var tsk = new Task(fn, ["Emily Marin", " and cums."]);
  // spies
  beforeEach(function() {
    spyOn(tsk, "addDependency").and.callThrough();
    spyOn(tsk, "execute").and.callThrough();
  });

  it("makes function instances", function() {
    expect(typeof tsk).toBe("function");
    expect(tsk.name).toBe("task");
    expect(tsk.fn.name).toBe("story");
    expect(typeof tsk.fn).toBe("function");
    expect(tsk.args).toEqual(["Emily Marin", " and cums."]);
  });

  it("can include dependencies via `addDependency()`", function() {
    function does(does) {return does || "fucks"}
    tsk.addDependency(does, 3);
    expect(tsk.dependencies.length).toBe(1);
    expect(tsk.depIndecees[0]).toBe(3);

    function desc(desc) {return desc || "lesbianely"};
    tsk.addDependency(desc, 2);
    expect(tsk.dependencies.length).toBe(2);

    expect(tsk.addDependency.calls.count()).toBe(2);
  });

  it("throws on bad function arg", function() {
    expect(tsk.addDependency).toThrow();
  });

  it("auto slides index to last if none provided", function() {
    var ai = tsk.args.length, di = tsk.dependencies.length, i = ai + di;

    function fin(fin) {return fin || "Liandra"}
    tsk.addDependency(fin);
    expect(tsk.depIndecees[tsk.depIndecees.length -1]).toBe(i);
  });

  describe("runs via `execute()`", function() {
    it("without async dependencies", function() {
      var res;
      res = tsk.execute("Beneath a willow,");
      console.log(res);
    });

    it("with async dependencies", function() {

    });
  });
});
