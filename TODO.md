* add async support
* NOTE the folder structure follows jshint dir structure, so dist file is
*   meant to be for any platform (browsers & node).  Keep investigateing the
*   jshint dist function
*  use a modulizer to provide module dependencies on the browser and node
* in the asynctask module, use a single function that captures the call stack
*   and uses the input as the asynt intance to check if has been both called
*   and executed (this aids in DRY pattern and uses the error as advatnage)
*   name it `checkState`.
* have a dep module with Dependency being the constructor and abstracting
*   dependency interaction to a single point such as execute() with task instead
*   of having to check for an fn or task or sequence ...
