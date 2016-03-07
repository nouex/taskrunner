"use strict";

var EE = require("events");

var Task = require("./Task.js");
var common = require("./common.js");
var tool = require("./tool.js");

var signals = common.signals;
var isAsyncTask = common.isAsyncTask;
var isAEC = common.isAEC;

var ASYNC_NOT_EXECUTED = signals.ASYNC_NOT_EXECUTED;
var EXECUTION_DELAYED = signals.EXECUTION_DELAYED;
var ASYNC_RESULT_INIT = signals.ASYNC_RESULT_INIT;

function AsyncTask(fn, args, opts) {
  var atsk, proto = Object.create(Function.prototype), mockEE = new (function ()  {
    EE.call(this);
  }), mockTsk = Task.call(this, fn, args, opts);

  Object.keys(EE.prototype).concat(Object.keys(Task.prototype)).concat(
  Object.keys(AsyncTask.prototype)).forEach(function(key) {
    // NOTE order matters
    if (key in AsyncTask.prototype) {
      proto[key] = AsyncTask.prototype[key];
    } else if (key in Task.prototype) {
      proto[key] = Task.prototype[key];
    } else {
      proto[key] = EE.prototype[key];
    }
  }, null);

  atsk = function asyncTask() {
    return atsk.getResult();
  };

  Object.keys(mockEE).concat(Object.keys(mockTsk)).forEach(function(key) {
    atsk[key] = key in mockEE ? mockEE[key] : mockTsk[key];
  }, null);

  atsk.__proto__ = proto;

  atsk.called = false;
  atsk.executed = false;
  atsk.result = ASYNC_RESULT_INIT;

  return atsk;
}

// NOTE: changes here must most likely be synced made in ./Task.js's execute()
AsyncTask.prototype.getCb = function () {
  return function execute(aEC) {
    "use strict";// NOTE crucial

    if (isAEC(aEC)) {
      hasAEC = true;
    } else {
      aEC = this.defAEC;
    }

    var hasAEC, args = hasAEC ? [].slice.call(arguments, 1) :
        [].slice.call(arguments), self = this, ret, tryOn;

    this.called = true;

    // may we execute
    if (isAsyncTask(tryOn = this._mayExecute())) {
      if (this.autoRetry)
        tryOn.once("executed", tryAgain);
      return EXECUTION_DELAYED;
    }

    // registering final args for task
    args.forEach(function regPassedArgs(actual) {
      var set, executable, index, once;

      set = "passed";
      executable = false;
      index = null;
      once = true;

      self._addSetEntry(set, actual, executable, index, once);
    }, null);

    ret = this.fn.apply(this, this._extractArgs());
    this.result = ret;
    this.executed = true;
    this._afterExecute();
    this.emit("executed", ret);

    return ret;

    function tryAgain() {
      aEC(execute.apply(self, [aEC].concat(args)));
    }
  }.bind(this);
};

AsyncTask.prototype.getResult = function () {
  if (!this.executed)
    return ASYNC_NOT_EXECUTED;
  return this.result;
};

AsyncTask.prototype.execute = function () {
  throw new Error("use getCb with asyncs");
};

module.exports = AsyncTask;
