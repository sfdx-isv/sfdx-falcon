//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @file          modules/sfdx-falcon-recipe/actions/install-package.ts
 * @copyright     Vivek M. Chawla - 2018
 * @author        Vivek M. Chawla <@VivekMChawla>
 * @version       1.0.0
 * @license       MIT
 * @summary       Exposes the CLI Command force:package:install
 * @description   Installs a First-Generation managed or unmanaged package into the target org.
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
// Import Local Modules
import {SfdxFalconDebug}            from  '../../../../sfdx-falcon-debug';  // Class. Internal Debug module
// Executor Imports
import {executeSfdxCommand}         from  '../../../executors/sfdx';        // Function. SFDX Executor (CLI-based Commands).
// Engine/Action Imports
import {AppxEngineAction}           from  '../../appx/actions';             // Abstract class. Extend this to build a custom Action for the Appx Recipe Engine.
import {AppxEngineActionContext}    from  '../../appx';                     // Interface. Represents the context of an Appx Recipe Engine.
import {SfdxFalconActionType}       from  '../../../engines';               // Enum. Represents types of SfdxFalconActions.

// Set the File Local Debug Namespace
const dbgNs     = 'action:install-package:';
const clsDbgNs  = 'InstallPackageAction:';

//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @class       InstallPackageAction
 * @extends     AppxEngineAction
 * @description Implements the action "install-package".
 * @version     1.0.0
 * @public
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
export class InstallPackageAction extends AppxEngineAction {

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
    this.actionName       = 'install-package';
    this.command          = 'force:package:install';
    this.description      = 'Install Package';
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
    if (typeof actionOptions.packageName       === 'undefined') throw new Error(`ERROR_MISSING_OPTION: 'packageName'`);
    if (typeof actionOptions.packageVersionId  === 'undefined') throw new Error(`ERROR_MISSING_OPTION: 'packageVersionId'`);
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
    this.progressMessage  = `Installing '${actionOptions.packageName}' (${actionOptions.packageVersionId}) into ${actionContext.targetOrg.alias}`;
    this.errorMessage     = `Installation of package '${actionOptions.packageName}' (${actionOptions.packageVersionId}) failed`;
    this.successMessage   = `Package '${actionOptions.packageName}' (${actionOptions.packageVersionId}) successfully installed into ${actionContext.targetOrg.alias}`;

    // Create an SFDX Command Definition object to specify which command the CLI will run.
    this.sfdxCommandDef = {
      command:      this.command,
      progressMsg:  this.progressMessage,
      errorMsg:     this.errorMessage,
      successMsg:   this.successMessage,
      observer:     actionContext.listrExecOptions.observer,
      commandArgs:  [] as [string],
      commandFlags: {
        FLAG_TARGETUSERNAME:  actionContext.targetOrg.alias,
        FLAG_PACKAGE:         actionOptions.packageVersionId,
        FLAG_WAIT:            10,
        FLAG_PUBLISHWAIT:     10,
        FLAG_NOPROMPT:        true,
        FLAG_JSON:            true,
        FLAG_LOGLEVEL:        actionContext.logLevel
      }
    }
    SfdxFalconDebug.obj(`FALCON_EXT:${dbgNs}`, this.sfdxCommandDef, `${clsDbgNs}executeAction:sfdxCommandDef: `);

    // Run the executor then store or throw the result. If you want to override error handling, do it here.
    await executeSfdxCommand(this.sfdxCommandDef)
      .then(execSuccessResult => {
        this.actionResponse.execSuccess(execSuccessResult);
      })
      .catch(execErrorResult  => {
        this.actionResponse.execFailure(execErrorResult);
        throw execErrorResult;
      });

    // The Action has now been run. Code in the base class will handle the return to the Engine->Recipe->User.
    return;
  }
}