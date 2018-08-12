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
import {waitASecond}              from  '../../../../sfdx-falcon-async';          // Why?
import {SfdxFalconDebug}          from  '../../../../sfdx-falcon-debug';          // Why?
import {SfdxCommandDefinition}    from  '../../../../sfdx-falcon-executors/sfdx'; // Why?

// Import Internal Engine Modules
import {AppxEngineActionContext}  from  '../../../engines/appx';                  // Why?
import {AppxEngineActionType}     from  '../../../engines/appx';                  // Why?
import {AppxEngineActionResult}   from  '../../../engines/appx';                  // Why?

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
  protected actionType:       AppxEngineActionType;       // Why?
  protected actionName:       string;                     // Why?
  protected description:      string;                     // Why?
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
  protected actionResult:     AppxEngineActionResult;     // Why?

  // Abstract methods
  protected async abstract  executeAction(actionContext:AppxEngineActionContext, actionOptions:any):Promise<any>;
  protected       abstract  validateActionOptions(actionOptions:any):void;

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @constructs  AppxEngineAction
   * @description ???
   * @version     1.0.0
   * @protected
   */
  //───────────────────────────────────────────────────────────────────────────┘
  protected constructor() {

    // Set default values for base properties.
    this.actionType       = AppxEngineActionType.UNSPECIFIED;
    this.actionName       = 'unspecified-action';
    this.description      = 'Unspecified Action';
    this.successDelay     = 2;
    this.errorDelay       = 2;
    this.progressDelay    = 1000;
    this.progressMessage  = `Executing ${this.actionName}`;
    this.errorMessage     = `Error while executing ${this.actionName}`;
    this.successMessage   = `Successfully executed ${this.actionName}`;
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      execute
   * @param       {AppxEngineActionContext} actionContext Required. The context 
   *              of the AppxEngine that is executing this action. 
   * @param       {any} [actionOptions] Optional. Any options that the command
   *              execution logic will require in order to properly do its job.
   * @returns     {Promise<AppxEngineActionResult>}
   * @description Wraps custom logic that may perform any number of tasks into 
   *              an API with consistent inputs, outputs, and debug behavior.
   *              This should be the ONLY public method of this class.
   * @version     1.0.0
   * @public @async
   */
  //───────────────────────────────────────────────────────────────────────────┘
  public async execute(actionContext:AppxEngineActionContext, actionOptions:any={}):Promise<AppxEngineActionResult> {

    // Validate the Action Context (implemented here by parent class)
    this.validateActionContext(actionContext);

    // Validate the Action Options (implemented by child class)
    this.validateActionOptions(actionOptions);

    // Reset the state of this Action (implemented here by parent class0)
    this.resetActionState();

    // Call the executeAction method and hendle success/errors
    await this.executeAction(actionContext, actionOptions)
      .then(result => {this.onSuccess(actionContext, result)})
      .catch(error => {this.onError(actionContext, error)});

    // Wait some number of seconds to give the user a chance to see the final status message.
    await waitASecond(this.successDelay);

    // Return whatever was put together by the onSuccess() method.
    return this.actionResult;

  }
  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      onError
   * @param       {AppxEngineActionContext} actionContext Required. ???
   * @param       {Error} error ???
   * @returns     {void}
   * @description ???
   * @version     1.0.0
   * @public
   */
  //───────────────────────────────────────────────────────────────────────────┘
  private onError(actionContext:AppxEngineActionContext, error:Error):void {

    SfdxFalconDebug.obj(`FALCON_EXT:${dbgNs}`, error, `${clsDbgNs}onError:error: `);
    throw error;
    // TODO: Add Implementation

  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      onSuccess
   * @param       {AppxEngineActionContext} actionContext Required. ???
   * @param       {any} result  Required. ???
   * @returns     {void}
   * @description ???
   * @version     1.0.0
   * @private
   */
  //───────────────────────────────────────────────────────────────────────────┘
  private onSuccess(actionContext:AppxEngineActionContext, result:any):void {

    // Debug
    SfdxFalconDebug.obj(`FALCON_EXT:${dbgNs}`, actionContext, `${clsDbgNs}onSuccess:actionContext: `);
    SfdxFalconDebug.obj(`FALCON_EXT:${dbgNs}`, result,        `${clsDbgNs}onSuccess:result: `);

    // Set the Action Name (same for all types)
    this.actionResult.action = this.actionName;

    // Prep the Action Result based on an (unexpected) string result.
    if (typeof result === 'string' || typeof result === 'undefined') {
      this.actionResult.status    = 0;
      this.actionResult.type      = AppxEngineActionType.UNSPECIFIED;
      this.actionResult.message   = 'Unexpected Success Result';
      this.actionResult.strResult = result || 'NO_RESULT_STRING_PROVIDED';
      this.actionResult.objResult = {};
      return;
    }

    // Parse the result based on it's type
    switch (result.constructor.name) {
      case 'SfdxShellResult':
        this.actionResult.type      = AppxEngineActionType.SFDX_CLI_COMMAND;
        this.actionResult.cmdDef    = this.sfdxCommandDef;
        this.actionResult.status    = result.status;
        this.actionResult.message   = this.successMessage;
        this.actionResult.strResult = result.raw;
        this.actionResult.objResult = result.json;
        break;
      default:
        this.actionResult.type      = AppxEngineActionType.UNSPECIFIED;
        this.actionResult.cmdDef    = this.sfdxCommandDef || this.jsfCommandDef || this.shellCommandDef || this.anyCliCommandDef;
        this.actionResult.status    = 0;
        this.actionResult.message   = 'Unexpected Success Result';
        this.actionResult.strResult = result;
        this.actionResult.objResult = result;
    }

    // Debug
    SfdxFalconDebug.obj(`FALCON_EXT:${dbgNs}`, this.actionResult, `${clsDbgNs}onSuccess:this.actionResult: `);
    return;
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      renderError
   * @param       {Array<any>} stringSubTokens ???? 
   * @description ???
   * @version     1.0.0
   * @public
   */
  //───────────────────────────────────────────────────────────────────────────┘
  public renderError(stringSubTokens:Array<any>=[]):void {

    // Render (ie. "print to terminal") the "base" of the error.
    this.renderBaseError(stringSubTokens);

    // Add customizations based on the needs of the derived class.
    console.log(`Rendered from the derived class`);
  }


  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      renderBaseError
   * @param       {Array<any>} stringSubTokens ???? 
   * @description ???
   * @version     1.0.0
   * @private
   */
  //───────────────────────────────────────────────────────────────────────────┘
  private renderBaseError(stringSubTokens:Array<any>=[]):void {

    console.log(`This is the base error`);

  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      resetActionState
   * @description Resets all class members that get values during an execution.
   *              This should be done every time the execute() method is called.
   * @version     1.0.0
   * @private
   */
  //───────────────────────────────────────────────────────────────────────────┘
  private resetActionState():void {

    // Clear out any previous results
    this.actionResult = <AppxEngineActionResult>{};

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