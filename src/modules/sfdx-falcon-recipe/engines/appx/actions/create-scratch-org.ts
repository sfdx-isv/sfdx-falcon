//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @file          modules/sfdx-falcon-recipe/actions/create-scratch-org.ts
 * @copyright     Vivek M. Chawla - 2018
 * @author        Vivek M. Chawla <@VivekMChawla>
 * @summary       Exposes the CLI Command force:org:create
 * @description   Creates a new scratch org when given an Alias and a scratch-def.json file.
 * @version       1.0.0
 * @license       MIT
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
// Import External Modules
import * as path                    from  'path';                           // Module. Node's path library.
// Import Local Modules
import {SfdxFalconDebug}            from  '../../../../sfdx-falcon-debug';  // Class. Internal Debug module
import {SfdxFalconError2}           from  '../../../../sfdx-falcon-error/index.2';  // Class. Provides customized Error Services that wrap SfdxError.
import {SfdxFalconResult}           from  '../../../../sfdx-falcon-result'; // Class. Provides framework for bubbling "results" up from nested calls.
import {SfdxFalconResultType}       from  '../../../../sfdx-falcon-result'; // Enum. Represents types of SfdxFalconResults.
// Executor Imports
import {executeSfdxCommand}         from  '../../../executors/sfdx';        // Function. SFDX Executor (CLI-based Commands).
// Engine/Action Imports
import {AppxEngineAction}           from  '../../appx/actions';             // Abstract class. Extend this to build a custom Action for the Appx Recipe Engine.
import {AppxEngineActionContext}    from  '../../appx';                     // Interface. Represents the context of an Appx Recipe Engine.
import {SfdxFalconActionType}       from  '../../../types/';               // Enum. Represents types of SfdxFalconActions.

// Set the File Local Debug Namespace
const dbgNs     = 'action:create-scratch-org:';
const clsDbgNs  = 'CreateScratchOrgAction:';

//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @class       CreateScratchOrgAction
 * @extends     AppxEngineAction
 * @description Implements the action "create-scratch-org".
 * @version     1.0.0
 * @public
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
export class CreateScratchOrgAction extends AppxEngineAction {

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
    this.actionName       = 'create-scratch-org';
    this.command          = 'force:org:create';
    this.description      = 'Create Scratch Org';
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
    if (typeof actionOptions.scratchOrgAlias === 'undefined') throw new Error(`ERROR_MISSING_OPTION: 'scratchOrgAlias'`);
    if (typeof actionOptions.scratchDefJson  === 'undefined') throw new Error(`ERROR_MISSING_OPTION: 'scratchDefJson'`);
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

    // Set the progress, error, and success messages for this action execution.
    this.progressMessage  = `Creating scratch org '${actionOptions.scratchOrgAlias}' using ${actionOptions.scratchDefJson} (this can take 3-10 minutes)`;
    this.errorMessage     = `Failed to create scratch org using ${actionOptions.scratchDefJson}`;
    this.successMessage   = `Scratch org '${actionOptions.scratchOrgAlias}' created successfully using ${actionOptions.scratchDefJson}`;

    // Create an SFDX Command Definition object to specify which command the CLI will run.
    this.sfdxCommandDef = {
      command:      this.command,
      progressMsg:  this.progressMessage,
      errorMsg:     this.errorMessage,
      successMsg:   this.successMessage,
      observer:     actionContext.listrExecOptions.observer,
      commandArgs:  new Array<string>(),
      commandFlags: {
        FLAG_TARGETDEVHUBUSERNAME:  actionContext.devHubAlias,
        FLAG_DEFINITIONFILE:        path.join(actionContext.projectContext.configPath, actionOptions.scratchDefJson),
        FLAG_SETALIAS:              actionOptions.scratchOrgAlias,
        FLAG_DURATIONDAYS:          30,
        FLAG_WAIT:                  10,
        FLAG_NONAMESPACE:           true,
        FLAG_SETDEFAULTUSERNAME:    true,
        FLAG_JSON:                  true,
        FLAG_LOGLEVEL:              actionContext.logLevel
      }
    }
    SfdxFalconDebug.obj(`FALCON_EXT:${dbgNs}`, this.sfdxCommandDef, `${clsDbgNs}executeAction:sfdxCommandDef: `);

    // Get an SFDX-Falcon Result that's customized for this Action.
    let falconActionResult = this.createActionResult(actionContext, actionOptions,       
                                                    { startNow:       true,
                                                      bubbleError:    true,
                                                      bubbleFailure:  true});

    // Run the executor then return or throw the result. If you want to override error handling, do it here.
    return await executeSfdxCommand(this.sfdxCommandDef)
      .then(falconExecutorResult => {

        // OPTIONAL: If you want to implement custom SUCCESS/FAILURE/WARNING/UNKNOWN logic, do it here.

        // Add the EXECUTOR result as a child of this function's ACTION Result, then return the ACTION Result.
        return falconActionResult.addChild(falconExecutorResult);
      })
      .catch(falconExecutorResult  => {

        // OPTIONAL: If you want to add additional ERROR handling behavior, do it here.

        // Make sure any rejected promises are wrapped as an ERROR Result.
        falconExecutorResult = SfdxFalconResult.wrapRejectedPromise(falconExecutorResult, 'ExecutorResult (REJECTED)', SfdxFalconResultType.EXECUTOR);
        
        // If the ACTION Result's "bubbleError" is TRUE, addChild() will throw an Error.
        return falconActionResult.addChild(falconExecutorResult);
      });
  }
}