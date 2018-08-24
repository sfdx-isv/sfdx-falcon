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
// Requires
const debug = require('debug');           // Why?
const chalk = require('chalk');           // Why?
const util  = require('util');            // Why?

//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @class       SfdxFalconDebug
 * @summary     Provides custom "debugging" services (ie. debug-style info to console.log()).
 * @description Provides custom "debugging" services (ie. debug-style info to console.log()).
 * @version     1.0.0
 * @public
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
export class SfdxFalconDebug {
  private static debuggers:Map<string,any>              = new Map();
  private static enabledDebuggers:Map<string, boolean>  = new Map<string, boolean>();
//  private static falconErrorColor:string                = 'blue';
//  private static systemErrorColor:string                = 'yellow';
  public  static lineBreaks:number                      = 5;
  public  static debugDepth:number                      = 2;

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      checkEnabled
   * @param       {string}  namespace Required. The "namespace" of a debug object.
   * @returns     {boolean} Returns TRUE if the namespace has been enabled.
   * @description Given a "namespace", check the internal map of "enabled" 
   *              namespaces and return true if a match is found.
   * @version     1.0.0
   * @public @static
   */
  //───────────────────────────────────────────────────────────────────────────┘
  public static checkEnabled(namespace:string):boolean {

    // Split the provided namespace into sections on ":"
    let namespaceGroups = namespace.split(':');
    let namespaceToTest = '';

    // Check the namespace from top level to last level. 
    for (let namespaceGroup of namespaceGroups) {
      namespaceToTest += namespaceGroup;
      if (SfdxFalconDebug.enabledDebuggers.get(namespaceToTest)) {
        return true;
      }
      namespaceToTest += ':';
    }

    // No single or combined groupings in the provided namespace match an enabled namespace.
    return false;
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      enableDebuggers
   * @param       {Array<string>} namespaces  Required. An array of strings,
   *              each representing a namespace that should be enabled.
   * @param       {number}  [debugDepth]  Optional. The number of levels "deep"
   *              that the nested contents of an Object will be rendered during
   *              certain display operations.
   * @returns     {void}
   * @description Given an Array of strings, add an entry in the Enabled Debuggers
   *              map.  This means that when debug code is reached during execution
   *              any enabled debug messages will be displayed to the user.
   * @version     1.0.0
   * @public @static
   */
  //───────────────────────────────────────────────────────────────────────────┘
  public static enableDebuggers(namespaces:Array<string>, debugDepth:number=2):void {
    for (let namespace of namespaces) {
      SfdxFalconDebug.enabledDebuggers.set(namespace, true);
    }
    SfdxFalconDebug.debugDepth = debugDepth;
    if (SfdxFalconDebug.enabledDebuggers.size > 0) {
      console.log(chalk`\n{blue The Following Debug Namesapces are Enabled (Debug Depth = ${debugDepth}):}\n%O\n`, namespaces);
    }
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