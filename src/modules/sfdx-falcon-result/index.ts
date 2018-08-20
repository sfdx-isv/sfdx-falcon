//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @file          modules/sfdx-falcon-result/index.ts
 * @copyright     Vivek M. Chawla - 2018
 * @author        Vivek M. Chawla <@VivekMChawla>
 * @summary       ???
 * @description   ???
 * @version       1.0.0
 * @license       MIT
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
// Import Local Modules
import { SfdxFalconError2 } from "../sfdx-falcon-error/index.2";
import { SfdxFalconDebug } from "../sfdx-falcon-debug";

// Require Modules
const chalk = require('chalk'); // Why?
const util  = require('util');  // Why?

//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @interface   SfdxFalconResultRenderOptions
 * @description Options object used by the various Render functions to customize display output.
 * @version     1.0.0
 * @public
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
export interface SfdxFalconResultRenderOptions {
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
 * @enum        SfdxFalconResultStatus
 * @description Represents the different types of sources where Results might come from.
 * @version     1.0.0
 * @public
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
export const enum SfdxFalconResultStatus {
  INITIALIZED = 'INITIALIZED',
  WAITING     = 'WAITING',
  SUCCESS     = 'SUCCESS',
  FAILURE     = 'FAILURE',
  WARNING     = 'WARNING',
  ERROR       = 'ERROR',
  UNKNOWN     = 'UNKNOWN'
}

//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @enum        SfdxFalconResultType
 * @description Represents the different types of sources where Results might come from.
 * @version     1.0.0
 * @public
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
export const enum SfdxFalconResultType {
  COMMAND   = 'COMMAND',
  EXECUTOR  = 'EXECUTOR',
  ACTION    = 'ACTION',
  ENGINE    = 'ENGINE',
  RECIPE    = 'RECIPE',
  INQUIRER  = 'INQUIRER',
  LISTR     = 'LISTR',
  UNKNOWN   = 'UNKNOWN'
}

//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @class       SfdxFalconResult
 * @description Implements a framework for creating results-driven, informational objects with a
 *              concept of heredity (child results) and the ability to "bubble up" both Errors
 *              (thrown exceptions) and application-defined "failures".
 * @version     1.0.0
 * @public
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
export class SfdxFalconResult {

  // Private static vars
  private static  labelColor:string   = 'blue';
  private static  detailColor:string  = 'yellow';

  // Public member vars
  public name:            string;
  public type:            SfdxFalconResultType;
  public detail:          object;
  public errObj:          SfdxFalconError2;
  public children:        Array<SfdxFalconResult>;

  // Private member vars
  private _bubbleError:   boolean;
  private _bubbleFailure: boolean;
  private _status:        SfdxFalconResultStatus;
  private _startTime:     number;
  private _endTime:       number;

  // Property accessors
  public get status():SfdxFalconResultStatus {
    return this._status;
  }
  public get duration():number {
    // If there is no start time, just return zero.
    if (this._startTime === 0) {return 0;}
    // If there is an end time, return the "historical" duration.
    if (this._endTime !== 0) {return this._endTime - this._startTime;}
    // The clock is still running (no end time yet), so return the current duration.
    return (new Date().getTime() - this._startTime);
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @constructs  SfdxFalconResult
   * @param       {string}  name  Required. The name of this Result.
   * @param       {SfdxFalconResultType}  type  Required. Type of this Result.
   * @param       {any} [options] Optional. Options are "startNow", 
   *              "bubbleError", and "bubbleFailure".
   * @description Constructs an SfdxFalconResult object.
   * @version     1.0.0
   * @public
   */
  //───────────────────────────────────────────────────────────────────────────┘
  public constructor(name:string, type:SfdxFalconResultType, options:any={}) {
    this.name         = name;
    this.type         = type;
    this.detail       = <any>{};
    this.errObj       = <SfdxFalconError2>{};
    this.children     = new Array<SfdxFalconResult>();
    this._status      = SfdxFalconResultStatus.INITIALIZED;
    this._startTime   = 0;
    this._endTime     = 0;

    // Set default options then override them with whatever comes from the caller.
    let resolvedOptions = {
      startNow:       true,
      bubbleError:    true,
      bubbleFailure:  true,
      ...options
    }

    // Process options to customize this instance
    if (resolvedOptions.startNow) {
      this.start();
    }
    this._bubbleError   = (resolvedOptions.bubbleError)   ? true : false;
    this._bubbleFailure = (resolvedOptions.bubbleFailure) ? true : false;
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      addChild
   * @param       {SfdxFalconResult}  childResult  Required.
   * @returns     {this}  Returns "this" instance to support method chaining.
   * @description Given an SFDX-Falcon Result, inspect the result then add it
   *              to the children array. If the child result is a FAILURE or
   *              ERROR, bubble this up by marking this as FAILURE or ERROR if
   *              bubbleFailure or bubbleError are TRUE.
   * @version     1.0.0
   * @public
   */
  //───────────────────────────────────────────────────────────────────────────┘
  public addChild(childResult:SfdxFalconResult):this {
    // DEVTEST
    console.log(`Called addChild() with this childResult:\n%O`, childResult);


    // Make sure we are getting an SFDX-Falcon Result.
    if ((childResult instanceof SfdxFalconResult) !== true) {

      // Try to wrap the non-SfdxFalconResult and then attempt to add it as a child.
      childResult = SfdxFalconResult.wrap(childResult, 'UNKNOWN RESULT', SfdxFalconResultType.UNKNOWN);
      this.addChild(childResult);
      return this;
    }

    // Add the Child Result to the array of children for this Result.
    this.children.push(childResult);

    // Special handling of BUBBLED FAILURE results...
    if (childResult.status === SfdxFalconResultStatus.FAILURE) {
      if (this._bubbleFailure) {
        this.failure(childResult);
        return this;
      }
    }

    // Special handling of BUBBLED ERROR results...
    if (childResult.status === SfdxFalconResultStatus.ERROR) {
      if (this._bubbleError) {
        this.throw(childResult.errObj);
      }
    }

    // All special handling is done. Make sure Start Time is set then return this Result.
    this.start();
    return this;
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      debugResult
   * @returns     {void}  
   * @description Calls this.renderResult() to generate a complete, formatted
   *              set of information about this Result and displays that result
   *              to the user via SfdxFalconDebug (guranteed output).
   * @version     1.0.0
   * @public
   */
  //───────────────────────────────────────────────────────────────────────────┘
  public debugResult():void {
    SfdxFalconDebug.debugMessage(`${this.type}_RESULT:`, this.renderResult());
  }  
  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      displayResult
   * @returns     {void}  
   * @description Calls this.renderResult() to generate a complete, formatted
   *              set of information about this Result and displays that result
   *              to the user via console.log().
   * @version     1.0.0
   * @public
   */
  //───────────────────────────────────────────────────────────────────────────┘
  public displayResult():void {
    console.log(this.renderResult());
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      error
   * @param       {Error}  errorDetail  Required.
   * @returns     {this}  Returns "this" instance to support method chaining.
   * @description Sets the stop time to NOW, marks status as ERROR, sets this
   *              Result's detail to an empty object, and stores the provided
   *              Error object as a Falcon Error as this Result's errObj.
   * @version     1.0.0
   * @public
   */
  //───────────────────────────────────────────────────────────────────────────┘
  public error(errorDetail?:Error):this {

    // Make sure we start with an Error
    if ((errorDetail instanceof Error) !== true) {
      if (typeof errorDetail === 'string') {
        errorDetail = new Error(errorDetail);
      }
      else {
        errorDetail = new Error(`ERROR_RESULT: An unknown error occured while building results for ${this.name}`);
      }
    }

    // Wrap the error in an SfdxFalconError2
    let falconError = SfdxFalconError2.wrap(errorDetail);

    // Add a message to the Falcon Stack of this error.
    falconError.addToStack(`at Result '${this.name}' of type '${this.type}' at duration ${this.duration}`);

    // Since this is an error, make sure the detail member var is an empty object.
    this.detail = {};

    // Store the error as our result AND as the errObj and set status to ERROR.
    this.errObj = falconError;

    // Stop the timer with an ERROR end status.
    this.finish(SfdxFalconResultStatus.ERROR);

    // Return this instance (for possible chaining).
    return this;
  }
  
  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      failure
   * @param       {object}  failureResult  Required.
   * @returns     {this}  Returns "this" instance to support method chaining.
   * @description Sets the stop time to NOW, marks status as FAILURE, and stores
   *              the provided "failure result" as the result.
   * @version     1.0.0
   * @public
   */
  //───────────────────────────────────────────────────────────────────────────┘
  public failure(failureResult:object={}):this {

    // Stop the timer with an ERROR end status.
    this.finish(SfdxFalconResultStatus.FAILURE);

    // Set the result (handles non-object input)
    this.setDetail(failureResult);

    // Return this instance (for possible chaining).
    return this;
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      finish
   * @param       {SfdxFalconResultStatus}  finalStatus Required.
   * @returns     {void}
   * @description Sets the stop time to NOW if it hasn't been set before and
   *              sets the final status to whatever is passed in.
   * @version     1.0.0
   * @private
   */
  //───────────────────────────────────────────────────────────────────────────┘
  private finish(finalStatus:SfdxFalconResultStatus):void {

    // Only set the end time if it hasn't been set before AND the start time was set.
    if (this._endTime === 0 && this._startTime !== 0) {
      let d = new Date();
      this._endTime = d.getTime();
    }

    // Default status to UNKNOWN if not provided by caller.
    if (typeof finalStatus === 'undefined') {
      finalStatus = SfdxFalconResultStatus.UNKNOWN;
    }

    // Set status and return.
    this._status = finalStatus;
    return;
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      renderAnyDetail
   * @param       {SfdxFalconResult}  result  Required. The Result to render.
   * @param       {SfdxFalconResultRenderOptions}  options  Required. Options
   *              object that determines how the Result is rendered (colors,
   *              obect inspection depth, etc).
   * @returns     {void}  
   * @description Given an SFDX-Falcon Result, renders to the console info
   *              in a way acceptable for any type of SFDX-Falcon Result.
   * @version     1.0.0
   * @private @static
   */
  //───────────────────────────────────────────────────────────────────────────┘
  private static renderAnyDetail(result:SfdxFalconResult, options:SfdxFalconResultRenderOptions):string {
    let renderResult = 
        chalk`\n{${options.labelColor} Result Detail: (Depth=${options.detailInspectDepth})} {reset ${util.inspect(result.detail, {depth:options.detailInspectDepth, colors:true})}}`
      + chalk`\n{${options.labelColor} Number of Children:} {${options.valueColor} ${result.children.length}}`
      + chalk`\n{${options.labelColor} Child Results: (Depth=${options.childInspectDepth})}\n{reset ${util.inspect(result.children, {depth:options.childInspectDepth, colors:true})}}`;
    return renderResult;    
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      renderActionDetail
   * @param       {SfdxFalconResult}  result  Required. The Result to render.
   * @param       {SfdxFalconResultRenderOptions}  options  Required. Options
   *              object that determines how the Result is rendered (colors,
   *              obect inspection depth, etc).
   * @returns     {void}  
   * @description Given an SFDX-Falcon Result, renders to the console info
   *              that's specifid to SFDX-Falcon Results of type ACTION.
   * @version     1.0.0
   * @private @static
   */
  //───────────────────────────────────────────────────────────────────────────┘
  private static renderActionDetail(result:SfdxFalconResult, options:SfdxFalconResultRenderOptions):string {
    // Give the chance to override colors here
    let childInspectDepth   = options.childInspectDepth;
    let detailInspectDepth  = options.detailInspectDepth;
    let renderResult = 
        chalk`\n{${options.labelColor} Result Detail: (Depth=${detailInspectDepth})} {reset ${util.inspect(result.detail, {depth:detailInspectDepth, colors:true})}}`
      + chalk`\n{${options.labelColor} Number of Children:} {${options.valueColor} ${result.children.length}}`
      + chalk`\n{${options.labelColor} Child Results: (Depth=${childInspectDepth})}\n{reset ${util.inspect(result.children, {depth:childInspectDepth, colors:true})}}`;
    return renderResult;    
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      renderBaseDetail
   * @param       {SfdxFalconResult}  result  Required. The Result to render.
   * @param       {SfdxFalconResultRenderOptions}  options  Required. Options
   *              object that determines how the Result is rendered (colors,
   *              obect inspection depth, etc).
   * @returns     {void}  
   * @description Given an SFDX-Falcon Result, renders to the console all of the 
   *              basic information that's common to all SFDX-Falcon Results.
   * @version     1.0.0
   * @private @static
   */
  //───────────────────────────────────────────────────────────────────────────┘
  private static renderBaseDetail(result:SfdxFalconResult, options:SfdxFalconResultRenderOptions):string {
    let renderOutput  = 
        chalk`\n{${options.headerColor} ${result.type}_RESULT_DEBUG:}`
      + chalk`\n{${options.labelColor} Result Type:}       {${options.valueColor} ${result.type}}`
      + chalk`\n{${options.labelColor} Result Name:}       {${options.valueColor} ${result.name}}`
      + chalk`\n{${options.labelColor} Result Status:}     {${options.valueColor} ${result.status}}`
      + chalk`\n{${options.labelColor} Result Start Time:} {${options.valueColor} ${result._startTime} (UTC)}`
      + chalk`\n{${options.labelColor} Result End Time:}   {${options.valueColor} ${result._endTime} (UTC)}`
      + chalk`\n{${options.labelColor} Result Duration:}   {${options.valueColor} ${result.duration/1000} seconds}`
      //+ chalk`\n{${labelColor} Result Error:}     \n${xxxxxxxxx}`
    return renderOutput;
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      renderErrorDetail
   * @param       {SfdxFalconResult}  result  Required. The Result to render.
   * @param       {SfdxFalconResultRenderOptions}  options  Required. Options
   *              object that determines how the Result is rendered (colors,
   *              obect inspection depth, etc).
   * @returns     {void}  
   * @description Given an SFDX-Falcon Result, renders to the console info
   *              that's specifid to SFDX-Falcon Results of type ACTION.
   * @version     1.0.0
   * @private @static
   */
  //───────────────────────────────────────────────────────────────────────────┘
  private static renderErrorDetail(result:SfdxFalconResult, options:SfdxFalconResultRenderOptions):string {
    let renderResult  = '';
    let indent        = '';

    // If there is no Error Object as part of the Result, render an empty object ({}).
    if (typeof result.errObj === 'undefined' || Object.keys(result.errObj).length === 0) {
      return chalk`\n{${options.labelColor} Result Error:}      {${options.valueColor} ${'{}'}}`;
    }

    // We have an Error to render.
    renderResult += 
        chalk`\n{${options.labelColor} Result Error:}`
      + chalk`\n{${options.errorLabelColor} ${indent}Name:}      {${options.valueColor} ${result.errObj.name}}`
      + chalk`\n{${options.errorLabelColor} ${indent}Message:}   {${options.valueColor} ${result.errObj.message}}`
      + chalk`\n{${options.errorLabelColor} ${indent}Exit Code:} {${options.valueColor} ${result.errObj.exitCode}}`
      + chalk`\n{${options.errorLabelColor} ${indent}Stack:}     {${options.valueColor} ${result.errObj.stack}}`
      + chalk`\n{${options.errorLabelColor} ${indent}Falcon Stack:} {${options.valueColor} ${result.errObj.falconStack}}`
      + chalk`\n{${options.errorLabelColor} ${indent}Actions:}   {${options.valueColor} ${result.errObj.actions}}`
      + chalk`\n{${options.errorLabelColor} ${indent}Falcon Data (Depth=${options.errorInspectDepth}):} {reset ${util.inspect(result.errObj.falconData, {depth:options.errorInspectDepth, colors:true})}}`
      + chalk`\n{${options.errorLabelColor} ${indent}Data (Depth=${options.errorInspectDepth}):}        {reset ${util.inspect(result.errObj.data, {depth:options.errorInspectDepth, colors:true})}}`
      + chalk`\n{${options.errorLabelColor} ${indent}Cause (Depth=${options.errorInspectDepth}):}       {reset ${util.inspect(result.errObj.cause, {depth:options.errorInspectDepth, colors:true})}}`
      return renderResult;    
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      renderResult
   * @returns     {string}  Returns string to be rendered by console.log() or 
   *              debug().
   * @description Generates a string of completely formatted output that's ready 
   *              for display to the user via console.log() or debug(). Relies
   *              on the caller to decide how to actually display to the user.
   * @version     1.0.0
   * @public
   */
  //───────────────────────────────────────────────────────────────────────────┘
  public renderResult():string {

    // Setup the options that will be used
    let renderOptions:SfdxFalconResultRenderOptions = {
      headerColor:        `yellow`,
      labelColor:         `blue`,
      errorLabelColor:    `red`,
      valueColor:         `reset`,
      childInspectDepth:  1,
      detailInspectDepth: 4,
      errorInspectDepth:  4
    }

    // Render the BASE info for this result.
    let renderOutput = SfdxFalconResult.renderBaseDetail(this, renderOptions);

    // Render the ERROR for this result
    renderOutput += SfdxFalconResult.renderErrorDetail(this, renderOptions);
    
    // Render the "detail" object differently based on the Result Type
    switch(this.type) {
      case SfdxFalconResultType.ACTION:
        renderOutput += SfdxFalconResult.renderActionDetail(this, renderOptions);
        break;
      default:
        renderOutput += SfdxFalconResult.renderAnyDetail(this, renderOptions);
        break;
    }

    // Add an extra line break at the end
    renderOutput += '\n';

    // Return our result to the caller.
    return renderOutput;
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      setDetail
   * @param       {object}  result  Required.
   * @returns     {object}  Returns the object that was saved to this.detail.
   * @description Parses the given result and saves it to this object's result.
   * @version     1.0.0
   * @private
   */
  //───────────────────────────────────────────────────────────────────────────┘
  private setDetail(result:any):object {

    // If we get an Error, pass it to this.error and exit.
    if (result instanceof Error) {
      this.error(result);
      return this.detail;
    }

    // Convert any non-object result into an object
    if (typeof result !== 'object') {
      this.detail = {
        rawResult:  `${result}`
      }
    }
    else {
      this.detail = result;
    }

    // Return the object we just set (useful if the caller needed the wrapped version)
    return this.detail;
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      start
   * @description Sets the start time to NOW if it hasn't been set before.
   * @version     1.0.0
   * @public
   */
  //───────────────────────────────────────────────────────────────────────────┘
  public start():this {

    // If status is anything other than INITIALIZED, do nothing.
    if (this._status !== SfdxFalconResultStatus.INITIALIZED) {
      return this;
    }

    // Only set the start time if it hasn't been set before.
    if (this._startTime === 0) {
      let d = new Date();
      this._startTime = d.getTime();
    }

    // Set the status to WAITING (one step forward from INITIALIZED).
    this._status = SfdxFalconResultStatus.WAITING;

    // Return this instance (for possible chaining).
    return this;
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      success
   * @param       {object}  successDetail  Required.
   * @returns     {this}  Returns "this" instance to support method chaining.
   * @description Sets the stop time to NOW, marks status as SUCCESS, and 
   *              stores the provided "success detail" as the result.
   * @version     1.0.0
   * @public
   */
  //───────────────────────────────────────────────────────────────────────────┘
  public success(successDetail:object={}):this {

    // Stop the timer with a SUCCESS end status.
    this.finish(SfdxFalconResultStatus.SUCCESS);

    // Set the result (handles non-object input)
    this.setDetail(successDetail);

    // Return this instance (for possible chaining).
    return this;
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      throw
   * @param       {any}  anyResult  Required.
   * @returns     {void}  No return (guaranteed throw)
   * @description Sets the stop time to NOW, marks status as ERROR, and stores
   *              the provided result as an Error object then throws this.
   * @version     1.0.0
   * @public
   */
  //───────────────────────────────────────────────────────────────────────────┘
  public throw(anyResult:any):void {
    this.error(anyResult);
    throw this;
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      warning
   * @param       {object}  warningResult  Required.
   * @returns     {this}  Returns "this" instance to support method chaining.
   * @description Sets the stop time to NOW, marks status as WARNING, and stores
   *              the provided "warning result" as the result.
   * @version     1.0.0
   * @public
   */
  //───────────────────────────────────────────────────────────────────────────┘
  public warning(warningResult:object={}):this {

    // Stop the timer with a WARNING end status.
    this.finish(SfdxFalconResultStatus.WARNING);

    // Set the result (handles non-object input)
    this.setDetail(warningResult);

    // Return this instance (for possible chaining).
    return this;
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      unknown
   * @param       {object}  unknownResult  Required.
   * @returns     {this}  Returns "this" instance to support method chaining.
   * @description Sets the stop time to NOW, marks status as UNKNOWN, and stores
   *              the provided "unknown result" as the result.
   * @version     1.0.0
   * @public
   */
  //───────────────────────────────────────────────────────────────────────────┘
  public unknown(unknownResult:object={}):this {

    // Stop the timer with a WARNING end status.
    this.finish(SfdxFalconResultStatus.UNKNOWN);

    // Set the result (handles non-object input)
    this.setDetail(unknownResult);

    // Return this instance (for possible chaining).
    return this;
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      wrap
   * @param       {any}  thingToWrap  Required.  The thing (string, object,
   *              error, whatever) that is being wrapped.
   * @returns     {SfdxFalconResult}  Returns a new SFDX-Falcon Result
   * @description Instantiates an SFDX-Falcon Result object and tries to 
   *              populate it as best as possible.
   * @version     1.0.0
   * @public @static
   */
  //───────────────────────────────────────────────────────────────────────────┘
  public static wrap(thingToWrap:any, resultName:string, resultType:SfdxFalconResultType=SfdxFalconResultType.UNKNOWN, resultOptions:any={}):SfdxFalconResult {

    // If it's already an SFDX-Falcon Result, return it.
    if (thingToWrap instanceof SfdxFalconResult) {
      return thingToWrap;
    }

    // Wrap things decended from Error
    if (thingToWrap instanceof Error) {

      // Make sure any Error is wrapped into an SfdxFalconError2
      let falconError = SfdxFalconError2.wrap(thingToWrap);

      // Create the new SFDX-Falcon Result
      let newFalconErrorResult = new SfdxFalconResult(falconError.name, resultType, resultOptions);

      // Now set the Result to error.
      newFalconErrorResult.error(falconError);

      // Return the Result
      return newFalconErrorResult;
    }

    // Wrap anything that's not an Error
    let newFalconResult = new SfdxFalconResult(resultName, resultType, resultOptions);

    // We don't know if this is Success, Failure, or other, so make Unknown.
    newFalconResult.unknown(thingToWrap);

    // Return the Result
    return newFalconResult
  }
}










//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @class       ????
 * @description ????
 * @version     1.0.0
 * @public
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘


  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @constructs  SfdxCliError
   * @param       {string}  stdErrBuffer  Required. Results from an stderr
   *              stream resulting from a call to a Salesforce CLI command.
   * @description ???
   * @version     1.0.0
   * @public
   */
  //───────────────────────────────────────────────────────────────────────────┘


//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @class       ????
 * @description ????
 * @version     1.0.0
 * @public
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘


//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @class       ????
 * @description ????
 * @version     1.0.0
 * @public
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
