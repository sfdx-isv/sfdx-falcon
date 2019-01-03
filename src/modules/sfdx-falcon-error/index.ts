//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @file          modules/sfdx-falcon-error/index.ts
 * @copyright     Vivek M. Chawla - 2018
 * @author        Vivek M. Chawla <@VivekMChawla>
 * @summary       Provides specialized error structures for SFDX-Falcon modules.
 * @description   Provides specialized error structures for SFDX-Falcon modules.  Wraps SfdxError
 *                by adding additional SFDX-Falcon specific stack information as well as customized
 *                rendering capabilities to show formatted output via the console.
 * @version       1.0.0
 * @license       MIT
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
// Import Local Modules
import {SfdxError}                      from  '@salesforce/core';             // Why?
//import {SfdxErrorConfig}                from  '@salesforce/core';             // Why?
import {FalconProgressNotifications}    from  '../sfdx-falcon-notifications'  // Why?
import {SfdxFalconDebug}                from  '../sfdx-falcon-debug';         // Why?
import {SfdxFalconResult}               from  '../sfdx-falcon-result';        // Why?
import {SfdxFalconResultDisplayOptions} from  '../sfdx-falcon-result';        // Why?
import {isEmpty}                        from  'lodash';                       // Why?

// Require Modules
const chalk     = require('chalk');     // Why?
const inquirer  = require('inquirer');  // Provides UX for getting feedback from the user.
const util      = require('util');      // Why?

//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @interface   CliErrorDetail
 * @description Data structure returned by Salesforce CLI calls made with --json flag set.
 * @version     1.0.0
 * @public
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
export interface CliErrorDetail {
  status:     number;
  result:     any;
  name?:      string;
  message?:   string;
  actions?:   Array<string>;
  stack?:     string;
  warnings?:  any;
}

//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @interface   SfdxFalconErrorRenderOptions
 * @description Options object used by the various Render functions to customize display output.
 * @version     1.0.0
 * @public
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
export interface SfdxFalconErrorRenderOptions {
  headerColor:        string;
  labelColor:         string;
  errorLabelColor:    string;
  valueColor:         string;
  childInspectDepth:  number;
  detailInspectDepth: number;
  errorInspectDepth:  number;
}

//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @interface   ShellErrorDetail
 * @description Represents information available after the failed execution of any shell command.
 * @version     1.0.0
 * @public
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
export interface ShellErrorDetail {
  code:     number;
  signal:   string;
  stderr:   string;
  stdout:   string;
  message:  string;
}

//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @class       SfdxFalconError
 * @extends     SfdxError
 * @description Extends SfdxError to provide specialized error structures for SFDX-Falcon modules.
 * @version     1.0.0
 * @public
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
export class SfdxFalconError extends SfdxError {

  // Private Members
  private _falconStack:     string;               // Keeps a record of each member in the SFDX-Falcon chain that touches this error.
  private _falconData:      any;                  // Additional information that's relevant to this error.
  private _falconUserInfo:  SfdxFalconErrorInfo;  // Info/message shown on Error when running in USER MODE.
  private _falconDebugInfo: SfdxFalconErrorInfo;  // Info/message shown on Error when running in DEBUG MODE.
  private _falconDevInfo:   SfdxFalconErrorInfo;  // Info/message shown on Error when running in DEVELOPER MODE.
  private _childError:      SfdxFalconError;      // Error object (or derivative) that was bubbled up and captured.

  // Property Accessors
  public get friendlyMessage() {return `Temporary Friendly Message`;}

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @constructs  SfdxFalconError
   * @param       {string}  message Required. Message for the error.
   * @param       {string}  [name]  Optional. Defaults to SfdxError in parent.
   * @param       {Array<string>} [actions] Optional. The action messages.
   * @param       {number}  [exitCode]  Optional. Code passed to the CLI.
   * @param       {Error}   [cause] Optional. Error message that started this.      
   * @description Extension of the SfdxError object. Adds special SFDX-Falcon
   *              specific stack and data properties.
   * @version     1.0.0
   * @public
   */
  //───────────────────────────────────────────────────────────────────────────┘
  public constructor(message:string, name?:string, actions:Array<string>=[], exitCode:number=1, cause:Error={} as Error) {

    // Set a default for name
    let thisName = name || 'SfdxFalconError';

    // Call the parent constructor
    super(message, thisName, actions, exitCode, cause);

    // Initialize member vars
    this._falconStack     = `${this.name}: ${this.message}`;
    this._falconData      = {};
    this._falconUserInfo  = new SfdxFalconErrorInfo();
    this._falconDebugInfo = new SfdxFalconErrorInfo();
    this._falconDevInfo   = new SfdxFalconErrorInfo();
    this.setData({});
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      addToStack
   * @param       {string}  stackItem Required. ???
   * @description ???
   * @version     1.0.0
   * @public
   */
  //───────────────────────────────────────────────────────────────────────────┘
  public addToStack(stackItem:string='at UNSPECIFIED result from UNKNOWN'):void {
    let indent = '    ';
    this._falconStack += `\n${indent}${stackItem}`;
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      bubble
   * @param       {string}  stackItem Required. ???
   * @description Adds an item to the Falcon Stack then throws this instance.
   * @version     1.0.0
   * @public
   */
  //───────────────────────────────────────────────────────────────────────────┘
  public bubble(stackItem:string):void {
    this.addToStack(stackItem);
    throw this;
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @property    childError
   * @description Gets the current Child Error object.
   * @version     1.0.0
   * @public
   */
  //───────────────────────────────────────────────────────────────────────────┘
  public get childError():SfdxFalconError {
    return this._childError;
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      displayErrorDebugInfo
   * @param       {SfdxFalconResult} commandResult  Required. SFDX Falcon Result
   *              Object for the command that's being terminated with an error.
   * @param       {boolean} showErrorDebug  Required. Determines if extended
   *              debugging output for the terminating Error can be shown.
   * @param       {boolean} promptUser  Required. Determines if the user will
   *              be prompted to display debug info. If FALSE, debug info will
   *              be shown without requiring additional user input.
   * @returns     {void}
   * @description Makes the final determination of what the Debug Display 
   *              options are. May prompt the user interactively to make this
   *              determination.
   * @version     1.0.0
   * @private @static  
   */
  //───────────────────────────────────────────────────────────────────────────┘
  private static async displayErrorDebugInfo(commandResult:SfdxFalconResult, showErrorDebug:boolean, promptUser:boolean):Promise<void> {

    // Don't display any debug information if not explicitly asked for.
    if (showErrorDebug !== true) {
      return;
    }

    // Initialize an Error Debug Options object.
    let displayOptions = <SfdxFalconResultDisplayOptions> {
      displayResult:      true,
      contextLabel:       '',
      detailInspectDepth: 2,
      childInspectDepth:  2,
      errorInspectDepth:  4
    };

    // If asked, prompt the user for their Error Debug choices.
    if (promptUser === true) {

      // Build the first prompt asking the user if they want to view detailed debug info.
      let iqPromptOne = [
        {
          type:     'confirm',
          name:     'showDebug',
          default:  true,
          message:  `${chalk.red('ERROR DETECTED:')} Would you like to view detailed debug information?`,
          when:     true
        }
      ];

      // Show the first prompt. If the user doesn't want to view debug info, just return.
      console.log('');
      let userSelectionsOne = await inquirer.prompt(iqPromptOne);
      if (userSelectionsOne.showDebug !== true) {
        return;
      }
    }

    // Show the debug output.
    do {
      commandResult.displayResult(displayOptions);

      // TODO: Need to add code to allow user to iteratively see debug info with more
      // depth in object display. We will do this by prompting them to change any of
      // the values found in the displayOptions object.

    } while (false); // Ensures we go through only one loop until we refactor per the TODO above.

    // All done.
    return;
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @property    falconData
   * @description Gets the current Falcon Data.
   * @version     1.0.0
   * @public
   */
  //───────────────────────────────────────────────────────────────────────────┘
  public get falconData():any {
    return this._falconData;
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @property    falconDebugInfo
   * @description Gets the current Debug Information object.
   * @version     1.0.0
   * @public
   */
  //───────────────────────────────────────────────────────────────────────────┘
  public get falconDebugInfo():SfdxFalconErrorInfo {
    return this._falconDebugInfo;
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @property    falconDevInfo
   * @description Gets the current Developer Information object.
   * @version     1.0.0
   * @public
   */
  //───────────────────────────────────────────────────────────────────────────┘
  public get falconDevInfo():SfdxFalconErrorInfo {
    return this._falconDevInfo;
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @property    falconStack
   * @description Gets the current Falcon Stack.
   * @version     1.0.0
   * @public
   */
  //───────────────────────────────────────────────────────────────────────────┘
  public get falconStack():any {
    return this._falconStack;
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @property    falconUserInfo
   * @description Gets the current User Information object.
   * @version     1.0.0
   * @public
   */
  //───────────────────────────────────────────────────────────────────────────┘
  public get falconUserInfo():SfdxFalconErrorInfo {
    return this._falconUserInfo;
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      setFalconData
   * @param       {any} data  Required. ???
   * @description Given any type of data
   * @version     1.0.0
   * @public
   */
  //───────────────────────────────────────────────────────────────────────────┘
  public setFalconData(data:any={}):this {
    this._falconData = data;
    return this;
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      setChildError
   * @param       {Error} errorObj  Required. ???
   * @description Given an Error Object, sets the Child Error of this instance.
   * @version     1.0.0
   * @public
   */
  //───────────────────────────────────────────────────────────────────────────┘
  public setChildError(errorObj:Error):this {
    this._childError = SfdxFalconError.wrap(errorObj);
    return this;
  }
  
  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      terminateWithError
   * @param       {SfdxFalconResult} commandResult  Required. SFDX Falcon Result
   *              Object for the command that's being terminated with an error.
   * @param       {boolean} [showErrorDebug]  Optional. Determines if extended
   *              debugging output for the terminating Error can be shown.
   * @param       {boolean} [promptUser] Optional. Determines if the user will
   *              be prompted to display debug info. If FALSE, debug info will
   *              be shown without requiring additional user input.
   * @description Kills all ongoing async code (ie. Progress Notifications) and
   *              possibly renders an Error Debug before throwing an SfdxError
   *              so that the CLI can present user-friendly error info.
   * @version     1.0.0
   * @public @static  
   */
  //───────────────────────────────────────────────────────────────────────────┘
  public static async terminateWithError(commandResult:SfdxFalconResult, showErrorDebug:boolean=true, promptUser:boolean=true):Promise<void> {
  
    // Make sure any outstanding notifications are killed.
    FalconProgressNotifications.killAll();

    // Make sure that an SfdxFalconResult object was passed to us.
    if ((commandResult instanceof SfdxFalconResult) === false) {
      throw new Error('ERROR_X01: An unexpected fatal error has occured');
    }

    // Make sure that the SfdxFalconResult object comes to us with a contained SfdxFalconError Object.
    if ((commandResult.errObj instanceof SfdxFalconError) === false) {
      throw new Error('ERROR_X02: An unexpected fatal error has occured');
    }

    // Run the "Display Error Debug Info" process. This may prompt the user to view extended debug info.
    await SfdxFalconError.displayErrorDebugInfo(commandResult, showErrorDebug, promptUser);

    // Throw the COMMAND Result's Error object.
    throw commandResult.errObj;

    /*
    // TODO: If we want to move to using message bundles for outgoing error messages,
    //       then this code should be reintroduced and expanded.  Till then, leave it 
    //       commented out.
    // Extract the COMMAND Result's Error Object
    let error = commandResult.errObj;

    // Build an SfdxErrorConfig object
    let sfdxErrorConfig = new SfdxErrorConfig(
      'sfdx-falcon',          // Package Name
      'sfdxFalconError',      // Bundle Name
      'errDefault'            // Error Message Key
    );

    // Designate the core Message and extra "friendly info" as tokens for the final Error Message output
    sfdxErrorConfig.setErrorTokens([error.message, error.friendlyMessage]);

    // Search the SFDX error message to see if we can figure out a recommended action.
    switch (true) {
      case /VMC_DEV_TEST1/.test(error.message):
        sfdxErrorConfig.addAction('actionDevTest1', [`TEST_ONE`]);
        sfdxErrorConfig.addAction('actionDevTest2', [`TEST_TWO`]);
        break;
      case /^ERROR_UNKNOWN_ACTION:/.test(error.message):
        sfdxErrorConfig.addAction('ACTIONFOR_ERROR_UNKNOWN_ACTION');
        break;
      case /VMC_DEV_TEST3/.test(error.message):
        sfdxErrorConfig.addAction('actionDevTest2', [`TEST_FOUR`]);
        break;
    }

    // Create an SFDX Error, set the command name, and throw it.
    let sfdxError = SfdxError.create(sfdxErrorConfig);
    sfdxError.commandName = commandName;

    throw sfdxError;
    //*/
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      wrap
   * @param       {Error} error  Required. The Error object to wrap.
   * @description Given an instance of Error, wraps it as SFDX-Falcon Error and
   *              returns the result.
   * @version     1.0.0
   * @public @static
   */
  //───────────────────────────────────────────────────────────────────────────┘
  public static wrap(error:Error):SfdxFalconError {

    // If this is already an SfdxFalconError, just return it.
    if (error instanceof SfdxFalconError) {
      return error;
    }

    // Create a new instance of SFDX-Falcon Error.
    let falconError:SfdxFalconError;
    if (error instanceof Error) {
      falconError = new SfdxFalconError(error.message, `SfdxFalconError (${error.name})`);
    }
    else {
      falconError       = new SfdxFalconError(`${error}`, `SfdxFalconError (Unknown)`);
      falconError.data  = {unknownObj: error}
    }

    // Return the new Falcon Error
    return falconError;
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      debug
   * @param       {Error}   errorToDebug  Required. Any object that is a child
   *              of Error.
   * @param       {number}  [inspectDepth]  Optional. Sets how deep the object
   *              inpsection goes when rendering object properties.
   * @returns     {void}
   * @description Given an object derived from Error and optionally a number
   *              indicating the inspection depth, renders to DEBUG a
   *              customized display of the information contained in the Error.
   * @version     1.0.0
   * @public @static
   */
  //───────────────────────────────────────────────────────────────────────────┘
  public static debug(errorToDebug:any, inspectDepth:number=2):void {
    SfdxFalconDebug.debugMessage(`ERROR_DEBUG`, SfdxFalconError.renderError(errorToDebug, inspectDepth));
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      display
   * @param       {Error}   errorToDisplay  Required. Any object that is a child
   *              of Error.
   * @param       {number}  [inspectDepth]  Optional. Sets how deep the object
   *              inpsection goes when rendering object properties.
   * @returns     {void}
   * @description Given an object derived from Error and optionally a number
   *              indicating the inspection depth, renders to console.log a
   *              customized display of the information contained in the Error.
   * @version     1.0.0
   * @public @static
   */
  //───────────────────────────────────────────────────────────────────────────┘
  public static display(errorToDisplay:any, inspectDepth:number=2):void {

    // Use console.log() to display what the renderer gives us.
    let headline = chalk`\n{yellow FALCON_PLUGIN_ERROR_DEBUG:}\n`
    console.log(headline + SfdxFalconError.renderError(errorToDisplay, inspectDepth));
    return;
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      renderBaseDetail
   * @param       {Error}   errorToRender  Required. Any object that is a child
   *              of Error.
   * @param       {SfdxFalconErrorRenderOptions}  options  Required. Rendering
   *              options that determine colors and inspection depth.
   * @returns     {string}
   * @description Generates the baseline set of completely formatted output 
   *              that is relevant to ALL Errors.
   * @version     1.0.0
   * @private @static
   */
  //───────────────────────────────────────────────────────────────────────────┘
  private static renderBaseDetail(errorToRender:Error, options:SfdxFalconErrorRenderOptions):string {
    let renderOutput  = 
        chalk`\n{${options.errorLabelColor} Error Name:}    {${options.valueColor} ${errorToRender.name}}`
      + chalk`\n{${options.errorLabelColor} Error Message:} {${options.valueColor} ${errorToRender.message}}`
      + chalk`\n{${options.errorLabelColor} Error Stack:} \n{${options.valueColor} ${errorToRender.stack}}`
    return renderOutput;
  }
  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      renderError
   * @param       {Error}   errorToRender  Required. Any object that is a child
   *              of Error.
   * @param       {number}  [childInspectDepth] Optional. Sets how deep the
   *              object inpsection goes when rendering "child" objects.
   * @param       {number}  [detailInspectDepth]  Optional. Sets how deep the
   *              object inpsection goes when rendering "detail" objects.
   * @param       {number}  [errorInspectDepth] Optional. Sets how deep the
   *              object inpsection goes when rendering "error" objects.
   * @returns     {string}
   * @description Generates a string of completely formatted output that's ready 
   *              for display to the user via console.log() or debug(). Relies
   *              on the caller to decide how to actually display to the user.
   * @version     1.0.0
   * @private @static
   */
  //───────────────────────────────────────────────────────────────────────────┘
  public static renderError(errorToRender:Error, childInspectDepth:number=2, detailInspectDepth:number=4, errorInspectDepth:number=4):string {

    // Setup the options that will be used
    let renderOptions:SfdxFalconErrorRenderOptions = {
      headerColor:        `yellow`,
      labelColor:         `blue`,
      errorLabelColor:    `red`,
      valueColor:         `reset`,
      childInspectDepth:  childInspectDepth,
      detailInspectDepth: detailInspectDepth,
      errorInspectDepth:  errorInspectDepth
    }

    // If what we got is NOT any type of Error, render as UNKNOWN
    if ((errorToRender instanceof Error) !== true) {
      return SfdxFalconError.renderUnknownDetail(errorToRender, renderOptions);
    }

    // Render the BASE error info. All Error objects should have enough to render here.
    let renderOutput = SfdxFalconError.renderBaseDetail(errorToRender, renderOptions);

    // Check for SfdxError
    if (errorToRender instanceof SfdxError) {
      renderOutput += SfdxFalconError.renderSfdxErrorDetail(errorToRender, renderOptions);
    }
    // Check for SfdxFalconError
    if (errorToRender instanceof SfdxFalconError) {
      renderOutput += SfdxFalconError.renderSfdxFalconErrorDetail(errorToRender, renderOptions);
    }
    // Check for SfdxCliError
    if (errorToRender instanceof SfdxCliError) {
      renderOutput += SfdxFalconError.renderSfdxCliErrorDetail(errorToRender, renderOptions);
    }
    // Check for ShellError
    if (errorToRender instanceof ShellError) {
      renderOutput += SfdxFalconError.renderShellErrorDetail(errorToRender, renderOptions);
    }
    
    // All done. Return the rendered output to caller.
    return renderOutput;
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      renderSfdxCliErrorDetail
   * @param       {SfdxCliError}  errorToRender  Required. Any object that is
   *              a child of Error.
   * @param       {SfdxFalconErrorRenderOptions}  options  Required. Rendering
   *              options that determine colors and inspection depth.
   * @returns     {string}
   * @description Generates an extended set of completely formatted output 
   *              that is relevant only to SfdxCliError objects.
   * @version     1.0.0
   * @private @static
   */
  //───────────────────────────────────────────────────────────────────────────┘
  private static renderSfdxCliErrorDetail(errorToRender:SfdxCliError, options:SfdxFalconErrorRenderOptions):string {
    let renderOutput  = '';
    if (isEmpty(errorToRender.cliError.name) === false) {
      renderOutput += chalk`\n{${options.errorLabelColor} CLI Error Name:}    ${errorToRender.cliError.name}`;
    }
    if (isEmpty(errorToRender.cliError.message) === false) {
      renderOutput += chalk`\n{${options.errorLabelColor} CLI Error Message:} ${errorToRender.cliError.message}`;
    }
    if (isEmpty(errorToRender.cliError.status) === false) {
      renderOutput += chalk`\n{${options.errorLabelColor} CLI Error Status:}  ${errorToRender.cliError.status}`;
    }
    // Render any "actions" as straight string output so newlines are respected in the output.
    if (Array.isArray(errorToRender.cliError.actions)) {
      renderOutput += chalk`\n{${options.errorLabelColor} CLI Error Actions:}`
      for (let i=0; i<errorToRender.cliError.actions.length; i++) {
        renderOutput += chalk`\n{green ${errorToRender.cliError.actions[i]}}`;
      }
    }
    if (isEmpty(errorToRender.cliError.warnings) === false) {
      renderOutput += chalk`\n{${options.errorLabelColor} CLI Error Warnings:}\n${util.inspect(errorToRender.cliError.warnings, {depth:options.childInspectDepth, colors:true})}`;
    }
    // Only display the CLI Error Stack if Child Inspect Depth is set to 5 or higher.
    if (isEmpty(errorToRender.cliError.stack) === false && options.childInspectDepth >= 5) {
      renderOutput += chalk`\n{${options.errorLabelColor} CLI Error Stack:}   \n${errorToRender.cliError.stack}`;
    }
    // Only display the CLI Error's "raw result" if the Child Inspect Depth is set to 2 or higher.
    if (isEmpty(errorToRender.cliError.result) === false && options.childInspectDepth >= 2) {
      let cliRawResultDepth = 5;
      renderOutput += chalk`\n{${options.errorLabelColor} CLI Error Raw Result: (Depth ${cliRawResultDepth})}\n${util.inspect(errorToRender.cliError.result, {depth:cliRawResultDepth, colors:true})}`;
    }
    return renderOutput;
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      renderSfdxErrorDetail
   * @param       {SfdxCliError}  errorToRender  Required. Any object that is
   *              a child of Error.
   * @param       {SfdxFalconErrorRenderOptions}  options  Required. Rendering
   *              options that determine colors and inspection depth.
   * @returns     {string}
   * @description Generates an extended set of completely formatted output 
   *              that is relevant only to SfdxError objects.
   * @version     1.0.0
   * @private @static
   */
  //───────────────────────────────────────────────────────────────────────────┘
  private static renderSfdxErrorDetail(errorToRender:SfdxError, options:SfdxFalconErrorRenderOptions):string {
    let renderOutput  = '';
    if (isEmpty(errorToRender.data) === false) {
      renderOutput += chalk`\n{${options.errorLabelColor} SfdxError Data (Depth ${options.childInspectDepth}):}\n{reset ${util.inspect(errorToRender.data, {depth:options.childInspectDepth, colors:true})}}`;
    }
    if (isEmpty(errorToRender.cause) === false) {
      renderOutput += chalk`\n{${options.errorLabelColor} SfdxError Cause (Depth ${options.childInspectDepth}):}\n{reset ${util.inspect(errorToRender.cause, {depth:options.childInspectDepth, colors:true})}}`;
    }
    if (isEmpty(errorToRender.actions) === false) {
      renderOutput += chalk`\n{${options.errorLabelColor} SfdxError Actions (Depth ${options.childInspectDepth}):}\n{reset ${util.inspect(errorToRender.actions, {depth:options.childInspectDepth, colors:true})}}`;
    }
    return renderOutput;
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      renderSfdxFalconErrorDetail
   * @param       {SfdxCliError}  errorToRender  Required. Any object that is
   *              a child of Error.
   * @param       {SfdxFalconErrorRenderOptions}  options  Required. Rendering
   *              options that determine colors and inspection depth.
   * @returns     {string}
   * @description Generates an extended set of completely formatted output 
   *              that is relevant only to SfdxFalconError objects.
   * @version     1.0.0
   * @private @static
   */
  //───────────────────────────────────────────────────────────────────────────┘
  private static renderSfdxFalconErrorDetail(errorToRender:SfdxFalconError, options:SfdxFalconErrorRenderOptions):string {
    let renderOutput = '';
    if (isEmpty(errorToRender.falconStack) === false) {
      renderOutput += chalk`\n{${options.errorLabelColor} Falcon Stack:}\n${errorToRender.falconStack}`;
    }
    if (isEmpty(errorToRender.falconData) === false) {
      renderOutput += chalk`\n{${options.errorLabelColor} Falcon Data (Depth ${options.childInspectDepth}):}\n{reset ${util.inspect(errorToRender.falconData, {depth:options.childInspectDepth, colors:true})}}`;
    }
    return renderOutput;
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      renderShellErrorDetail
   * @param       {ShellError}  errorToRender  Required. Any object that is
   *              a child of Error.
   * @param       {SfdxFalconErrorRenderOptions}  options  Required. Rendering
   *              options that determine colors and inspection depth.
   * @returns     {string}
   * @description Generates an extended set of completely formatted output 
   *              that is relevant only to ShellError objects.
   * @version     1.0.0
   * @private @static
   */
  //───────────────────────────────────────────────────────────────────────────┘
  private static renderShellErrorDetail(errorToRender:ShellError, options:SfdxFalconErrorRenderOptions):string {
    let renderOutput = '';
    if (isEmpty(errorToRender.shellError.code) === false)
      renderOutput += chalk`\n{${options.errorLabelColor} ShellError Code:}    ${errorToRender.shellError.code}`;
    if (isEmpty(errorToRender.shellError.signal) === false)
      renderOutput += chalk`\n{${options.errorLabelColor} ShellError Signal:}  ${errorToRender.shellError.signal}`;
    if (isEmpty(errorToRender.shellError.message) === false)
      renderOutput += chalk`\n{${options.errorLabelColor} ShellError Message:} ${errorToRender.shellError.message}`;
    if (isEmpty(errorToRender.shellError.stderr) === false)
      renderOutput += chalk`\n{${options.errorLabelColor} ShellError StdErr:}\n${errorToRender.shellError.stderr}`;
    if (isEmpty(errorToRender.shellError.stdout) === false)
      renderOutput += chalk`\n{${options.errorLabelColor} ShellError StdOut:}\n${errorToRender.shellError.stdout}`;
    return renderOutput;
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      renderUnknown
   * @param       {Error}   errorToDisplay  Required. Any object that is a child
   *              of Error.
   * @param       {number}  [inspectDepth]  Optional. Sets how deep the object
   *              inpsection goes when rendering object properties.
   * @returns     {void}
   * @description Given an object derived from Error and optionally a number
   *              indicating the inspection depth, renders to console.log a
   *              customized display of the information contained in the Error.
   * @version     1.0.0
   * @public @static
   */
  //───────────────────────────────────────────────────────────────────────────┘
  private static renderUnknownDetail(unknownObject:any, options:SfdxFalconErrorRenderOptions):string {
    let renderOutput  = 
        chalk`\n{${options.errorLabelColor} Error Name:}    {${options.valueColor} UNKNOWN}`
      + chalk`\n{${options.errorLabelColor} Error Message:} {${options.valueColor} The object provided is not of type 'Error'}`
      + chalk`\n{${options.errorLabelColor} Error Stack:}   {${options.valueColor} Not Available}`
      + chalk`\n{${options.errorLabelColor} Raw Object: (Depth ${options.childInspectDepth})}\n${util.inspect(unknownObject, {depth:options.childInspectDepth, colors:true})}`
    return renderOutput;    
  }
}

//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @class       SfdxFalconErrorInfo
 * @description Stores detailed error information & messages for display to multiple user personas.
 * @version     1.0.0
 * @public
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
export class SfdxFalconErrorInfo {

  // Public Members
  public title:   string;
  public message: string;
  public actions: Array<string>;

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @constructs  SfdxFalconErrorInfo
   * @description Stores detailed error information & messages for display to
   *              multiple user personas.
   * @version     1.0.0
   * @public
   */
  //───────────────────────────────────────────────────────────────────────────┘
  public constructor() {
    this.title    = 'UNKNOWN ERROR';
    this.message  = 'An unknown error has occured';
    this.actions  = [];
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      addAction
   * @param       {string}  actionItem Required. Action that the user can take
   *              to recover from whatever caused this error.
   * @description Adds a new string to the "actions" array.
   * @version     1.0.0
   * @public
   */
  //───────────────────────────────────────────────────────────────────────────┘
  public addAction(actionItem:string=''):void {
    this.actions.push(actionItem);
  }
}

//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @class       SfdxCliError
 * @extends     SfdxFalconError
 * @description Extends SfdxFalconError to provide specialized error handling of error results
 *              returned from CLI commands run via shell exec.
 * @version     1.0.0
 * @public
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
export class SfdxCliError extends SfdxFalconError {

  // Member vars
  public cliError: CliErrorDetail;

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @constructs  SfdxCliError
   * @param       {string}  stdErrBuffer  Required. Results from an stderr
   *              stream resulting from a call to a Salesforce CLI command.
   * @description Given a string (typically the contents of a stderr buffer),
   *              returns an SfdxFalconError object with a specialized 
   *              "cliError" object property.
   * @version     1.0.0
   * @public
   */
  //───────────────────────────────────────────────────────────────────────────┘
  public constructor(stdErrBuffer:string, message:string='Unknown CLI Error') {

    // Initialize the cliError member var and helper vars.
    let cliError  = <CliErrorDetail>{};
    let actions   = new Array<string>();

    // Try to parse stdErrBuffer into an object, then try to copy over the standard SFDX CLI error details
    try {
      let parsedError = JSON.parse(stdErrBuffer);
      cliError.name      = parsedError.name      || `UnknownCliError`;
      cliError.message   = parsedError.message   || `Unknown CLI Error (see 'cliError.result.rawResult' for original CLI response)`;
      cliError.status    = (isNaN(parsedError.status)) ?  1 : parsedError.status;
      // Figuring out "actions" is a little complicated because it may be "actions" or "action"
      // (or not even there) in the JSON retured from the CLI. Try to handle all possibilities.
      if (Array.isArray(parsedError.actions)) {
        actions = actions.concat(parsedError.actions);
      }
      if (parsedError.action) {
        actions.push(parsedError.action);
      }
      cliError.actions   = actions;
      cliError.warnings  = parsedError.warnings  || [];
      cliError.stack     = parsedError.stack     || '';
      cliError.result    = parsedError.result    || {rawResult: parsedError};

    }
    catch (parsingError) {
      cliError.name      = `UnparseableCliError`;
      cliError.message   = `Unparseable CLI Error (see 'cliError.result.rawResult' for raw error)`;
      cliError.status    = 999;
      cliError.actions   = [];
      cliError.warnings  = [];
      cliError.stack     = `Unparseable CLI Error (see 'cliError.result.rawResult' for raw error)`;
      cliError.result    = {rawResult: stdErrBuffer};
    }

    // Call the parent constructor to get our baseline SfdxFalconError object.
    super(`${message}. ${cliError.message}`, 'SfdxCliError');

    // Attach the cliError variable to this SfdxCliError object.
    this.cliError = cliError;

    // Pull any "actions" out of the CLI Error and attach them to the SfdxError.actions property.
    if (isEmpty(cliError.actions) === false) {
      this.actions = cliError.actions;
    }

    // Add a detail line to the Falcon Stack.
    this.addToStack(`${this.cliError.name}: ${this.cliError.message}`);
    return;
  }
}

//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @class       ShellError
 * @extends     SfdxFalconError
 * @description Extends SfdxFalconError to provide specialized error handling of error results
 *              returned by failed shell commands which may or may not provide a JSON structure as
 *              part of their error message.
 * @version     1.0.0
 * @public
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
export class ShellError extends SfdxFalconError {

  // Member vars
  public shellError: ShellErrorDetail;

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @constructs  ShellError
   * @param       {number}  code  Required. Exit code provided by the Shell.
   *              If NULL, then signal must have a value.
   * @param       {string}  signal  Required. Signal which caused the Shell to 
   *              terminate. If NULL, then code must have a value.
   * @param       {string}  stdErrBuffer  Required. Contents of stderr when the
   *              shell was terminated.
   * @param       {string}  [stdOutBuffer]  Optional. Contents of stdout when the
   *              shell was terminated.
   * @param       {string}  [message] Optional. Message that the caller would
   *              like the user to see. If not provided, will default to the
   *              contents of stderr.
   * @description Returns an SfdxFalconError object with a specialized set of 
   *              information in the "shellError" object property.
   * @version     1.0.0
   * @public
   */
  //───────────────────────────────────────────────────────────────────────────┘
  public constructor(code:number, signal:string, stdErrBuffer:string, stdOutBuffer:string=null, message:string='') {

    // Set the message to be either what the caller provided, the first line of stdErrBuffer, or a default message.
    if (!message) {
      if (typeof stdErrBuffer === 'string' && stdErrBuffer) {
        message = stdErrBuffer.substr(0, stdErrBuffer.indexOf('\n'));
      }
      else if (typeof stdOutBuffer === 'string' && stdOutBuffer) {
        message = stdOutBuffer.substr(0, stdOutBuffer.indexOf('\n'));
      }
      else {
        // Set a default "Unknown Shell Error" message.
        message = `Unknown Shell Error (code=${code}, signal=${signal})`;
      }
    }

    // Call the parent constructor to get our baseline Error.
    super(`${message}`, 'ShellError');

    // Initialize the shellError member var.
    this.shellError = <ShellErrorDetail>{};

    // Copy over all of the Shell Error details
    this.shellError.code    = code;
    this.shellError.signal  = signal;
    this.shellError.stdout  = stdOutBuffer;
    this.shellError.stderr  = stdErrBuffer;
    this.shellError.message = message;

    // Add a detail line to the Falcon Stack.
    //this.addToStack(`at ${this.shellError.code}: ${this.shellError.message}`);
    return;
  }
}