"use strict";

var S = require("./lib/Sequence.js");
var T = require("./lib/Task.js");
var A = require("./lib/AsyncTask.js");

exports.mkSequence = function(opts) {
  return new S(opts);
};

// FIXME
exports.mkTask = function(fn, opts) {
  var args, sliceAt = 2;

  if (typeof opts !== "object" || opts === null) {
    opts = {};
    sliceAt = 1;
  }
  args = [].slice.apply(arguments, sliceAt);

  return new T(fn, args, opts);
};

exports.mkAsyncTask = function(fn, opts) {
  var args, sliceAt = 2;

  if (typeof opts !== "object" || opts === null) {
    opts = {};
    sliceAt = 1;
  }
  args = [].slice.apply(arguments, sliceAt);

  return new A(fn, args, opts);
};
