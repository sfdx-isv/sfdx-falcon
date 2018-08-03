//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @file          modules/sfdx-falcon-command/index.ts
 * @copyright     Vivek M. Chawla - 2018
 * @author        Vivek M. Chawla <@VivekMChawla>
 * @requires      module:salesforce/command
 * @summary       Exports SfdxFalconCommand for use with creating custom Salesforce CLI commands.
 * @description   ???
 * @version       1.0.0
 * @license       MIT
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
// Imports
import {flags}                        from  '@oclif/command';         // Requried to create CLI command flags.
import {SfdxCommand}                  from  '@salesforce/command';    // Required by child classe to create a CLI command
import {Messages}                     from  '@salesforce/core';       // Messages library that simplifies using external JSON for string reuse.
import {SfdxFalconDebug}              from  '../sfdx-falcon-debug';   // Why?
import {SfdxFalconError}              from  '../sfdx-falcon-error';   // Why?
import {SfdxFalconStatus}             from  '../sfdx-falcon-status';  // Why?
import {SfdxFalconJsonResponse}       from  '../sfdx-falcon-types';   // Why?


//─────────────────────────────────────────────────────────────────────────────┐
// SFDX Core library has the ability to import a JSON file with message strings
// making it easy to separate logic from static output messages. There are 
// two steps required to use this.
//
// Step 1:  Tell the Messages framework to look for and import a 'messages' 
//          directory from inside the root of your project.
// Step 2:  Create a Messages object representing a message bundle from inside
//          your 'messages' directory.  The second param represents the name of
//          the JSON file you're trying to load. 
// 
// Note that messages from @salesforce/command, @salesforce/core, or any library
// that is using the messages framework can also be loaded this way by 
// specifying the module name as the first parameter of loadMessages().
//─────────────────────────────────────────────────────────────────────────────┘
Messages.importMessagesDirectory(__dirname);
const sfdxFalconCommandMessages = Messages.loadMessages('sfdx-falcon', 'sfdxFalconCommand');

//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @abstract
 * @class       SfdxFalconCommand
 * @extends     SfdxCommand
 * @access      public
 * @version     1.0.0
 * @summary     Abstract base class class for building Salesforce CLI commands that use Yeoman.
 * @description Classes that extend SfdxYeomanCommand will be able to run any Generator defined
 *              in the src/generators directory.  The file name in src/generators should match the 
 *              generatorType string passed into runYeomanGenerator().  For example, if 
 *              generatorType==="my-generator", then there MUST be a TS script file located at 
 *              src/generators/my-generator.ts.
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
export abstract class SfdxFalconCommand extends SfdxCommand {

  // These help build and deliver a JSON response once command execution is done.
  protected falconCommandName:string;                   // Why?
  protected falconCommandStatus:SfdxFalconStatus;       // Why?
  protected falconJsonResponse:SfdxFalconJsonResponse;  // Why?

  protected falconDebugFlag:boolean     = false;    // Why?
  protected falconDebugExtFlag:boolean  = false;    // Why?
  protected falconDebugXlFlag:boolean   = false;    // Why?
  protected falconDebugErrFlag:boolean  = false;    // Why?

  //───────────────────────────────────────────────────────────────────────────┐
  // Define the baseline set of custom FLAGS used by all SFDX-Falcon commands.
  //    --FALCONDEBUG     Command should run in DEBUG mode.
  //    --FALCONDEBUGEXT  Command should run in EXTENDED DEBUG mode.
  //    --FALCONDEBUGXL   Command should run in EXTRA LARGE (XL) DEBUG mode.
  //    --FALCONDEBUGERR  Command should run in ERROR DEBUG mode.
  //───────────────────────────────────────────────────────────────────────────┘
  public static falconBaseflagsConfig = {
    falcondebug: flags.boolean({
      description: sfdxFalconCommandMessages.getMessage('falcondebug_FlagDescription'),  
      required: false,
      hidden: true
    }),
    falcondebugext: flags.boolean({
      description: sfdxFalconCommandMessages.getMessage('falcondebugext_FlagDescription'),  
      required: false,
      hidden: true
    }),
    falcondebugxl: flags.boolean({
      description: sfdxFalconCommandMessages.getMessage('falcondebugxl_FlagDescription'),  
      required: false,
      hidden: true
    }),
    falcondebugerr: flags.boolean({
      description: sfdxFalconCommandMessages.getMessage('falcondebugerr_FlagDescription'),  
      required: false,
      hidden: true
    })
  };

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @function    sfdxFalconCommandInit
   * @returns     {void}
   * @description Initializes various SfdxFalconCommand structures.
   * @version     1.0.0
   * @protected
   */
  //───────────────────────────────────────────────────────────────────────────┘
  protected sfdxFalconCommandInit(commandName:string='FALCON_COMMAND') {
    // Initialize the JSON response
    this.falconJsonResponse = {
      status: 0,
      result: 'RESPONSE_NOT_SPECIFIED'
    };
  
    // Read the incoming values for all DEBUG flags.
    this.falconDebugFlag      = this.flags.falcondebug      ||  false;
    this.falconDebugExtFlag   = this.flags.falcondebugext   ||  false;
    this.falconDebugXlFlag    = this.flags.falcondebugxl    ||  false;
    this.falconDebugErrFlag   = this.flags.falcondebugerr   ||  false;

    // Specify the top-level SFDX-Falcon debugger namespaces to enable.
    let enabledDebuggers = new Array<string>();

    // Build an array of the namespaces to enable.
    if (this.falconDebugFlag)     enabledDebuggers.push('FALCON');
    if (this.falconDebugExtFlag)  enabledDebuggers.push('FALCON_EXT');
    if (this.falconDebugXlFlag)   enabledDebuggers.push('FALCON_XL');

    // Enable the debuggers.
    SfdxFalconDebug.enableDebuggers(enabledDebuggers);

  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @function    sfdxFalconCommandInit
   * @returns     {void}
   * @description Initializes various SfdxFalconCommand structures.
   * @version     1.0.0
   * @protected
   */
  //───────────────────────────────────────────────────────────────────────────┘
  protected onError(error:any) {
    SfdxFalconError.terminateWithError(error, this.falconCommandName, this.falconDebugErrFlag);
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @function    onSuccess
   * @param       {SfdxFalconStatus}  statusReport
   * @returns     {void}  
   * @description ???
   * @version     1.0.0
   * @private
   */
  //───────────────────────────────────────────────────────────────────────────┘
  protected onSuccess(statusReport:any):void {
    this.falconCommandStatus = {...this.falconCommandStatus, ...statusReport};
    this.falconJsonResponse = {
      status:  0,
      result:  this.falconCommandStatus
    }
    SfdxFalconDebug.obj(`FALCON:COMMAND:${this.falconCommandName}`, statusReport, `SfdxFalconCommand:onSuccess:statusReport: `);
    console.log(`Command Successful. Total elapsed time: ${this.falconCommandStatus.getRunTime(true)} seconds`);
  }

} // End of class SfdxFalconCommand