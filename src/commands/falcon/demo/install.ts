//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @file          commands/falcon/demo/install.ts
 * @copyright     Vivek M. Chawla - 2018
 * @author        Vivek M. Chawla <@VivekMChawla>
 * @version       1.0.0
 * @license       MIT
 * @requires      module:???
 * @summary       Implements the falcon:demo:install CLI command
 * @description   Salesforce CLI Plugin command (falcon:demo:install) that is expected to run inside
 *                of a fully-configured AppExchange Demo Kit (ADK) project.  Takes project and local
 *                settings from various JSON config files and uses them to power an Org Build 
 *                based on the SFDX Falcon Recipe selected by the user.
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
// Import External Modules
//import {SfdxCommand}                  from  '@salesforce/command';  // The CLI command we build must extend this class.
import {Messages}                     from  '@salesforce/core';     // Messages library that simplifies using external JSON for string reuse.
//import {flags}                        from  '@oclif/command';       // Requried to create CLI command flags.
import * as path                      from  'path';                 // Helps resolve local paths at runtime.

// Import Local Modules
import {SfdxFalconCommand}            from  '../../../modules/sfdx-falcon-command'; // Why?
import {SfdxFalconProject}            from  '../../../modules/sfdx-falcon-project'; // Why?
//import {SfdxFalconDebug}              from  '../../../modules/sfdx-falcon-debug';   // Why?
//import {SfdxFalconError}              from  '../../../modules/sfdx-falcon-error';   // Why?
//import {SfdxFalconStatus}             from  '../../../modules/sfdx-falcon-status';  // Why?
//import {SfdxFalconJsonResponse}       from  '../../../modules/sfdx-falcon-types';   // Why?
//import {validateLocalPath}            from  '../../../modules/sfdx-falcon-validators';  // Core validation function to check that local path values don't have invalid chars.

//import {SfdxFalconRecipe}             from '../../../modules/sfdx-falcon-recipe';
//import {CreateScratchOrgAction}       from '../../../modules/sfdx-falcon-recipe/engines/appx/actions/create-scratch-org';
//import {SfdxCliLogLevel}              from '../../../modules/sfdx-falcon-types';           // Why?

// Use SfdxCore's Messages framework to get the message bundles for this command.
Messages.importMessagesDirectory(__dirname);
const baseMessages    = Messages.loadMessages('sfdx-falcon', 'sfdxFalconCommand');
const commandMessages = Messages.loadMessages('sfdx-falcon', 'falconDemoInstall');
//const errorMessages   = Messages.loadMessages('sfdx-falcon', 'sfdxFalconError');


//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @class       FalconDemoInstall
 * @extends     SfdxFalconCommand
 * @summary     Implements the CLI Command falcon:demo:install
 * @description Reads an SFDX-Falcon Recipe (either the one specified as the project default inside
 *              sfdx-project.json or one specified at the command line) and uses the resulting
 *              compiled Recipe to perform a set of tasks that should result in a demo org being
 *              built to the specifications of the SFDX Falcon Recipe.
 * @version     1.0.0
 * @public
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
export default class FalconDemoInstall extends SfdxFalconCommand {

  // Define the basic properties of this CLI command.
  public static description = commandMessages.getMessage('commandDescription');
  public static hidden      = false;
  public static examples    = [
    `$ sfdx falcon:demo:install`,
    `$ sfdx falcon:demo:install --projectdir ~/demos/adk-projects/my-adk-project`,
    `$ sfdx falcon:demo:install --projectdir ~/demos/adk-projects/my-adk-project \\\n` + 
    `                          --configfile my-alternate-demo-config.json`
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
      description: baseMessages.getMessage('projectdir_FlagDescription'),
      default: '.',
      hidden: false
    },
    configfile: {
      char: 'f', 
      required: false,
      type: 'filepath',
      description: baseMessages.getMessage('configfile_FlagDescription'),
      hidden: false
    },
    extendedoptions: {
      char: 'x', 
      required: false,
      type: 'string',
      description: baseMessages.getMessage('extendedoptions_FlagDescription'),
      default: '{}',
      hidden: false
    },
    
    // IMPORTANT! The next line MUST be here to import the FalconDebug flags.
    ...SfdxFalconCommand.falconBaseflagsConfig
  };

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @function    run
   * @returns     {Promise<any>}  This should resolve by returning a JSON object
   *              that the CLI will then forward to the user if the --json flag
   *              was set when this command was called.
   * @description Entrypoint function used by the CLI when the user wants to
   *              run the command 'sfdx falcon:demo:install'.
   * @version     1.0.0
   * @public @async
   */
  //───────────────────────────────────────────────────────────────────────────┘
  public async run(): Promise<any> { 

    // Initialize the SfdxFalconCommand base (DO NOT REMOVE THIS LINE OF CODE!)
    this.sfdxFalconCommandInit('falcon:demo:install');

    // Resolve the Project Directory (specified by the user) to a Project Path.
    let projectPath = path.resolve(this.projectDirectory)

    // Instantiate the SFDX-Falcon Project residing at the Project Path.
    const sfdxFalconProject = await SfdxFalconProject.resolve(projectPath);
    
    // If the user passed any Extended Options, use them as Compile Options.
    let compileOptions = this.extendedOptions;

    // Run the Default Recipe as specified by the project.
    await sfdxFalconProject.runDefaultRecipe(compileOptions)
      .then(recipeResult => {this.onSuccess(recipeResult)})   // Implemented by parent class
      .catch(error => {this.onError(error)});                 // Implemented by parent class

    // Return the JSON Response that was populated by onSuccess().
    return this.falconJsonResponse;
  }
} // End of Class FalconDemoInstall