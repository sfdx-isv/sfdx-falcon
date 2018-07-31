//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @file          commands/falcon/demo/deploy.ts
 * @copyright     Vivek M. Chawla - 2018
 * @author        Vivek M. Chawla <@VivekMChawla>
 * @version       1.0.0
 * @license       MIT
 * @requires      module:validators/core
 * @summary       Implements the falcon:demo:deploy CLI command
 * @description   Salesforce CLI Plugin command (falcon:demo:deploy) that is expected to run inside
 *                of a fully-configured AppExchange Demo Kit (ADK) project.  Uses project and local
 *                settings from various JSON config files and uses them to power an Org Build that
 *                targets a non-scratch (ie. trial, DE, or sandbox) org specified by the local user.
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
// Imports
import {SfdxCommand}                  from  '@salesforce/command';                  // The CLI command we build must extend this class.
import {Messages}                     from  '@salesforce/core';                     // Messages library that simplifies using external JSON for string reuse.
import {SfdxError}                    from  '@salesforce/core';                     // Why?
import {SfdxErrorConfig}              from  '@salesforce/core';                     // Why?
import {flags}                        from  '@oclif/command';                       // Requried to create CLI command flags.
import * as path                      from  'path';                                 // Helps resolve local paths at runtime.
import {validateLocalPath}            from  '../../../validators/core-validator';   // Core validation function to check that local path values don't have invalid chars.
import {AppxDemoProject}              from  '../../../helpers/appx-demo-helper';    // Provides information and actions related to an ADK project
import {FalconDebug}                  from  '../../../helpers/falcon-helper';       // Why?
import {FalconError}                  from  '../../../helpers/falcon-helper';       // Why?
import {FalconStatusReport}           from  '../../../helpers/falcon-helper';       // Why?
import {FalconJsonResponse}           from  '../../../falcon-types';                // Why?
import {FalconProgressNotifications}  from  '../../../helpers/notification-helper'; // Why?


// Requires
const debug = require('debug')('falcon:demo:deploy');                       // Utility for debugging. set debug.enabled = true to turn on.

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
const messages = Messages.loadMessages('sfdx-falcon', 'falconDemoDeploy');

//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @class       FalconDemoDeploy
 * @extends     SfdxCommand
 * @summary     Implements the CLI Command falcon:demo:deploy
 * @description TODO ????
 * @version     1.0.0
 * @public
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
export default class FalconDemoDeploy extends SfdxCommand {
  //───────────────────────────────────────────────────────────────────────────┐
  // These static properties give the Salesforce CLI a picture of what your
  // command is and does. For example, the --help flag implemented by the
  // SfdxCommand class uses the description and examples, and won't show this
  // command at all if the 'hidden' property is set to TRUE.
  //───────────────────────────────────────────────────────────────────────────┘
  public static description = messages.getMessage('commandDescription');
  public static hidden      = false;
  public static examples    = [
    `$ sfdx falcon:demo:deploy`,
    `$ sfdx falcon:demo:deploy --deploydir ~/demos/adk-projects/my-adk-project`
  ];

  //───────────────────────────────────────────────────────────────────────────┐
  // Identify which core SFDX arguments/features are required by this command.
  //───────────────────────────────────────────────────────────────────────────┘
  protected static requiresProject        = false;  // True if an SFDX Project workspace is REQUIRED.
  protected static requiresUsername       = false;  // True if an org username is REQUIRED.
  protected static requiresDevhubUsername = false;  // True if a hub org username is REQUIRED.
  protected static supportsUsername       = false;  // True if an org username is OPTIONAL.
  protected static supportsDevhubUsername = false;  // True if a hub org username is OPTIONAL.  

  //───────────────────────────────────────────────────────────────────────────┐
  // Define the custom FLAGS used by this command.
  // -d --DEPLOYDIR   Directory where a fully configured AppX Demo Kit (ADK)
  //                  project exists. All commands for deployment must be 
  //                  defined inside this directory.
  //    --FALCONDEBUG Indicates that the command should run in DEBUG mode.
  //                  Defaults to FALSE if not specified by the user.
  //───────────────────────────────────────────────────────────────────────────┘
  protected static flagsConfig = {
    deploydir: {
      char: 'd', 
      required: false,
      type: 'directory',
      description: messages.getMessage('deploydirFlagDescription'),
      default: '.',
      hidden: false
    },
    configfile: {
      char: 'f', 
      required: false,
      type: 'filepath',
      description: messages.getMessage('configfileFlagDescription'),
      hidden: false
    },
    falcondebug: flags.boolean({
      description: messages.getMessage('falcondebugFlagDescription'),  
      required: false,
      hidden: true
    }),
    falcondebugasync: flags.boolean({
      description: messages.getMessage('falcondebugasyncFlagDescription'),  
      required: false,
      hidden: true
    }),
    falcondebugextended: flags.boolean({
      description: messages.getMessage('falcondebugextendedFlagDescription'),  
      required: false,
      hidden: true
    })
  };

  //───────────────────────────────────────────────────────────────────────────┐
  // Define some private instance member variables that will be used to help
  // build and deliver the JSON response.
  //───────────────────────────────────────────────────────────────────────────┘
  private statusReport:FalconStatusReport;        // Why?
  private jsonResponse:FalconJsonResponse;        // Why?

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @function    run
   * @returns     {Promise<any>}  This should resolve by returning a JSON object
   *              that the CLI will then forward to the user if the --json flag
   *              was set when this command was called.
   * @description Entrypoint function used by the CLI when the user wants to
   *              run the command 'sfdx falcon:demo:deploy'.
   * @version     1.0.0
   * @public @async
   */
  //───────────────────────────────────────────────────────────────────────────┘
  public async run(): Promise<any> { 

    // Grab values from CLI command flags.  Set defaults for optional flags not set by user.
    const deployDirFlag           = this.flags.deploydir            ||  '.';
    const demoConfigFile          = this.flags.configfile           ||  '';
    const falconDebugFlag         = this.flags.falcondebug          ||  false;
    const falconDebugAsyncFlag    = this.flags.falcondebugasync     ||  false;
    const falconDebugExtendedFlag = this.flags.falcondebugextended  ||  false;

    // Initialize the global debug enablement settings
    FalconDebug.setDebugEnablement(falconDebugFlag, falconDebugAsyncFlag, falconDebugExtendedFlag);

    // Don't forget to enable the LOCAL debug
    debug.enabled = FalconDebug.getDebugEnabled();

    // Initialize the JSON response
    this.jsonResponse = {
      status: 1,
      result: 'ERROR_RESPONSE_NOT_SET'
    };

    // Make sure that deployDirFlag has a valid local path
    if (validateLocalPath(deployDirFlag) === false) {
      throw new Error('Deploy Directory can not begin with a ~, have unescaped spaces, or contain these invalid characters (\' \" * |)');
    }

    // Instantiate an AppxDemoProject Object.
    const appxDemoProject = await AppxDemoProject.resolve(path.resolve(deployDirFlag), demoConfigFile);
    
    // Run validateDemo(). The "errorJson" is an object created by JSON-parsing stderr output.
    await appxDemoProject.validateDemo()
      .then(statusReport => {this.onSuccess(statusReport)})
      .catch(falconError => {this.onError(falconError)});

    // The JSON Response was populated in onSuccess(). Just need to return now.
    return this.jsonResponse;
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @function    onSuccess
   * @param       {FalconStatusReport}  statusReport
   * @returns     {void}  
   * @description ???
   * @version     1.0.0
   * @private
   */
  //───────────────────────────────────────────────────────────────────────────┘
  private onSuccess(statusReport:FalconStatusReport):void {
    this.statusReport = statusReport;
    this.jsonResponse = {
      status:  0,
      result:  this.statusReport
    }
    FalconDebug.debugObject(debug, statusReport, `FalconDemoDeploy.onSuccess`);
    console.log(`Demo Validation Completed Successfully. Total elapsed time: ${statusReport.getRunTime(true)}`);
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @function    onError
   * @param       {any}  error  ???
   * @returns     {void}
   * @description ???
   * @version     1.0.0
   * @private
   */
  //───────────────────────────────────────────────────────────────────────────┘
  private onError(error:any):void {

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

    // Pull out the sfdxErrorObj so the code below is easier to read.
    let stdError = falconError.stdErrJson;

    // Display a formatted version of the stdError before throwing the SfdxError.
    FalconDebug.displayStdError(stdError);

    // Merge the custom Falcon message and the standard SFDX into our output.
    sfdxErrorConfig.setErrorTokens([falconError.message, stdError.message]);

    // Search the SFDX error message to see if we can figure out a recommended action.
    switch (true) {
      case /VMC_DEV_TEST1/.test(stdError.message):
        sfdxErrorConfig.addAction('actionDevTest1', [`TEST_ONE`]);
        sfdxErrorConfig.addAction('actionDevTest2', [`TEST_TWO`]);
        break;
      case /^ERROR_UNKNOWN_ACTION:/.test(stdError.message):
        sfdxErrorConfig.addAction('ACTIONFOR_ERROR_UNKNOWN_ACTION');
        break;
      case /VMC_DEV_TEST3/.test(stdError.message):
        sfdxErrorConfig.addAction('actionDevTest2', [`TEST_FOUR`]);
        break;
    }

    // Create an SFDX Error, set the command name, and throw it.
    let sfdxError = SfdxError.create(sfdxErrorConfig);
    sfdxError.commandName = 'falcon:demo:deploy';
    throw sfdxError;
  }
}