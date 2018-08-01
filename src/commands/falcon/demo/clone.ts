//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @file          commands/falcon/demo/clone.ts
 * @copyright     Vivek M. Chawla - 2018
 * @author        Vivek M. Chawla <@VivekMChawla>
 * @version       1.0.0
 * @license       MIT
 * @requires      module:validators/core
 * @summary       Implements the falcon:demo:clone CLI command
 * @description   Salesforce CLI Plugin command (falcon:demo:clone) that allows a Salesforce DX
 *                developer to clone an existing AppExchange Demo Kit (ADK) based project. After
 *                the ADK project code is cloned, the user is taken through an interview to help
 *                set up developer-specific project variables.
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
// Imports
import {core}                   from  '@salesforce/command';                // Allows us to use the Messages Library from core.
import {Messages}                     from  '@salesforce/core';                     // Messages library that simplifies using external JSON for string reuse.
import {flags}                  from  '@oclif/command';                     // Requried to create CLI command flags.
import {GeneratorStatus}        from  '../../../helpers/yeoman-helper';     // Helper object to get status back from Generators after they run.
import SfdxYeomanCommand        from  '../../../sfdx-yeoman-command';       // Base class that CLI commands in this project that use Yeoman should use.
import {validateLocalPath}      from  '../../../validators/core-validator'; // Core validation function to check that local path values don't have invalid chars.

import {FalconDebug}            from  '../../../helpers/falcon-helper';       // Why?
import {FalconError}            from  '../../../helpers/falcon-helper';       // Why?
import {FalconStatusReport}     from  '../../../helpers/falcon-helper';       // Why?
import {FalconJsonResponse}     from  '../../../falcon-types';                // Why?

// Requires
const debug = require('debug')('falcon:demo:clone');                               // Utility for debugging. set debug.enabled = true to turn on.

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
const messages = Messages.loadMessages('sfdx-falcon', 'falconDemoClone');

//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @class       FalconDemoClone
 * @extends     SfdxYeomanCommand
 * @summary     Implements the CLI Command falcon:demo:clone
 * @description Extends SfdxYeomanCommand, which itself extends SfdxCommand.  Implements the CLI
 *              Command falcon:demo:clone. This command allows a Salesforce DX developer to
 *              clone an existing project based on the AppExchange Demo Kit (ADK) template.  After
 *              the project code is cloned, the user is taken through an interview to help set up 
 *              developer-specific project variables.
 * @version     1.0.0
 * @public
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
export default class FalconDemoClone extends SfdxYeomanCommand {
  //───────────────────────────────────────────────────────────────────────────┐
  // These static properties give the Salesforce CLI a picture of what your
  // command is and does. For example, the --help flag implemented by the
  // SfdxCommand class uses the description and examples, and won't show this
  // command at all if the 'hidden' property is set to TRUE.
  //───────────────────────────────────────────────────────────────────────────┘
  public static description = messages.getMessage('commandDescription');
  public static hidden      = false;
  public static examples    = [
    `$ sfdx falcon:demo:clone git@github.com:GitHubUser/my-repository.git`,
    `$ sfdx falcon:demo:clone https://github.com/GitHubUser/my-repository.git`,
    `$ sfdx falcon:demo:clone https://github.com/GitHubUser/my-repository.git \\
                           --outputdir ~/demos/appexchange-demo-kit-projects`
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
  // Define the ARGUMENTS used by this command. Note, this has to be done
  // with a public static member variable named 'args'.
  // Position 1 (gitRemoteUri)  - URI of the Git Remote repo being cloned.
  //───────────────────────────────────────────────────────────────────────────┘
  public static args = [
    {
      name: 'GIT_REMOTE_URI',
      description: messages.getMessage('gitRemoteUriArgDescription'),
      required: true,
      hidden: false
    }
  ];

  //───────────────────────────────────────────────────────────────────────────┐
  // Define the FLAGS used by this command.
  // -d --OUTPUTDIR   Directory where AppX Demo Kit (ADK) project will be cloned
  //                  to.  Defaults to . (current directory) is not specified.
  //    --FALCONDEBUG Indicates that the command should run in DEBUG mode.
  //                  Defaults to FALSE if not specified by the user.
  //───────────────────────────────────────────────────────────────────────────┘
  protected static flagsConfig = {
    outputdir: {
      char: 'd', 
      required: false,
      type: 'directory',
      description: messages.getMessage('outputdirFlagDescription'),
      default: '.',
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
    }),
    falcondebugerrors: flags.boolean({
      description: messages.getMessage('falcondebugerrorsFlagDescription'),  
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
  private generatorStatus:GeneratorStatus;        // Why?

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @function    run
   * @returns     {Promise<any>}  This should resolve by returning a JSON object
   *              that the CLI will then forward to the user if the --json flag
   *              was set when this command was called.
   * @description Entrypoint function used by the CLI when the user wants to
   *              run the command 'sfdx falcon:demo:clone'.
   * @version     1.0.0
   * @public @async
   */
  //───────────────────────────────────────────────────────────────────────────┘
  public async run(): Promise<any> { // tslint:disable-line:no-any

    // Grab values from CLI command arguments.
    const gitRemoteUriArg = this.args.GIT_REMOTE_URI;

    // Grab values from CLI command flags.  Set defaults for optional flags not set by user.
    const outputDirFlag           = this.flags.outputdir            ||  '.';
    const debugModeFlag           = this.flags.falcondebug          ||  false;
    const falconDebugFlag         = this.flags.falcondebug          ||  false;
    const falconDebugAsyncFlag    = this.flags.falcondebugasync     ||  false;
    const falconDebugExtendedFlag = this.flags.falcondebugextended  ||  false;
    const falconDebugErrorsFlag   = this.flags.falcondebugerrors    ||  false;

    // Initialize the global debug enablement settings
    FalconDebug.setDebugEnablement(falconDebugFlag, falconDebugAsyncFlag, falconDebugExtendedFlag);

    // Initialize the JSON response
    this.jsonResponse = {
      status: 1,
      result: 'ERROR_RESPONSE_NOT_SET'
    };

    // Make sure that outputFirFlag has a valid local path
    if (validateLocalPath(outputDirFlag) === false) {
      throw new Error('Target Directory can not begin with a ~, have unescaped spaces, or contain these invalid characters (\' \" * |)');
    }

    //─────────────────────────────────────────────────────────────────────────┐
    // Declare and initialize a GeneratorStatus object. This will let us get
    // status messages back from the Yeoman Generator and we can display them
    // to the user once the Generator completes it's run.
    //─────────────────────────────────────────────────────────────────────────┘
    this.generatorStatus = new GeneratorStatus();

    //─────────────────────────────────────────────────────────────────────────┐
    // Make an async call to the base object's generate() funtion.  This will
    // load and execute the Yeoman Generator defined in clone-falcon-project.ts.
    // All user interactions for the rest of this command will come from Yeoman,
    // so there is no need to run anything after this call returns.
    //─────────────────────────────────────────────────────────────────────────┘
    await super.runYeomanGenerator('clone-appx-demo-project', {
      commandName:      'falcon:demo:clone',
      generatorStatus:  this.generatorStatus,
      gitRemoteUri:     gitRemoteUriArg,
      outputDir:        outputDirFlag,
      debugMode:        debugModeFlag,
      options: []
    })
    .then(statusReport => {this.onSuccess(statusReport)})
    .catch(error => {FalconError.terminateWithError(error, 'falcon:demo:clone', falconDebugErrorsFlag)});

    // Return empty JSON since this is meant to be a human-readable command only.
    return this.jsonResponse;
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @function    onSuccess
   * @param       {any}  statusReport
   * @returns     {void}  
   * @description ???
   * @version     1.0.0
   * @private
   */
  //───────────────────────────────────────────────────────────────────────────┘
  private onSuccess(statusReport:any):void {
    /*
    this.statusReport = statusReport;
    this.jsonResponse = {
      status:  0,
      result:  this.statusReport
    }
    FalconDebug.debugObject(debug, statusReport, `FalconDemoClone:onSuccess:statusReport`);

    console.log(`Demo Project was cloned successfully. Total elapsed time: ${statusReport.getRunTime(true)} seconds`);
    //*/
    // Print all status messages for the user.
    this.generatorStatus.printStatusMessages();
  }
} // End of Class FalconDemoClone