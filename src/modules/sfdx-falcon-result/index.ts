//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @file          modules/sfdx-falcon-result/index.ts
 * @copyright     Vivek M. Chawla - 2018
 * @author        Vivek M. Chawla <@VivekMChawla>
 * @summary       Exports SfdxFalconResult, which can be used to communicate status/results between
 *                various SFDX-Falcon modules.
 * @description   Exports a concrete class that can be used to create "Result" objects.  Each Result
 *                can be used to track status and detail information of the context of some running
 *                code, then pass that information back to a "parent" result.  This gives the ability
 *                to track complex interactions over many different sections of code.
 * @version       1.0.0
 * @license       MIT
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
// Import External Modules
import {isEmpty}  from  'lodash'; // Useful function for detecting empty objects.

// Import Local Modules
import {SfdxFalconDebug}  from '../sfdx-falcon-debug';  // Class. Specialized debug provider for SFDX-Falcon code.
import {SfdxFalconError}  from '../sfdx-falcon-error';  // Class. Extends SfdxError to provide specialized error structures for SFDX-Falcon modules.

// Require Modules
const chalk     = require('chalk');     // Makes it easier to generate colored CLI output via console.log.
const inquirer  = require('inquirer');  // Provides UX for getting feedback from the user.
const util      = require('util');      // Provides access to the "inspect" function to help output objects via console.log.

// Set the File Local Debug Namespace and Class Name
const dbgNs     = 'MODULE:sfdx-falcon-result:';


//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @interface   SfdxFalconResultDisplayOptions
 * @description Options object used by the displayResult() function.
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
export interface SfdxFalconResultDisplayOptions {
  displayResult?:     boolean;
  contextLabel:       string;
  detailInspectDepth: number;
  childInspectDepth:  number;
  errorInspectDepth:  number;
}

//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @interface   SfdxFalconResultRenderOptions
 * @extends     SfdxFalconResultDisplayOptions
 * @description Options object used by the various Render functions to customize display output.
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
export interface SfdxFalconResultRenderOptions extends SfdxFalconResultDisplayOptions {
  headerColor:        string;
  labelColor:         string;
  errorLabelColor:    string;
  valueColor:         string;
}

//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @interface   SfdxFalconResultOptions
 * @description Represents the options that can be set when an SfdxFalconResult object is constructed.
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
export interface SfdxFalconResultOptions {
  startNow?:        boolean;
  bubbleError?:     boolean;
  bubbleFailure?:   boolean;
  failureIsError?:  boolean;
}

//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @enum        SfdxFalconResultStatus
 * @description Represents the different types of sources where Results might come from.
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
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
export const enum SfdxFalconResultType {
  ACTION    = 'ACTION',
  COMMAND   = 'COMMAND',
  ENGINE    = 'ENGINE',
  EXECUTOR  = 'EXECUTOR',
  FUNCTION  = 'FUNCTION',
  GENERATOR = 'GENERATOR',
  INQUIRER  = 'INQUIRER',
  LISTR     = 'LISTR',
  RECIPE    = 'RECIPE',
  UNKNOWN   = 'UNKNOWN',
  UTILITY   = 'UTILITY'
}

//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @class       SfdxFalconResult
 * @description Implements a framework for creating results-driven, informational objects with a
 *              concept of heredity (child results) and the ability to "bubble up" both Errors
 *              (thrown exceptions) and application-defined "failures".
 * @public
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
export class SfdxFalconResult {

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      isValid
   * @param       {object}  objectToCheck  Required. The object that will be
   *              checked to see if it's a valid SFDX-Falcon Result.
   * @returns     {void}
   * @description Given any object, determines if that object is an SFDX-Falcon
   *              Result and throws an SfdxFalconError if not.
   * @public @static
   */
  //───────────────────────────────────────────────────────────────────────────┘
  public static isValid(objectToCheck:object):void {

    // If the incoming object is an SfdxFalconResult, we're all good.
    if (objectToCheck instanceof SfdxFalconResult) {
      return;
    }

    // The object is NOT an SfdxFalconResult.  Prepare an error to throw.
    const falconError = new SfdxFalconError(`ERROR_INVALID_RESULT: Expected an SfdxFalconResult`, 'SfdxFalconError');
    falconError.message  += (objectToCheck.constructor) ? ` but got '${objectToCheck.constructor.name}'` : '';
    falconError.data      = {unknownObject: objectToCheck};

    // Throw the error.
    throw falconError;
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      validate
   * @param       {unknown}  objectToCheck  Required. The object that will be
   *              checked to see if it's a valid SFDX-Falcon Result.
   * @param       {SfdxFalconResultType}  expectedResultType  Required. Type of
   *              SFDX-Falcon Result you expect to find.
   * @param       {SfdxFalconResultStatus} [status] Optional. The status that
   *              you expect the SFDX-Falcon Result to have.
   * @returns     {boolean}  Returns TRUE if the Object to Check matches all
   *              specified criteria, FALSE if otherwise.
   * @description Given an Object to check, an SFDX-Falcon Result Type, and
   *              (optionally) an SFDX-Falcon Result Status, determines if the
   *              Object matches the specified criteria and returns TRUE if
   *              it does.
   * @public @static
   */
  //───────────────────────────────────────────────────────────────────────────┘
  public static validate(objectToCheck:unknown, expectedType?:SfdxFalconResultType, expectedStatus?:SfdxFalconResultStatus):boolean {

    // Start by making sure we actually have an SFDX-Falcon Result.
    if ((objectToCheck instanceof SfdxFalconResult) !== true) {
      return false;
    }

    // If an EXPECTED TYPE was provided, see if we have the right TYPE of Result.
    if (expectedType) {
      if ((objectToCheck as SfdxFalconResult).type !== expectedType) {
        return false;
      }
    }

    // If an EXPECTED STATUS was provided, check against that, too.
    if (expectedStatus) {
      if ((objectToCheck as SfdxFalconResult).status !== expectedStatus) {
        return false;
      }
    }

    // If we get here, we've got a validated SFDX-Falcon Result Object
    return true;
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      wrap
   * @param       {unknown}  thingToWrap  Required.  The thing (string, object,
   *              error, whatever) that is being wrapped.
   * @param       {SfdxFalconResultType}  resultType  Required. Type of the new Result.
   * @param       {string}  resultName  Required. The name of the new Result.
   * @param       {string}  [resultSource]  Optional. Defaults to concatenation of
   *              "resultType:resultName" if not provided.
   * @returns     {SfdxFalconResult}  Returns a new SFDX-Falcon Result
   * @description Instantiates an SFDX-Falcon Result object and tries to
   *              populate it as best as possible.
   * @public @static
   */
  //───────────────────────────────────────────────────────────────────────────┘
  public static wrap(thingToWrap:unknown, resultType:SfdxFalconResultType, resultName:string, resultSource?:string):SfdxFalconResult {

    // If it's already an SFDX-Falcon Result, return it.
    if (thingToWrap instanceof SfdxFalconResult) {
      return thingToWrap;
    }

    // Set default values for incoming arguments.
    resultType    = resultType    ||  SfdxFalconResultType.UNKNOWN;
    resultName    = resultName    ||  `Unknown`;
    resultSource  = resultSource  ||  `${resultType}:${resultName}`;

    // Wrap things decended from Error
    if (thingToWrap instanceof Error) {

      // Make sure any Error is wrapped into an SfdxFalconError
      const falconError = SfdxFalconError.wrap(thingToWrap, resultSource);

      // Create the new SFDX-Falcon Result
      const newFalconErrorResult = new SfdxFalconResult(resultName, resultType);

      // Now set the Result to error.
      newFalconErrorResult.error(falconError);

      // Return the Result
      return newFalconErrorResult;
    }

    // Wrap anything that's not an Error
    const newFalconResult = new SfdxFalconResult(resultName, resultType);

    // Store the contents of the "thing to wrap" in the detail property of the new result.
    newFalconResult.setDetail(thingToWrap);

    // We don't know if this is Success, Failure, or other, so make Unknown.
    newFalconResult.unknown();

    // Return the Result
    return newFalconResult;
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      wrapRejectedPromise
   * @param       {unknown}  rejectedPromiseData  Required.  The data passed
   *              into a catch() function that's hung off of a rejected Promise.
   * @param       {SfdxFalconResultType}  resultType  Required. Type of the new Result.
   * @param       {string}  resultName  Required. Name of the Result.
   * @param       {string}  [resultSource]  Required. Source of the Result.
   * @returns     {SfdxFalconResult}  Returns a new SFDX-Falcon Result
   * @description Tries to figure out what's in the Rejected Promise Data and
   *              then instantiates an SFDX-Falcon Result object and tries to
   *              populate it as best as possible.
   * @public @static
   */
  //───────────────────────────────────────────────────────────────────────────┘
  public static wrapRejectedPromise(rejectedPromiseData:unknown, resultType:SfdxFalconResultType, resultName:string, resultSource?:string):SfdxFalconResult {

    // If it's already an SFDX-Falcon Result, return it.
    if (rejectedPromiseData instanceof SfdxFalconResult) {
      return rejectedPromiseData;
    }

    // Set default values for incoming arguments.
    resultType    = resultType    ||  SfdxFalconResultType.UNKNOWN;
    resultName    = resultName    ||  `Unknown`;
    resultSource  = resultSource  ||  `${resultType}:${resultName}`;

    // Now we FORCE creation of an SFDX-Falcon Error, regardless of whatever the rejectedPromiseData is.
    const rejectedPromiseError = SfdxFalconError.wrap(rejectedPromiseData, resultSource);

    // Now we WRAP the error as an SFDX-Falcon Result.
    return SfdxFalconResult.wrap(rejectedPromiseError, resultType, resultName, resultSource);
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
   * @private @static
   */
  //───────────────────────────────────────────────────────────────────────────┘
  private static renderActionDetail(result:SfdxFalconResult, options:SfdxFalconResultRenderOptions):string {

    // TODO: Add custom rendering for ACTION results.
    // In the meantime, just forward to the renderAnyDetail() function.
    return SfdxFalconResult.renderAnyDetail(result, options);
  }
  
  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      renderAnyDetail
   * @param       {SfdxFalconResult}  result  Required. The Result to render.
   * @param       {SfdxFalconResultRenderOptions}  options  Required. Options
   *              object that determines how the Result is rendered (colors,
   *              obect inspection depth, etc).
   * @returns     {string}
   * @description Given an SFDX-Falcon Result, renders to the console info
   *              in a way acceptable for any type of SFDX-Falcon Result.
   * @private @static
   */
  //───────────────────────────────────────────────────────────────────────────┘
  private static renderAnyDetail(result:SfdxFalconResult, options:SfdxFalconResultRenderOptions):string {
    let renderResult = '';

    // Only render Child Results if the Child Inspect Depth is 3 or greater.
    if (isEmpty(result.children) === false && options.childInspectDepth >= 3) {
      renderResult += chalk`\n{${options.labelColor} Child Results: (Depth=${options.childInspectDepth})}\n{reset ${util.inspect(result.children, {depth:options.childInspectDepth, colors:true})}}`;
    }

    return renderResult;
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      renderBaseDetail
   * @param       {SfdxFalconResult}  result  Required. The Result to render.
   * @param       {SfdxFalconResultRenderOptions}  options  Required. Options
   *              object that determines how the Result is rendered (colors,
   *              obect inspection depth, etc).
   * @returns     {string}
   * @description Given an SFDX-Falcon Result, renders to the console all of the
   *              basic information that's common to all SFDX-Falcon Results.
   * @private @static
   */
  //───────────────────────────────────────────────────────────────────────────┘
  private static renderBaseDetail(result:SfdxFalconResult, options:SfdxFalconResultRenderOptions):string {
    let renderResult =
        chalk`\n{${options.headerColor} ${result.type}_RESULT_DEBUG${options.contextLabel ? ' (' + options.contextLabel + ')' : ''}:}`
      + chalk`\n{${options.labelColor} Result Type:}        {${options.valueColor} ${result.type}}`
      + chalk`\n{${options.labelColor} Result Name:}        {${options.valueColor} ${result.name}}`
      + chalk`\n{${options.labelColor} Result Status:}      {${options.valueColor} ${result.status}}`
      + chalk`\n{${options.labelColor} Result Start Time:}  {${options.valueColor} ${result._startTime} (UTC)}`
      + chalk`\n{${options.labelColor} Result End Time:}    {${options.valueColor} ${result._endTime} (UTC)}`
      + chalk`\n{${options.labelColor} Result Duration:}    {${options.valueColor} ${result.duration/1000} seconds}`
      + chalk`\n{${options.labelColor} Number of Children:} {${options.valueColor} ${result.children.length}}`;
    if (isEmpty(result.detail) === false) {
      renderResult += chalk`\n{${options.labelColor} Result Detail: (Depth=${options.detailInspectDepth})}\n{reset ${util.inspect(result.detail, {depth:options.detailInspectDepth, colors:true})}}`;
    }
    return renderResult;
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      renderErrorDetail
   * @param       {SfdxFalconResult}  result  Required. The Result to render.
   * @param       {SfdxFalconResultRenderOptions}  options  Required. Options
   *              object that determines how the Result is rendered (colors,
   *              obect inspection depth, etc).
   * @returns     {string}
   * @description Given an SFDX-Falcon Result, unpacks any errors and renders
   *              detailed error info to the console, going back through any
   *              chained errors that are found to be children of the error
   *              held by the Result passed to this method.
   * @private @static
   */
  //───────────────────────────────────────────────────────────────────────────┘
  private static renderErrorDetail(result:SfdxFalconResult, options:SfdxFalconResultRenderOptions):string {

    // If there is no Error Object as part of the Result, return an empty string.
    if (((result.errObj instanceof Error) === false) || isEmpty(result.errObj)) {
      return '';
    }

    // Declare local vars used to render the error detail.
    let renderResult  = '';
    const separator   = '---------------';

    // Unpack the Result's Error object and unwind all child errors.
    const errors        = [] as SfdxFalconError[];
    let currentError    = result.errObj;
    let foundLastError  = false;
    while (foundLastError === false) {
      errors.push(currentError);
      if (currentError.cause instanceof Error) {
        // Found a child error. Make it the new current error.
        currentError = currentError.cause as SfdxFalconError;
      }
      else {
        // No child error found. That means we found the last error.
        foundLastError = true;
      }
    }

    // Render output for each Error object in the errors array.
    for (let i=0; i < errors.length; i++) {
      renderResult += chalk`\n{yellow ${separator}--------------${separator}}`;
      renderResult += chalk`\n{yellow ${separator} ERROR ${errors.length - i} of ${errors.length} ${separator}}`;
      renderResult += chalk`\n{yellow ${separator}--------------${separator}}`;
      renderResult += SfdxFalconError.renderError(errors[i], options.childInspectDepth, options.detailInspectDepth, options.errorInspectDepth);
    }

    // Add a final separator.
    renderResult += chalk`\n{yellow ${separator}---------------${separator}}`;
    renderResult += chalk`\n{yellow ${separator} END OF ERRORS ${separator}}`;
    renderResult += chalk`\n{yellow ${separator}---------------${separator}}`;

    // We have an Error to render.
    return renderResult;
  }
  
  // Public member vars
  public name:            string;
  public type:            SfdxFalconResultType;
  public children:        SfdxFalconResult[];

  // Private member vars
  private _detail:          unknown;
  private _errObj:          SfdxFalconError;
  private _bubbleError:     boolean;
  private _bubbleFailure:   boolean;
  private _failureIsError:  boolean;
  private _status:          SfdxFalconResultStatus;
  private _startTime:       number;
  private _endTime:         number;

  // Property accessors
  public get detail():object {
    return this._detail as object;
  }
  public set detail(incomingDetail:object) {
    this.setDetail(incomingDetail);
  }
  public get duration():number {
    // If there is no start time, just return zero.
    if (this._startTime === 0) { return 0; }
    // If there is an end time, return the "historical" duration.
    if (this._endTime !== 0) { return this._endTime - this._startTime; }
    // The clock is still running (no end time yet), so return the current duration.
    return (new Date().getTime() - this._startTime);
  }
  public get durationSecs():number {
    return this.duration / 1000;
  }
  public get durationString():string {
    const durationSeconds = Math.floor(this.durationSecs);
    if (durationSeconds < 60) return `${durationSeconds}s`;
    return `${Math.floor(durationSeconds/60)}m ${durationSeconds%60}s`;
  }
  public get errObj():SfdxFalconError {
    return this._errObj;
  }
  public get resultTypeErrorName():string {
    switch (this.type) {
      case SfdxFalconResultType.ACTION:
        return 'FailedAction';
      case SfdxFalconResultType.COMMAND:
        return 'FailedCommand';
      case SfdxFalconResultType.ENGINE:
        return 'FailedEngine';
      case SfdxFalconResultType.EXECUTOR:
        return 'FailedExecutor';
      case SfdxFalconResultType.INQUIRER:
        return 'FailedInquirer';
      case SfdxFalconResultType.LISTR:
        return 'FailedListr';
      case SfdxFalconResultType.RECIPE:
        return 'FailedRecipe';
      case SfdxFalconResultType.UNKNOWN:
        return 'UnknownFailure';
      case SfdxFalconResultType.UTILITY:
        return 'FailedUtility';
      case SfdxFalconResultType.FUNCTION:
        return 'FailedFunction';
      default:
        return 'UnknownFailure';
    }
  }
  public get lastChild():SfdxFalconResult {
    return this.children[this.children.length-1];
  }
  public get status():SfdxFalconResultStatus {
    return this._status;
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @constructs  SfdxFalconResult
   * @param       {string}  name  Required. The name of this Result.
   * @param       {SfdxFalconResultType}  type  Required. Type of this Result.
   * @param       {SfdxFalconResultOptions} [options] Optional. Available
   *              Options are "startNow", "bubbleError", "bubbleFailure", and
   *              "failureAsError".
   * @description Constructs an SfdxFalconResult object.
   * @public
   */
  //───────────────────────────────────────────────────────────────────────────┘
  public constructor(name:string, type:SfdxFalconResultType, options:SfdxFalconResultOptions={}) {
    this.name         = name;
    this.type         = type;
    this.children     = new Array<SfdxFalconResult>();
    this._detail      = {} as unknown;
    this._errObj      = {} as SfdxFalconError;
    this._status      = SfdxFalconResultStatus.INITIALIZED;
    this._startTime   = 0;
    this._endTime     = 0;

    // Set default options then override them with whatever comes from the caller.
    const resolvedOptions = {
      startNow:       true,
      bubbleError:    true,
      bubbleFailure:  true,
      failureIsError: true,
      ...options
    } as SfdxFalconResultOptions;

    // Process options to customize this instance
    if (resolvedOptions.startNow) {
      this.start();
    }
    this._bubbleError     = (resolvedOptions.bubbleError)     ? true : false;
    this._bubbleFailure   = (resolvedOptions.bubbleFailure)   ? true : false;
    this._failureIsError  = (resolvedOptions.failureIsError)  ? true : false;
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      setDetail
   * @param       {unknown} [incomingDetail]  Optional. Typically this will be
   *              a string, an unknown type of object, or an Error object.
   * @returns     {void}
   * @description Parses the given result and saves it to this object's "detail"
   *              property.  Will attempt to coerce any non-object data into
   *              an object.
   * @public
   */
  //───────────────────────────────────────────────────────────────────────────┘
  public setDetail(incomingDetail:unknown=null):void {

    // If the Incoming Detail is NULL or UNDEFINED, don't do anything.
    if (incomingDetail == null || typeof incomingDetail === 'undefined') {
      return;
    }

    // If we get an Error, pass it to this.error and exit.
    if (incomingDetail instanceof Error) {
      this.error(incomingDetail);
      return;
    }

    // Convert any non-object result into an object
    if (typeof incomingDetail !== 'object') {
      this._detail = {
        rawResult:  `${incomingDetail}`
      };
    }
    else {
      this._detail = incomingDetail;
    }

    // Return the object we just set (useful if the caller needed the wrapped version)
    return;
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      start
   * @returns     {this}  Returns "this" instance to support method chaining.
   * @description Sets the start time to NOW if it hasn't been set before.
   * @public
   */
  //───────────────────────────────────────────────────────────────────────────┘
  public start():this {

    // Only set the start time if it hasn't been set before.
    if (this._startTime === 0) {
      const d = new Date();
      this._startTime = d.getTime();
    }

    // If status is INITIALIZED, move it one step forward to WAITING.
    if (this._status === SfdxFalconResultStatus.INITIALIZED) {
      this._status = SfdxFalconResultStatus.WAITING;
    }

    // Return this instance (for possible chaining).
    return this;
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      success
   * @returns     {this}  Returns "this" instance to support method chaining.
   * @description Sets the stop time to NOW and marks the status of this Result
   *              as SUCCESS.
   * @public
   */
  //───────────────────────────────────────────────────────────────────────────┘
  public success():this {

    // Stop the timer with an ending status of SUCCESS.
    this.finish(SfdxFalconResultStatus.SUCCESS);

    // Return this instance (for possible chaining).
    return this;
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      throw
   * @param       {unknown} anyResult  Required. Typically an Error object, but
   *              could be anything. Whatever is provided will end up bound to
   *              an SfdxFalconError via this.error().
   * @returns     {void}  Always throws this instance of SfdxFalconResult.
   * @description Forwards the contents of anyResult to this.error() which sets
   *              the stop time to NOW, marks status as ERROR, and stores the
   *              provided result as an Error object then throws this.
   * @public
   */
  //───────────────────────────────────────────────────────────────────────────┘
  public throw(anyResult:unknown):void {
    this.error(anyResult);
    throw this;
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      warning
   * @returns     {this}  Returns "this" instance to support method chaining.
   * @description Sets the stop time to NOW and marks status as WARNING.
   * @public
   */
  //───────────────────────────────────────────────────────────────────────────┘
  public warning():this {

    // Stop the timer with an ending status of WARNING.
    this.finish(SfdxFalconResultStatus.WARNING);

    // Return this instance (for possible chaining).
    return this;
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      unknown
   * @returns     {this}  Returns "this" instance to support method chaining.
   * @description Sets the stop time to NOW and marks status as UNKNOWN.
   * @public
   */
  //───────────────────────────────────────────────────────────────────────────┘
  public unknown():this {

    // Stop the timer with an ending status of UNKNOWN.
    this.finish(SfdxFalconResultStatus.UNKNOWN);

    // Return this instance (for possible chaining).
    return this;
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      addChild
   * @param       {SfdxFalconResult}  childResult  Required.
   * @param       {boolean} [requireValidChildResult] Optional. If set to TRUE,
   *              calls to this method will throw an Error if the value passed
   *              to childResult is not a valid SfdxFalconResult object.
   * @returns     {this}  Returns "this" instance to support method chaining.
   * @description Given an SFDX-Falcon Result, inspect the result then add it
   *              to the children array. If the child result is a FAILURE or
   *              ERROR, bubble this up by marking this as FAILURE or ERROR if
   *              bubbleFailure or bubbleError are TRUE.
   * @public
   */
  //───────────────────────────────────────────────────────────────────────────┘
  public addChild(childResult:SfdxFalconResult, requireValidChildResult:boolean=true):this {

    // Debug
    SfdxFalconDebug.obj(`${dbgNs}${this.type}:addChild`, childResult, `childResult: `);

    // If a valid Child Result is required, perform the check before moving on.
    if (requireValidChildResult) {
      SfdxFalconResult.isValid(childResult);
    }

    // If the Child Result is NOT an SfdxFalconResult already, wrap it up as one then call addChild() again.
    if ((childResult instanceof SfdxFalconResult) !== true) {
      childResult = SfdxFalconResult.wrap(childResult, SfdxFalconResultType.UNKNOWN, 'UNKNOWN RESULT');
      return this.addChild(childResult);
    }

    // Make sure that this Result has been started.
    this.start();

    // Add the Child Result to the array of children for this Result.
    this.children.push(childResult);

    // TODO: The FAILURE and ERROR handling logic below have a lot of duplicated code. We should
    //       refactor this into a single helper function at some point.

    // Special handling for Child Results marked as a FAILURE (as long as failureIsError is FALSE).
    if (childResult.status === SfdxFalconResultStatus.FAILURE && this._failureIsError === false) {

      // We may need to "bubble" the Child FAILURE by making this Result a FAILURE, too.
      if (this._bubbleFailure) {

        // Create an SfdxFalconError object to track information about the FAILURE.
        const failureErrObject =
          new SfdxFalconError ( `${this.type}:${this.name} has failed because the child operation `
                              + `${childResult.type}:${childResult.name} was marked as FAILED `
                              + `${(childResult.errObj instanceof Error) ? '(' + childResult.errObj.name + ')':''}`
                              , this.resultTypeErrorName
                              , `${dbgNs}addChild`
                              // If the Child Result had an Error Object, add it as the Child Error of the SfdxFalconError Object we just created.
                              , (childResult.errObj instanceof Error) ? SfdxFalconError.wrap(childResult.errObj) : null);
        
        // Store specially constructed Result Information for this (Parent) Result and the Child Result in the SfdxFalconError object.
        failureErrObject.setDetail({
          resultStatus:   'BUBBLED_FAILURE',
          resultDuration: this.duration + ' ms'
        });

        // Store the SfdxFalconResult object's "detail" data for this (Parent) Result and the Child Result in the SfdxFalconError object.
        failureErrObject.setData({
          sfdxFalconResult: this
        });

        // Mark this Result as a FAILURE and give it the Failure Error Object we just created.
        this.failure(failureErrObject);
      }
      else {
        // Mark this instance with WARNING status _without_ "finishing" (ie. this.failure()) yet.
        this._status = SfdxFalconResultStatus.WARNING;
      }
    }
    // Special handling for Child Results marked as an ERROR...or FAILURES when failureIsError is TRUE.
    else if (childResult.status === SfdxFalconResultStatus.ERROR
              || (childResult.status === SfdxFalconResultStatus.FAILURE && this._failureIsError === true)) {
      
      // We may need to "bubble" the Child ERROR by making this Result an ERROR then throwing it.
      if (this._bubbleError) {

        // Create an SfdxFalconError object to track information about the ERROR.
        const errorErrObject =
          new SfdxFalconError ( `${this.type}:${this.name} has failed because the child operation `
                              + `${childResult.type}:${childResult.name} threw an error `
                              + `${(childResult.errObj instanceof Error) ? '(' + childResult.errObj.name + ')' : ''}`
                              , this.resultTypeErrorName
                              , `${dbgNs}addChild`
                              // If the Child Result had an Error Object, add it as the Child Error of the SfdxFalconError Object we just created.
                              , (childResult.errObj instanceof Error) ? SfdxFalconError.wrap(childResult.errObj) : null);

        // Store specially constructed Result Information for this (Parent) Result and the Child Result in the SfdxFalconError object.
        errorErrObject.setDetail({
          resultStatus:   (childResult.status === SfdxFalconResultStatus.FAILURE) ? 'BUBBLED_FAILURE_AS_ERROR' : 'BUBBLED_ERROR',
          resultDuration: this.duration + ' ms'
        });

        // Store the SfdxFalconResult object's "detail" data for this (Parent) Result and the Child Result in the SfdxFalconError object.
        errorErrObject.setData({
          sfdxFalconResult: this
        });

        // Force this Result to end in an ERROR and throw itself.
        this.throw(errorErrObject);
      }
      else {
        // Mark this instance with WARNING status _without_ "finishing" (ie. calling this.failure()) yet.
        this._status = SfdxFalconResultStatus.WARNING;
      }
    }

    // Return this instance (for possible chaining).
    return this;
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      addRejectedChild
   * @param       {unknown} rejectedPromise  Required.  The data passed into
   *              a catch() function that's hung off of a rejected Promise.
   * @param       {SfdxFalconResultType}  resultType  Required. Type of the new
   *              Child Result. Only used if the contents of rejectedPromise
   *              are not already an SfdxFalconResult.
   * @param       {string}  resultName  Required. The name of the new Result.
   *              Only used if the contents of rejectedPromise are not
   *              already an SfdxFalconResult.
   * @param       {string}  [resultSource]  Optional. The source of the
   *              Rejected Child.  Defaults to a concatenation of resultType
   *              and resultName if not provided.
   * @returns     {this}  Returns the current instance of SfdxFalconResult.
   * @description Wraps the data from a Rejected Promise as an SfdxFalconResult
   *              and adds the new Result as a Child of this Result.
   * @public
   */
  //───────────────────────────────────────────────────────────────────────────┘
  public addRejectedChild(rejectedPromise:unknown, resultType:SfdxFalconResultType, resultName:string, resultSource?:string):this {

    // Debug
    SfdxFalconDebug.obj(`${dbgNs}${this.type}:addRejectedChild:`, {rejectedPromise: rejectedPromise}, `rejectedPromise: `);

    // Ensure that resultSource has a value. Default is "RESULT_TYPE:RESULT_NAME"
    if (typeof resultSource === 'undefined') {
      resultSource = `${resultType}:${resultName}`;
    }

    // Declare local var to hold the Rejected Child.
    const rejectedChild:SfdxFalconResult = SfdxFalconResult.wrap(rejectedPromise, resultType, resultName, resultSource);

    // Debug the Rejected Child Result
    rejectedChild.debugResult(`Rejected Child Result`, `${dbgNs}addRejectedChild:`);

    // Now call the normal addChild() method and return the result.
    // IMPORTANT: This call can result in a thrown error if the Rejected
    // Child was an ERROR and this Result's "bubbleError" setting is TRUE.
    return this.addChild(rejectedChild);
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      addResolvedChild
   * @param       {unknown} resolvedPromise  Required.  The data passed into
   *              a then() function that's hung off of a resolved Promise.
   * @param       {SfdxFalconResultType}  resultType  Required. Type of the new
   *              Child Result. Only used if the contents of resolvedPromise
   *              are not already an SfdxFalconResult.
   * @param       {string}  resultName  Required. The name of the new Result.
   *              Only used if the contents of resolvedPromiseData are not
   *              already an SfdxFalconResult.
   * @param       {string}  [resultSource]  Optional. The source of the
   *              Resolved Child.  Defaults to a concatenation of resultType
   *              and resultName if not provided.
   * @returns     {this}  Returns the current instance of SfdxFalconResult.
   * @description Wraps the data from a Rejected Promise as an SfdxFalconResult
   *              and adds the new Result as a Child of this Result.
   * @public
   */
  //───────────────────────────────────────────────────────────────────────────┘
  public addResolvedChild(resolvedPromise:unknown, resultType:SfdxFalconResultType, resultName:string, resultSource?:string):this {

    // Debug
    SfdxFalconDebug.obj(`${dbgNs}${this.type}:addResolvedChild:`, {resolvedPromise: resolvedPromise}, `resolvedPromise: `);

    // Ensure that resultSource has a value. Default is "RESULT_TYPE:RESULT_NAME"
    if (typeof resultSource === 'undefined') {
      resultSource = `${resultType}:${resultName}`;
    }

    // Declare local var to hold the Rejected Child.
    const resolvedChild:SfdxFalconResult = SfdxFalconResult.wrap(resolvedPromise, resultType, resultName, resultSource);

    // Debug the Rejected Child Result
    resolvedChild.debugResult(`Resolved Child Result`, `${dbgNs}addResolvedChild:`);

    // Now call the normal addChild() method and return the result.
    // IMPORTANT: This call can result in a thrown error if the Resolved
    // Child (for some strange reason) was an ERROR and this Result's "bubbleError" setting is TRUE.
    return this.addChild(resolvedChild);
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      debugResult
   * @param       {string}  [contextLabel]  Optional. Adds a string inside
   *              parenthesis to the immediate right of the Result Label.
   * @param       {string}  [debugNamespace]  Optional. Defines the Debug
   *              Namespace that should be used for debugging this call.
   * @param       {number}  [childInspectDepth]   Optional. Overrides the
   *              default setting for inspection depth of Child Results.
   * @param       {number}  [detailInspectDepth]  Optional. Overrides the
   *              default setting for inspection depth of Detail Results.
   * @param       {number}  [errorInspectDepth]   Optional. Overrides the
   *              default setting for inspection depth of stored Errors.
   * @returns     {void}
   * @description Calls this.renderResult() to generate a complete, formatted
   *              set of information about this Result and displays that result
   *              to the user via SfdxFalconDebug (guranteed output).
   * @public
   */
  //───────────────────────────────────────────────────────────────────────────┘
  public debugResult(contextLabel:string='', debugNamespace:string='', childInspectDepth:number=1, detailInspectDepth:number=4, errorInspectDepth:number=1):void {
    const debugOutput
      = '-\n'
      + this.renderResult(contextLabel, childInspectDepth, detailInspectDepth, errorInspectDepth)
      + '\n-\n-\n-\n-\n-\n-\n-\n-\n-\n-';

    // If namespace is provided, use the standard debug channel. Force debug message if no namespace.
    if (debugNamespace) {
      SfdxFalconDebug.msg(`${debugNamespace}`, debugOutput);
    }
    else {
      SfdxFalconDebug.debugMessage(`${this.type}_RESULT:`, debugOutput);
    }
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      displayErrorDebugInfo
   * @param       {boolean} showErrorDebug  Required. Determines if extended
   *              debugging output for the terminating Error can be shown.
   * @param       {boolean} promptUser  Required. Determines if the user will
   *              be prompted to display debug info. If FALSE, debug info will
   *              be shown without requiring additional user input.
   * @returns     {Promise<void>}
   * @description Makes the final determination of what the Debug Display
   *              options are. May prompt the user interactively to make this
   *              determination.
   * @public @async
   */
  //───────────────────────────────────────────────────────────────────────────┘
  public async displayErrorDebugInfo(showErrorDebug:boolean, promptUser:boolean):Promise<void> {

    // Don't display any debug information if not explicitly asked for.
    if (showErrorDebug !== true) {
      return;
    }

    // Initialize an Error Debug Options object.
    const displayOptions = {
      displayResult:      true,
      contextLabel:       '',
      detailInspectDepth: 2,
      childInspectDepth:  2,
      errorInspectDepth:  1
    } as SfdxFalconResultDisplayOptions;

    // If asked, prompt the user for their Error Debug choices.
    if (promptUser === true) {

      // Build the first prompt asking the user if they want to view detailed debug info.
      const iqPromptOne = [
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
      const userSelectionsOne = await inquirer.prompt(iqPromptOne);
      if (userSelectionsOne.showDebug !== true) {
        return;
      }
    }

    // Show the debug output.
    do {
      this.displayResult(displayOptions);

      // TODO: Need to add code to allow user to iteratively see debug info with more
      // depth in object display. We will do this by prompting them to change any of
      // the values found in the displayOptions object.

    } while (false); // Ensures we go through only one loop until we refactor per the TODO above.

    // All done.
    return;
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      displayResult
   * @param       {SfdxFalconResultDisplayOptions}  [displayOptions]  Optional.
   *              Sets all the display options for the displayResult() function.
   * @returns     {void}
   * @description Calls this.renderResult() to generate a complete, formatted
   *              set of information about this Result and displays that result
   *              to the user via console.log().
   * @public
   */
  //───────────────────────────────────────────────────────────────────────────┘
  public displayResult(displayOptions:SfdxFalconResultDisplayOptions=null):void {

    // Make sure that displayOptions is an object.
    if (typeof displayOptions !== 'object') {
      displayOptions = {} as SfdxFalconResultDisplayOptions;
    }
    
    // Set default options for any undefined Display Options.
    displayOptions.displayResult      = displayOptions.displayResult      || true;
    displayOptions.contextLabel       = displayOptions.contextLabel       || '';
    displayOptions.detailInspectDepth = displayOptions.detailInspectDepth || 2;
    displayOptions.childInspectDepth  = displayOptions.childInspectDepth  || 2;
    displayOptions.errorInspectDepth  = displayOptions.errorInspectDepth  || 1;

    // Make sure we should display this result.  Exit if not.
    if (displayOptions.displayResult !== true) {
      return;
    }

    // Render this result using the options provided.
    console.log(this.renderResult(displayOptions.contextLabel,
                                  displayOptions.childInspectDepth,
                                  displayOptions.detailInspectDepth,
                                  displayOptions.errorInspectDepth));
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      error
   * @param       {Error|unknown} errorObject  Required.
   * @returns     {this}  Returns "this" instance to support method chaining.
   * @description Sets the stop time to NOW, marks status as ERROR, sets this
   *              Result's detail to an empty object, and stores the provided
   *              Error object as a Falcon Error as this Result's errObj.
   * @public
   */
  //───────────────────────────────────────────────────────────────────────────┘
  public error(errorObject:Error|unknown):this {

    // Make sure we start with an Error
    if ((errorObject instanceof Error) !== true) {
      if (typeof errorObject === 'string') {
        errorObject = new Error(errorObject);
      }
      else {
        errorObject = new Error(`An unknown error occured while building results for ${this.name}`);
      }
    }

    // Wrap the error in an SfdxFalconError
    const falconError = SfdxFalconError.wrap(errorObject);

    // Add a message to the Falcon Stack of this error.
    falconError.addToStack(`ERROR at '${this.type}:${this.name}' caused by '${falconError.source}' (duration ${this.duration}ms)`);
    
    // Store the Falcon Error in this result's errObj property.
    this._errObj = falconError;

    // Stop the timer with an ending status of ERROR.
    this.finish(SfdxFalconResultStatus.ERROR);

    // Return this instance (for possible chaining).
    return this;
  }
  
  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      failure
   * @param       {Error|unknown} errorObject Required.
   * @returns     {this}  Returns "this" instance to support method chaining.
   * @description Sets the stop time to NOW, marks status as FAILURE, and stores
   *              the provided "failure detail" as the detail for this result.
   * @public
   */
  //───────────────────────────────────────────────────────────────────────────┘
  public failure(errorObject:Error|unknown):this {

    // Make sure that we end up working with an SfdxFalconError in this function.
    let falconError:SfdxFalconError = null;
    if (errorObject instanceof Error) {
      falconError = SfdxFalconError.wrap(errorObject);
    }
    else {
      falconError = new SfdxFalconError(`Unknown failure state set in ${this.type} Result '${this.name}'.`, `UnknownFailure`);
      falconError.setData({rawResult: errorObject});
    }

    // Add a message to the Falcon Stack of this error.
    falconError.addToStack(`FAILURE at '${this.type}:${this.name}' caused by '${falconError.source}' (duration ${this.duration}ms)`);
    
    // Store the Falcon Error in this result's errObj property.
    this._errObj = falconError;

    // Stop the timer with an ending status of FAILURE.
    this.finish(SfdxFalconResultStatus.FAILURE);

    // Return this instance (for possible chaining).
    return this;
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      finish
   * @param       {SfdxFalconResultStatus}  finalStatus Required.
   * @returns     {SfdxFalconResultStatus}  This Result's actual final status.
   * @description Sets the stop time to NOW if it hasn't been set before and
   *              sets the final status to whatever is passed in, as long as
   *              the incoming status is of higher priority than the current
   *              status.  Priorities are:
   *                6 - ERROR
   *                5 - FAILURE
   *                4 - WARNING
   *                3 - SUCCESS
   *                2 - UNKNOWN
   *                1 - WAITING
   *                0 - INITIALIZED
   * @private
   */
  //───────────────────────────────────────────────────────────────────────────┘
  private finish(finalStatus:SfdxFalconResultStatus=SfdxFalconResultStatus.UNKNOWN):SfdxFalconResultStatus {

    // Make sure the caller isn't trying to finish with INITIALIZED or WAITING.
    if (finalStatus === SfdxFalconResultStatus.INITIALIZED || finalStatus === SfdxFalconResultStatus.WAITING) {
      throw new SfdxFalconError(`ERROR_INVALID_ARGUMENT: SfdxFalconResult.finish() does `
                                +`not accept INITIALIZED or WAITING for Final Status`);
    }

    // Since we're about to finish, make sure that we've started.
    this.start();

    // Change this Result's status as long as the new status is higher priority than the old one.
    switch (finalStatus) {
      case SfdxFalconResultStatus.ERROR:
        this._status = finalStatus;
        break;
      case SfdxFalconResultStatus.FAILURE:
        if (this._status !== SfdxFalconResultStatus.ERROR) {
          this._status = finalStatus;
        }
        break;
      case SfdxFalconResultStatus.WARNING:
        if (this._status !== SfdxFalconResultStatus.ERROR
            && this._status !== SfdxFalconResultStatus.FAILURE) {
          this._status = finalStatus;
        }
        break;
      case SfdxFalconResultStatus.SUCCESS:
        if (this._status !== SfdxFalconResultStatus.ERROR
            && this._status !== SfdxFalconResultStatus.FAILURE
              && this._status !== SfdxFalconResultStatus.WARNING) {
          this._status = finalStatus;
        }
        break;
      case SfdxFalconResultStatus.UNKNOWN:
        if (this._status !== SfdxFalconResultStatus.ERROR
          && this._status !== SfdxFalconResultStatus.FAILURE
            && this._status !== SfdxFalconResultStatus.WARNING
              && this._status !== SfdxFalconResultStatus.SUCCESS) {
          this._status = finalStatus;
        }
        break;
    }

    // Only set the end time if it hasn't been set before AND the start time was set.
    if (this._endTime === 0 && this._startTime !== 0) {
      const d = new Date();
      this._endTime = d.getTime();
    }

    // Done.
    return this._status;
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      renderResult
   * @param       {string}  [contextLabel]  Optional. Adds a string inside
   *              parenthesis to the immediate right of the Result Label.
   * @param       {number}  [childInspectDepth]   Optional. Overrides the
   *              default setting for inspection depth of Child Results.
   * @param       {number}  [detailInspectDepth]  Optional. Overrides the
   *              default setting for inspection depth of Detail Results.
   * @param       {number}  [errorInspectDepth]   Optional. Overrides the
   *              default setting for inspection depth of stored Errors.
   * @returns     {string}  Returns string to be rendered by console.log() or
   *              debug().
   * @description Generates a string of completely formatted output that's ready
   *              for display to the user via console.log() or debug(). Relies
   *              on the caller to decide how to actually display to the user.
   * @private
   */
  //───────────────────────────────────────────────────────────────────────────┘
  private renderResult(contextLabel:string='', childInspectDepth:number=1, detailInspectDepth:number=4, errorInspectDepth:number=1):string {

    // Setup the options that will be used
    const renderOptions:SfdxFalconResultRenderOptions = {
      headerColor:        `yellow`,
      labelColor:         `blue`,
      errorLabelColor:    `red`,
      valueColor:         `reset`,
      contextLabel:       contextLabel,
      childInspectDepth:  childInspectDepth,
      detailInspectDepth: detailInspectDepth,
      errorInspectDepth:  errorInspectDepth
    };

    // Render the BASE info for this result.
    let renderOutput = SfdxFalconResult.renderBaseDetail(this, renderOptions);

    // Render the ERROR for this result
    renderOutput += SfdxFalconResult.renderErrorDetail(this, renderOptions);
    
    // Render the "detail" object differently based on the Result Type
    switch (this.type) {
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
}
