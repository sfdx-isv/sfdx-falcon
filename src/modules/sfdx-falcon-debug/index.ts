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
import {SfdxFalconError}  from  '../sfdx-falcon-error';  // Why?
import {ERROR_TYPE}       from  '../../enums';                      // Why?

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
   * @version     1.0.0
   * @public @static
   */
  //───────────────────────────────────────────────────────────────────────────┘
  static displayFalconError(falconError:SfdxFalconError, inspectDepth:number=2) {
    let falconErrorColor = 'blue';
    let systemErrorColor = 'yellow';

    // Output the core Error info
    console.log('');
    console.log(chalk.red.bold(`CLI_EXCEPTION_DEBUG:`));
    console.log(chalk`{${falconErrorColor} Falcon Error Type:}    ${falconError.type}`);
    console.log(chalk`{${falconErrorColor} Falcon Error Name:}    ${falconError.name}`);
    console.log(chalk`{${falconErrorColor} Falcon Error Source:}  ${falconError.source}`);
    console.log(chalk`{${falconErrorColor} Falcon Error Status:}  ${falconError.status}`);
    console.log(chalk`{${falconErrorColor} Falcon Error Msg:}     ${falconError.message}`);
    console.log(chalk`{${falconErrorColor} Falcon Message:}       ${falconError.falconMessage}`);
    console.log(chalk`{${falconErrorColor} Falcon Info:}          ${falconError.friendlyInfo}`);
    if (falconError.error instanceof Error) {
      console.log(chalk`{${systemErrorColor} System Error Name:}    ${falconError.error.name}`);
      console.log(chalk`{${systemErrorColor} System Error Msg:}     ${falconError.error.message}`);
      console.log(chalk`{${systemErrorColor} System Error Stack:} \n${falconError.error.stack}`);  
    }
    console.log(chalk`{${falconErrorColor} Falcon Error Detail: (Depth ${inspectDepth})}\n${util.inspect(falconError.details, {depth:inspectDepth, colors:true})}`);
    console.log('');
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      getDebugger
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