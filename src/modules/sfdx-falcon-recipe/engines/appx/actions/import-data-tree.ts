//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @file          modules/sfdx-falcon-recipe/actions/import-data-tree.ts
 * @copyright     Vivek M. Chawla - 2018
 * @author        Vivek M. Chawla <@VivekMChawla>
 * @summary       Exposes the CLI Command force:data:tree:import
 * @description   Given an Alias and a data-plan.json file, uses the Salesforce CLI to import data
 *                to the Target Org.
 * @version       1.0.0
 * @license       MIT
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
// Import External Modules
import * as path                    from  'path';                           // Module. Node's path library.

// Import Local Modules
import {SfdxFalconDebug}            from  '../../../../sfdx-falcon-debug';  // Class. Internal Debug module
import {SfdxFalconResult}           from  '../../../../sfdx-falcon-result'; // Class. Provides framework for bubbling "results" up from nested calls.
import {SfdxFalconResultType}       from  '../../../../sfdx-falcon-result'; // Enum. Represents types of SfdxFalconResults.

// Executor Imports
import {executeSfdxCommand}         from  '../../../executors/sfdx';        // Function. SFDX Executor (CLI-based Commands).

// Engine/Action Imports
import {AppxEngineAction}           from  '../../appx/actions';             // Abstract class. Extend this to build a custom Action for the Appx Recipe Engine.
import {AppxEngineActionContext}    from  '../../appx';                     // Interface. Represents the context of an Appx Recipe Engine.
import {SfdxFalconActionType}       from  '../../../types/';                // Enum. Represents types of SfdxFalconActions.

// Set the File Local Debug Namespace
const dbgNs     = 'action:import-data-tree:';
const clsDbgNs  = 'ImportDataTreeAction:';

//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @class       ImportDataTreeAction
 * @extends     AppxEngineAction
 * @description Implements the action "import-data-tree".
 * @version     1.0.0
 * @public
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
export class ImportDataTreeAction extends AppxEngineAction {

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      initializeAction
   * @returns     {void}
   * @description Sets member variables based on the specifics of this action.
   * @version     1.0.0
   * @protected
   */
  //───────────────────────────────────────────────────────────────────────────┘
  protected initializeAction():void {

    // Set values for all the base member vars to better define THIS AppxEngineAction.
    this.actionType       = SfdxFalconActionType.SFDX_CLI;
    this.actionName       = 'import-data-tree';
    this.command          = 'force:data:tree:import';
    this.description      = 'Import Data Tree';
    this.successDelay     = 2;
    this.errorDelay       = 2;
    this.progressDelay    = 1000;
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      validateActionOptions
   * @param       {any}   actionOptions Required. The options that should be
   *              validated because they are required by this specific action.
   * @returns     {void}  
   * @description Given an object containing Action Options, make sure that 
   *              everything expected by this Action in order to properly
   *              execute has been provided.
   * @version     1.0.0
   * @protected
   */
  //───────────────────────────────────────────────────────────────────────────┘
  protected validateActionOptions(actionOptions:any):void {
    if (typeof actionOptions.plan === 'undefined') throw new Error(`ERROR_MISSING_OPTION: 'plan'`);
    // Save this for later when(if) we add support for individual SOBject tree files.
    //if (typeof actionOptions.plan === 'undefined' && typeof actionOptions.sObjectTreeFiles === 'undefined') {
    //  throw new Error(`ERROR_MISSING_OPTION: Either 'plan' or 'sObjectTreeFiles' must be provided`);
    //}
  }  

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      executeAction
   * @param       {any}   actionOptions Optional. Any options that the command
   *              execution logic will require in order to properly do its job.
   * @returns     {Promise<SfdxFalconResult>} Resolves with an SfdxFalconResult
   *              of type ACTION that has one or more EXECUTOR Results as 
   *              children.
   * @description Performs the custom logic that's wrapped by the execute method
   *              of the base class.
   * @version     1.0.0
   * @protected @async
   */
  //───────────────────────────────────────────────────────────────────────────┘
  protected async executeAction(actionContext:AppxEngineActionContext, actionOptions:any={}):Promise<SfdxFalconResult> {

    // Get an SFDX-Falcon Result that's customized for this Action.
    let actionResult = this.createActionResult(
      actionContext, actionOptions,
      { startNow:       true,
        bubbleError:    true,
        bubbleFailure:  true});
    // Add additional DETAIL for this Result (beyond what is added by createActionResult().
    actionResult.detail = {...{
      sfdxCommandDef:     null
    }};
    actionResult.debugResult(`Initialized`, `${dbgNs}executeAction`);    

    // Set the progress, error, and success messages for this action execution.
    this.progressMessage  = `Importing data based on ${actionOptions.plan}`;
    this.errorMessage     = `Data tree import failed for plan ${actionOptions.plan}`;
    this.successMessage   = `Data tree import succeeded for plan '${actionOptions.plan}'`;

    // Create an SFDX Command Definition object to specify which command the CLI will run.
    this.sfdxCommandDef = {
      command:      this.command,
      progressMsg:  this.progressMessage,
      errorMsg:     this.errorMessage,
      successMsg:   this.successMessage,
      observer:     actionContext.listrExecOptions.observer,
      commandArgs:  new Array<string>(),
      commandFlags: {
        FLAG_TARGETUSERNAME:  actionContext.targetOrg.alias,
        FLAG_PLAN:            path.join(actionContext.projectContext.dataPath, actionOptions.plan),
        FLAG_CONTENTTYPE:     'json',
        FLAG_JSON:            true,
        FLAG_LOGLEVEL:        actionContext.logLevel
      }
    }
    actionResult.detail.sfdxCommandDef = this.sfdxCommandDef;
    actionResult.debugResult(`SFDX Command Definition Created`, `${dbgNs}executeAction`);    

    // Run the executor then return or throw the result. If you want to override error handling, do it here.
    return await executeSfdxCommand(this.sfdxCommandDef)
      .then(executorResult => {

        actionResult.debugResult(`Executor Promise Resolved`, `${dbgNs}executeAction`);

        // Add the EXECUTOR result as a child of this function's ACTION Result, then return the ACTION Result.
        return actionResult.addChild(executorResult);
      })
      .catch(executorResult  => {

        actionResult.debugResult(`Executor Promise Rejected`, `${dbgNs}executeAction`);

        // Make sure any rejected promises are wrapped as an ERROR Result.
        executorResult = SfdxFalconResult.wrapRejectedPromise(executorResult, 'sfdx:executeSfdxCommand', SfdxFalconResultType.EXECUTOR);
        
        // Debug the rejected and wrapped EXECUTOR Result
        executorResult.debugResult(`Rejected Promise Wrapped as SFDX-Falcon Error`, `${dbgNs}executeAction`);

        // If the ACTION Result's "bubbleError" is TRUE, addChild() will throw an Error.
        return actionResult.addChild(executorResult);
      });
  }
}