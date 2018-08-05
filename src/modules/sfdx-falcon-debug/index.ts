//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @file          modules/sfdx-falcon-debug/index.ts
 * @copyright     Vivek M. Chawla - 2018
 * @author        Vivek M. Chawla <@VivekMChawla>
 * @requires      module:???
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

    //DEVTEST
    //console.log(`checkEnabled:topNamespace: %s = %s${SfdxFalconDebug.printLineBreaks()}`, topNamespace, SfdxFalconDebug.enabledDebuggers.get(topNamespace));

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
  public static enableDebuggers(namespaces:Array<string>):void {
    for (let namespace of namespaces) {
      SfdxFalconDebug.enabledDebuggers.set(namespace, true);
    }
    //DEVTEST
    //console.log(`SfdxFalconDebug.enabledDebuggers:\n%O${SfdxFalconDebug.printLineBreaks()}`, SfdxFalconDebug.enabledDebuggers);

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
  static displayFalconError(falconError:SfdxFalconError) {
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