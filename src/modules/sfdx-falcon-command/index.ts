//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @file          modules/sfdx-falcon-command/index.ts
 * @copyright     Vivek M. Chawla - 2018
 * @author        Vivek M. Chawla <@VivekMChawla>
 * @summary       Exports SfdxFalconCommand for use with creating custom Salesforce CLI commands.
 * @description   ???
 * @version       1.0.0
 * @license       MIT
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
// Import External Modules
import * as path                      from  'path';                 // Helps resolve local paths at runtime.
import {flags}                        from  '@salesforce/command';  // Required by child classe to create a CLI command
import {SfdxCommand}                  from  '@salesforce/command';  // Required by child classe to create a CLI command
import {Messages}                     from  '@salesforce/core';     // Messages library that simplifies using external JSON for string reuse.
import {SfdxError}                    from  '@salesforce/core';     // Generalized SFDX error which also contains an action.

// Import Internal Modules
import {FalconProgressNotifications}  from  '../sfdx-falcon-notifications'  // Why?
import {SfdxFalconDebug}              from  '../sfdx-falcon-debug';         // Internal debugging framework for SFDX-Falcon.
import {SfdxFalconError}              from  '../sfdx-falcon-error';         // Why?
import {SfdxFalconResult}             from  '../sfdx-falcon-result';        // Why?
import {SfdxFalconResultType}         from  '../sfdx-falcon-result';        // Why?
import {SfdxFalconJsonResponse}       from  '../sfdx-falcon-types';         // Why?
import {validateLocalPath}            from  '../sfdx-falcon-validators';    // Core validation function to check that local path values don't have invalid chars.

//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @enum        SfdxFalconCommandType
 * @description Defines the possible types of SFDX-Falcon Commands.
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
export enum SfdxFalconCommandType {
  APPX_PACKAGE    = 'APPX_PACKAGE',
  APPX_DEMO       = 'APPX_DEMO',
  APPX_EXTENSION  = 'APPX_EXTENSION',
  UNKNOWN         = 'UNKNOWN'
}

//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @interface   SfdxFalconCommandResultDetail
 * @description Model of the Detail object that should be attached to an SFDX-Falcon COMMAND Result.
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
export interface SfdxFalconCommandResultDetail {
  commandName:      string;
  commandType:      SfdxFalconCommandType;
  commandFlags:     any;
  commandArgs:      any;
  commandExitCode:  number;
  enabledDebuggers: string[];
}

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
const baseMessages  = Messages.loadMessages('sfdx-falcon', 'sfdxFalconCommand');
const errorMessages = Messages.loadMessages('sfdx-falcon', 'sfdxFalconError');

//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @abstract
 * @class       SfdxFalconCommand
 * @extends     SfdxCommand
 * @summary     Abstract base class class for building Salesforce CLI commands that use Yeoman.
 * @description Classes that extend SfdxYeomanCommand will be able to run any Generator defined
 *              in the src/generators directory.  The file name in src/generators should match the 
 *              generatorType string passed into runYeomanGenerator().  For example, if 
 *              generatorType==="my-generator", then there MUST be a TS script file located at 
 *              src/generators/my-generator.ts.
 * @version     1.0.0
 * @public
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
export abstract class SfdxFalconCommand extends SfdxCommand {

  // Abstract methods
  protected abstract buildFinalError(cmdError:SfdxFalconError):SfdxError; // Builds a user-friendly error message that's specific to an implemented command.

  // These help build and deliver a JSON response once command execution is done.
  protected falconCommandName:          string;                         // Why?
  protected falconCommandResult:        SfdxFalconResult;               // Why?
  protected falconCommandResultDetail:  SfdxFalconCommandResultDetail;  // Why?
  protected falconJsonResponse:         SfdxFalconJsonResponse;         // Why?

  // Member vars for commonly implemented flags.
  protected outputDirectory:            string;                         // Why?
  protected projectDirectory:           string;                         // Why?
  protected targetDirectory:            string;                         // Why?
  protected recipeFile:                 string;                         // Why?
  protected configFile:                 string;                         // Why?
  protected extendedOptions:            {any}                           // Why?

  // Member vars for commonly implemented arguments.
  protected gitRemoteUri:               string;                         // Why?
  protected gitCloneDirectory:          string;                         // Why?

  // Member vars for ALL debug flags
  protected falconDebugFlag:            Array<string> = new Array<string>();  // Why?
  protected falconDebugErrorFlag:       boolean       = false;                // Why?
  protected falconDebugSuccessFlag:     boolean       = false;                // Why?
  protected falconDebugDepthFlag:       number        = 2;                    // Why?

  //───────────────────────────────────────────────────────────────────────────┐
  // Define the baseline set of custom FLAGS used by all SFDX-Falcon commands.
  //    --FALCONDEBUG           Command should run in DEBUG mode.
  //    --FALCONDEBUGERROR      Command should run in ERROR DEBUG mode.
  //    --FALCONDEBUGSUCCESS    Command should run in SUCCESS DEBUG mode.
  //    --FALCONDEBUGDEPTH      Object inspection depth when debug is rendered.
  //───────────────────────────────────────────────────────────────────────────┘
  public static falconBaseflagsConfig = {
    falcondebug: flags.array({
      description: baseMessages.getMessage('falcondebug_FlagDescription'),
      required: false,
      hidden: false,
      default: []
    }),
    falcondebugerror: flags.boolean({
      description: baseMessages.getMessage('falcondebugerror_FlagDescription'),
      required: false,
      hidden: false
    }),
    falcondebugsuccess: flags.boolean({
      description: baseMessages.getMessage('falcondebugsuccess_FlagDescription'),  
      required: false,
      hidden: false
    }),
    falcondebugdepth: flags.number({
      description: baseMessages.getMessage('falcondebugdepth_FlagDescription'),
      required: false,
      hidden: false,
      default: 2
    })
  };

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @function    sfdxFalconCommandInit
   * @param       {string}  commandName Required. ???
   * @param       {SfdxFalconCommandType} commandType Required. ???
   * @returns     {void}
   * @description Initializes various SfdxFalconCommand structures.
   * @version     1.0.0
   * @protected
   */
  //───────────────────────────────────────────────────────────────────────────┘
  protected sfdxFalconCommandInit(commandName:string='UNSPECIFIED_FALCON_COMMAND', commandType:SfdxFalconCommandType) {

    // Initialize the JSON response
    this.falconJsonResponse = {
      falconStatus: 0,
      falconResult: 'RESPONSE_NOT_SPECIFIED'
    };
  
    // Set the command name
    this.falconCommandName = commandName;

    // Read the inocming values for all COMMON FLAGS. (not all of these will have values)
    this.outputDirectory            = path.resolve(this.flags.outputdir       ||  '.');
    this.projectDirectory           = path.resolve(this.flags.projectdir      ||  '.');
    this.targetDirectory            = path.resolve(this.flags.targetdir       ||  '.');
    this.recipeFile                 = path.resolve(this.flags.recipefile      ||  '.');
    this.configFile                 = path.resolve(this.flags.configfile      ||  '.');
    this.extendedOptions            = JSON.parse((this.flags.extendedOptions  ||  '{}'));
  
    // Read the incoming values for all COMMON ARGS. (not all of these will have values)
    this.gitRemoteUri               = this.args.GIT_REMOTE_URI        ||  '';
    this.gitCloneDirectory          = this.args.GIT_CLONE_DIR         ||  '';

    // Read the incoming values for all DEBUG flags.
    this.falconDebugFlag            = this.flags.falcondebug          ||  [];
    this.falconDebugErrorFlag       = this.flags.falcondebugerror     ||  false;
    this.falconDebugSuccessFlag     = this.flags.falcondebugsuccess   ||  false;
    this.falconDebugDepthFlag       = this.flags.falcondebugdepth     ||  2;
    
    // Specify the top-level SFDX-Falcon debugger namespaces to enable.
    let enabledDebuggers = new Array<string>();

    // Build an array of the debugger namespaces to enable.
    for (let debugNamespace of this.falconDebugFlag) {
      enabledDebuggers.push(`${debugNamespace.trim()}`);
    }
    if (this.falconDebugErrorFlag)    enabledDebuggers.push('FALCON_ERROR');
    if (this.falconDebugSuccessFlag)  enabledDebuggers.push('FALCON_SUCCESS');

    // Initialize an SfdxFalconResult object to store the Result of this COMMAND.
    this.falconCommandResult = 
      new SfdxFalconResult(commandName, SfdxFalconResultType.COMMAND,
                          { startNow:       true,
                            bubbleError:    false,    // Let onError() handle errors (no bubbling)
                            bubbleFailure:  false});  // Let onSuccess() handle failures (no bubbling)

    // Initialize the Results Detail object for this COMMAND.
    this.falconCommandResultDetail = {commandName:      commandName,
                                      commandType:      commandType,
                                      commandFlags:     this.flags,
                                      commandArgs:      this.args,
                                      commandExitCode:  null,
                                      enabledDebuggers: enabledDebuggers};

    // Attach the Results Detail object to the COMMAND result.
    this.falconCommandResult.setDetail(this.falconCommandResultDetail);

    // Enable the specified debuggers.
    SfdxFalconDebug.enableDebuggers(enabledDebuggers, this.falconDebugDepthFlag);

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
   * @param       {any}   rejectedPromise Required. 
   * @param       {boolean} [showErrorDebug]  Optional. Determines if extended
   *              debugging output the Error Result can be shown.
   * @param       {boolean} [promptUser] Optional. Determines if the user will
   *              be prompted to display debug info. If FALSE, debug info will
   *              be shown without requiring additional user input.
   * @returns     {Promise<void>}
   * @description Recieves the results from a Rejected Promise and processes 
   *              them to settle out the ultimate exit status of this
   *              COMMAND Result.
   * @version     1.0.0
   * @protected
   */
  //───────────────────────────────────────────────────────────────────────────┘
  protected async onError(rejectedPromise:any, showErrorDebug:boolean=true, promptUser:boolean=true):Promise<void> {

    // Make sure any rejected promises are wrapped as an ERROR Result.
    let errorResult = SfdxFalconResult.wrapRejectedPromise(rejectedPromise, SfdxFalconResultType.UNKNOWN, 'RejectedPromise');

    // Set the Exit Code for this COMMAND Result (failure==1).
    this.falconCommandResultDetail.commandExitCode = 1;

    // Add the ERROR Result to the COMMAND Result.
    this.falconCommandResult.addChild(errorResult);

    // Manually mark the COMMAND Result as an Error (since bubbleError is FALSE)
    this.falconCommandResult.error(errorResult.errObj);

    // Terminate with Error.
    // TODO: Need to add a global parameter to store the "show prompt" setting
    await this.terminateWithError(showErrorDebug, promptUser);
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @function    onSuccess
   * @param       {any}  resolvedPromise Required.
   * @returns     {Promise<void>}
   * @description Takes any resolved Promise which should be returned by some
   *              sort of Asynchronous call (implemented in a derived class)
   *              that does whatever "work" the CLI Command is meant to do and
   *              makes sure it's wrapped as an SFDX Falcon Result
   * @version     1.0.0
   * @protected
   */
  //───────────────────────────────────────────────────────────────────────────┘
  protected async onSuccess(resolvedPromise:any):Promise<void> {

    // Make sure any resolved promises are wrapped as an SfdxFalconResult.
    let successResult = SfdxFalconResult.wrap(resolvedPromise, SfdxFalconResultType.UNKNOWN, `onSuccess`);

    // Set the Exit Code for this COMMAND Result (success==0).
    this.falconCommandResultDetail.commandExitCode = 0;

    // Add the SFDX-Falcon Result as a Child of the COMMAND Result.
    this.falconCommandResult.addChild(successResult);

    // Mark the COMMAND Result as completing successfully.
    this.falconCommandResult.success();

    // If the "falcondebugsuccess" flag was set, render the COMMAND Result
    if (this.falconDebugSuccessFlag) {
      this.falconCommandResult.displayResult();
    }

    // TODO: Setup the JSON Response

  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      terminateWithError
   * @param       {boolean} [showErrorDebug]  Optional. Determines if extended
   *              debugging output for the terminating Error can be shown.
   * @param       {boolean} [promptUser] Optional. Determines if the user will
   *              be prompted to display debug info. If FALSE, debug info will
   *              be shown without requiring additional user input.
   * @description Kills all ongoing async code (ie. Progress Notifications) and
   *              possibly renders an Error Debug before throwing an SfdxError
   *              so that the CLI can present user-friendly error info.
   * @protected
   */
  //───────────────────────────────────────────────────────────────────────────┘
  private async terminateWithError(showErrorDebug:boolean=true, promptUser:boolean=true):Promise<void> {
  
    // Make sure any outstanding notifications are killed.
    FalconProgressNotifications.killAll();

    // Make sure that an SfdxFalconResult object was passed to us.
    if ((this.falconCommandResult instanceof SfdxFalconResult) === false) {
      throw new Error('ERROR_X01: An unexpected fatal error has occured');
    }

    // Make sure that the SfdxFalconResult object comes to us with a contained SfdxFalconError Object.
    if ((this.falconCommandResult.errObj instanceof SfdxFalconError) === false) {
      throw new Error('ERROR_X02: An unexpected fatal error has occured');
    }

    // Run the "Display Error Debug Info" process. This may prompt the user to view extended debug info.
    await this.falconCommandResult.displayErrorDebugInfo(showErrorDebug, promptUser);

    // Throw a "Final Error" based on the COMMAND Result's Error object.
    throw this.buildFinalError(this.falconCommandResult.errObj);
  }
} // End of class SfdxFalconCommand