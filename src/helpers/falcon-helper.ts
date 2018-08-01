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
import {SfdxError}                    from  '@salesforce/core';                     // Why?
import {SfdxErrorConfig}              from  '@salesforce/core';                     // Why?
import {AppxDemoLocalConfig}          from '../falcon-types';         // Why?
import {AppxDemoProjectConfig}        from '../falcon-types';         // Why?
import {ERROR_TYPE}                   from '../enums';                // Why?
import {FalconProgressNotifications}  from './notification-helper'    // Why?

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
    let falconErrorColor = 'blue';
    let errorColor, errorLabel;
    console.log('');
    console.log(chalk.red.bold(`CLI_EXCEPTION_DEBUG:`));
    console.log(chalk`{${falconErrorColor} Error Name:}  ${falconError.name}`);
    console.log(chalk`{${falconErrorColor} Error Msg:}   ${falconError.falconMessage}`);
    console.log(chalk`{${falconErrorColor} Status Code:} ${falconError.status}`);
    if (typeof falconError.errObj.stack !== 'undefined') {
      switch (falconError.type) {
        case ERROR_TYPE.CLI_ERROR:
          errorColor = 'yellow';
          errorLabel = 'CLI';
          break;
        case ERROR_TYPE.INTERNAL_ERROR:
          errorColor = 'magenta';
          errorLabel = 'Internal';
          break;
        case ERROR_TYPE.FALCON_ERROR:
          errorColor = 'green';
          errorLabel = 'Falcon';
          break;
        default:
          errorColor = 'red';
          errorLabel = 'Unknown';
          break;
      }
      if (falconError.errObj.name)      console.log(chalk`{${errorColor} ${errorLabel} Error Name:}  ${falconError.errObj.name}`);
      if (falconError.errObj.message)   console.log(chalk`{${errorColor} ${errorLabel} Error Msg:}   ${falconError.errObj.message}`);
      if (falconError.errObj.status)    console.log(chalk`{${errorColor} ${errorLabel} Status Code:} ${falconError.errObj.status}`);
      if (falconError.errObj.warnings)  console.log(chalk`{${errorColor} ${errorLabel} Warnings:}    ${util.inspect(falconError.errObj.warnings, {depth:8, colors:true})}`);
      if (falconError.errObj.action)    console.log(chalk`{${errorColor} ${errorLabel} Suggested Actions:} \n${falconError.errObj.action}`);
      if (falconError.errObj.stack)     console.log(chalk`{${errorColor} ${errorLabel} Stacktrace:}        \n${falconError.errObj.stack}`);
    }
    console.log(chalk`{${falconErrorColor} Raw Error:}\n${falconError.errRaw}`);
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
  public  type:           ERROR_TYPE;
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
        name:           `UNEXPECTED_ERROR (${error.name})`,
        message:        `${error.message}`,
        falconMessage:  `There has been an unexpected error`,
        type:           ERROR_TYPE.INTERNAL_ERROR,
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
      falconError.type          = ERROR_TYPE.UNPARSED_ERROR;
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
    falconError.type    = ERROR_TYPE.CLI_ERROR;
    falconError.name    = stdErrJson.name;
    falconError.message = stdErrJson.message;
    falconError.status  = stdErrJson.status;
    falconError.errObj  = stdErrJson;

    return falconError;
  }
  
  public static terminateWithError(error:any, commandName:string, showErrorDebug:boolean=false):void {
  
    // Make sure any outstanding notifications are killed.
    FalconProgressNotifications.killAll();

    // Make sure that whatever we get is wrapped as a Falcon Error.
    let falconError = FalconError.wrap(error);

    // Build an SfdxErrorConfig object
    let sfdxErrorConfig = new SfdxErrorConfig(
      'sfdx-falcon',          // Package Name
      'falconErrorMessages',  // Bundle Name
      'errDefault'            // Error Message Key
    );

    // Display a formatted version of the stdError before throwing the SfdxError.
    if (showErrorDebug) {
      FalconDebug.displayFalconError(falconError);
    }

    // Merge the custom Falcon message and the standard SFDX into our output.
    sfdxErrorConfig.setErrorTokens([falconError.falconMessage, falconError.errObj.message]);

    // Search the SFDX error message to see if we can figure out a recommended action.
    switch (true) {
      case /VMC_DEV_TEST1/.test(falconError.errObj.message):
        sfdxErrorConfig.addAction('actionDevTest1', [`TEST_ONE`]);
        sfdxErrorConfig.addAction('actionDevTest2', [`TEST_TWO`]);
        break;
      case /^ERROR_UNKNOWN_ACTION:/.test(falconError.errObj.message):
        sfdxErrorConfig.addAction('ACTIONFOR_ERROR_UNKNOWN_ACTION');
        break;
      case /VMC_DEV_TEST3/.test(falconError.errObj.message):
        sfdxErrorConfig.addAction('actionDevTest2', [`TEST_FOUR`]);
        break;
    }

    // Create an SFDX Error, set the command name, and throw it.
    let sfdxError = SfdxError.create(sfdxErrorConfig);
    sfdxError.commandName = commandName;
    throw sfdxError;  
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