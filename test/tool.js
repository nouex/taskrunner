"use strict";

var tool = require("../lib/tool.js");

describe("deepCpy()", function() {
  it ("copies own enum & deep", function() {
    var arr = [{}, {"a": {}}];
    var cpd = tool.deepCpy(arr);

    expect(cpd).not.toBe(arr);
    expect(cpd[0]).not.toBe(arr[0]);
    expect(cpd[1].a).not.toBe(arr[1].a)
  })
});

describe("objForEach()", function() {
  it ("")
});
