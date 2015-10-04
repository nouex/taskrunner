* create an optionally turned on complexity metric
*   i.e. measuring the horizontal (sequence) and vertical (dependencies)
*   
* SPEED up _mayExecute() by having own instance flags indicating the last
*   update (if no change since last update, use that state)
*   use the complexity metrics to turn this on after a taskrunner structure
*   gets too complicated (meanint the _mayExecute()) would way long to check
* TEST the added opts param and whatever it affects (unstable for now)
* TEST index.js
* HUMANIZE signals by logging (if logging option is on) them to a stream
