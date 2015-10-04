exports.deepCpy = function deepCpy(o) {// own enumerable only
  var ret = Array.isArray(o) ? [] : {}, keys = Object.keys(o),
      len = keys.length;

      for (var i = 0, prop; i < len; i++) {
        prop = o[keys[i]];
        if (typeof prop === "object" && prop !== null) {
          prop = deepCpy(prop);
        }
        ret[keys[i]] = prop;
      }

    return ret;
};

// iterates over own enum and allow to break
exports.objForEach = function objForEach(o, fn, cxt) {
  var keys = Object.keys(o), shouldBreak = false, key;

  for (var i = 0, len = keys.length; i < len; i++) {
    if (shouldBreak) break;
    key = keys[i];

    fn.call(cxt, breakout, o[key], key, o);
  }
  return undefined;
  // closure
  function breakout() {
    shouldBreak = true;
  }
};
