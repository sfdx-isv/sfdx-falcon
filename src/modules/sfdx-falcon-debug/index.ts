//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @file          modules/sfdx-falcon-debug/index.ts
 * @copyright     Vivek M. Chawla - 2018
 * @author        Vivek M. Chawla <@VivekMChawla>
 * @summary       Provides custom Debugging (well, LOGGING) services for the SFDX-Falcon Plugin.
 * @description   Provides custom Debugging (well, LOGGING) services for the SFDX-Falcon Plugin.
 * @version       1.0.0
 * @license       MIT
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
// Requires
const debug = require('debug'); // Why?
const chalk = require('chalk'); // Why?
const util  = require('util');  // Why?

/** Type. Alias to any, mainly so the intent is obvious when this is used. */
type DebugFunc = any; // tslint:disable-line: no-any

//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @class       SfdxFalconDebug
 * @summary     Provides custom "debugging" services (ie. debug-style info to console.log()).
 * @description Provides custom "debugging" services (ie. debug-style info to console.log()).
 * @public
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
export class SfdxFalconDebug {
  public  static lineBreaks:        number                  = 5;
  public  static debugDepth:        number                  = 2;


  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      checkEnabled
   * @param       {string}  namespace Required. The "namespace" of a debug object.
   * @returns     {boolean} Returns TRUE if the namespace has been enabled.
   * @description Given a "namespace", check the internal map of "enabled"
   *              namespaces and return true if a match is found.
   * @public @static
   */
  //───────────────────────────────────────────────────────────────────────────┘
  public static checkEnabled(namespace:string):boolean {

    // Split the provided namespace into sections on ":"
    const namespaceGroups = namespace.split(':');
    let namespaceToTest = '';

    // Check the namespace from top level to last level.
    for (const namespaceGroup of namespaceGroups) {
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
   * @public @static
   */
  //───────────────────────────────────────────────────────────────────────────┘
  public static enableDebuggers(namespaces:string[], debugDepth:number=2):void {
    for (const namespace of namespaces) {
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
   * @param       {string}  namespace Required.
   * @param       {string}  message  Required.
   * @returns     {void}
   * @description ???
   * @public @static
   */
  //───────────────────────────────────────────────────────────────────────────┘
  public static debugMessage(namespace:string, message:string):void {
    const debugFunc = SfdxFalconDebug.getDebugger(namespace);
    debugFunc(`\n${chalk.blue(message)}\n`);
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      debugObject
   * @param       {string}  namespace Required.
   * @param       {object}  objToDebug  Required.
   * @param       {string}  [strLead] Optional
   * @param       {string}  [strTail] Optional
   * @returns     {void}
   * @description ???
   * @public @static
   */
  //───────────────────────────────────────────────────────────────────────────┘
  public static debugObject(namespace:string, objToDebug:object, strLead:string = '', strTail:string = ''):void {
    const debugFunc = SfdxFalconDebug.getDebugger(namespace);
    debugFunc(
      `\n${chalk.yellow(strLead)}\n` +
      `${util.inspect(objToDebug, {depth:8, colors:true})}` +
      `${SfdxFalconDebug.printLineBreaks()}`
    );
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      debugString
   * @param       {string}  namespace Required.
   * @param       {string}  strToDebug  Required.
   * @param       {string}  [strLead] Optional
   * @param       {string}  [strTail] Optional
   * @returns     {void}
   * @description ???
   * @public @static
   */
  //───────────────────────────────────────────────────────────────────────────┘
  public static debugString(namespace:string, strToDebug:string, strLead:string = '', strTail:string = ''):void {
    const debugFunc = SfdxFalconDebug.getDebugger(namespace);
    debugFunc(`-\n${chalk.blue(strLead)}${strToDebug}${chalk.blue(strTail)}${SfdxFalconDebug.printLineBreaks()}`);
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      disableDebuggers
   * @param       {string[]} namespaces  Required.
   * @returns     {void}
   * @description ???
   * @public @static
   */
  //───────────────────────────────────────────────────────────────────────────┘
  public static disableDebuggers(namespaces:string[]):void {
    for (const namespace of namespaces) {
      SfdxFalconDebug.enabledDebuggers.set(namespace, false);
    }
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      getDebugger
   * @param       {string}  namespace Required
   * @returns     {DebugFunc} Returns the debugger with the appropriate namespace.
   * @description ???
   * @public @static
   */
  //───────────────────────────────────────────────────────────────────────────┘
  public static getDebugger(namespace:string):DebugFunc {
    if (SfdxFalconDebug.debuggers.has(namespace)) {
      return SfdxFalconDebug.debuggers.get(namespace);
    }
    else {
      const newDebugger = debug(namespace);
      newDebugger.enabled = true;
      SfdxFalconDebug.debuggers.set(namespace, newDebugger);
      return newDebugger;
    }
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      msg
   * @param       {string}  namespace Required.
   * @param       {string}  message  Required.
   * @returns     {void}
   * @description ???
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
   * @param       {string}  namespace Required.
   * @param       {object}  objToDebug  Required.
   * @param       {string}  [strLead] Optional
   * @param       {string}  [strTail] Optional
   * @returns     {void}
   * @description ???
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
   * @method      str
   * @param       {string}  namespace Required.
   * @param       {string}  strToDebug  Required.
   * @param       {string}  [strLead] Optional
   * @param       {string}  [strTail] Optional
   * @returns     {void}
   * @description ???
   * @public @static
   */
  //───────────────────────────────────────────────────────────────────────────┘
  public static str(namespace:string, strToDebug:string, strLead:string = '', strTail:string = ''):void {
    if (SfdxFalconDebug.checkEnabled(namespace)) {
      SfdxFalconDebug.debugString(namespace, strToDebug, strLead, strTail);
    }
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      toConsole
   * @param       {string}  message Required. Message to send to console.log().
   * @description Sends a message to console.log that's pre and post-pended
   *              with newline breaks to help the output be easy to see.
   * @public @static
   */
  //───────────────────────────────────────────────────────────────────────────┘
  public static toConsole(message:string):void {
    console.log(
      `${SfdxFalconDebug.printLineBreaks()}` +
      `\n${chalk.yellow(message)}\n` +
      `${SfdxFalconDebug.printLineBreaks()}`
    );
  }

  // Private members
  private static debuggers:         Map<string, DebugFunc>  = new Map();
  private static enabledDebuggers:  Map<string, boolean>    = new Map<string, boolean>();
  //private static falconErrorColor:  string                  = 'blue';
  //private static systemErrorColor:  string                  = 'yellow';

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      printLineBreaks
   * @description Returns a string containing the number of newline chars as
   *              specified in the lineBreaks public static member variable.
   * @private @static
   */
  //───────────────────────────────────────────────────────────────────────────┘
  private static printLineBreaks():string {
    return '\n-'.repeat(SfdxFalconDebug.lineBreaks);
  }

} // ENDOF class SfdxFalconDebug
