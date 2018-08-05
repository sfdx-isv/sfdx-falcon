//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @file          commands/falcon/demo/deploy.ts
 * @copyright     Vivek M. Chawla - 2018
 * @author        Vivek M. Chawla <@VivekMChawla>
 * @requires      module:validators/core
 * @summary       Implements the CLI command "falcon:demo:deploy"
 * @description   Salesforce CLI Plugin command (falcon:demo:deploy) that is expected to run inside
 *                of a fully-configured AppExchange Demo Kit (ADK) project.  Uses project and local
 *                settings from various JSON config files to power an Org Build.
 * @version       1.0.0
 * @license       MIT
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
// External Imports
import {SfdxCommand}                  from  '@salesforce/command';                  // The CLI command we build must extend this class.
import {Messages}                     from  '@salesforce/core';                     // Messages library that simplifies using external JSON for string reuse.
import {flags}                        from  '@oclif/command';                       // Requried to create CLI command flags.

// Local Imports
import {AppxDemoProject}              from  '../../../helpers/appx-demo-helper';    // Provides information and actions related to an ADK project
import {SfdxFalconCommand}            from  '../../../modules/sfdx-falcon-command'; // Provides support for SfdxFalcon-based CLI commands.

// Use SfdxCore's Messages framework to get the message bundle for this command.
Messages.importMessagesDirectory(__dirname);
const messages = Messages.loadMessages('sfdx-falcon', 'falconDemoDeploy');


//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @class       FalconDemoDeploy
 * @extends     SfdxFalconCommand
 * @summary     Implements the CLI Command "falcon:demo:deploy"
 * @description TODO ????
 * @version     1.0.0
 * @public
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
export default class FalconDemoDeploy extends SfdxFalconCommand {

  // Define the basic properties of this CLI command.
  public static description = messages.getMessage('commandDescription');
  public static hidden      = false;
  public static examples    = [
    `$ sfdx falcon:demo:deploy`,
    `$ sfdx falcon:demo:deploy --projectdir ~/demos/adk-projects/my-adk-project`,
    `$ sfdx falcon:demo:deploy --projectdir ~/demos/adk-projects/my-adk-project \\\n` + 
    `                         --configfile my-alternate-demo-config.json`
  ];

  // Identify the core SFDX arguments/features required by this command.
  protected static requiresProject        = false;  // True if an SFDX Project workspace is REQUIRED.
  protected static requiresUsername       = false;  // True if an org username is REQUIRED.
  protected static requiresDevhubUsername = false;  // True if a hub org username is REQUIRED.
  protected static supportsUsername       = false;  // True if an org username is OPTIONAL.
  protected static supportsDevhubUsername = false;  // True if a hub org username is OPTIONAL.  

  //───────────────────────────────────────────────────────────────────────────┐
  // -d --PROJECTDIR  Directory where a fully configured AppX Demo Kit (ADK)
  //                  project exists. All commands for deployment must be 
  //                  defined inside this directory.
  // -f --CONFIGFILE  Name of the config file to override the normal demo
  //                  install process with.
  //───────────────────────────────────────────────────────────────────────────┘
  protected static flagsConfig = {
    projectdir: {
      char: 'd', 
      required: false,
      type: 'directory',
      description: messages.getMessage('projectdir_FlagDescription'),
      default: '.',
      hidden: false
    },
    configfile: {
      char: 'f', 
      required: false,
      type: 'filepath',
      description: messages.getMessage('configfile_FlagDescription'),
      hidden: false
    },
    // IMPORTANT! The next line MUST be here to import the FalconDebug flags.
    ...SfdxFalconCommand.falconBaseflagsConfig
  };

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @function    run
   * @returns     {Promise<any>}  Resolves with a JSON object that the CLI will
   *              pass to the user as stdout if the --json flag was set.
   * @description Entrypoint function for "sfdx falcon:demo:deploy".
   * @version     1.0.0
   * @public @async
   */
  //───────────────────────────────────────────────────────────────────────────┘
  public async run(): Promise<any> { 

    // Initialize the SfdxFalconCommand (required by ALL classes that extend SfdxFalconCommand).
    this.sfdxFalconCommandInit('falcon:demo:deploy');

    // Instantiate an AppxDemoProject Object.
    const appxDemoProject = await AppxDemoProject.resolve(this.projectDirectory, this.configFile);
    
    // Run deployDemo().
    await appxDemoProject.deployDemo()
    .then(statusReport => {this.onSuccess(statusReport)}) // <-- Preps this.falconJsonResponse for return
    .catch(error => {this.onError(error)});               // <-- Wraps any errors and displays to user

    // Return the JSON Response that was created by onSuccess()
    return this.falconJsonResponse;
  }
}