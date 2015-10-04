"use strict";

var tool = require("./tool.js");
var common = require("./common.js");
var signals = common.signals;

var ID_UNRESOLVED = signals.ID_UNRESOLVED;
var EXECUTION_DELAYED = signals.EXECUTION_DELAYED;

var isAsyncTask = common.isAsyncTask;
var isAEC = common.isAEC;
var isTask = common.isTask;
var labAEC = common.labAEC;

Task.prototype = Object.create(Function.prototype);
function Task (fn, args, opts) {
  var ret = function task() {
    return ret.execute.apply(ret, arguments);
  };
  var i;
  ret.fn = fn;
  ret.sets = {
    "final": [],
    "passed": [],
    "internal": [],
    "task": [],
    "dep": []
  };
  // options
  opts = opts || {};
  ret.defAEC = "function" === typeof opts.defAEC ? labAEC(opts.defAEC) :
                labAEC(function NOP(){});
  ret.autoRetry = "autoRetry" in opts ? Boolean(opts.autoRetry) : true;

  ret.__proto__ = Task.prototype;

  args.forEach(function regTaskArgs(actual) {
    var set = "task", executable = false, index = null, once = false;

    ret._addSetEntry(set, actual, executable, index, once);

  }, null);

  return ret;
}

Task.prototype.addDep = function (fn, index, set) {
  var set, actual = fn, executable = true, index, once = false;
  if (!actual instanceof Function) throw new TypeError("bad `fn` arg");
  if (arguments.length == 3) {
    set = String(set);
    index = +index;
  } else if ("1" in arguments) {
    switch(typeof index) {
      case "number":
      index = index;
      set = "dep";
      break;

      case "string":
      if (!/^(?:dep|task|internal|passed|final)$/i.test(index)) {
        throw new TypeError;
      } else {
        set = index.toLowerCase();
        index = null;
      }
      break;

      default:
      throw new TypeError;
    }
  } else {
    index = null;
    set = "dep";
  }

  return this._addSetEntry(set, actual, executable, index, once);
};

/**
* @param id {number}
* @return ID_UNRESOLVED {object}
*/
Task.prototype.removeDep = function (id) {
  var remInd, set, found = false, ret;

  tool.objForEach(this.sets, function(breakout, setb) {
    this._traverseSet(setb, function(breakaway, meta, ind) {
      if (meta.id === id) {
        set = setb;
        remInd = ind;
        found = true;
        breakaway();
        breakout();
      }
    }, null);
  }, this);

  if (!found) return ID_UNRESOLVED;

  ret = this._removeDep(set, remInd, 1);
  return ret.actual;
};

Task.prototype._removeDep = function (set, i, h) {
  return set.splice(i, h)[0];
};
// NOTE assings new id to meta, b/c it essentially creates a new entry (meta)
Task.prototype.moveDep = function (id, index, set) {
  // TODO filter
  set = undefined == set ? "dep" : set;
  // declare
  var actual = this.removeDep(id), ret;
  // body
  if (actual === ID_UNRESOLVED) return ID_UNRESOLVED;
  else {
    ret = this.addDep(actual, index, set);
  }
  // return
  return ret;
};

var nextMetaId = 0;
/**
* @return nextMetaId {number} id of meta
*/
Task.prototype._addSetEntry = function(set, actual, executable, index, once) {
  var set = this.sets[set], meta = {};

  // expects exact args
  if (arguments.length !== 5) throw new Error;// TODO debug()

  meta.actual = actual;
  meta.executable = !!executable;
  meta.index = typeof index === "number" ? index : null;
  meta.once = once
  meta.id = nextMetaId++;

  set.push(meta);
  return meta.id;
};

/**
* @param set {object} a set object
* @return copy {object} return a worked-on set
* @api private
*/
Task.prototype._orderSet = function (set) {
  var indexMap = new Array(set.length), holder = [], setLen = set.length, index;

  initIndexMap(indexMap);

  this._traverseSet(set, function(breakaway, meta, ind) {
    index = meta.index;
    if (index !== null)  {
      indexMap[ind] = true;
    }
  }, null);

  indexMap.forEach(function(move, ind) {
    var toMove, index;

    if (move) {
      toMove = set[ind];
      index = toMove.index;
      if (index > setLen) throw new Error("arg index not valid: " + index);
      if (holder[index] !== undefined) throw new Error("index already taken");
      holder[index] = toMove;
      toMove.index = null;
    }
  }, null);

  var j = 0, k = 0;
  while (j < setLen) {
    if (holder[j] !== undefined) {j += 1; continue;}
    while (indexMap[k] === true && k < setLen) k += 1;
    holder[j] = set[k];
    k += 1;
    j += 1;
  }

  // must replace all set with holder to return same object
  set.forEach(function(el, ind) {
    set[ind] = holder[ind];
  }, null);

  return set;

  function initIndexMap(map) {
    var tot = map.length, len = map.length;
    while (tot) {
      map[Math.abs(tot - len)] = false;
      tot -= 1;
    }
    return map;
  }
};

/**
* @return
*/
Task.prototype._handleSet = function (set) {
  set = tool.deepCpy(set);// implicit copy
  this._orderSet(set);
  set.forEach(function(meta, ind) {
    // execute if needed
    if (meta.executable) {
      meta.actual = meta.actual();
      meta.executable = false;
    }
  }, null);

  return set;
};

Task.prototype._mergeSets = function () {
  var sets = this.sets, dep, task,
  internal, passed, final;
  // starting from bottom
  dep = this._handleSet(sets.dep);
  task = this._handleSet(sets.task);
  internal = this._handleSet(sets.internal.concat(task).concat(dep));
  passed = this._handleSet(sets.passed);
  final = this._handleSet(sets.final.concat(passed).concat(internal));
  return final;
};

Task.prototype._extractArgs = function() {
  var merged = this._mergeSets(), args = [];

  merged.forEach(function(meta) {
    args.push(meta.actual);
  }, null);

  return args;
};
// TODO use tool.objForEach to keep DRY
Task.prototype._traverseSet = function(a, fn, cxt) {
  var meta, i = 0, shouldBreak = false;

  while (i < a.length) {
    if (shouldBreak) break;
    meta = a[i];
    fn.call(cxt, breakout, meta, i, changeI);
    i += 1;
  }

  return undefined;

  function breakout() {shouldBreak = true;}
  function changeI(n) {i = n};
};

Task.prototype._afterExecute = function () {
  var self = this;

  tool.objForEach(this.sets, function(breakout, set) {
    this._traverseSet(set, function(breakout2, meta, i, changeI) {
      if (meta.once) {
        this._removeDep(set, i, 1);
        changeI(--i);
      }
    }, self);
  }, self);
};

Task.prototype._mayExecute = function () {
  var self = this, ret = true;

  tool.objForEach(this.sets, function(breakout, set) {
    this._traverseSet(set, function(breakout2, meta) {
      var actual = meta.actual;

      if (isAsyncTask(actual) && !actual.executed) {
        ret = actual;
        breakout2();
        breakout();
      } else if (isAsyncTask(actual) || isTask(actual)){
        ret = actual._mayExecute();
        if (ret !== true) {
          breakout2();
          breakout();
        }
      }
    }, self);
  }, self);

  return ret;
};
// NOTE: changes in execute() must most likely be made in ./AsyncTask.js
Task.prototype.execute = function execute(aEC) {
  "use strict";//NOTE crucial

  if (isAEC(aEC)) {
    hasAEC = true;
  } else {
    aEC = this.defAEC
  }

  var hasAEC, args = hasAEC ? [].slice.call(arguments, 1) :
      [].slice.call(arguments), self = this, ret, tryOn;

  if (isAsyncTask(tryOn = this._mayExecute())) {
    if (this.autoRetry)
      tryOn.once("executed", tryAgain);
    return EXECUTION_DELAYED;
  }

  args.forEach(function regPassedArgs(actual) {
    var set, executable, index, once;

    set = "passed";
    executable = false;
    index = null;
    once = true;

    self._addSetEntry(set, actual, executable, index, once);
  }, null);

  ret = this.fn.apply(this, this._extractArgs());
  this._afterExecute();

  return ret;

  function tryAgain() {
    aEC(self.execute.apply(self, [aEC].concat(args)));
  }
};

module.exports = Task;
