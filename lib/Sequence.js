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

function Sequence () {
  var ret = function() {
    return this.run.apply(null, arguments);
  };
  ret.tasks = new Array;
  ret.defAEC = labAEC(function(res) {
    console.log("sequence defAEC result: " + res);
  });
  ret.taskDefAEC = labAEC(function(res) {
    console.log("task defAEC result: " + res);
  });

  ret.__proto__ = Sequence.prototype;

  return ret;
}

Sequence.prototype._addTask = function (fn, asyn, taskDefAEC) {
  if (!approveTask(fn)) return undefined;
  if (!isAEC(taskDefAEC)) taskDefAEC = this.taskDefAEC;
  cstr = asyn ? AsyncTask : Task;

  var task, hasAEC, cstr;

  task = new cstr(fn, [].slice.call(arguments, 3), taskDefAEC);

  this.tasks.push(task);
  return task;
};

Sequence.prototype.addTask = function (fn, taskDefAEC) {
  var args, slicei;

  slicei = isAEC(taskDefAEC) ? 2 : 1, taskDefAEC = undefined;
  args = [].slice.call(arguments, slicei);
  return this._addTask.apply(this, [fn, false, taskDefAEC].concat(args));
};

Sequence.prototype.addAsyncTask = function(fn, taskDefAEC) {
  var args, slicei;

  slicei = isAEC(taskDefAEC) ? 2 : 1, taskDefAEC = undefined;
  args = [].slice.call(arguments, slicei);
  return this._addTask.apply(this, [fn, true, taskDefAEC].concat(args));
};

Sequence.prototype.run = function (aEC) {
  hasAEC = isAEC(aEC) ? true : false;
  aEC = hasAEC ? aEC : this.defAEC;

  var ret, tryOn, hasAEC;
  var self = this, runArgs = hasAEC ? [].slice.call(arguments, 1) :
      [].slice.call(arguments);

  if (isAsyncTask(tryOn = this._mayExecute())) {
    tryOn.once("executed", tryAgain);
    return EXECUTION_DELAYED;
  }
  this.tasks.forEach(run, null);
  function run (task, ind) {
    if (ind === 0) {
      ret = task.apply(task, runArgs);
    } else {
      ret = task();
    }
  }
  return ret;

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
