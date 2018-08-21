//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @file          modules/sfdx-falcon-recipe/engines/appx/actions/index.ts
 * @copyright     Vivek M. Chawla - 2018
 * @author        Vivek M. Chawla <@VivekMChawla>
 * @version       1.0.0
 * @license       MIT
 * @summary       ???
 * @description   ???
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
// Import local modules
import {waitASecond}                from  '../../../../sfdx-falcon-async';          // Why?
import {SfdxFalconDebug}            from  '../../../../sfdx-falcon-debug';          // Why?
import {SfdxFalconResult}           from  '../../../../sfdx-falcon-result';         // Why?
import {SfdxFalconResultStatus}     from  '../../../../sfdx-falcon-result';         // Why?
import {SfdxFalconResultType}       from  '../../../../sfdx-falcon-result';         // Why?
// Executor Imports
import {SfdxCommandDefinition}      from  '../../../executors/sfdx';                // Why?
// Engine/Action Imports
import {SfdxFalconActionType}       from  '../../../types';                         // Enum. Represents types of SfdxFalconActions.
import {AppxEngineActionContext}    from  '../../../engines/appx';                  // Why?

// Set the File Local Debug Namespace
const dbgNs     = 'appx-engine-action:';
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
  protected command:          string;                     // Why?
  protected successDelay:     number;                     // Why?
  protected errorDelay:       number;                     // Why?
  protected progressDelay:    number;                     // Why?
  protected progressMessage:  string;                     // Basic progress message (defined inside execute)
  protected successMessage:   string;                     // Basic success message (defined inside execute)
  protected errorMessage:     string;                     // Basic error message (defined inside execute)
  protected sfdxCommandDef:   SfdxCommandDefinition;      // Holds the command definition when executing Salesforce CLI commands.
  protected jsfCommandDef:    any;                        // Holds the command definition for a JSForce command.
  protected shellCommandDef:  any;                        // Placeholder (Why?)
  protected anyCliCommandDef: any;                        // Placeholder (Why?)

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
    this.successDelay     = 2;
    this.errorDelay       = 2;
    this.progressDelay    = 1000;
    this.progressMessage  = `Executing ${this.actionName}`;
    this.errorMessage     = `Error while executing ${this.actionName}`;
    this.successMessage   = `Successfully executed ${this.actionName}`;
    this.sfdxCommandDef   = null;
    this.jsfCommandDef    = null;
    this.shellCommandDef  = null;
    this.anyCliCommandDef = null;
  
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
      command:        this.command,
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
    this.anyCliCommandDef = {};
    this.jsfCommandDef    = {};
    this.sfdxCommandDef   = <SfdxCommandDefinition>{};
    this.shellCommandDef  = {};

    // Clear out any previous messages
    this.progressMessage  = '';
    this.errorMessage     = '';
    this.successMessage   = '';
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