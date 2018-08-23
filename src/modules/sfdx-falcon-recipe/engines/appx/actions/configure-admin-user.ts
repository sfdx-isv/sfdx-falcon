//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @file          modules/sfdx-falcon-recipe/actions/configure-admin-user.ts
 * @copyright     Vivek M. Chawla - 2018
 * @author        Vivek M. Chawla <@VivekMChawla>
 * @summary       Uses JSForce to update properties of the Admin user connected to the Target Org.
 * @description   Uses JSForce to update properties of the Admin user connected to the Target Org.
 * @version       1.0.0
 * @license       MIT
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
// Import Local Modules
import {readConfigFile}               from  '../../../../sfdx-falcon-util';           // Function. Reads a JSON config file from disk and returns as JS Object.
import {SfdxFalconResult}             from  '../../../../sfdx-falcon-result';         // Class. Provides framework for bubbling "results" up from nested calls.
import {SfdxFalconResultType}         from  '../../../../sfdx-falcon-result';         // Enum. Represents types of SfdxFalconResults.
// Executor Imports
import {configureUser}                from  '../../../executors/hybrid';  // Function. Hybrid executor
// Engine/Action Imports
import {AppxEngineAction}             from  '../../appx/actions'; // Abstract class. Extend this to build a custom Action for the Appx Recipe Engine.
import {AppxEngineActionContext}      from  '../../appx';         // Interface. Represents the context of an Appx Recipe Engine.
import {SfdxFalconActionType}         from  '../../../types/';    // Enum. Represents types of SfdxFalconActions.
// Import Utility Functions
import {getUsernameFromAlias}         from  '../../../../sfdx-falcon-util/sfdx';  // Function. SFDX Executor for getting the username associated with an Org Alias.

// Set the File Local Debug Namespace
const dbgNs     = 'ACTION:configure-admin-user:';
const clsDbgNs  = 'ConfigureAdminUserAction:';

//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @class       ConfigureAdminUserAction
 * @extends     AppxEngineAction
 * @description Implements the action "configure-admin-user".
 * @version     1.0.0
 * @public
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
export class ConfigureAdminUserAction extends AppxEngineAction {

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
    this.actionName       = 'configure-admin-user';
    this.command          = 'falcon:internal:command';
    this.description      = 'Configure Admin User';
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
    if (typeof actionOptions.definitionFile === 'undefined') throw new Error(`ERROR_MISSING_OPTION: 'definitionFile'`);
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
      userDefinition:     null,
      adminUsername:      null
    }};
  
    // DEVELOPMENT_DEBUG
    //actionResult.displayResult();

    // Find and read the user definition file.
    let userDefinition = await readConfigFile(actionContext.projectContext.configPath, actionOptions.definitionFile)
      .catch(error => {actionResult.throw(error)});
    actionResult.detail.userDefinition = userDefinition;

    // DEVELOPMENT_DEBUG
    //actionResult.displayResult();

    // Get the username associated with the Target Org Alias (this should be the Admin User)
    let adminUsername = await getUsernameFromAlias(actionContext.targetOrg.alias)
      .catch(error => {actionResult.throw(error)}) as string;
    actionResult.detail.adminUsername = adminUsername;

    // DEVELOPMENT_DEBUG
    //actionResult.displayResult();

    // Define the messages for this command.
    let executorMessages = {
      progressMsg:  `Configuring user '${adminUsername}' in ${actionContext.targetOrg.alias}`,
      errorMsg:     `Failed to configure user '${adminUsername}' in ${actionContext.targetOrg.alias}`,
      successMsg:   `User '${adminUsername}' configured successfully`,
    }

    // Run the executor then return or throw the result. If you want to override error handling, do it here.
    return await configureUser( adminUsername, userDefinition, 
                                actionContext.targetOrg, executorMessages, 
                                actionContext.listrExecOptions.observer)
      .then(executorResult => {

        // DEVELOPMENT_DEBUG
        //actionResult.displayResult('INSIDE THEN');

        // Add the EXECUTOR result as a child of this function's ACTION Result, then return the ACTION Result.
        return actionResult.addChild(executorResult);
      })
      .catch(executorResult  => {

        // DEVELOPMENT_DEBUG
        //actionResult.displayResult('INSIDE CATCH');

        // Make sure any rejected promises are wrapped as an ERROR Result.
        executorResult = SfdxFalconResult.wrapRejectedPromise(executorResult, 'hybrid:configureUser', SfdxFalconResultType.EXECUTOR);
        
        executorResult.displayResult('INSIDE CATCH');

        // If the ACTION Result's "bubbleError" is TRUE, addChild() will throw an Error.
        return actionResult.addChild(executorResult);
      });
  }
}