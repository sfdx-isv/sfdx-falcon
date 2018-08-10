//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @file          modules/sfdx-falcon-recipe/engines/appx/actions/index.ts
 * @copyright     Vivek M. Chawla - 2018
 * @author        Vivek M. Chawla <@VivekMChawla>
 * @version       1.0.0
 * @license       MIT
 * @requires      module:???
 * @summary       ???
 * @description   ???
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
// Import local modules
import {waitASecond}            from  '../../../../sfdx-falcon-async';          // Why?
import {SfdxFalconDebug}        from  '../../../../sfdx-falcon-debug';          // Why?
import {SfdxCommandDefinition}  from  '../../../../sfdx-falcon-executors/sfdx'; // Why?

// Import Internal Engine Modules
import {AppxEngineContext}      from  '../../../engines/appx';                  // Why?
import {AppxEngineActionType}   from  '../../../engines/appx';                  // Why?
import {AppxEngineActionResult} from  '../../../engines/appx';                  // Why?

// Set the File Local Debug Namespace
const dbgNs = 'appx-engine-action';

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
  protected engineContext:    AppxEngineContext           // Why?
  protected actionType:       AppxEngineActionType;       // Why?
  protected actionName:       string;                     // Why?
  protected successDelay:     number;                     // Why?
  protected errorDelay:       number;                     // Why?
  protected progressDelay:    number;                     // Why?
  protected progressMessage:  string;                     // Basic progress message (defined inside execute)
  protected successMessage:   string;                     // Basic success message (defined inside execute)
  protected errorMessage:     string;                     // Basic error message (defined inside execute)
  protected clsDbgNs:         string;                     // Class name when used as part of Debug Messages.
  protected sfdxCommandDef:   SfdxCommandDefinition;      // Holds the command definition when executing Salesforce CLI commands.
  protected jsfCommandDef:    any;                        // Holds the command definition for a JSForce command.
  protected shellCommandDef:  any;                        // Placeholder (Why?)
  protected anyCliCommandDef: any;                        // Placeholder (Why?)
  protected actionResult:     AppxEngineActionResult;     // Why?

  // Abstract methods
  protected async abstract executeAction(actionOptions:any):Promise<any>;

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @constructs  AppxEngineAction
   * @param       {AppxEngineContext} engineContext ???? 
   * @description ???
   * @version     1.0.0
   * @protected
   */
  //───────────────────────────────────────────────────────────────────────────┘
  protected constructor(engineContext:AppxEngineContext) {

    SfdxFalconDebug.obj(`FALCON_EXT:${dbgNs}`, engineContext, `AppxEngineAction:constructor:engineContext: `);

    // VALIDATION: EngineContext must be provided.
    if (typeof engineContext === 'undefined') {
      throw new Error (`ERROR_INVALID_ARGUMENT: Missing engineContext object when `
                      +`constructing an AppxEngineAction object.`);
    }

    // VALIDATION: If the target is a Scratch Org, then a DevHub must be provided.
    if (engineContext.targetOrg.isScratchOrg === true && (!engineContext.devHubAlias)) {
      throw new Error (`ERROR_MISSING_CONFIG_INFO: Target Org is identified as a scratch org, but `
                      +`no DevHub Alias was provided`)
    }

    // Set default values for base properties.
    this.engineContext    = engineContext;
    this.actionType       = AppxEngineActionType.UNSPECIFIED;
    this.actionName       = 'Unspecified Action';
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
   * @param       {any}   actionOptions Optional. Any options that the command
   *              execution logic will require in order to properly do its job.
   * @returns     {Promise<AppxEngineActionResult>}
   * @description Wraps custom logic that may perform any number of tasks into 
   *              an API with consistent inputs, outputs, and debug behavior.
   *              This should be the ONLY public method of this class.
   * @version     1.0.0
   * @public @async
   */
  //───────────────────────────────────────────────────────────────────────────┘
  public async execute(actionOptions:any={}):Promise<AppxEngineActionResult> {

    // Reset the state of this Action.
    this.resetActionState();

    // Call the executeAction method and hendle success/errors
    await this.executeAction(actionOptions)
      .then(result => {this.onSuccess(result)})
      .catch(error => {this.onError(error)});

    // Wait some number of seconds to give the user a chance to see the final status message.
    await waitASecond(this.successDelay);

    // Return whatever was put together by the onSuccess() method.
    return this.actionResult;

  }
  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      onError
   * @param       {Error} error ???? 
   * @param       {any}   observer  ???? 
   * @description ???
   * @version     1.0.0
   * @public
   */
  //───────────────────────────────────────────────────────────────────────────┘
  private onError(error:Error):any {

    SfdxFalconDebug.obj(`FALCON_EXT:${dbgNs}`, error, `AppxEngineAction:onError:error: `);
    throw error;
    // TODO: Add Implementation

  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      onSuccess
   * @param       {any} result    ???? 
   * @param       {any} observer  ???? 
   * @description ???
   * @version     1.0.0
   * @public
   */
  //───────────────────────────────────────────────────────────────────────────┘
  private onSuccess(result:any):any {

    // Debug
    SfdxFalconDebug.obj(`FALCON_EXT:${dbgNs}`, result, `${this.clsDbgNs}:onSuccess:result: `);

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
    SfdxFalconDebug.obj(`FALCON_EXT:${dbgNs}`, this.actionResult, `${this.clsDbgNs}:onSuccess:this.actionResult: `);
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
}