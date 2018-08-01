//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @file          helpers/falcon-helper.ts
 * @copyright     Vivek M. Chawla - 2018
 * @author        Vivek M. Chawla <@VivekMChawla>
 * @version       1.0.0
 * @license       MIT
 * @requires      module:???
 * @summary       SFDX-Falcon general helper library
 * @description   Exports general helper classes & functions tightly related to the SFDX-Falcon
 *                framework.
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
// Imports
import {AppxDemoLocalConfig}    from '../falcon-types';   // Why?
import {AppxDemoProjectConfig}  from '../falcon-types';   // Why?

// Requires
const chalk = require('chalk');   // Why?
const util  = require('util');    // Why?

//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @class       AppxDemoProjectContext
 * @access      public
 * @version     1.0.0
 * @summary     ????
 * @description ????
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
export class AppxDemoProjectContext {
  // Interface
  public config: {
    local:    AppxDemoLocalConfig;
    project:  AppxDemoProjectConfig;
    global:   any;
  }
  public path: string;
  // Constructor
  constructor() {
    this.config = {
      local:    <AppxDemoLocalConfig>{},
      project:  <AppxDemoProjectConfig>{},
      global:   {}
    };
  }
}

//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @class       FalconDebug
 * @access      public
 * @version     1.0.0
 * @summary     ????
 * @description ????
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
export class FalconDebug {
  private static debugEnabled:boolean         = false;
  private static debugAsyncEnabled:boolean    = false;
  private static debugExtendedEnabled:boolean = false;
  private static debugInitialized:boolean     = false;

  static getDebugEnabled():boolean {return FalconDebug.debugEnabled}
  static getDebugAsyncEnabled():boolean {return FalconDebug.debugAsyncEnabled}
  static getDebugExtendedEnabled():boolean {return FalconDebug.debugExtendedEnabled}
  static getDebugInitialized():boolean {return FalconDebug.debugInitialized}
  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      
   * @description ???
   * @version     1.0.0
   * @public @static
   */
  //───────────────────────────────────────────────────────────────────────────┘
  static setDebugEnablement(debugEnabled:boolean, debugAsyncEnabled:boolean, debugExtendedEnabled:boolean):void {
    if (FalconDebug.debugInitialized === true) {
      throw new Error(`ERROR_DEBUG_OPTIONS_SET: Debug enablement options can only be set once`);
    }
    FalconDebug.debugEnabled          = debugEnabled;
    FalconDebug.debugAsyncEnabled     = debugAsyncEnabled;
    FalconDebug.debugExtendedEnabled  = debugExtendedEnabled;
    FalconDebug.debugInitialized      = true;
  }
  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      
   * @description ???
   * @version     1.0.0
   * @public @static
   */
  //───────────────────────────────────────────────────────────────────────────┘
  static debugObject(localDebugger:any, objToDebug:object, objName:string, strTail?:string):void {
    FalconDebug.initLocalDebuggerEnablement(localDebugger);
    localDebugger(
      `-\n${chalk.yellow(objName + ':')}\n` +
      util.inspect(objToDebug, {depth:6, colors:true}) +
      `\n-\n-\n-\n-`
    );
    if(strTail) localDebugger(strTail);
  }
  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      
   * @description ???
   * @version     1.0.0
   * @public @static
   */
  //───────────────────────────────────────────────────────────────────────────┘
  static debugString(localDebugger:any, strToDebug:string, strName:string, strTail?:string):void {
    FalconDebug.initLocalDebuggerEnablement(localDebugger);
    localDebugger(`-\n${chalk.magenta(strName + ':')} ${strToDebug}`);
    if(strTail) localDebugger(strTail);
  }
  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      
   * @description ???
   * @version     1.0.0
   * @public @static
   */
  //───────────────────────────────────────────────────────────────────────────┘
  static displayFalconError(falconError:FalconError) {
    console.log('');
    console.log(chalk.red.bold(`CLI_EXCEPTION_DEBUG:`));
    console.log(chalk`{blue Error Name:}  ${falconError.name}`);
    console.log(chalk`{blue Error Msg:}   ${falconError.falconMessage}`);
    console.log(chalk`{blue Status Code:} ${falconError.status}`);
    if (typeof falconError.errObj.stack !== 'undefined') {
      if (falconError.errObj.name)      console.log(chalk`{yellow CLI Error Name:}  ${falconError.errObj.name}`);
      if (falconError.errObj.message)   console.log(chalk`{yellow CLI Error Msg:}   ${falconError.errObj.message}`);
      if (falconError.errObj.status)    console.log(chalk`{yellow CLI Status Code:} ${falconError.errObj.status}`);
      if (falconError.errObj.warnings)  console.log(chalk`{yellow CLI Warnings:}    ${util.inspect(falconError.errObj.warnings, {depth:8, colors:true})}`);
      if (falconError.errObj.action)    console.log(chalk`{yellow CLI Suggested Actions:} \n${falconError.errObj.action}`);
      if (falconError.errObj.stack)     console.log(chalk`{yellow CLI Stacktrace:}        \n${falconError.errObj.stack}`);
    }
    console.log(chalk`{yellow Raw Error:}\n${falconError.errRaw}`);
    console.log('');
  }
  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      
   * @description ???
   * @version     1.0.0
   * @private @static
   */
  //───────────────────────────────────────────────────────────────────────────┘
  private static initLocalDebuggerEnablement(localDebugger:any):void {
    // Don't change anything if the localDebugger is already enabled.
    if (localDebugger.enabled) return;

    // Check the namespace of the Local Debugger and enable
    switch (true) {
      case /\(ASYNC\)$/.test(localDebugger.namespace):
        localDebugger.enabled = FalconDebug.getDebugAsyncEnabled();
        break;
      case /\(EXTENDED\)$/.test(localDebugger.namespace):
        localDebugger.enabled = FalconDebug.getDebugExtendedEnabled();
        break;
      default:
        localDebugger.enabled = FalconDebug.getDebugEnabled();
        break;
    }
  }
}

//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @class       FalconError
 * @access      public
 * @version     1.0.0
 * @summary     ????
 * @description ????
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
export class FalconError {
  public  name:           string;
  public  message:        string;
  public  falconMessage:  string;
  public  status:         number;
  public  errRaw:         string;
  public  errObj:         any;

  private constructor() {
  }

  public static wrap(error:any):FalconError {
    if (error instanceof FalconError) {
      return error;
    }
    else {
      return {
        name:           `UNEXPECTED_EXCEPTION (${error.name})`,
        message:        `Unexpected Exception ${error.message}`,
        falconMessage:  `There has been an unexpected exception ${error.message}`,
        status:   -999,
        errObj:   error,
        errRaw:   error.toString()
      }
    }
  }

  public static wrapCliError(stdErrString:string, customMessage:string=''):FalconError {
    let falconError = new FalconError();
    let stdErrJson  = <any>{};

    // Initialize errRaw since everybody gets that.
    falconError.errRaw  = stdErrString;
    
    // See if we can resolve the raw stderr output to an object.
    try {
      stdErrJson = JSON.parse(stdErrString);
    } catch (e) {
      // Could not parse the stderr string.
      falconError.name          = `UNPARSED_CLI_ERROR`;
      falconError.message       = `Unparsed CLI Error`;
      falconError.falconMessage = `The CLI threw an error that could not be parsed`;
      falconError.status        = -1;
      falconError.errObj        = <any>{};
      return falconError;
    }

    // Use the custom message for the Falcon Message (if provided).
    if (customMessage) {
      falconError.falconMessage = customMessage;
    }
    else {
      falconError.falconMessage = stdErrJson.message;
    }

    // Wrap the parsed error as best we can
    falconError.name    = stdErrJson.name;
    falconError.message = stdErrJson.message;
    falconError.status  = stdErrJson.status;
    falconError.errObj  = stdErrJson;

    return falconError;
  }  
}

//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @class       FalconStatusReport
 * @access      public
 * @version     1.0.0
 * @summary     ????
 * @description ????
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
export class FalconStatusReport {
  private   startTime:      number  = -1;
  private   endTime:        number  = -1;
  private   runTime:        number  = -1;

  public    statusCode:     number  = -1;
  public    statusLog:      Array<string>;
  public    statusMessage:  string  = '';

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @constructs  FalconStatusReport      
   * @description ???
   * @version     1.0.0
   */
  //───────────────────────────────────────────────────────────────────────────┘
  constructor (startTimer:boolean=false) {
    if (startTimer === true) {
      this.startTimer();
    }
    this.statusLog = new Array<string>();
  }
  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      
   * @description ???
   * @version     1.0.0
   * @public
   */
  //───────────────────────────────────────────────────────────────────────────┘
  public setStatusMessage(statusMessage:string):void {
    this.logStatusMessage(statusMessage);
    this.statusMessage = statusMessage;
  }
  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      
   * @description ???
   * @version     1.0.0
   * @public
   */
  //───────────────────────────────────────────────────────────────────────────┘
  public logStatusMessage(logMessage:string):void {
    this.statusLog.push(logMessage);
  }
  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      
   * @description ???
   * @version     1.0.0
   * @public
   */
  //───────────────────────────────────────────────────────────────────────────┘
  public startTimer() {
    if (this.endTime !== -1) {
      throw new Error('ERROR_TIMER_RUNNING: You can not restart a timer that has already been stopped.');
    }
    if (this.startTime !== -1) {
      throw new Error('ERROR_TIMER_RUNNING: You can not start a timer that is already running.');
    }
    let d = new Date();
    this.startTime = d.getTime();
  }
  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      
   * @description ???
   * @version     1.0.0
   * @public
   */
  //───────────────────────────────────────────────────────────────────────────┘
  public stopTimer():number {
    if (this.startTime === -1) {
      throw new Error('ERROR_TIMER_NEVER_STARTED: You can not stop a timer that was never started.');
    }
    if (this.endTime !== -1) {
      throw new Error('ERROR_TIMER_STOPPED: You can not stop a timer that is already stopped.');
    }
    let d = new Date();
    this.endTime = d.getTime();
    this.runTime = this.endTime - this.startTime;
    return this.runTime;
  }
  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      
   * @description ???
   * @version     1.0.0
   * @public
   */
  //───────────────────────────────────────────────────────────────────────────┘
  public getStartTime(returnString:boolean=false):number|string {
    if (returnString === true) {
      return this.printTime(this.startTime);
    }
    else {
      return this.startTime;
    }
  }
  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      
   * @description ???
   * @version     1.0.0
   * @public
   */
  //───────────────────────────────────────────────────────────────────────────┘
  public getEndTime(returnString:boolean=false):number|string {
    if (returnString === true) {
        return this.printTime(this.endTime);
    }
    else {
      return this.endTime;
    }
  }
  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      
   * @description ???
   * @version     1.0.0
   * @public
   */
  //───────────────────────────────────────────────────────────────────────────┘
  public getRunTime(returnString:boolean=false):number|string {
    if (this.startTime === -1) {
      throw new Error('ERROR_TIMER_NEVER_STARTED: You can get runtime from a timer that was never started.');
    }
    let returnRuntime = -1;
    if (this.runTime === -1) {
      let d = new Date();
      returnRuntime = d.getTime() - this.startTime;
    }
    else {
      returnRuntime = this.runTime;
    }
    if (returnString === true) {
      return `${returnRuntime/1000}`;
    }
    else {
      return returnRuntime;
    }
  }
  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      
   * @description ???
   * @version     1.0.0
   * @public
   */
  //───────────────────────────────────────────────────────────────────────────┘
  public getCurrentTime(returnString:boolean=false):number|string {
    let d = new Date();
    let currentTime = d.getTime();

    if (returnString === true) {
      return this.printTime(currentTime);
    }
    else {
      return currentTime;      
    }
  }
  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      printTime
   * @description ???
   * @version     1.0.0
   * @private
   */
  //───────────────────────────────────────────────────────────────────────────┘
  private printTime(timeCode:number):string {
    let d = new Date(timeCode);
    let hours         = d.getHours();
    let minutes       = d.getMinutes().toLocaleString('en-US', {minimumIntegerDigits: 2, useGrouping: false});
    let seconds       = d.getSeconds().toLocaleString('en-US', {minimumIntegerDigits: 2, useGrouping: false});
    let milliseconds  = d.getMilliseconds().toLocaleString('en-US', {minimumIntegerDigits: 3, useGrouping: false});

    return `${hours}:${minutes}:${seconds}:${milliseconds}`;
  }
}