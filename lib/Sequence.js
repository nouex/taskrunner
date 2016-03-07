"use strict";

var Task = require("./Task.js");
var AsyncTask = require("./AsyncTask.js");
var common = require("./common.js");
var tool = require("./tool.js");

var sigs = common.signals;
var EXECUTION_DELAYED = sigs.EXECUTION_DELAYED;

var isAsyncTask = common.isAsyncTask;
var isAEC = common.isAEC;
var labAEC = common.labAEC;

function approveTask(task) {
  return typeof task === "function";
}

function Sequence (opts) {
  var ret = function seq() {
    return this.run.apply(ret, arguments);
  };
  ret.tasks = new Array;

  opts = opts || {};
  // opts:defAEC = NOP
  ret.defAEC = "function" === typeof opts.defAEC ?
                labAEC(opts.defAEC) :
                labAEC(function NOP(){});
  // opts:autoRetry = true
  ret.autoRetry = "autoRetry" in opts ? Boolean(opts.autoRetry) : true;

  ret.__proto__ = Sequence.prototype;

  return ret;
}

Sequence.prototype._addTask = function (fn, asyn, opts) {
  if (!approveTask(fn)) return undefined;
  cstr = asyn ? AsyncTask : Task;

  var task, cstr;

  task = new cstr(fn, [].slice.call(arguments, 3), opts);
  this.tasks.push(task);

  return task;
};

Sequence.prototype.addTask = function (fn, opts) {
  var args, slicei;

  slicei = typeof opts === "object" && opts !== null ? 2 : 1;
  args = [].slice.call(arguments, slicei);
  // no opts provided
  slicei === 1 ? opts = {} : void 0;

  return this._addTask.apply(this, [fn, false, opts].concat(args));
};

Sequence.prototype.addAsyncTask = function(fn, opts) {
  var args, slicei;

  slicei = typeof opts === "object" && opts !== null ? 2 : 1;
  args = [].slice.call(arguments, slicei);
  // no opts provided
  slicei === 1 ? opts = {} : void 0;

  return this._addTask.apply(this, [fn, true, opts].concat(args));
};

Sequence.prototype.run = function (aEC) {
  hasAEC = isAEC(aEC) ? true : false;
  aEC = hasAEC ? aEC : this.defAEC;

  var ret, tryOn, hasAEC;
  var self = this, runArgs = hasAEC ?
        [].slice.call(arguments, 1) :
        [].slice.call(arguments);

  if (isAsyncTask(tryOn = this._mayExecute())) {
    if (this.autoRetry)
      tryOn.once("executed", tryAgain);
    return EXECUTION_DELAYED;
  }
  this.tasks.forEach(run, null);

  return ret;

  function run (task, ind) {
    if (ind === 0) {
      ret = task.apply(task, runArgs);
    } else {
      ret = task();
    }
  }

  function tryAgain() {
    aEC(self.run.apply(self, [aEC].concat(runArgs)));
  }
};

Sequence.prototype._mayExecute = function () {
  var tasks = this.tasks, ret = true;

  tool.objForEach(tasks, function(breakout, task) {
    if (isAsyncTask(task) && !task.executed) {
      ret = task;
      breakout();
    } else {
      ret = task._mayExecute();
      ret !== true ? breakout() : void 0;
    }
  }, null);

  return ret;
};

module.exports = Sequence;
