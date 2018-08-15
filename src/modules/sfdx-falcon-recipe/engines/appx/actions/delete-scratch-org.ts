//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @file          modules/sfdx-falcon-recipe/actions/delete-scratch-org.ts
 * @copyright     Vivek M. Chawla - 2018
 * @author        Vivek M. Chawla <@VivekMChawla>
 * @summary       Exposes the CLI Command force:org:delete
 * @description   Marks the specified scratch org for deletion.
 * @version       1.0.0
 * @license       MIT
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
// Import Local Modules
import {SfdxFalconDebug}            from  '../../../../sfdx-falcon-debug';  // Class. Internal Debug module
// Executor Imports
import {executeSfdxCommand}         from  '../../../executors/sfdx';        // Function. SFDX Executor (CLI-based Commands).
import {SfdxFalconExecutorResponse} from  '../../../executors';             // Class. Primary way for Executors to communicate status with callers.
import {SfdxFalconExecutorStatus}   from  '../../../executors';             // Enum. Represents the status of an Executor as part of an SFDX-Falcon Executor Response.
// Engine/Action Imports
import {AppxEngineAction}           from  '../../appx/actions';             // Abstract class. Extend this to build a custom Action for the Appx Recipe Engine.
import {AppxEngineActionContext}    from  '../../appx';                     // Interface. Represents the context of an Appx Recipe Engine.
import {SfdxFalconActionType}       from  '../../../engines';               // Enum. Represents types of SfdxFalconActions.

// Set the File Local Debug Namespace
const dbgNs     = 'action:delete-scratch-org:';
const clsDbgNs  = 'DeleteScratchOrgAction:';

//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @class       DeleteScratchOrgAction
 * @extends     AppxEngineAction
 * @description Implements the action "delete-scratch-org".
 * @version     1.0.0
 * @public
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
export class DeleteScratchOrgAction extends AppxEngineAction {

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
    this.actionName       = 'delete-scratch-org';
    this.command          = 'force:org:delete';
    this.description      = 'Delete Scratch Org';
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
   * @private
   */
  //───────────────────────────────────────────────────────────────────────────┘
  protected validateActionOptions(actionOptions:any):void {
    if (typeof actionOptions.scratchOrgAlias === 'undefined') throw new Error(`ERROR_MISSING_OPTION: 'scratchOrgAlias'`);
  }  

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      executeAction
   * @param       {any}   actionOptions Optional. Any options that the command
   *              execution logic will require in order to properly do its job.
   * @returns     {Promise<void>}
   * @description Performs the custom logic that's wrapped by the execute method
   *              of the base class.
   * @version     1.0.0
   * @protected @async
   */
  //───────────────────────────────────────────────────────────────────────────┘
  protected async executeAction(actionContext:AppxEngineActionContext, actionOptions:any={}):Promise<void> {

    // Set the progress, error, and success messages for this action execution.
    this.progressMessage  = `Marking scratch org '${actionOptions.scratchOrgAlias}' for deletion`;
    this.errorMessage     = `Request to mark scratch org '${actionOptions.scratchOrgAlias}' for deletion failed`;
    this.successMessage   = `Scratch org '${actionOptions.scratchOrgAlias}' successfully marked for deletion`;

    // Create an SFDX Command Definition object to specify which command the CLI will run.
    this.sfdxCommandDef = {
      command:      this.command,
      progressMsg:  this.progressMessage,
      errorMsg:     this.errorMessage,
      successMsg:   this.successMessage,
      observer:     actionContext.listrExecOptions.observer,
      commandArgs:  [] as [string],
      commandFlags: {
        FLAG_TARGETUSERNAME:        actionContext.targetOrg.alias,
        FLAG_TARGETDEVHUBUSERNAME:  actionContext.devHubAlias,
        FLAG_NOPROMPT:              true,
        FLAG_JSON:                  true,
        FLAG_LOGLEVEL:              actionContext.logLevel
      }
    }
    SfdxFalconDebug.obj(`FALCON_EXT:${dbgNs}`, this.sfdxCommandDef, `${clsDbgNs}executeAction:sfdxCommandDef: `);

    // Execute the SFDX Command using an SFDX Executor. Base class handles success/error.
    await executeSfdxCommand(this.sfdxCommandDef)
      .then(execSuccessResponse => {
        this.actionResponse.execSuccess(execSuccessResponse);
      })
      .catch(execErrorResponse => {
        // Check if the Executor Error Response is due to a thrown Error (not a FAILURE).
        if (execErrorResponse.status === SfdxFalconExecutorStatus.ERROR) {
          this.actionResponse.execFailure(execErrorResponse);
          throw execErrorResponse;
        }
        // Check if the execErrorResponse is a directly thrown Error
        if (execErrorResponse instanceof Error) {
          let newExecErrorResponse = new SfdxFalconExecutorResponse('executeSfdxCommand');
          newExecErrorResponse.error(execErrorResponse)
          this.actionResponse.execFailure(newExecErrorResponse);
          throw newExecErrorResponse;  
        }
        // Finally, suppress any FAILURES because we might be deleting a scratch org that doesn't exist.
        execErrorResponse.code    = -1;                                       // Change code to "warning" (-1)
        execErrorResponse.message = `WARNING: ${execErrorResponse.message}`;  // Massage the message
        execErrorResponse.status  = SfdxFalconExecutorStatus.WARNING;         // Change status to WARNING

        // Put this execErrorResponse in the SUCCESS array
        this.actionResponse.execSuccess(execErrorResponse);

        // Done! DO NOT THROW!
      });

    // The Action has now been run. Code in the base class will handle the return to the Engine->Recipe->User.
    return;
  }
}