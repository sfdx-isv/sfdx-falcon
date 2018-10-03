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
import {SfdxFalconResult}           from  '../../../../sfdx-falcon-result'; // Class. Provides framework for bubbling "results" up from nested calls.
import {SfdxFalconResultStatus}     from  '../../../../sfdx-falcon-result'; // Enum. Represents the status of SfdxFalconResults.
import {SfdxFalconError}            from  '../../../../sfdx-falcon-error';  // Why?

// Executor Imports
import {executeSfdxCommand}         from  '../../../executors/sfdx';        // Function. SFDX Executor (CLI-based Commands).

// Engine/Action Imports
import {AppxEngineAction}           from  '../../appx/actions';             // Abstract class. Extend this to build a custom Action for the Appx Recipe Engine.
import {AppxEngineActionContext}    from  '../../appx';                     // Interface. Represents the context of an Appx Recipe Engine.
import {SfdxFalconActionType}       from  '../../../types';                 // Enum. Represents types of SfdxFalconActions.

// Set the File Local Debug Namespace
const dbgNs     = 'ACTION:deploy-metadata:';
//const clsDbgNs  = 'DeployMetadataAction:';

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
    this.executorName     = 'sfdx:executeSfdxCommand';
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
    // Add additional DETAIL for this Result (beyond what is added by createActionResult()).
    actionResult.detail = {...{
      executorName:       this.executorName,
      executorMessages:   null,
      sfdxCommandDef:     null
    }};
    actionResult.debugResult(`Initialized`, `${dbgNs}executeAction`);

    // Define the messages that are relevant to this Action
    let executorMessages = {
      progressMsg:  `Deploying MDAPI source from '${actionOptions.mdapiSource}'`,
      errorMsg:     `Deployment failed for MDAPI source '${actionOptions.mdapiSource}'`,
      successMsg:   `Deployment of '${actionOptions.mdapiSource}' succeeded`
    }
    actionResult.detail.executorMessages = executorMessages;
    actionResult.debugResult(`Executor Messages Set`, `${dbgNs}executeAction`);

    // Create an SFDX Command Definition object to specify which command the CLI will run.
    let sfdxCommandDef = {
      command:      'force:mdapi:deploy',
      progressMsg:  executorMessages.progressMsg,
      errorMsg:     executorMessages.errorMsg,
      successMsg:   executorMessages.successMsg,
      observer:     actionContext.listrExecOptions.observer,
      commandArgs:  new Array<string>(),
      commandFlags: {
        FLAG_TARGETUSERNAME:  actionContext.targetOrg.alias,
        FLAG_DEPLOYDIR:       path.join(actionContext.projectContext.mdapiSourcePath, actionOptions.mdapiSource),
        FLAG_WAIT:            5,
        FLAG_TESTLEVEL:       'NoTestRun',
        FLAG_JSON:            true,
        FLAG_LOGLEVEL:        actionContext.logLevel
      }
    }
    actionResult.detail.sfdxCommandDef = sfdxCommandDef;
    actionResult.debugResult(`SFDX Command Definition Created`, `${dbgNs}executeAction`);

    // Run the executor then return or throw the result.
    // OPTIONAL: If you want to override success/error handling, do it here.
    return await executeSfdxCommand(sfdxCommandDef)
      .then(executorResult => {

        // Override standard behavior here so we can convert a FAILED Executor to an ERROR
        //return this.handleResolvedExecutor(executorResult, actionResult, this.executorName, dbgNs);

        // Use the normal process to handle/wrap/add the resolved Exeuctor
        this.handleResolvedExecutor(executorResult, actionResult, this.executorName, dbgNs);

        // Check for FAILURE. If there is, create an SFDX-Falcon error and add as a new child.
        if (actionResult.lastChild.status === SfdxFalconResultStatus.FAILURE) {
          let execFailureError 
            = new SfdxFalconError (`ERROR_FAILED_EXECUTOR: Executor '${actionResult.lastChild.name}' `
                                  +`has failed during MDAPI deployment of ${actionOptions.mdapiSource}`, 
                                   `FailedExecutor`);
          execFailureError.setFalconData(actionResult.lastChild.detail.sfdxCliError);
          actionResult.throw(execFailureError);
        }
        else {

          // No FAILURE or ERROR, so just return the Action Result.
          return actionResult;        
        }
      })
      .catch(executorResult => {
        return this.handleRejectedExecutor(executorResult, actionResult, this.executorName, dbgNs);
      });
  }
}