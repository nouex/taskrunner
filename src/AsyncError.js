"use strict";

var util = require("util");

module.exports = AsyncError;

util.inherits(AsyncError, Error);
function AsyncError () {

}
