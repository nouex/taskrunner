//"use strict";

var AsyncTask = require("./AsyncTask.js");
var AsyncError = require("./AsyncError.js");

module.exports = Task;
function Task (fn, args) {
  var ret = function task() {
    return this.execute.apply(this, arguments);
  };
  ret.name = fn.name || "[anonymous]";
  ret.fn = fn;
  ret.args = args || new Array;
  ret.dependencies = [];
  ret.depIndecees = [];

  ret.__proto__ = Task.prototype;

  return ret;
}

Task.prototype.addDependency = function (fn, index) {
  var ai, di, ti;
  if (index === undefined) {
    ai = this.args.length;
    di = this.dependencies.length;
    ti = ai + di;
    index = ti;
  }

  if (typeof fn !== "function") throw new Error;

  this.dependencies.push(fn);
  this.depIndecees.push(index);

  return this;
};

Task.prototype.execute = function () {
  var taskArgs = this.args, passedArgs = [].slice.call(arguments), fn = this.fn,
      dep = this.dependencies, depI = this.depIndecees, len,
      i = len = dep.length + passedArgs.length + taskArgs.length, ind = {},
      finArgs = new Array(len), self = this;

  //check for async completions
  var shouldExit = false;
  dep.every(function(dep, i) {
    if (dep instanceof AsyncTask) {
      if (dep.called && dep.executed) {
        return true;
      } else {
        dep.on("executed", onAsyncExecuted);
        shouldExit = true;
        return false;
      }
    } else {
      return true;
    }
  }, null);

  if (shouldExit) {
    return new AsyncError;
  }

  while(i--) {
    finArgs[i] = ind;
  }
  // fill finArgs with deps
  dep.forEach(function(dep, i) {
    var res = dep(), depi = depI[i];
    finArgs.splice(depi, 1, res);
  },null);

  // fill finArgs with actuals
  var j = 0;
  passedArgs.concat(taskArgs).forEach(function(arg, i) {
    while (j <= len && finArgs[j] !== ind) {
      j += 1;
    }
    if (j > len)
      throw new Error;
    finArgs[j] = arg;
    j += 1;
  }, null);

  if (~finArgs.indexOf(ind)) throw new Error;// TODO debug() n exit

  return fn.apply(null, finArgs);

  function onAsyncExecuted () {
    self.execute.apply(self, passedArgs);
  }
};
