//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @file          modules/sfdx-falcon-debug/index.ts
 * @copyright     Vivek M. Chawla - 2018
 * @author        Vivek M. Chawla <@VivekMChawla>
 * @summary       ???
 * @description   ???
 * @version       1.0.0
 * @license       MIT
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
import {SfdxFalconError}  from  '../sfdx-falcon-error';   // Why?
import {ERROR_TYPE}       from  '../../enums';            // Why?
import { SfdxCliError, SfdxFalconError2 } from '../sfdx-falcon-error/index.2';
import {SfdxError}        from '@salesforce/core';

// Requires
const debug = require('debug');           // Why?
const chalk = require('chalk');           // Why?
const util  = require('util');            // Why?

//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @class       SfdxFalconDebug
 * @summary     ????
 * @description ????
 * @version     1.0.0
 * @public
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
export class SfdxFalconDebug {
  private static debuggers:Map<string,any>              = new Map();
  private static enabledDebuggers:Map<string, boolean>  = new Map<string, boolean>();
  private static falconErrorColor:string                = 'blue';
  private static systemErrorColor:string                = 'yellow';
  public  static lineBreaks:number                      = 5;
  public  static debugDepth:number                      = 2;

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      
   * @description ???
   * @version     1.0.0
   * @public @static
   */
  //───────────────────────────────────────────────────────────────────────────┘
  public static checkEnabled(namespace:string):boolean {
    // Get the "top namespace", ie. the substring up to the first ":".
    let topNamespace = namespace.substring(0, namespace.indexOf(':'));

    // Find out if the topNamespace is set to TRUE in the enabledDebuggers map.
    return SfdxFalconDebug.enabledDebuggers.get(topNamespace);
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      enableDebuggers
   * @description ???
   * @version     1.0.0
   * @private @static
   */
  //───────────────────────────────────────────────────────────────────────────┘
  public static enableDebuggers(namespaces:Array<string>, debugDepth:number=2):void {
    for (let namespace of namespaces) {
      SfdxFalconDebug.enabledDebuggers.set(namespace, true);
    }
    SfdxFalconDebug.debugDepth = debugDepth;
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      debugMessage
   * @description ???
   * @version     1.0.0
   * @public @static
   */
  //───────────────────────────────────────────────────────────────────────────┘
  public static debugMessage(namespace:string, message:string):void {
    let debugFunc = SfdxFalconDebug.getDebugger(namespace);
    debugFunc(`\n${chalk.blue(message)}\n`);
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      debugObject
   * @description ???
   * @version     1.0.0
   * @public @static
   */
  //───────────────────────────────────────────────────────────────────────────┘
  public static debugObject(namespace:string, objToDebug:object, strLead:string = '', strTail:string = ''):void {
    let debugFunc = SfdxFalconDebug.getDebugger(namespace);
    debugFunc(
      `\n${chalk.yellow(strLead)}\n` +
      `${util.inspect(objToDebug, {depth:8, colors:true})}` +
      `${SfdxFalconDebug.printLineBreaks()}`
    );
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      debugString
   * @description ???
   * @version     1.0.0
   * @public @static
   */
  //───────────────────────────────────────────────────────────────────────────┘
  public static debugString(namespace:string, strToDebug:string, strLead:string = '', strTail:string = ''):void {
    let debugFunc = SfdxFalconDebug.getDebugger(namespace);
    debugFunc(`-\n${chalk.blue(strLead)}${strToDebug}${chalk.blue(strTail)}${SfdxFalconDebug.printLineBreaks()}`);
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      disableDebuggers
   * @param       {Array<string>} namespaces  Required.
   * @returns     {void}
   * @description ???
   * @version     1.0.0
   * @public @static
   */
  //───────────────────────────────────────────────────────────────────────────┘
  public static disableDebuggers(namespaces:Array<string>):void {
    for (let namespace of namespaces) {
      SfdxFalconDebug.enabledDebuggers.set(namespace, false);
    }
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      displayFalconError
   * @description ???
   * @returns     {void}
   * @version     1.0.0
   * @public @static
   */
  //───────────────────────────────────────────────────────────────────────────┘
  public static displayFalconError(falconError:any, inspectDepth:number=2):void {

    // Check for SfdxCliError
    if (falconError instanceof SfdxCliError) {
      SfdxFalconDebug.renderSfdxCliError(falconError, 6);
      return;
    }
    // Check for SfdxFalconError
    if (falconError instanceof SfdxFalconError2) {
      SfdxFalconDebug.renderSfdxFalconError(falconError, inspectDepth);
      return;
    }
    // Check for SfdxError
    if (falconError instanceof SfdxError) {
      SfdxFalconDebug.renderSfdxError(falconError, inspectDepth);
      return;
    }
    // Check for Error
    if (falconError instanceof Error) {
      SfdxFalconDebug.renderError(falconError, inspectDepth);
      return;
    }
    
    // If we get here then we don't recognize what the caller passed to us.
    console.log('');
    console.log(chalk.red.bold(`CLI_EXCEPTION_DEBUG:`));
    console.log(chalk`{${SfdxFalconDebug.falconErrorColor} Falcon Error Type:}  UNKNOWN`);
    console.log(chalk`{${SfdxFalconDebug.falconErrorColor} Falcon Error Name:}  ${falconError.constructor.name}`);
    console.log(chalk`{${SfdxFalconDebug.falconErrorColor} Error Data (RAW):} \n${falconError}`);
    console.log(chalk`{${SfdxFalconDebug.falconErrorColor} Error Data (OBJ): (Depth ${inspectDepth})}\n${util.inspect(falconError, {depth:inspectDepth, colors:true})}`);
    console.log('');

    return;

    // Output the core Error info
    /*
    console.log('');
    console.log(chalk.red.bold(`CLI_EXCEPTION_DEBUG:`));
    console.log(chalk`{${SfdxFalconDebug.falconErrorColor} Falcon Error Type:}    ${falconError.type}`);
    console.log(chalk`{${SfdxFalconDebug.falconErrorColor} Falcon Error Name:}    ${falconError.name}`);
    console.log(chalk`{${SfdxFalconDebug.falconErrorColor} Falcon Error Source:}  ${falconError.source}`);
    console.log(chalk`{${SfdxFalconDebug.falconErrorColor} Falcon Error Status:}  ${falconError.status}`);
    console.log(chalk`{${SfdxFalconDebug.falconErrorColor} Falcon Error Msg:}     ${falconError.message}`);
    console.log(chalk`{${SfdxFalconDebug.falconErrorColor} Falcon Message:}       ${falconError.falconMessage}`);
    console.log(chalk`{${SfdxFalconDebug.falconErrorColor} Falcon Info:}          ${falconError.friendlyInfo}`);
    if (falconError.error instanceof Error) {
      console.log(chalk`{${SfdxFalconDebug.systemErrorColor} System Error Name:}    ${falconError.error.name}`);
      console.log(chalk`{${SfdxFalconDebug.systemErrorColor} System Error Msg:}     ${falconError.error.message}`);
      console.log(chalk`{${SfdxFalconDebug.systemErrorColor} System Error Stack:} \n${falconError.error.stack}`);  
    }
    console.log(chalk`{${SfdxFalconDebug.falconErrorColor} Falcon Error Detail: (Depth ${inspectDepth})}\n${util.inspect(falconError.details, {depth:inspectDepth, colors:true})}`);
    console.log('');
    //*/
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      renderError
   * @param       {Error}  error  Required.
   * @returns     {void}
   * @description Given an Error, render detailed debug info to console.
   * @version     1.0.0
   * @private @static
   */
  //───────────────────────────────────────────────────────────────────────────┘
  private static renderError(error:Error, inspectDepth:number=2):void {

    return;    
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      renderSfdxCliError
   * @param       {SfdxCliError}  cliError  Required.
   * @returns     {void}
   * @description Given an SfdxCliError, render detailed debug info to console.
   * @version     1.0.0
   * @private @static
   */
  //───────────────────────────────────────────────────────────────────────────┘
  private static renderSfdxCliError(cliError:SfdxCliError, inspectDepth:number=2):void {

    // Set colors specific to this renderer
    let cliErrorColor = 'magenta';

    // Output the core Error info
    console.log('');
    console.log(chalk.red.bold(`SFDX_CLI_ERROR_DEBUG:`));
    console.log(chalk`{${SfdxFalconDebug.falconErrorColor} Error Name:}        ${cliError.name}`);
    console.log(chalk`{${SfdxFalconDebug.falconErrorColor} Error Msg:}         ${cliError.message}`);
    console.log(chalk`{${cliErrorColor} CLI Error Name:}    ${cliError.cliError.name}`);
    console.log(chalk`{${cliErrorColor} CLI Error Message:} ${cliError.cliError.message}`);
    console.log(chalk`{${cliErrorColor} CLI Error Status:}  ${cliError.cliError.status}`);
    console.log(chalk`{${cliErrorColor} CLI Error Stack:} \n${cliError.cliError.stack}`);
    console.log(chalk`{${cliErrorColor} CLI Error Result: (Depth ${inspectDepth})}\n${util.inspect(cliError.cliError.result, {depth:inspectDepth, colors:true})}`);
    console.log(chalk`{${cliErrorColor} CLI Error Warnings:}\n${cliError.cliError.result}`);
    console.log(chalk`{${SfdxFalconDebug.falconErrorColor} Falcon Stack:}\n${cliError.falconStack}`);
    console.log(chalk`{${SfdxFalconDebug.falconErrorColor} Falcon Data:} \n${cliError.falconData}`);
    console.log(chalk`{${SfdxFalconDebug.systemErrorColor} System Error Stack:}\n${cliError.stack}`);
  console.log('');
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      renderSfdxError
   * @param       {SfdxError}  sfdxError  Required.
   * @returns     {void}
   * @description Given an SfdxError, render detailed debug info to console.
   * @version     1.0.0
   * @private @static
   */
  //───────────────────────────────────────────────────────────────────────────┘
  private static renderSfdxError(sfdxError:SfdxError, inspectDepth:number=2):void {


  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      renderSfdxFalconError
   * @param       {SfdxFalconError2}  falconError  Required.
   * @returns     {void}
   * @description Given an SfdxFalconError2, render detailed debug info to the
   *              console.
   * @version     1.0.0
   * @private @static
   */
  //───────────────────────────────────────────────────────────────────────────┘
  private static renderSfdxFalconError(falconError:SfdxFalconError2, inspectDepth:number=2):void {

    // Output the core Error info
    console.log('');
    console.log(chalk.red.bold(`SFDX_FALCON_ERROR_DEBUG:`));
    console.log(chalk`{${SfdxFalconDebug.falconErrorColor} Error Name:} ${falconError.name}`);
    console.log(chalk`{${SfdxFalconDebug.falconErrorColor} Error Msg:}  ${falconError.message}`);
    console.log(chalk`{${SfdxFalconDebug.falconErrorColor} Falcon Stack:}\n${falconError.falconStack}`);
    console.log(chalk`{${SfdxFalconDebug.falconErrorColor} Falcon Data: (Depth ${inspectDepth})}\n${util.inspect(falconError.data, {depth:inspectDepth, colors:true})}`);
    console.log('');
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      getDebugger
   * @param       {string}  namespace Required
   * @returns     {any} Returns the debugger with the appropriate namespace.
   * @description ???
   * @version     1.0.0
   * @public @static
   */
  //───────────────────────────────────────────────────────────────────────────┘
  public static getDebugger(namespace:string):any {
    if (SfdxFalconDebug.debuggers.has(namespace)) {
      return SfdxFalconDebug.debuggers.get(namespace);
    }
    else {
      let newDebugger = debug(namespace);
      newDebugger.enabled = true;
      SfdxFalconDebug.debuggers.set(namespace, newDebugger);
      return newDebugger;
    }
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      msg
   * @description ???
   * @version     1.0.0
   * @public @static
   */
  //───────────────────────────────────────────────────────────────────────────┘
  public static msg(namespace:string, message:string):void {
    if (SfdxFalconDebug.checkEnabled(namespace)) {
      SfdxFalconDebug.debugMessage(namespace, message);
    }
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      obj
   * @description ???
   * @version     1.0.0
   * @public @static
   */
  //───────────────────────────────────────────────────────────────────────────┘
  public static obj(namespace:string, objToDebug:object, strLead:string = '', strTail:string = ''):void {
    if (SfdxFalconDebug.checkEnabled(namespace)) {
      SfdxFalconDebug.debugObject(namespace, objToDebug, strLead, strTail);
    }
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      printLineBreaks
   * @description ???
   * @version     1.0.0
   * @private @static
   */
  //───────────────────────────────────────────────────────────────────────────┘
  private static printLineBreaks():string {
    return '\n-'.repeat(SfdxFalconDebug.lineBreaks);
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      str
   * @description ???
   * @version     1.0.0
   * @public @static
   */
  //───────────────────────────────────────────────────────────────────────────┘
  public static str(namespace:string, strToDebug:string, strLead:string = '', strTail:string = ''):void {
    if (SfdxFalconDebug.checkEnabled(namespace)) {
      SfdxFalconDebug.debugString(namespace, strToDebug, strLead, strTail);
    }
  }
} // ENDOF class SfdxFalconDebug