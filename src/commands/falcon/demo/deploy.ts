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
import {core}                   from  '@salesforce/command';                // Allows us to use the Messages Library from core.
import {flags}                  from  '@oclif/command';                     // Requried to create CLI command flags.
import {GeneratorStatus}        from  '../../../helpers/yeoman-helper';     // Helper object to get status back from Generators after they run.
import SfdxYeomanCommand        from  '../../../sfdx-yeoman-command';       // Base class that CLI commands in this project that use Yeoman should use.
import {validateLocalPath}      from  '../../../validators/core-validator'; // Core validation function to check that local path values don't have invalid chars.

//─────────────────────────────────────────────────────────────────────────────┐
// SFDX Core library has the ability to import a JSON file with message strings
// making it easy to separate logic from static output messages. The file
// referenced by the second parameter of loadMessages() must be found in the
// messages directory at the root of your project.
//─────────────────────────────────────────────────────────────────────────────┘
// Initialize Messages with the current plugin directory
core.Messages.importMessagesDirectory(__dirname);

// Load the specific messages for this file. Messages from @salesforce/command, @salesforce/core,
// or any library that is using the messages framework can also be loaded this way.
const messages = core.Messages.loadMessages('sfdx-falcon', 'falconDemoDeploy');

//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @class       FalconDemoDeploy
 * @extends     SfdxYeomanCommand
 * @access      public
 * @version     1.0.0
 * @summary     Implements the CLI Command falcon:demo:deploy
 * @description TODO ????
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
// TODO: We may not need to use Yeoman for the deploy command
export default class FalconDemoClone extends SfdxYeomanCommand {
  //───────────────────────────────────────────────────────────────────────────┐
  // Set command-level properties.
  //───────────────────────────────────────────────────────────────────────────┘
  public static description = messages.getMessage('commandDescription');
  public static hidden      = false;
  public static examples    = [
    `$ sfdx falcon:demo:deploy`,
    `$ sfdx falcon:demo:deploy --deploydir ~/demos/adk-projects/my-adk-project`
  ];
  
  //───────────────────────────────────────────────────────────────────────────┐
  // Define the FLAGS used by this command.
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
    falcondebug: flags.boolean({
      description: messages.getMessage('falcondebugFlagDescription'),  
      required: false,
      hidden: true
    })
  };

  //───────────────────────────────────────────────────────────────────────────┐
  // Identify which core SFDX arguments/features are required by this command.
  //───────────────────────────────────────────────────────────────────────────┘
  protected static requiresProject        = false;  // True if an SFDX Project workspace is REQUIRED.
  protected static requiresUsername       = false;  // True if an org username is REQUIRED.
  protected static requiresDevhubUsername = false;  // True if a hub org username is REQUIRED.
  protected static supportsUsername       = false;  // True if an org username is OPTIONAL.
  protected static supportsDevhubUsername = false;  // True if a hub org username is OPTIONAL.

  //───────────────────────────────────────────────────────────────────────────┐
  // Implement the run() function (this is what powers the SFDX command)
  //───────────────────────────────────────────────────────────────────────────┘
  public async run(): Promise<any> { // tslint:disable-line:no-any

    // Grab values from CLI command flags.  Set defaults for optional flags not set by user.
    const deployDirFlag = this.flags.deploydir    ||  '.';
    const debugModeFlag = this.flags.falcondebug  || false;

    // Make sure that deployDirFlag has a valid local path
    if (validateLocalPath(deployDirFlag) === false) {
      throw new Error('Deploy Directory can not begin with a ~, have unescaped spaces, or contain these invalid characters (\' \" * |)');
    }

    //─────────────────────────────────────────────────────────────────────────┐
    // Declare and initialize a GeneratorStatus object. This will let us get
    // status messages back from the Yeoman Generator and we can display them
    // to the user once the Generator completes it's run.
    //─────────────────────────────────────────────────────────────────────────┘
    let generatorStatus = new GeneratorStatus();

    //─────────────────────────────────────────────────────────────────────────┐
    // Make an async call to the base object's generate() funtion.  This will
    // load and execute the Yeoman Generator defined in clone-falcon-project.ts.
    // All user interactions for the rest of this command will come from Yeoman,
    // so there is no need to run anything after this call returns.
    //─────────────────────────────────────────────────────────────────────────┘
    await super.runYeomanGenerator('deploy-falcon-demo', {
      commandName:      'falcon:demo:deploy',
      generatorStatus:  generatorStatus,
      deployDir:        deployDirFlag,
      debugMode:        debugModeFlag,
      options: []
    })

    // Print all status messages for the user.
    generatorStatus.printStatusMessages();

    // Return empty JSON since this is meant to be a human-readable command only.
    return {};
  }
}