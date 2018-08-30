//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @file          modules/sfdx-falcon-recipe/engines/appx/actions/index.ts
 * @copyright     Vivek M. Chawla - 2018
 * @author        Vivek M. Chawla <@VivekMChawla>
 * @summary       ???
 * @description   ???
 * @version       1.0.0
 * @license       MIT
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
// Import local modules
import {waitASecond}                from  '../../../../sfdx-falcon-async';    // Why?
import {SfdxFalconDebug}            from  '../../../../sfdx-falcon-debug';    // Why?
import {SfdxFalconResult}           from  '../../../../sfdx-falcon-result';   // Why?
import {SfdxFalconResultStatus}     from  '../../../../sfdx-falcon-result';   // Why?
import {SfdxFalconResultType}       from  '../../../../sfdx-falcon-result';   // Why?

// Executor Imports

// Engine/Action Imports
import {SfdxFalconActionType}       from  '../../../types';                   // Enum. Represents types of SfdxFalconActions.
import {AppxEngineActionContext}    from  '../../../engines/appx';            // Why?
import { SfdxFalconError } from '../../../../sfdx-falcon-error';

// Set the File Local Debug Namespace
const dbgNs     = 'ACTION:appx-engine-action:';
const clsDbgNs  = 'AppxEngineAction:';

//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @class       AppxEngineAction
 * @description Base class for all "actions" that are supported by the "Appx" Falcon Recipe Engine.
 * @version     1.0.0
 * @public @abstract
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
export abstract class AppxEngineAction {

  // Base class members
  protected actionName:       string;                     // Why?
  protected actionType:       SfdxFalconActionType;       // Why?
  protected description:      string;                     // Why?
  protected executorName:     string;                     // Why?
  protected successDelay:     number;                     // Why?
  protected errorDelay:       number;                     // Why?
  protected progressDelay:    number;                     // Why?

  // Abstract methods
  protected async abstract  executeAction(actionContext:AppxEngineActionContext, actionOptions:any):Promise<SfdxFalconResult>;
  protected       abstract  initializeAction():void;
  protected       abstract  validateActionOptions(actionOptions:any):void;

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @constructs  AppxEngineAction
   * @description Constructor for the AppxEngineAction class.
   * @version     1.0.0
   * @public
   */
  //───────────────────────────────────────────────────────────────────────────┘
  public constructor() {

    // Set default values for base properties.
    this.actionName       = 'unspecified-action';
    this.actionType       = SfdxFalconActionType.UNSPECIFIED;
    this.description      = 'Unspecified Action';
    this.executorName     = 'Unspecified Executor';
    this.successDelay     = 2;
    this.errorDelay       = 2;
    this.progressDelay    = 1000;
  
    // Give the child class the chance to initialize over the defaults
    this.initializeAction();
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      createActionResult
   * @param       {AppxEngineActionContext} actionContext Required. The context 
   *              of the AppxEngine that is executing the action. 
   * @param       {any} actionOptions Required. Any options that the command
   *              execution logic will require in order to properly do its job.
   * @param       {any} [sfdxFalconResultOptions] Optional. Options are
   *              "startNow", "bubbleError", and "bubbleFailure".
   * @returns     {SfdxFalconResult} A new SFDX-Falcon Result customized with
   *              the information specific to this AppxEngineAction instance. 
   * @description Takes an AppxEngineActionContext and Action Options along
   *              with options for the SfdxFalconResult constructor and creates
   *              an SFDX-Falcon Result object, then adds details about this
   *              Action to it before returning it to the caller.
   * @version     1.0.0
   * @protected
   */
  //───────────────────────────────────────────────────────────────────────────┘
  protected createActionResult(actionContext:AppxEngineActionContext, actionOptions:any={}, sfdxFalconResultOptions:any={}):SfdxFalconResult {

    // Initialize an SFDX-Falcon ACTION Result.
    let falconActionResult = 
      new SfdxFalconResult(`executeAction:${this.actionName}`, SfdxFalconResultType.ACTION, sfdxFalconResultOptions);

    // Set the detail for the ACTION Result.
    falconActionResult.setDetail({
      actionType:     this.actionType,
      actionName:     this.actionName,
      description:    this.description,
      actionContext:  actionContext,
      actionOptions:  actionOptions
    });

    // Done. Send our new friend back to the caller.
    return falconActionResult;
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      execute
   * @param       {AppxEngineActionContext} actionContext Required. The context 
   *              of the AppxEngine that is executing this action. 
   * @param       {any} [actionOptions] Optional. Any options that the command
   *              execution logic will require in order to properly do its job.
   * @returns     {Promise<SfdxFalconActionResponse>} Resolves with an SFDX-
   *              Falcon Action Response object, populated with an array of
   *              the Executors that were run when the Action was executed.
   * @description Wraps the calling of a specific SFDX-Falcon Action, as defined
   *              by the child class that extends this.  
   * @version     1.0.0
   * @public @async
   */
  //───────────────────────────────────────────────────────────────────────────┘
  public async execute(actionContext:AppxEngineActionContext, actionOptions:any={}):Promise<SfdxFalconResult> {

    // Validate the Action Context (implemented here by parent class)
    this.validateActionContext(actionContext);

    // Validate the Action Options (implemented by child class)
    this.validateActionOptions(actionOptions);

    // Reset the state of this Action (implemented here by parent class0)
    this.resetActionState(actionContext, actionOptions);

    // Call the executeAction method and handle success/errors
    let falconActionResult:SfdxFalconResult = await this.executeAction(actionContext, actionOptions)
      .then(falconActionResult  =>  {return this.onSuccess(falconActionResult)})
      .catch(falconActionResult =>  {return this.onError(falconActionResult)});

    // Wait some number of seconds to give the user a chance to see the final status message.
    await waitASecond(this.successDelay);

    // Return whatever was put together by the onSuccess() method.
    return falconActionResult;
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      handleRejectedExecutor
   * @param       {any} rejectedExecutorResult Required. The result that was 
   *              passed back as part of an EXECUTOR's Rejected Promise.
   * @param       {SfdxFalconResult} actionResult Required. The ACTION Result
   *              that owns the call to the EXECUTOR.
   * @param       {string}  executorName  Required. Used to create a new 
   *              SfdxFalconResult if the Rejected Promise did not return an
   *              existing SfdxFalconResult.
   * @param       {string}  debugNamespace  Required. Debug namespace of the 
   *              child class.
   * @returns     {SfdxFalconResult}  Returns the ACTION result that was passed
   *              in.  This way the return value of this function can be passed
   *              immediately up the call stack.
   * @description Given the data from a REJECTED PROMISE returned from a call to
   *              an EXECUTOR, ensures that the response is wrapped as an SFDX-
   *              Falcon Result and then added to the child array of the specified
   *              ACTION Result.
   * @version     1.0.0
   * @protected
   */
  //───────────────────────────────────────────────────────────────────────────┘
  protected handleRejectedExecutor(rejectedExecutorResult:any, actionResult:SfdxFalconResult, executorName:string, debugNamespace:string):SfdxFalconResult {

    // Debug
    actionResult.debugResult(`Executor Promise Rejected`, `${debugNamespace}handleRejectedExecutor`);

    // Make sure all rejected promises are wrapped as SFDX-Falcon Results.
    rejectedExecutorResult = SfdxFalconResult.wrapRejectedPromise(rejectedExecutorResult, executorName, SfdxFalconResultType.EXECUTOR);
    
    // Debug the rejected and wrapped EXECUTOR Result
    rejectedExecutorResult.debugResult(`Rejected Promise Wrapped as SFDX-Falcon Error`, `${debugNamespace}handleRejectedExecutor`);

    // If the ACTION Result's "bubbleError" is TRUE, addChild() will throw an Error.
    return actionResult.addChild(rejectedExecutorResult);
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      handleResolvedExecutor
   * @param       {any} resolvedExecutorResult Required. The result that was 
   *              passed back as part of an EXECUTOR's Resolved Promise.
   * @param       {SfdxFalconResult} actionResult Required. The ACTION Result
   *              that owns the call to the EXECUTOR.
   * @param       {string}  executorName  Required. Used to create a new 
   *              SfdxFalconResult if the Resolved Promise did not return an
   *              existing SfdxFalconResult.
   * @param       {string}  debugNamespace  Required. Debug namespace of the 
   *              child class.
   * @returns     {SfdxFalconResult}  Returns the ACTION result that was passed
   *              in.  This way the return value of this function can be passed
   *              immediately up the call stack.
   * @description Given the data from a RESOLVED PROMISE returned from a call to
   *              an EXECUTOR, ensures that the response is wrapped as an SFDX-
   *              Falcon Result and then added to the child array of the specified
   *              ACTION Result.
   * @version     1.0.0
   * @protected
   */
  //───────────────────────────────────────────────────────────────────────────┘
  protected handleResolvedExecutor(resolvedExecutorResult:any, actionResult:SfdxFalconResult, executorName:string, debugNamespace:string):SfdxFalconResult {

    // Debug
    actionResult.debugResult(`Executor Promise Resolved`, `${debugNamespace}handleResolvedExecutor`);

    // Make sure all resolved promises are wrapped as SFDX-Falcon Results.
    resolvedExecutorResult = SfdxFalconResult.wrap(resolvedExecutorResult, executorName, SfdxFalconResultType.EXECUTOR);
    
    // Debug the Resolved and Wrapped EXECUTOR Result
    resolvedExecutorResult.debugResult(`Resolved Executor Result`, `${debugNamespace}handleResolvedExecutor`);

    // Add the EXECUTOR result as a child of the ACTION Result, then return the ACTION Result.
    return actionResult.addChild(resolvedExecutorResult);
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      onError
   * @param       {SfdxFalconExecutorResponse}  execErrorResponse Required.
   * @returns     {void}
   * @description Handles rejected calls returning from this.executeAction()
   *              calls made to the child class.
   * @version     1.0.0
   * @private
   */
  //───────────────────────────────────────────────────────────────────────────┘
  private onError(falconActionResult:SfdxFalconResult):SfdxFalconResult {

    // Debug the contents of falconActionResult BEFORE we do anything to it.
    SfdxFalconDebug.obj(`FALCON_EXT:${dbgNs}`, falconActionResult, `${clsDbgNs}onError:falconActionResult: `);

    // Make sure any rejected promises are wrapped as an SFDX-Falcon Result.
    falconActionResult = SfdxFalconResult.wrap(falconActionResult, 'ActionResult (REJECTED)', SfdxFalconResultType.ACTION);

    // If the ACTION Result still WAITING, then the Child class did not complete the Result.  Do that now.
    if (falconActionResult.status === SfdxFalconResultStatus.WAITING) {
      
      // NOTE: By passing its own errObj, the error() method will handle a missing Error Object.
      falconActionResult.error(falconActionResult.errObj);
    }

    // Since thie was a FAILUIRE, throw the Action Response to inform the caller who started the Engine.
    throw falconActionResult;
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      onSuccess
   * @param       {SfdxFalconExecutorResponse}  execSuccessResponse Required.
   * @returns     {SfdxFalconResult}
   * @description ???
   * @version     1.0.0
   * @private
   */
  //───────────────────────────────────────────────────────────────────────────┘
  private onSuccess(falconActionResult:SfdxFalconResult):SfdxFalconResult {

    // Make sure that we were provided with an SFDX-Falcon Result
    if ((falconActionResult instanceof SfdxFalconResult) !== true) {
      let typeError = new TypeError (`ERROR_INVALID_TYPE: AppxEngineAction.onSuccess() expects an argument that's an instance  `
                                    +`of 'SfdxFalconResult', not '${falconActionResult.constructor.name}'`);
      throw SfdxFalconError.wrap(typeError);
    }

    // Debug the contents of the Action Result.
    SfdxFalconDebug.obj(`FALCON_EXT:${dbgNs}`, falconActionResult, `${clsDbgNs}onSuccess:falconActionResult: `);

    // If the ACTION Result still WAITING, then the Child class did not complete the Result.  Do that now.
    if (falconActionResult.status === SfdxFalconResultStatus.WAITING) {
      falconActionResult.success();
    }

    // Done.
    return falconActionResult;
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      resetActionState
   * @param       {AppxEngineActionContext} actionContext Required. The context 
   *              of the AppxEngine that is executing this action. 
   * @param       {any} [actionOptions] Optional. Any options that the command
   *              execution logic will require in order to properly do its job.
   * @description Resets all class members that get values during an execution.
   *              This should be done every time the execute() method is called.
   * @version     1.0.0
   * @private
   */
  //───────────────────────────────────────────────────────────────────────────┘
  private resetActionState(actionContext:AppxEngineActionContext, actionOptions:any={}):void {

    // Clear out any previous Command Definitions
    //this.anyCliCommandDef = {};
    //this.jsfCommandDef    = {};
    //this.sfdxCommandDef   = <SfdxCommandDefinition>{};
    //this.shellCommandDef  = {};

    // Clear out any previous messages
    //this.progressMessage  = '';
    //this.errorMessage     = '';
    //this.successMessage   = '';
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      validateActionContext
   * @param       {AppxEngineActionContext} actionContext Required. ???
   * @description ???
   * @version     1.0.0
   * @private
   */
  //───────────────────────────────────────────────────────────────────────────┘
  private validateActionContext(actionContext:AppxEngineActionContext):void {

    // VALIDATION: actionContext must be provided.
    if (typeof actionContext === 'undefined') {
      throw new Error (`ERROR_INVALID_ACTION_CONTEXT: Missing actionContxt object when `
                      +`attempting to execute an AppxEngineAction`);
    }

    // VALIDATION: If the target is a Scratch Org, then a DevHub must be provided.
    if (actionContext.targetOrg.isScratchOrg === true && (!actionContext.devHubAlias)) {
      throw new Error (`ERROR_INVALID_ACTION_CONTEXT: Target Org is identified as a scratch org, but `
                      +`a DevHub Alias was not provided`);
    }
  }
}