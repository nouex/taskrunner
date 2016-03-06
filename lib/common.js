"use strict";

// NOTE ./Task.js & ./Sequence.js must not be required in global scope
// becuase of infinite circular requiring
exports.signals = {};

[
  "ID_UNRESOLVED",
  "EXECUTION_DELAYED",
  "ASYNC_NOT_EXECUTED",
  "ASYNC_RESULT_INIT"
].forEach(function(sigKey) {
    exports.signals[sigKey] = Object.create(null);
}, null);

exports.signal = function (sig) {
  var signals = exports.signals;
  var keys = Object.keys(signals);
  var key;

  for (var i = 0, len = keys.length; i < len; i++) {
    key = keys[i];
    if (sig === signals[key]) {
      return key;
    }
  }
  return false;
};

exports.isSignal = function(sig) {
  return exports.signal(sig) ? true : false;
};

exports.isAsyncTask = function (tsk) {
  var ret;

  if (typeof tsk !== "function") return false;

  ret = ["called", "executed"].every(function(key) {
    return key in tsk && tsk.hasOwnProperty(key);
  }, null);

  if (ret) {
    ret = "getCb" in tsk && !tsk.hasOwnProperty("getCb");
  }

  return ret;
};

exports.isTask = function (tsk) {
  return tsk instanceof require("./Task.js") && !tsk.hasOwnProperty("executed");
};

exports.isSequence = function (thing) {
  var Seq = require("./Sequence.js");
  return thing instanceof Seq && Object.getPrototypeOf(thing) === Seq.prototype;
};

exports.isAEC = function (fn) {
  return "function" === typeof fn && fn.asyncExecCatcher === true;
}
// label async-exec catcher
exports.labAEC = function (fn) {
  fn.asyncExecCatcher = true;
  return fn;
};
