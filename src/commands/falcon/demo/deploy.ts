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
import {core, SfdxCommand}      from  '@salesforce/command';                // Allows us to use the Messages Library from core.
import {flags}                  from  '@oclif/command';                     // Requried to create CLI command flags.
import * as path                from  'path';                               // Helps resolve local paths at runtime.
import {validateLocalPath}      from  '../../../validators/core-validator'; // Core validation function to check that local path values don't have invalid chars.
import {AdkProject}             from  '../../../helpers/adk-helper';        // Provides information and actions related to an ADK project
import {FalconStatusReport}     from  '../../../helpers/falcon-helper';     // Why?

// Requires
const debug = require('debug')('falcon:demo:deploy');                       // Utility for debugging. set debug.enabled = true to turn on.


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
 * @extends     SfdxCommand
 * @access      public
 * @version     1.0.0
 * @summary     Implements the CLI Command falcon:demo:deploy
 * @description TODO ????
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
// TODO: We may not need to use Yeoman for the deploy command
export default class FalconDemoClone extends SfdxCommand {
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

    // Set the debug mode based on the caller's debugModeFlag setting.
    debug.enabled = debugModeFlag;
  
    // Make sure that deployDirFlag has a valid local path
    if (validateLocalPath(deployDirFlag) === false) {
      throw new Error('Deploy Directory can not begin with a ~, have unescaped spaces, or contain these invalid characters (\' \" * |)');
    }

    //─────────────────────────────────────────────────────────────────────────┐
    // Instantiate an AdkProject Object.
    //─────────────────────────────────────────────────────────────────────────┘
    const adkProject = await AdkProject.resolve(path.resolve(deployDirFlag), debugModeFlag);
    
    // Validate the demo
    const statusReport = await adkProject.validateDemo() as FalconStatusReport;

    debug(`statusReport.getStartTime(): %s`,  statusReport.getStartTime(true));
    debug(`statusReport.getEndTime():   %s`,  statusReport.getEndTime(true));
    debug(`statusReport.getRunTime():   %s`,  statusReport.getRunTime(true));
    debug(`statusReport.statusMessage:  %O`,  statusReport.statusMessage);
    debug(`statusReport.statusLog:      %O`,  statusReport.statusLog);

//    debug(`adkProject.projectPath: %s`, adkProject.projectPath);
//    debug(`adkProject.targetOrgAlias: %s`, adkProject.targetOrgAlias);
//    debug(`adkProject.sfdxProjectConfig: \n%O`, adkProject.sfdxProjectConfig);
//    debug(`adkProject.sfdxProjectConfig.plugins.sfdxFalcon: \n%O`, adkProject.sfdxProjectConfig.plugins.sfdxFalcon);

    //─────────────────────────────────────────────────────────────────────────┐
    // ???
    //─────────────────────────────────────────────────────────────────────────┘

    //─────────────────────────────────────────────────────────────────────────┐
    // ???
    // Provide some sort of output
    //─────────────────────────────────────────────────────────────────────────┘
    

    //─────────────────────────────────────────────────────────────────────────┐
    // ???
    // Construct some sort of response.
    // Return empty JSON since this is meant to be a human-readable command only.
    //─────────────────────────────────────────────────────────────────────────┘
    return {};
  }
}