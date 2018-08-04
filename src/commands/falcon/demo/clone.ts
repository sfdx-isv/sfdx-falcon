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
import {SfdxCommand}                  from  '@salesforce/command';                  // The CLI command we build must extend this class.
import {Messages}                     from  '@salesforce/core';                     // Messages library that simplifies using external JSON for string reuse.
import {flags}                        from  '@oclif/command';                       // Requried to create CLI command flags.
import * as path                      from  'path';                                 // Helps resolve local paths at runtime.

import {GeneratorStatus}          from  '../../../helpers/yeoman-helper';               // Helper object to get status back from Generators after they run.
import {validateLocalPath}        from  '../../../modules/sfdx-falcon-validators';      // Core validation function to check that local path values don't have invalid chars.

import {SfdxFalconJsonResponse}   from  '../../../modules/sfdx-falcon-types';           // Why?
import {SfdxFalconDebug}          from  '../../../modules/sfdx-falcon-debug';           // Why?
import {SfdxFalconError}          from  '../../../modules/sfdx-falcon-error';           // Why?
import {SfdxFalconStatus}         from  '../../../modules/sfdx-falcon-status';          // Why?

import {SfdxFalconYeomanCommand}  from  '../../../modules/sfdx-falcon-yeoman-command';  // Base class that CLI commands in this project that use Yeoman should use.


// Use SfdxCore's Messages framework to get the message bundle for this command.
Messages.importMessagesDirectory(__dirname);
const messages      = Messages.loadMessages('sfdx-falcon', 'falconDemoClone');
const errorMessages = Messages.loadMessages('sfdx-falcon', 'falconErrorMessages');


//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @class       FalconDemoClone
 * @extends     SfdxFalconYeomanCommand
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
export default class FalconDemoClone extends SfdxFalconYeomanCommand {

  // Define the basic properties of this CLI command.
  public static description = messages.getMessage('commandDescription');
  public static hidden      = false;
  public static examples    = [
    `$ sfdx falcon:demo:clone git@github.com:GitHubUser/my-repository.git`,
    `$ sfdx falcon:demo:clone https://github.com/GitHubUser/my-repository.git`,
    `$ sfdx falcon:demo:clone https://github.com/GitHubUser/my-repository.git\n\\` +
    `                        --outputdir ~/demos/appexchange-demo-kit-projects`
  ];
    
  // Identify the core SFDX arguments/features required by this command.
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
      description: messages.getMessage('gitRemoteUri_ArgDescription'),
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
      description: messages.getMessage('outputdir_FlagDescription'),
      default: '.',
      hidden: false
    },
    // IMPORTANT! The next line MUST be here to import the FalconDebug flags.
    ...SfdxFalconYeomanCommand.falconBaseflagsConfig
  };

  // Define a GeneratorStatus var to track what happens inside Yeoman.
  private generatorStatus:GeneratorStatus;

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

    // Initialize the SfdxFalconCommand base.
    this.sfdxFalconCommandInit('falcon:demo:clone');

    // Grab values from CLI command arguments.
    const gitRemoteUriArg = this.args.GIT_REMOTE_URI;

    // Grab values from CLI command flags.  Set defaults for optional flags not set by user.
    const outputDirectory = this.flags.outputdir      ||  '.';
    const debugModeFlag   = this.flags.falcondebug    ||  false;

    // Make sure that outputDirectory has a valid local path
    if (validateLocalPath(outputDirectory) === false) {
      throw new Error(errorMessages.getMessage('errInvalidProjectDirectory'));
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
      outputDir:        outputDirectory,
      debugMode:        debugModeFlag,
      options: []
    })
    .then(statusReport => {this.onSuccess(statusReport)})
    .catch(error => {this.onError(error)});

    // The JSON Response was populated in onSuccess(). Just need to return now.
    return this.falconJsonResponse;
  }

} // End of Class FalconDemoClone