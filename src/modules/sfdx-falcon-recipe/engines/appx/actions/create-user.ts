//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @file          modules/sfdx-falcon-recipe/actions/create-user.ts
 * @copyright     Vivek M. Chawla - 2018
 * @author        Vivek M. Chawla <@VivekMChawla>
 * @summary       Uses JSForce to create a user in the Target Org.
 * @description   Uses JSForce to create a user in the Target Org.
 * @version       1.0.0
 * @license       MIT
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
// Import External Modules/Types
import {JsonMap}                      from  '@salesforce/ts-types'; // Any JSON compatible object.

// Import Local Modules
import {SfdxFalconResult}             from  '../../../../sfdx-falcon-result'; // Class. Provides framework for bubbling "results" up from nested calls.
import {SfdxFalconResultOptions}      from  '../../../../sfdx-falcon-result'; // Interface. Represents the options that can be set when an SfdxFalconResult object is constructed.
import {SfdxFalconResultType}         from  '../../../../sfdx-falcon-result'; // Interface. Represents the different types of sources where Results might come from.

// Executor Imports
import {createUser}                   from  '../../../executors/hybrid';  // Function. Hybrid executor

// Engine/Action Imports
import {AppxEngineActionContext}      from  '../../appx';         // Interface. Represents the context of an Appx Recipe Engine.
import {AppxEngineAction}             from  '../../appx/actions'; // Abstract class. Extend this to build a custom Action for the Appx Recipe Engine.
import {CoreActionResultDetail}       from  '../../appx/actions'; // Interface. Represents the core "result detail" info common to every ACTION.

// Import Recipe Types
import {ActionOptions}                from  '../../../types/';    // Type. Alias to JsonMap.
import {ExecutorMessages}             from  '../../../types/';    // Interface. Represents the standard messages that most Executors use for Observer notifications.
import {SfdxFalconActionType}         from  '../../../types/';    // Enum. Represents types of SfdxFalconActions.

// Import Utility Functions
import {createUniqueUsername}         from  '../../../../sfdx-falcon-util'; // Function. Adds a UUID to a username to create something unique.
import {readConfigFile}               from  '../../../../sfdx-falcon-util';   // Function. Reads a JSON config file from disk and returns as JS Object.

// Set the File Local Debug Namespace
const dbgNs     = 'ACTION:create-user:';


//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @interface   ActionResultDetail
 * @extends     CoreActionResultDetail
 * @description Represents the structure of the "Result Detail" object used by this ACTION.
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
interface ActionResultDetail extends CoreActionResultDetail {
  userDefinition:   JsonMap;
  uniqueUsername:   string;
  defaultPassword:  string;
}

//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @class       CreateUserAction
 * @extends     AppxEngineAction
 * @description Implements the action "create-user".
 * @public
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
export class CreateUserAction extends AppxEngineAction {

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
    this.actionType       = SfdxFalconActionType.SFDC_API;
    this.actionName       = 'create-user';
    this.description      = 'Create User';
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
    if (typeof actionOptions.definitionFile === 'undefined') throw new Error(`ERROR_MISSING_OPTION: 'definitionFile'`);
    if (typeof actionOptions.sfdxUserAlias  === 'undefined') throw new Error(`ERROR_MISSING_OPTION: 'sfdxUserAlias'`);
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      executeAction
   * @param       {ActionOptions} actionOptions Optional. Any options that the
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
        userDefinition:     null,
        uniqueUsername:     null,
        defaultPassword:    null
      }
    } as ActionResultDetail;
    actionResult.debugResult(`Initialized`, `${dbgNs}executeAction:`);

    // Create a typed variable to represent this function's ACTION Result Detail.
    const actionResultDetail = actionResult.detail as ActionResultDetail;

    // Find and read the user definition file.
    const userDefinition = await readConfigFile(actionContext.projectContext.configPath, actionOptions.definitionFile as string)
      .catch(error => { actionResult.throw(error); });
    actionResultDetail.userDefinition = userDefinition as JsonMap;
    actionResult.debugResult(`User Definition File Read`, `${dbgNs}executeAction:`);

    // Create a unique username based on what's in the definition file.
    const uniqueUsername  = createUniqueUsername(userDefinition['Username']);
    actionResultDetail.uniqueUsername = uniqueUsername;
    actionResult.debugResult(`Unique Username Generated`, `${dbgNs}executeAction:`);

    // Determine what the appropriate default password should be.
    const defaultPassword = determineDefaultPassword(userDefinition['password']);
    actionResultDetail.defaultPassword = defaultPassword;
    actionResult.debugResult(`Default Password Determined`, `${dbgNs}executeAction:`);

    // Define the messages for this command.
    const executorMessages = {
      progressMsg:  `Creating User '${uniqueUsername}' in ${actionContext.targetOrg.alias}`,
      errorMsg:     `Failed to create User '${uniqueUsername}' in ${actionContext.targetOrg.alias}`,
      successMsg:   `User '${uniqueUsername}' created successfully`
    } as ExecutorMessages;
    actionResultDetail.executorMessages = executorMessages;
    actionResult.debugResult(`Executor Messages Set`, `${dbgNs}executeAction:`);
  
    // Run the executor then return or throw the result.
    // OPTIONAL: If you want to override success/error handling, do it here.
    return await createUser( uniqueUsername, defaultPassword, userDefinition as JsonMap,
                                actionContext.targetOrg, executorMessages,
                                actionContext.listrExecOptions.observer)
      .catch(rejectedPromise => actionResult.addRejectedChild(rejectedPromise, SfdxFalconResultType.EXECUTOR, `hybrid:createUser`))
      .then(resolvedPromise => {
        if (resolvedPromise === actionResult) {
          // If "resolvedPromise" points to the same location in memory as "actionResult", it means that
          // executeSfdxCommand() returned an ERROR which was suppressed. If you don't want to suppress EXECUTOR
          // errors, the ACTION Result used by this class must be instantiated with "bubbleError" set to FALSE.
          return actionResult;
        }
        return actionResult.addResolvedChild(resolvedPromise, SfdxFalconResultType.EXECUTOR, `hybrid:createUser`);
      });
  }
}

// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    determineDefaultPassword
 * @param       {string}  suggestedPassword Optional. This will usually be returned as-is if it's
 *              provided. Otherwise this will be determined by some "default processing" logic.
 * @returns     {string}  Either a reflectoin of the suggested password, or a better one.
 * @description Given a "suggested password", this function will determine if it's OK to use that
 *              password or supply a different one as a replacement.
 * @version     1.0.0
 * @private
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
function determineDefaultPassword(suggestedPassword:string):string {
  if (! suggestedPassword) {
    return '1HappyCloud';
  }
  else {
    return suggestedPassword;
  }
}
