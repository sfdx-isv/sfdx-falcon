//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @file          commands/falcon/project/clone.ts
 * @copyright     Vivek M. Chawla - 2018
 * @author        Vivek M. Chawla <@VivekMChawla>
 * @version       1.0.0
 * @license       MIT
 * @requires      module:validators/core
 * @summary       Implements the falcon:project:clone CLI command
 * @description   Salesforce CLI Plugin command (falcon:project:clone) that allows a Salesforce DX
 *                developer to clone an existing project based on the SFDX-Falcon template.  After
 *                the project code is cloned, the user is taken through an interview to help set up
 *                developer-specific project variables.
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
// Imports
import {flags}              from '@oclif/command';                  // Why?
import {core}               from '@salesforce/command';             // Why?
import * as gitHelper       from '../../../helpers/git-helper';     // Why?
import SfdxYeomanCommand    from '../../../sfdx-yeoman-command';    // Why?

// Requires
const shell           = require('shelljs');                                 // Cross-platform shell access - use for setting up Git repo.
const debug           = require('debug')('falcon:project:clone');

// Initialize Messages with the current plugin directory
core.Messages.importMessagesDirectory(__dirname);

// Load the specific messages for this file. Messages from @salesforce/command, @salesforce/core,
// or any library that is using the messages framework can also be loaded this way.
const messages = core.Messages.loadMessages('sfdx-falcon', 'falconProjectClone');


//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @class       FalconProjectClone
 * @extends     SfdxYeomanCommand
 * @access      public
 * @version     1.0.0
 * @summary     Implements the CLI Command falcon:project:clone
 * @description Extends SfdxYeomanCommand, which itself extends SfdxCommand.  Implements the CLI
 *              Command falcon:project:clone. This command allows a Salesforce DX developer to
 *              clone an existing project based on the SFDX-Falcon template.  After the project 
 *              code is cloned, the user is taken through an interview to help set up 
 *              developer-specific project variables.
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
export default class FalconProjectClone extends SfdxYeomanCommand {
  //───────────────────────────────────────────────────────────────────────────┐
  // Set command-level properties.
  //───────────────────────────────────────────────────────────────────────────┘
  public static description = messages.getMessage('commandDescription');
  public static hidden      = false;
  public static examples    = [
    `$ sfdx falcon:project:clone git@github.com:GitHubUser/my-repository.git`,
    `$ sfdx falcon:project:clone https://github.com/GitHubUser/my-repository.git`,
    `$ sfdx falcon:project:clone https://github.com/GitHubUser/my-repository.git \\
                           --outputdir ~/projects/sfdx-falcon-projects`
  ];
  
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
  // -d --OUTPUTDIR   Directory where SFDX-Falcon project will be cloned to.
  //                  Defaults to . (current directory) is not specified.
  //    --FALCONDEBUG Indicates that the command should run in DEBUG mode.
  //                  Defaults to FALSE if not specified by the user.
  //───────────────────────────────────────────────────────────────────────────┘
  protected static flagsConfig = {
    outputdir: flags.string({
      char: 'd', 
      description: messages.getMessage('outputdirFlagDescription'),
      default: '.',
      required: false,
      hidden: false
    }),
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
  // Implement the run() function (this is what actually powers the command)
  //───────────────────────────────────────────────────────────────────────────┘
  public async run(): Promise<any> { // tslint:disable-line:no-any

    // Grab values from arguments.
    const gitRemoteUriArg = this.args.GIT_REMOTE_URI;

    // Check if the Git Remote is reachable, readable, and not empty.
//    if (gitHelper.isGitRemoteEmpty(gitRemoteUriArg) === true) {
//      throw new Error(`Remote repository "${gitRemoteUriArg}" is empty or unreachable.`)
//    }

    // Grab values from flags.  Set defaults for optional flags not set by user.
    const outputDirFlag = this.flags.outputdir  ||  '.';
    const debugModeFlag = this.flags.falcondebug || false;

    //─────────────────────────────────────────────────────────────────────────┐
    // Make an async call to the base object's generate() funtion.  This will
    // load and execute the Yeoman Generator defined in clone-falcon-project.ts.
    // All user interactions for the rest of this command will come from Yeoman,
    // so there is no need to run anything after this call returns.
    //─────────────────────────────────────────────────────────────────────────┘
    await super.generate('clone-falcon-project', {
      commandName:  'falcon:project:clone',
      gitRemoteUri: gitRemoteUriArg,
      outputDir:    outputDirFlag,
      debugMode:    debugModeFlag,
      options: []
    });

    // TODO: It would be nice if we could somehow get information BACK from
    // the call to super.generate(). Interview questions from the generator
    // would be great for this.

    // Return empty JSON.
    return { };
  }
}