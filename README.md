![build status badge](https://travis-ci.org/reecehudson/taskrunner.svg "build status image")
# Taskrunner #
***
## API ##
#### mkSequence (opts) ####
Returns an instance of [Sequence](#Sequence)
* `opts`
  * `autoRetry` determines if it should continue execution after all deps are
     ready, if true, it retries by passing the result to the function labeled
     as 'asynchronousExecutionCatcher' passed to `run()`. If it's not labeled or
     present, it uses `defAEC`. Default is `true`.
  * `defAEC` a function that is used to pass the result of `run()` when an
     [async task](#AsyncTask) impedes execution from completing.
     result of

#### mkTask (fn, opts [,arg1, arg2, ...]) ####
Returns an instance of [Task](#Task)
* `fn` the function (task) to execute
* `opts`
  * `autoRetry` determines if it should continue execution after all deps are
     ready, if true, it retries by passing the result to the function labeled
     as 'asynchronousExecutionCatcher' passed to `execute`. If it's not labeled or
     present, it uses `defAEC`. Default is `true`.
  * `defAEC` a function that is used to pass the result of `execute()` when an
     [async task](#AsyncTask) impedes execution from completing.
     result of
* Anything after will be registered as an arg of a task set.

#### mkAsyncTask (fn, opts [, arg1, arg2, ...]) ####
Returns an instance of [AsyncTask](#AsyncTask)
* `fn` the function (task) to execute
* `opts`
  * `autoRetry` determines if it should continue execution after all deps are
     ready, if true, it retries by passing the result to the function labeled
     as 'asynchronousExecutionCatcher' passed to `execute`. If it's not labeled or
     present, it uses `defAEC`. Default is `true`.
  * `defAEC` a function that is used to pass the result of `execute()` when an
     [async task](#AsyncTask) impedes execution from completing.
     result of
*  Anything after will be registered as an arg of a task set.

### <a name="Sequence"></a>Sequence ###
#### addTask (fn, opts [, arg1, arg2, ...]) ####
Creates and returns a new instance of [Task](#Task).
* `fn` the function (task) to execute
* `opts`
    * `autoRetry` determines if it should continue execution after all deps are
       ready, if true, it retries by passing the result to the function labeled
       as 'asynchronousExecutionCatcher' passed to `execute`. If it's not labeled or
       present, it uses `defAEC`. Default is `true`.
    * `defAEC` a function that is used to pass the result of `execute()` when an
       [async task](#AsyncTask) impedes execution from completing.
       result of
*  Anything after will be registered as an arg of a task set.


#### addAsyncTask (fn, opts [, arg1, arg2, ...]) ####
Creates and returns a new instance of [AsyncTask](#addAsyncTask)
* `fn` the function (task) to execute
* `opts`
  * `autoRetry` determines if it should continue execution after all deps are
     ready, if true, it retries by passing the result to the function labeled
     as 'asynchronousExecutionCatcher' passed to `execute`. If it's not labeled or
     present, it uses `defAEC`. Default is `true`.
  * `defAEC` a function that is used to pass the result of `execute()` when an
     [async task](#AsyncTask) impedes execution from completing.
     result of
*  Anything after will be registered as an arg of a task *set*.


#### run ([aEC] [, arg1, arg2, ...]) ####
Runs the sequence.  Returns the result of the last task in the sequence.
* `aEC` must be labeled with the property `.asyncExecCatcher`; if passed is used
   instead of defAEC,
* Anything after will be registered as an arg of set *passed* to the **first
  task** in the lineup

### <a name="Task"></a>Task ###
Used to represent any function that is to be executed.
#### addDep (fn, [,index] [,set])
Adds a dependency to the task being called from. Essentially, a dep is a function
whose return value will be used as the arg passed to the task.  Returns the `id`
of the task.
* `fn` any valid function
* `index`, 0-based index of where the arg (dep's result) will be place relative
  to `set`
* `set` any 1 of the 5 valid sets

#### removeDep (id) ####
Removes the dep by id of the task from wich it was called.  Returns the fn
  of the removed dep or signal `ID_UNRESOLVED`.
  * `id`, the id of the dep redturned by `addDep()`

#### moveDep (id, index [,set])
Moves a dep's placement.  Return the new id of the dep or `ID_UNRESOLVED`
* `id`, id number refering to the dep
* `index`, the new index
* `set`, the set to place `index`

#### execute ([aEF] [, arg1, arg2, ...]) ####
Executes the task.  Returns the result of the task or `EXECUTION_DELAYED`.
* `aEF`, a function labeled by a prop `asyncExecCatcher` that is to *catch* the
  result of the task if `EXECUTION_DELAYED` is initially returned.
* Anything after will be registered as an arg of set *passed*

### <a name="AsyncTask"></a>AsyncTask
Inherits from [Task](#Task) and EventEmitter. Used for tasks that will be called
at some point later.
#### getCb() ####
Returns a function to be called by the user when the async task should be
executed. The return function acts the same as `Task.prototype.execute()`.

#### getResult() ####
Returns the result of the async task if it was executed or `ASYNC_NOT_EXECUTED`

## Sets#
Sets are used to give relativity when referring to an index of a dep.  They are
better understood if you talk about the as, <index> of <set>,
  e.g. 0 of task
       0 of final

There are a total of five sets and they go like this: `dep` and `task` makeup
`internal`; `internal` and `passed` makeup final.

                                 final
                                /      \
                            passed    internal
                                      /      \                 
                                    task     dep

TODO: provide a friendly graphic

**dep** is used as a default when using `addDep()`
**task** is used when passing args at the time of creating the task, such as,
`mkTask()`, `mkAsyncTask()`, `tsk.addTask()`, `tsk.addAsyncTask()`
**internal** is comprises the above
**passed** is used when finally executing the task and passing the args at the
last second, `execute()`
**final** comrpises all of the above

## Signals #
Signals can be accessed by `require("taskrunner").signals`.  Signals are can be
thought of placeholders or types that have specific significance.  Say, instead
of returning null in a function and surmising that an 'id' wasn't found, we use
signals to specifically know the reason.

TODO: add a friendly graphic depecting a bad ass sequence flow
