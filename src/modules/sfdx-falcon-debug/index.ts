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
//import {SfdxFalconError}  from  '../sfdx-falcon-error';   // Why?
//import {ERROR_TYPE}       from  '../../enums';            // Why?
//import { SfdxCliError, SfdxFalconError } from '../sfdx-falcon-error/index.2';
//import {SfdxError}        from '@salesforce/core';

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