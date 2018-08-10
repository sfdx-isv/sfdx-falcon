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
 *                of a fully-configured AppExchange Demo Kit (ADK) project.  Uses project and local
 *                settings from various JSON config files and uses them to power an Org Build 
 *                based on the SFDX Falcon Recipe selected by the user.
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
// Imports
import {SfdxCommand}                  from  '@salesforce/command';                  // The CLI command we build must extend this class.
import {Messages}                     from  '@salesforce/core';                     // Messages library that simplifies using external JSON for string reuse.
import {flags}                        from  '@oclif/command';                       // Requried to create CLI command flags.
import * as path                      from  'path';                                 // Helps resolve local paths at runtime.
import {AppxDemoProject}              from  '../../../helpers/appx-demo-helper';    // Provides information and actions related to an ADK project
import {validateLocalPath}            from  '../../../modules/sfdx-falcon-validators';   // Core validation function to check that local path values don't have invalid chars.

import {SfdxFalconJsonResponse}       from  '../../../modules/sfdx-falcon-types';   // Why?
import {SfdxFalconDebug}              from  '../../../modules/sfdx-falcon-debug';   // Why?
import {SfdxFalconError}              from  '../../../modules/sfdx-falcon-error';   // Why?
import {SfdxFalconStatus}             from  '../../../modules/sfdx-falcon-status';  // Why?
import {SfdxFalconCommand}            from  '../../../modules/sfdx-falcon-command'; // Why?

// Use SfdxCore's Messages framework to get the message bundle for this command.
Messages.importMessagesDirectory(__dirname);
const messages      = Messages.loadMessages('sfdx-falcon', 'falconDemoInstall');
const errorMessages = Messages.loadMessages('sfdx-falcon', 'sfdxFalconError');



// DEVTEST

import {SfdxFalconRecipe}       from '../../../modules/sfdx-falcon-recipe';
import {CreateScratchOrgAction} from '../../../modules/sfdx-falcon-recipe/engines/appx/actions/create-scratch-org';
import {SfdxCliLogLevel}        from '../../../modules/sfdx-falcon-types';           // Why?

// DEVTEST







//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @class       FalconDemoInstall
 * @extends     SfdxFalconCommand
 * @summary     Implements the CLI Command falcon:demo:install
 * @description TODO ????
 * @version     1.0.0
 * @public
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
export default class FalconDemoInstall extends SfdxFalconCommand {

  // Define the basic properties of this CLI command.
  public static description = messages.getMessage('commandDescription');
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

    // Initialize the SfdxFalconCommand base.
    this.sfdxFalconCommandInit('falcon:demo:install');


    // DEVTEST
    /*
    let myStepContext = {
      devHubAlias:        ``,
      targetOrgAlias:     ``,
      targetIsScratchOrg: false,
      projectPath:        ``,
      configPath:         ``,
      mdapiSourcePath:    ``,
      dataPath:           '',
      logLevel:           SfdxCliLogLevel.DEBUG,
      recipeObserver:     null,
      stepObserver:       null,
      stepGroupObserver:  null
    };
    let myStepOptions = {
      customOptionOne: 'Hooray',
      customOptionsTwo: 'Boo'
    };
    let myAction = new CreateScratchOrg(myStepContext, myStepOptions);
    //*/
    
    let recipeTest = await SfdxFalconRecipe.read('/Users/vchawla/git/ADK-projects/cloned/adk-project-1', 'demo-config', 'alternate-demo-config.json');

    let compileOptions = {
//      targetOrgAlias:'fscdrivewealth-scratch-org-demo',
      optionOne: 'DEVTEST',
      optionsTwo: 'DEV222TEST',
      devHubAlias:  'PBO_DevHub'
    }

    let compiledRecipe = await recipeTest.compile(compileOptions);
    SfdxFalconDebug.obj('FALCON:DEVTEST', recipeTest, 'DEVTEST:compiledRecipe');

    return {};





    // Instantiate an AppxDemoProject Object.
    const appxDemoProject = await AppxDemoProject.resolve(path.resolve(this.projectDirectory), this.configFile);
    
    // Take the main action for this command. Success and errors handled by parent class.
    await appxDemoProject.deployDemo()
      .then(statusReport => {this.onSuccess(statusReport)})
      .catch(error => {this.onError(error)});

    // The JSON Response was populated in onSuccess(). Just need to return now.
    return this.falconJsonResponse;
  }

} // End of Class FalconDemoInstall