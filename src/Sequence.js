//"use strict";

var Task = require("./Task.js");

// debug = ...debuglog("Sequence.js");
function warn(msg) {
  msg = msg || "";
  console.warn(msg);// TODO migh be incompatable across platforms
}

function approveTask(task) {
  return typeof task === "function";
}

function objForEach(obj, fn, cxt) {
  // own enumerable
  var keys = Object.keys(obj);
  keys.forEach(function(prop) {
    fn.call(cxt, obj[prop], prop, obj);
  }, null);
  return undefined;
}

Sequence.Task = Task

function Sequence () {
  var ret = function() {
    return this.run.apply(null, arguments);
  };
  ret.tasks = new Array;
  ret.__proto__ = Sequence.prototype;

  return ret;
}

Sequence.prototype.addTask = function (fn) {
  if (!approveTask(fn)) return undefined;
  var task = new Task(fn, [].slice.call(arguments, 1));
  // task.__creator = this;
  this.tasks.push(task);
  return task;
};

Sequence.prototype.run = function () {
  var ret;
  var runArgs = [].slice.call(arguments);// only applies to first task

  this.tasks.forEach(run, null);
  function run (task, ind) {
    if (ind === 0) {
      ret = task.execute.apply(task, runArgs);
    } else {
      ret = task.execute();
    }
  }
  return ret;
};
