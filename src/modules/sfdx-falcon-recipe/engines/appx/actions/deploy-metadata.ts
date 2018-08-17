//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @file          modules/sfdx-falcon-recipe/actions/deploy-metadata.ts
 * @copyright     Vivek M. Chawla - 2018
 * @author        Vivek M. Chawla <@VivekMChawla>
 * @summary       Exposes the CLI Command force:mdapi:deploy
 * @description   Deploys Salesforce metadata via the MDAPI from the given metadata source directory
 *                to the target org.
 * @version       1.0.0
 * @license       MIT
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
// Import External Modules
import * as path                    from  'path';                           // Module. Node's path library.
// Import Local Modules
import {SfdxFalconDebug}            from  '../../../../sfdx-falcon-debug';  // Class. Internal Debug module
// Executor Imports
import {executeSfdxCommand}         from  '../../../executors/sfdx';        // Function. SFDX Executor (CLI-based Commands).
import {SfdxFalconExecutorResponse} from  '../../../executors';             // Class. Primary way for Executors to communicate status with callers.
// Engine/Action Imports
import {AppxEngineAction}           from  '../../appx/actions';             // Abstract class. Extend this to build a custom Action for the Appx Recipe Engine.
import {AppxEngineActionContext}    from  '../../appx';                     // Interface. Represents the context of an Appx Recipe Engine.
import {SfdxFalconActionType}       from  '../../../engines';               // Enum. Represents types of SfdxFalconActions.

// Set the File Local Debug Namespace
const dbgNs     = 'action:deploy-metadata:';
const clsDbgNs  = 'DeployMetadataAction:';

//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @class       DeployMetadataAction
 * @extends     AppxEngineAction
 * @description Implements the action "deploy-metadata".
 * @version     1.0.0
 * @public
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
export class DeployMetadataAction extends AppxEngineAction {

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
    this.actionName       = 'deploy-metadata';
    this.command          = 'force:mdapi:deploy';
    this.description      = 'Deploy Metadata';
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
    if (typeof actionOptions.mdapiSource === 'undefined') throw new Error(`ERROR_MISSING_OPTION: 'mdapiSource'`);
  }  

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      executeAction
   * @param       {any}   actionOptions Optional. Any options that the command
   *              execution logic will require in order to properly do its job.
   * @returns     {Promise<SfdxFalconExecutorResponse>}
   * @description Performs the custom logic that's wrapped by the execute method
   *              of the base class.
   * @version     1.0.0
   * @protected @async
   */
  //───────────────────────────────────────────────────────────────────────────┘
  protected async executeAction(actionContext:AppxEngineActionContext, actionOptions:any={}):Promise<SfdxFalconExecutorResponse> {

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

    // Run the executor then store or throw the result. If you want to override error handling, do it here.
    return await executeSfdxCommand(this.sfdxCommandDef)
      .then(execSuccessResponse => {
        // Make sure any resolved promises are wrapped as an SFDX-Falcon Executor Response.
        execSuccessResponse = SfdxFalconExecutorResponse.wrap(execSuccessResponse, 'executeSfdxCommand');
        // If you want to add additional SUCCESS handling behavior, do it here.
        return execSuccessResponse;
      })
      .catch(execErrorResponse  => {
        // Make sure any rejected promises are wrapped as an SFDX-Falcon Executor Response.
        execErrorResponse = SfdxFalconExecutorResponse.wrap(execErrorResponse, 'executeSfdxCommand');
        // If you want to add additional FAILURE handling behavior, do it here.
        throw execErrorResponse;
      });

    // The Action has now been run. Code in the base class will handle the return to the Engine->Recipe->User.
//    return;
  }
}