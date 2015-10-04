"use strict";

// TODO change sequence instantination via proper api when index.js is ready
var Sequence = require("../lib/Sequence.js");
var AsyncTask = require("../lib/AsyncTask.js");

/**
* Each sequence task is a "scene".  Each scene is a task/async task
* that depends on "parts" to complete the plot.
*/

var storys = "";
var scenen = 1;
var appendScene = function(scene) {
  if (typeof scene !== "string") throw new TypeError;
  var intro = "SCENE " + scenen++ + ":\n\n";
  return storys += intro + scene + "\n"
};
var stitchParts = function () {
  var str = "";
  [].slice.call(arguments).forEach(function(part){
    str += part;
  });
  return str;
};
var fn = function() {
  appendScene(stitchParts.apply(null, arguments));
};

var t1, t2, a1, a2, a3;
var story = new Sequence;

a1 = new AsyncTask(function(name) {return name}, []);
t1 = story.addTask(fn, "Once there was a lad named ");
t1.addDep(a1);
a3 = new AsyncTask(function(adj) {return adj}, []);
t2 = story.addTask(fn, "A ", "close friend ");
t2.addDep(a3, 1, "final");

a1.getCb()("Dantzel. ");
a3.getCb()("gay ");
story.run();

console.log(storys);
