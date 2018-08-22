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
import {SfdxError}                    from  '@salesforce/core';             // Why?
import {SfdxErrorConfig}              from  '@salesforce/core';             // Why?
import {FalconProgressNotifications}  from  '../sfdx-falcon-notifications'  // Why?
import {SfdxFalconDebug}              from  '../sfdx-falcon-debug';         // Why?
import {SfdxFalconResult}             from  '../sfdx-falcon-result';        // Why?

// Require Modules
const chalk = require('chalk'); // Why?
const util  = require('util');  // Why?

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
 * @class       SfdxFalconError
 * @extends     SfdxError
 * @description Extends SfdxError to provide specialized error structures for SFDX-Falcon modules.
 * @version     1.0.0
 * @public
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
export class SfdxFalconError extends SfdxError {

  // Private Members
  private _falconStack: string;   // Keeps a record of each member in the SFDX-Falcon chain that touches this error.
  private _falconData:  any;      // Additional information that's relevant to this error.

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
    this._falconStack  = `${this.name}: ${this.message}`;
    this._falconData   = {};
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
   * @method      terminateWithError
   * @param       {Error} error  Required. Error that's causing the termination.
   * @param       {string}  commandName Required. Command being terminated.
   * @param       {boolean} [showErrorDebug]  Optional. Determines if extended
   *              debugging output for the terminating Error will be shown.
   * @description Kills all ongoing async code (ie. Progress Notifications) and
   *              possibly renders an Error Debug before throwing an SfdxError
   *              so that the CLI can present user-friendly error info.
   * @version     1.0.0
   * @public @static
   */
  //───────────────────────────────────────────────────────────────────────────┘
  public static terminateWithError(error:any, commandName:string, showErrorDebug:boolean=false):void {
  
    // Make sure any outstanding notifications are killed.
    FalconProgressNotifications.killAll();

    // Check if we got an SFDX-Falcon RESULT and pull out it's errObj (if present)
    if (error instanceof SfdxFalconResult) {
      error = error.errObj;
    }

    // Make sure that whatever we get is wrapped as a Falcon Error.
    error = SfdxFalconError.wrap(error);

    // Display a formatted version of the stdError before throwing the SfdxError.
    // TODO: Move all Error Rendering/Display logic into this class
    if (showErrorDebug) {
      SfdxFalconError.display(error, SfdxFalconDebug.debugDepth);
    }

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
//    let sfdxError = SfdxError.create(sfdxErrorConfig);
//    sfdxError.commandName = commandName;
    throw error;
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
    console.log(SfdxFalconError.renderError(errorToDisplay, inspectDepth));
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
        chalk`\n{${options.headerColor} CLI_ERROR_DEBUG:}`
      + chalk`\n{${options.labelColor} Error Name:}    {${options.valueColor} ${errorToRender.name}}`
      + chalk`\n{${options.labelColor} Error Message:} {${options.valueColor} ${errorToRender.message}}`
      + chalk`\n{${options.labelColor} Error Stack:}   {${options.valueColor} ${errorToRender.stack}}`
    return renderOutput;    
  }
  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      renderError
   * @param       {Error}   errorToRender  Required. Any object that is a child
   *              of Error.
   * @param       {number}  [inspectDepth]  Optional. Sets how deep the object
   *              inpsection goes when rendering object properties.
   * @returns     {string}
   * @description Generates a string of completely formatted output that's ready 
   *              for display to the user via console.log() or debug(). Relies
   *              on the caller to decide how to actually display to the user.
   * @version     1.0.0
   * @private @static
   */
  //───────────────────────────────────────────────────────────────────────────┘
  public static renderError(errorToRender:Error, inspectDepth:number=2):string {

    // Setup the options that will be used
    let renderOptions:SfdxFalconErrorRenderOptions = {
      headerColor:        `yellow`,
      labelColor:         `blue`,
      errorLabelColor:    `red`,
      valueColor:         `reset`,
      childInspectDepth:  inspectDepth,
      detailInspectDepth: 4,
      errorInspectDepth:  4
    }

    // If what we got is NOT any type of Error, render as UNKNOWN
    if ((errorToRender instanceof Error) !== true) {
      return SfdxFalconError.renderUnknownDetail(errorToRender, renderOptions);
    }

    // Render the BASE info for this result.
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
    
    // Add a extra line break at the close and return to caller.
    renderOutput += `\n`;
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
    let renderOutput  = 
      chalk`\n{${options.labelColor} CLI Error Name:}    ${errorToRender.cliError.name}`
    + chalk`\n{${options.labelColor} CLI Error Message:} ${errorToRender.cliError.message}`
    + chalk`\n{${options.labelColor} CLI Error Status:}  ${errorToRender.cliError.status}`
    + chalk`\n{${options.labelColor} CLI Error Stack:} \n${errorToRender.cliError.stack}`
    + chalk`\n{${options.labelColor} CLI Error Result: (Depth ${options.childInspectDepth})}\n${util.inspect(errorToRender.cliError.result, {depth:options.childInspectDepth, colors:true})}`
    + chalk`\n{${options.labelColor} CLI Error Warnings:}\n${errorToRender.cliError.result}`
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
    let renderOutput  = 
      chalk`\n{${options.labelColor} SfdxError Data (Depth ${options.childInspectDepth}):}\n{reset ${util.inspect(errorToRender.data, {depth:options.childInspectDepth, colors:true})}}`
    + chalk`\n{${options.labelColor} SfdxError Cause (Depth ${options.childInspectDepth}):}\n{reset ${util.inspect(errorToRender.cause, {depth:options.childInspectDepth, colors:true})}}`
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
    let renderOutput  = 
      chalk`\n{${options.labelColor} Falcon Stack:}\n${errorToRender.falconStack}`
    + chalk`\n{${options.labelColor} Falcon Data (Depth ${options.childInspectDepth}):}\n{reset ${util.inspect(errorToRender.falconData, {depth:options.childInspectDepth, colors:true})}}`
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
        chalk`\n{${options.headerColor} CLI_ERROR_DEBUG:}`
      + chalk`\n{${options.labelColor} Error Name:}    {${options.valueColor} UNKNOWN}`
      + chalk`\n{${options.labelColor} Error Message:} {${options.valueColor} The object provided is not of type 'Error'}`
      + chalk`\n{${options.labelColor} Error Stack:}   {${options.valueColor} Not Available}`
      + chalk`\n{${options.labelColor} Raw Object: (Depth ${options.childInspectDepth})}\n${util.inspect(unknownObject, {depth:options.childInspectDepth, colors:true})}`
      + `\n`;
    return renderOutput;    
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

    // Call the parent constructor to get our baseline Error.
    super(`ERROR_SALESFORCE_CLI: ${message}`, 'SfdxCliError');

    // Initialize the cliError member var.
    this.cliError = <CliErrorDetail>{};

    // Try to parse stdErrBuffer into an object, then try to copy over the standard SFDX CLI error details
    let parsedError;
    try {
      parsedError = JSON.parse(stdErrBuffer);
      this.cliError.name      = parsedError.name      || `Unknown CLI Error`;
      this.cliError.message   = parsedError.message   || `Unknown CLI Error`;
      this.cliError.status    = (typeof parsedError.status !== 'undefined') ? parsedError.status : 1;
      this.cliError.stack     = parsedError.stack     || this.name;
      this.cliError.result    = parsedError.result    || {};
      this.cliError.warnings  = parsedError.warnings  || [];
    }
    catch (parsingError) {
      this.cliError.name      = `ERROR_NOT_PARSEABLE`;
      this.cliError.message   = `Unparseable CLI Error (see 'cliError.result.rawResult' for raw error)`;
      this.cliError.status    = 999;
      this.cliError.stack     = `Unparseable CLI Error (see 'cliError.result.rawResult' for raw error)`;
      this.cliError.result    = {rawResult: stdErrBuffer};
      this.cliError.warnings  = [];
    }

    // Add a detail line to the Falcon Stack.
    this.addToStack(`${this.cliError.name}: ${this.cliError.message}`);
    return;
  }
}