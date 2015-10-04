"use strict";

var S = require("./lib/Sequence.js");
var T = require("./lib/Task.js");
var A = require("./lib/AsyncTask.js");

// default opts
exports.sequenceOpts = {
  defAEC: /*...*/,
  autoRetry: true
};

exports.taskOpts = {
  defAEC: /*...*/,
  autoRetry: true//for non-completed async halt
};

exports.mkSequence = function(opts) {
  return new S(polishOpts(opts) || exports.seqOpts);
};

// FIXME
exports.mkTask = function(fn, defAEC, /*opts*/) {
  var args;

  //return new T(fn, args, defAEC);
};

exports.mkAsyncTask = function(fn, defAEC, /*opts*/) {
  var args;
  // ...
};
