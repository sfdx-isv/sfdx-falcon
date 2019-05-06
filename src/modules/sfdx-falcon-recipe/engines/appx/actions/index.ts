//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @file          modules/sfdx-falcon-recipe/engines/appx/actions/index.ts
 * @copyright     Vivek M. Chawla - 2018
 * @author        Vivek M. Chawla <@VivekMChawla>
 * @summary       Abstract base class that provides the core logic for SFDX-Falcon Actions.
 * @description   Abstract base class that provides the core logic for SFDX-Falcon Actions.
 * @version       1.0.0
 * @license       MIT
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
// Import local modules
import {SfdxFalconDebug}            from  '../../../../sfdx-falcon-debug';      // Why?
import {SfdxFalconError}            from  '../../../../sfdx-falcon-error';      // Why?
import {SfdxFalconResult}           from  '../../../../sfdx-falcon-result';     // Class. Provides framework for bubbling "results" up from nested calls.
import {SfdxFalconResultOptions}    from  '../../../../sfdx-falcon-result';     // Interface. Represents the options that can be set when an SfdxFalconResult object is constructed.
import {SfdxFalconResultStatus}     from  '../../../../sfdx-falcon-result';     // Why?
import {SfdxFalconResultType}       from  '../../../../sfdx-falcon-result';     // Why?
import {waitASecond}                from  '../../../../sfdx-falcon-util/async'; // Why?

// Executor Imports
import {SfdxCommandDefinition}      from  '../../../executors/sfdx';  // Interface. Represents an SFDX "Command Definition" that can be compiled into a string that can be executed at the command line against the Salesforce CLI.

// Engine/Action Imports
import {AppxEngineActionContext}    from  '../../../engines/appx';  // Interface. Represents the context of an Appx Recipe Engine.

// Import Recipe Types
import {ActionOptions}              from  '../../../types/';    // Type. Alias to JsonMap.
import {ExecutorMessages}           from  '../../../types/';    // Interface. Represents the standard messages that most Executors use for Observer notifications.
import {SfdxFalconActionType}       from  '../../../types/';    // Enum. Represents types of SfdxFalconActions.

// Set the File Local Debug Namespace
const dbgNs     = 'ACTION:appx-engine-action:';


//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @interface   CoreActionResultDetail
 * @description Represents the core set of "detail" information that every ACTION result should have.
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
export interface CoreActionResultDetail {
  actionType:       SfdxFalconActionType;
  actionName:       string;
  description:      string;
  executorMessages: ExecutorMessages;
  actionContext:    AppxEngineActionContext;
  actionOptions:    ActionOptions;
}

//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @interface   SfdxCliActionResultDetail
 * @description Represents the "detail" information that every SFDX-CLI ACTION result should have.
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
export interface SfdxCliActionResultDetail extends CoreActionResultDetail {
  sfdxCommandDef:   SfdxCommandDefinition;
}

//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @class       AppxEngineAction
 * @description Base class for all "actions" that are supported by the "Appx" Falcon Recipe Engine.
 * @public @abstract
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
export abstract class AppxEngineAction {

  // Protected class members
  protected actionName:       string;                     // Why?
  protected actionType:       SfdxFalconActionType;       // Why?
  protected description:      string;                     // Why?
  protected successDelay:     number;                     // Why?
  protected errorDelay:       number;                     // Why?
  protected progressDelay:    number;                     // Why?

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @constructs  AppxEngineAction
   * @description Constructor for the AppxEngineAction class.
   * @public
   */
  //───────────────────────────────────────────────────────────────────────────┘
  public constructor() {

    // Set default values for base properties.
    this.actionName       = 'unspecified-action';
    this.actionType       = SfdxFalconActionType.UNSPECIFIED;
    this.description      = 'Unspecified Action';
    this.successDelay     = 2;
    this.errorDelay       = 2;
    this.progressDelay    = 1000;
  
    // Give the child class the chance to initialize over the defaults
    this.initializeAction();
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      execute
   * @param       {AppxEngineActionContext} actionContext Required. The context
   *              of the AppxEngine that is executing this action.
   * @param       {ActionOptions} [actionOptions] Optional. Any options that the
   *              command execution logic will require in order to properly do
   *              its job.
   * @returns     {Promise<SfdxFalconActionResponse>} Resolves with an SFDX-
   *              Falcon Action Response object, populated with an array of
   *              the Executors that were run when the Action was executed.
   * @description Wraps the calling of a specific SFDX-Falcon Action, as defined
   *              by the child class that extends this.
   * @public @async
   */
  //───────────────────────────────────────────────────────────────────────────┘
  public async execute(actionContext:AppxEngineActionContext, actionOptions:ActionOptions={}):Promise<SfdxFalconResult> {

    // Validate the Action Context (implemented here by parent class)
    this.validateActionContext(actionContext);

    // Validate the Action Options (implemented by child class)
    this.validateActionOptions(actionOptions);

    // Call the executeAction method and handle success/errors
    const falconActionResult:SfdxFalconResult = await this.executeAction(actionContext, actionOptions)
      .then(successResult   =>  this.onSuccess(successResult))
      .catch(failureResult  =>  this.onError(failureResult));

    // Wait some number of seconds to give the user a chance to see the final status message.
    await waitASecond(this.successDelay);

    // Return whatever was put together by the onSuccess() method.
    return falconActionResult;
  }

  // Abstract methods
  protected async abstract  executeAction(actionContext:AppxEngineActionContext, actionOptions:ActionOptions):Promise<SfdxFalconResult>;
  protected       abstract  initializeAction():void;
  protected       abstract  validateActionOptions(actionOptions:ActionOptions):void;

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      createActionResult
   * @param       {AppxEngineActionContext} actionContext Required. The context
   *              of the AppxEngine that is executing the action.
   * @param       {ActionOptions} [actionOptions] Optional. Any options that the
   *              command execution logic will require in order to properly do
   *              its job.
   * @param       {SfdxFalconResultOptions} [sfdxFalconResultOptions] Optional.
   *              Specifies options that will be passed to the SfdxFalconResult
   *              contstructor.
   * @returns     {SfdxFalconResult} A new SFDX-Falcon Result customized with
   *              the information specific to this AppxEngineAction instance.
   * @description Takes an AppxEngineActionContext and Action Options along
   *              with options for the SfdxFalconResult constructor and creates
   *              an SFDX-Falcon Result object, then adds details about this
   *              Action to it before returning it to the caller.
   * @protected
   */
  //───────────────────────────────────────────────────────────────────────────┘
  protected createActionResult(actionContext:AppxEngineActionContext, actionOptions:ActionOptions={}, sfdxFalconResultOptions:SfdxFalconResultOptions={}):SfdxFalconResult {

    // Initialize an SFDX-Falcon ACTION Result.
    const falconActionResult =
      new SfdxFalconResult(`${this.actionName}:executeAction`, SfdxFalconResultType.ACTION, sfdxFalconResultOptions);

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
   * @method      onError
   * @param       {unknown} rejectedPromise Required. The result of a rejected promise.
   * @returns     {void}
   * @description Handles rejected calls returning from this.executeAction()
   *              calls that have been made to the child class.
   * @version     1.0.0
   * @private
   */
  //───────────────────────────────────────────────────────────────────────────┘
  private onError(rejectedPromise:unknown):SfdxFalconResult {

    // Debug the contents of the Rejected Promise BEFORE we do anything to it.
    SfdxFalconDebug.obj(`${dbgNs}onError:rejectedPromise:`, {rejectedPromise: rejectedPromise}, `rejectedPromise: `);

    // Make sure any rejected promises are wrapped as an SFDX-Falcon Result.
    const thisActionResult = SfdxFalconResult.wrap(rejectedPromise, SfdxFalconResultType.UNKNOWN, 'ActionResult (REJECTED)');

    // If the ACTION Result still WAITING, then the Child class did not complete the Result.  Do that now.
    if (thisActionResult.status === SfdxFalconResultStatus.WAITING) {
      
      // NOTE: By passing its own errObj, the error() method will handle a missing Error Object.
      thisActionResult.error(thisActionResult.errObj);
    }

    // Since thie was a FAILUIRE, throw the Action Response to inform the caller who started the Engine.
    throw thisActionResult;
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      onSuccess
   * @param       {SfdxFalconExecutorResponse}  execSuccessResponse Required.
   * @returns     {SfdxFalconResult}
   * @description ???
   * @private
   */
  //───────────────────────────────────────────────────────────────────────────┘
  private onSuccess(falconActionResult:SfdxFalconResult):SfdxFalconResult {

    // Make sure that we were provided with an SFDX-Falcon Result
    if ((falconActionResult instanceof SfdxFalconResult) !== true) {
      const typeError =
        new SfdxFalconError ( `AppxEngineAction.onSuccess() expects an argument that's an instance  `
                            + `of 'SfdxFalconResult', not '${falconActionResult.constructor.name}'`
                            , `TypeError`
                            , `${dbgNs}onSuccess`);
      typeError.setData({rawResult: falconActionResult});
      throw typeError;
    }

    // Debug the contents of the Action Result.
    SfdxFalconDebug.obj(`${dbgNs}onSuccess:falconActionResult:`, falconActionResult, `falconActionResult: `);

    // If the ACTION Result still WAITING, then the Child class did not complete the Result.  Do that now.
    if (falconActionResult.status === SfdxFalconResultStatus.WAITING) {
      falconActionResult.success();
    }

    // Done.
    return falconActionResult;
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      validateActionContext
   * @param       {AppxEngineActionContext} actionContext Required. ???
   * @description ???
   * @private
   */
  //───────────────────────────────────────────────────────────────────────────┘
  private validateActionContext(actionContext:AppxEngineActionContext):void {

    // VALIDATION: actionContext must be provided.
    if (typeof actionContext === 'undefined') {
      throw new SfdxFalconError ( `Missing actionContxt object when attempting to `
                                + `execute an AppxEngineAction`
                                , `InvalidActionContext`
                                , `${dbgNs}validateActionContext`);
    }

    // VALIDATION: If the target is a Scratch Org, then a DevHub must be provided.
    if (actionContext.targetOrg.isScratchOrg === true && (!actionContext.devHubAlias)) {
      const actionContextError = new SfdxFalconError( `Target Org is identified as a scratch org, but `
                                                    + `a DevHub Alias was not provided`
                                                    , `InvalidActionContext`
                                                    , `${dbgNs}validateActionContext`);
      actionContextError.setData(actionContext);
      throw actionContextError;
    }
  }
}
