//"use strict";
var EE = require("events");
var util = require("util");

var Task = require("./Task.js");
var AsyncError = require("./AsyncError.js");

var debug = function NOP(){};
module.exports = AsyncTask;
function AsyncTask(fn, args) {
  var atsk, proto = {}, mock = new (function ()  {
    EE.call(this);
    Task.call(this);
  });

  Object.keys(EE.prototype).concat(Task.prototype).forEach(function(key) {
    proto[key] = key in EE.prototype ? EE.prototype[key] : Task.prototype[key];
  }, null);

  atsk = function asyncTask() {
    return this.getResult();
  };

  Object.keys(mock).forEach(function(key) {
    atsk[key] = mock[key];
  }, null);

  atsk.__proto__ = proto;

  atsk.called = false;
  atsk.executed = false;
  atsk.result;

  return atsk;
}

AsyncTask.prototype.getCb = function () {
  return function execute() {
    var taskArgs = this.args, fn = this.fn, passedArgs = [].slice.call(arguments),
        dep = this.dependencies, depI = this.depIndecees, self = this;
        depArgs = new Array(dep.length), finArgs = new Array;
    // fill finArgs with indicator
    var i = len = depArgs.length + passedArgs.length + taskArgs.length, ind = {};
    // NOTE this is the 1st diff of async execute and regular exec
    this.called = true;
    //check for async completions
    var shouldExit = false, listenOn;
    depArgs.every(function(dep, i) {
      if (dep instanceof AsyncTask) {
        if (dep.called && dep.executed) {
          return true;
        } else {
          listenOn = dep;
          shouldExit = true;
          return false;
        }
      } else {
        return true;
      }
    }, null);

    if (shouldExit) {
      listenOn.on("executed", onExecuted);
      // NOTE this is the 2ND diff of async execute and regular exec
      function onExecuted () {
        /*self.*/execute.apply(self, passedArgs);
      }
      return new AsyncError;
    }

    while(i--) {
      finArgs[i] = ind;
    }
    // fill finArgs with deps
    depArgs.forEach(function(dep, i) {
      var res = dep(), depi = depI[i];
      finArgs.splice(depi, 1, res);
    },null);
    // fill finArgs with other actuals
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
    // NOTE this is the 3rd diff of async execute and regular exec
    var ret = fn.apply(null, finArgs);
    this.result = ret;
    this.executed = true;
    this.emit("executed");
    return ret;
  }.bind(this);
};

AsyncTask.prototype.getResult = function () {
  if (!this.executed)
    return new AsyncError;

  return this.result;
};

AsyncTask.prototype.execute = function () {
  throw new Error("use getCb with asyncs");
};
