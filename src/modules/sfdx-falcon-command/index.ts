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
// External Imports
import * as path                      from  'path';                       // Helps resolve local paths at runtime.
import {flags}                        from  '@oclif/command';             // Requried to create CLI command flags.
import {SfdxCommand}                  from  '@salesforce/command';        // Required by child classe to create a CLI command
import {Messages}                     from  '@salesforce/core';           // Messages library that simplifies using external JSON for string reuse.

// Internal Imports
import {SfdxFalconDebug}              from  '../sfdx-falcon-debug';       // Internal debugging framework for SFDX-Falcon.
import {SfdxFalconError}              from  '../sfdx-falcon-error';       // Why?
import {SfdxFalconStatus}             from  '../sfdx-falcon-status';      // Why?
import {SfdxFalconJsonResponse}       from  '../sfdx-falcon-types';       // Why?
import {validateLocalPath}            from  '../sfdx-falcon-validators';  // Core validation function to check that local path values don't have invalid chars.


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
const commandMessages = Messages.loadMessages('sfdx-falcon', 'sfdxFalconCommand');
const errorMessages = Messages.loadMessages('sfdx-falcon', 'sfdxFalconError');


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

  // Member vars for commonly implemented flags.
  protected outputDirectory:string;                     // Why?
  protected projectDirectory:string;                    // Why?
  protected targetDirectory:string;                     // Why?
  protected recipeFile:string;                          // Why?
  protected configFile:string;                          // Why?

  // Member vars for commonly implemented arguments.
  protected gitRemoteUri:string;                        // Why?

  // Member vars for ALL debug flags
  protected falconDebugFlag:boolean         = false;    // Why?
  protected falconDebugExtFlag:boolean      = false;    // Why?
  protected falconDebugXlFlag:boolean       = false;    // Why?
  protected falconDebugErrFlag:boolean      = false;    // Why?
  protected falconDebugSuccessFlag:boolean  = false;    // Why?


  //───────────────────────────────────────────────────────────────────────────┐
  // Define the baseline set of custom FLAGS used by all SFDX-Falcon commands.
  //    --FALCONDEBUG         Command should run in DEBUG mode.
  //    --FALCONDEBUGEXT      Command should run in EXTENDED DEBUG mode.
  //    --FALCONDEBUGXL       Command should run in EXTRA LARGE (XL) DEBUG mode.
  //    --FALCONDEBUGERR      Command should run in ERROR DEBUG mode.
  //    --FALCONDEBUGSUCCESS  Command should run in SUCCESS DEBUG mode.
  //───────────────────────────────────────────────────────────────────────────┘
  public static falconBaseflagsConfig = {
    falcondebug: flags.boolean({
      description: commandMessages.getMessage('falcondebug_FlagDescription'),  
      required: false,
      hidden: false
    }),
    falcondebugext: flags.boolean({
      description: commandMessages.getMessage('falcondebugext_FlagDescription'),  
      required: false,
      hidden: true
    }),
    falcondebugxl: flags.boolean({
      description: commandMessages.getMessage('falcondebugxl_FlagDescription'),  
      required: false,
      hidden: true
    }),
    falcondebugerr: flags.boolean({
      description: commandMessages.getMessage('falcondebugerr_FlagDescription'),  
      required: false,
      hidden: false
    }),
    falcondebugsuccess: flags.boolean({
      description: commandMessages.getMessage('falcondebugsuccess_FlagDescription'),  
      required: false,
      hidden: false
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
  protected sfdxFalconCommandInit(commandName:string='UNSPECIFIED_FALCON_COMMAND') {

    // Initialize the JSON response
    this.falconJsonResponse = {
      status: 0,
      result: 'RESPONSE_NOT_SPECIFIED'
    };
  
    // Set the command name
    this.falconCommandName = commandName;

    // Read the inocming values for all COMMON FLAGS. (not all of these will have values)
    this.outputDirectory          = path.resolve(this.flags.outputdir  ||  '.');
    this.projectDirectory         = path.resolve(this.flags.projectdir ||  '.');
    this.targetDirectory          = path.resolve(this.flags.targetdir  ||  '.');
    this.recipeFile               = path.resolve(this.flags.recipefile ||  '.');
    this.configFile               = path.resolve(this.flags.configfile ||  '.');
  
    // Read the incoming values for all COMMON ARGS. (not all of these will have values)
    this.gitRemoteUri             = this.args.GIT_REMOTE_URI        ||  '';

    // Read the incoming values for all DEBUG flags.
    this.falconDebugFlag          = this.flags.falcondebug          ||  false;
    this.falconDebugExtFlag       = this.flags.falcondebugext       ||  false;
    this.falconDebugXlFlag        = this.flags.falcondebugxl        ||  false;
    this.falconDebugErrFlag       = this.flags.falcondebugerr       ||  false;
    this.falconDebugSuccessFlag   = this.flags.falcondebugsuccess   ||  false;

    // Specify the top-level SFDX-Falcon debugger namespaces to enable.
    let enabledDebuggers = new Array<string>();

    // Build an array of the debugger namespaces to enable.
    if (this.falconDebugFlag)         enabledDebuggers.push('FALCON');
    if (this.falconDebugExtFlag)      enabledDebuggers.push('FALCON_EXT');
    if (this.falconDebugXlFlag)       enabledDebuggers.push('FALCON_XL');
    if (this.falconDebugErrFlag)      enabledDebuggers.push('FALCON_ERR');
    if (this.falconDebugSuccessFlag)  enabledDebuggers.push('FALCON_SUCCESS');

    // Enable the specified debuggers.
    SfdxFalconDebug.enableDebuggers(enabledDebuggers);

    // Perform validation of common flags and args.
    if (validateLocalPath(this.outputDirectory) === false) {
      throw new Error(errorMessages.getMessage('errInvalidDirectory', ['Output ']));
    }
    if (validateLocalPath(this.projectDirectory) === false) {
      throw new Error(errorMessages.getMessage('errInvalidDirectory', ['Project ']));
    }
    if (validateLocalPath(this.targetDirectory) === false) {
      throw new Error(errorMessages.getMessage('errInvalidDirectory', ['Target ']));
    }
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @function    onError
   * @param       ???
   * @returns     {void}
   * @description ???
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
    SfdxFalconDebug.obj(`FALCON_SUCCESS:${this.falconCommandName}`, this.falconCommandStatus, `SfdxFalconCommand:onSuccess:statusReport: `);
    
    if (typeof this.falconCommandStatus.getRunTime !== 'undefined') {
      console.log(`Command Successful. Total elapsed time: ${this.falconCommandStatus.getRunTime(true)} seconds`);
    }
    else {
      console.log(`Command Successful`);
    }
  }

} // End of class SfdxFalconCommand