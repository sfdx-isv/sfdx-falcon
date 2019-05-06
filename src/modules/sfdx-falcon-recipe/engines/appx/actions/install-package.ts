//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @file          modules/sfdx-falcon-recipe/actions/install-package.ts
 * @copyright     Vivek M. Chawla - 2018
 * @author        Vivek M. Chawla <@VivekMChawla>
 * @summary       Exposes the CLI Command force:package:install
 * @description   Installs a First-Generation managed or unmanaged package into the target org.
 * @version       1.0.0
 * @license       MIT
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
// Import Local Modules
import {SfdxFalconResult}           from  '../../../../sfdx-falcon-result'; // Class. Provides framework for bubbling "results" up from nested calls.
import {SfdxFalconResultOptions}    from  '../../../../sfdx-falcon-result'; // Interface. Represents the options that can be set when an SfdxFalconResult object is constructed.
import {SfdxFalconResultType}       from  '../../../../sfdx-falcon-result'; // Interface. Represents the different types of sources where Results might come from.

// Executor Imports
import {executeSfdxCommand}         from  '../../../executors/sfdx';  // Function. SFDX Executor (CLI-based Commands).
import {SfdxCommandDefinition}      from  '../../../executors/sfdx';  // Interface. Represents an SFDX "Command Definition" that can be compiled into a string that can be executed at the command line against the Salesforce CLI.

// Engine/Action Imports
import {AppxEngineActionContext}    from  '../../appx';         // Interface. Represents the context of an Appx Recipe Engine.
import {AppxEngineAction}           from  '../../appx/actions'; // Abstract class. Extend this to build a custom Action for the Appx Recipe Engine.
import {SfdxCliActionResultDetail}  from  '../../appx/actions'; // Interface. Represents the "detail" information that every SFDX-CLI ACTION result should have.

// Import Recipe Types
import {ActionOptions}              from  '../../../types/';    // Type. Alias to JsonMap.
import {ExecutorMessages}           from  '../../../types/';    // Interface. Represents the standard messages that most Executors use for Observer notifications.
import {SfdxFalconActionType}       from  '../../../types/';    // Enum. Represents types of SfdxFalconActions.

// Set the File Local Debug Namespace
const dbgNs     = 'ACTION:install-package:';


//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @interface   ActionResultDetail
 * @extends     SfdxCliActionResultDetail
 * @description Represents the structure of the "Result Detail" object used by this ACTION.
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
// NOTE: Left commented out because there are no additional option properties for this Action.
//interface ActionResultDetail extends SfdxCliActionResultDetail {}

//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @class       InstallPackageAction
 * @extends     AppxEngineAction
 * @description Implements the action "install-package".
 * @public
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
export class InstallPackageAction extends AppxEngineAction {

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      initializeAction
   * @returns     {void}
   * @description Sets member variables based on the specifics of this action.
   * @protected
   */
  //───────────────────────────────────────────────────────────────────────────┘
  protected initializeAction():void {

    // Set values for all the base member vars to better define THIS AppxEngineAction.
    this.actionType       = SfdxFalconActionType.SFDX_CLI;
    this.actionName       = 'install-package';
    this.description      = 'Install Package';
    this.successDelay     = 2;
    this.errorDelay       = 2;
    this.progressDelay    = 1000;
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      validateActionOptions
   * @param       {ActionOptions} actionOptions Required. The options that
   *              should be validated because they are required by this specific
   *              action.
   * @returns     {void}
   * @description Given an object containing Action Options, make sure that
   *              everything expected by this Action in order to properly
   *              execute has been provided.
   * @protected
   */
  //───────────────────────────────────────────────────────────────────────────┘
  protected validateActionOptions(actionOptions:ActionOptions):void {
    if (typeof actionOptions.packageName       === 'undefined') throw new Error(`ERROR_MISSING_OPTION: 'packageName'`);
    if (typeof actionOptions.packageVersionId  === 'undefined') throw new Error(`ERROR_MISSING_OPTION: 'packageVersionId'`);
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      executeAction
   * @param       {ActionOptions} [actionOptions] Optional. Any options that the
   *              command execution logic will require in order to properly do
   *              its job.
   * @returns     {Promise<SfdxFalconResult>} Resolves with an SfdxFalconResult
   *              of type ACTION that has one or more EXECUTOR Results as
   *              children.
   * @description Performs the custom logic that's wrapped by the execute method
   *              of the base class.
   * @protected @async
   */
  //───────────────────────────────────────────────────────────────────────────┘
  protected async executeAction(actionContext:AppxEngineActionContext, actionOptions:ActionOptions={}):Promise<SfdxFalconResult> {

    // Get an SFDX-Falcon Result that's customized for this Action.
    const actionResult = this.createActionResult(
      actionContext, actionOptions,
      { startNow:       true,
        bubbleError:    true,
        bubbleFailure:  true,
        failureIsError: true} as SfdxFalconResultOptions);

    // Merge core DETAIL added by createActionResult() with additional DETAIL for this specific Result.
    actionResult.detail = {
      ...actionResult.detail,
      ...{
        executorMessages:   null,
        sfdxCommandDef:     null
      }
    } as SfdxCliActionResultDetail;
    actionResult.debugResult(`Initialized`, `${dbgNs}executeAction:`);

    // Create a typed variable to represent this function's ACTION Result Detail.
    const actionResultDetail = actionResult.detail as SfdxCliActionResultDetail;
    
    // Define the messages that are relevant to this Action
    const executorMessages = {
      progressMsg:  `Installing '${actionOptions.packageName}' (${actionOptions.packageVersionId}) into ${actionContext.targetOrg.alias}`,
      errorMsg:     `Installation of package '${actionOptions.packageName}' (${actionOptions.packageVersionId}) failed`,
      successMsg:   `Package '${actionOptions.packageName}' (${actionOptions.packageVersionId}) successfully installed into ${actionContext.targetOrg.alias}`
    } as ExecutorMessages;
    actionResultDetail.executorMessages = executorMessages;
    actionResult.debugResult(`Executor Messages Set`, `${dbgNs}executeAction:`);

    // Create an SFDX Command Definition object to specify which command the CLI will run.
    const sfdxCommandDef = {
      command:      'force:package:install',
      progressMsg:  executorMessages.progressMsg,
      errorMsg:     executorMessages.errorMsg,
      successMsg:   executorMessages.successMsg,
      observer:     actionContext.listrExecOptions.observer,
      commandArgs:  new Array<string>(),
      commandFlags: {
        FLAG_TARGETUSERNAME:  actionContext.targetOrg.alias,
        FLAG_PACKAGE:         actionOptions.packageVersionId,
        FLAG_WAIT:            10,
        FLAG_PUBLISHWAIT:     10,
        FLAG_NOPROMPT:        true,
        FLAG_JSON:            true,
        FLAG_LOGLEVEL:        actionContext.logLevel
      }
    } as SfdxCommandDefinition;
    actionResultDetail.sfdxCommandDef = sfdxCommandDef;
    actionResult.debugResult(`SFDX Command Definition Created`, `${dbgNs}executeAction:`);

    // Run the executor then return or throw the result.
    // OPTIONAL: If you want to override success/error handling, do it here.
    return await executeSfdxCommand(sfdxCommandDef)
      .catch(rejectedPromise => actionResult.addRejectedChild(rejectedPromise, SfdxFalconResultType.EXECUTOR, `sfdx:executeSfdxCommand`))
      .then(resolvedPromise => {
        if (resolvedPromise === actionResult) {
          // If "resolvedPromise" points to the same location in memory as "actionResult", it means that
          // executeSfdxCommand() returned an ERROR which was suppressed. If you don't want to suppress EXECUTOR
          // errors, the ACTION Result used by this class must be instantiated with "bubbleError" set to FALSE.
          return actionResult;
        }
        return actionResult.addResolvedChild(resolvedPromise, SfdxFalconResultType.EXECUTOR, `sfdx:executeSfdxCommand`);
      });
  }
}
