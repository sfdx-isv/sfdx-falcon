//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @file          commands/falcon/apk/clone.ts
 * @copyright     Vivek M. Chawla - 2018
 * @author        Vivek M. Chawla <@VivekMChawla>
 * @summary       Implements the CLI command "falcon:apk:clone"
 * @description   Salesforce CLI Plugin command (falcon:apk:clone) that allows a Salesforce DX
 *                developer to clone an existing project based on the SFDX-Falcon template.  After
 *                the project code is cloned, the user is taken through an interview to help set up
 *                developer-specific project variables.
 * @version       1.0.0
 * @license       MIT
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
// Import External Modules
import {flags}                        from  '@salesforce/command';  // Allows creation of flags for CLI commands.
import {Messages}                     from  '@salesforce/core';     // Messages library that simplifies using external JSON for string reuse.

// Import Internal Modules
import {SfdxFalconYeomanCommand}      from  '../../../modules/sfdx-falcon-yeoman-command';  // Base class that CLI commands in this project that use Yeoman should use.

// Import Internal Types
import {SfdxFalconCommandType}        from  '../../../modules/sfdx-falcon-command'; // Enum. Represents the types of SFDX-Falcon Commands.


// Set the File Local Debug Namespace
//const dbgNs     = 'COMMAND:falcon-apk-clone:';
//const clsDbgNs  = 'FalconApkClone:';

// Use SfdxCore's Messages framework to get the message bundle for this command.
Messages.importMessagesDirectory(__dirname);
const baseMessages    = Messages.loadMessages('sfdx-falcon', 'sfdxFalconCommand');
const commandMessages = Messages.loadMessages('sfdx-falcon', 'falconApkClone');

//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @class       FalconApkClone
 * @extends     SfdxFalconYeomanCommand
 * @summary     Implements the CLI Command "falcon:apk:clone"
 * @description The command "falcon:apk:clone" allows a Salesforce DX developer to clone an
 *              existing project based on the SFDX-Falcon template.  After the project is cloned,
 *              the user is taken through an interview to help set up developer-specific project
 *              variables.
 * @version     1.0.0
 * @public
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
export default class FalconApkClone extends SfdxFalconYeomanCommand {

  // Define the basic properties of this CLI command.
  public static description = commandMessages.getMessage('commandDescription');
  public static hidden      = false;
  public static examples    = [
    `$ sfdx falcon:apk:clone git@github.com:GitHubUser/my-repository.git`,
    `$ sfdx falcon:apk:clone https://github.com/GitHubUser/my-repository.git MyRepoDirName`,
    `$ sfdx falcon:apk:clone https://github.com/GitHubUser/my-repository.git MyRepoDirName \\\n` +
    `                      --outputdir ~/projects/appexchange-package-kit-projects`
  ];

  // Identify the core SFDX arguments/features required by this command.
  protected static requiresProject        = false;  // True if an SFDX Project workspace is REQUIRED.
  protected static requiresUsername       = false;  // True if an org username is REQUIRED.
  protected static requiresDevhubUsername = false;  // True if a hub org username is REQUIRED.
  protected static supportsUsername       = false;  // True if an org username is OPTIONAL.
  protected static supportsDevhubUsername = false;  // True if a hub org username is OPTIONAL.
  
  //───────────────────────────────────────────────────────────────────────────┐
  // Define the ARGUMENTS used by this command. 
  // Position 1 (GIT_REMOTE_URI)  - URI of the git repository being cloned.
  // Position 2 (GIT_CLONE_DIR)   - Name of the locally cloned repo directory.
  //───────────────────────────────────────────────────────────────────────────┘
  public static args = [
    {
      name: 'GIT_REMOTE_URI',
      description: baseMessages.getMessage('gitRemoteUri_ArgDescription'),
      required: true,
      hidden: false
    },
    {
      name: 'GIT_CLONE_DIR',
      description: baseMessages.getMessage('gitCloneDir_ArgDescription'),
      required: false,
      hidden: false
    }
  ];

  //───────────────────────────────────────────────────────────────────────────┐
  // Define the FLAGS used by this command.
  // -d --OUTPUTDIR   Directory where AppX Demo Kit (ADK) project will be cloned
  //                  to.  Defaults to . (current directory) is not specified.
  //───────────────────────────────────────────────────────────────────────────┘
  protected static flagsConfig = {
    outputdir: flags.directory({
      char: 'd', 
      required: false,
      description: commandMessages.getMessage('outputdir_FlagDescription'),
      default: '.',
      hidden: false
    }),

    // IMPORTANT! The next line MUST be here to import the FalconDebug flags.
    ...SfdxFalconYeomanCommand.falconBaseflagsConfig
  };

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @function    run
   * @returns     {Promise<any>}  Resolves with a JSON object that the CLI will
   *              pass to the user as stdout if the --json flag was set.
   * @description Entrypoint function for "sfdx falcon:apk:clone".
   * @version     1.0.0
   * @public @async
   */
  //───────────────────────────────────────────────────────────────────────────┘
  public async run(): Promise<any> {

    // Initialize the SfdxFalconCommand (required by ALL classes that extend SfdxFalconCommand).
    this.sfdxFalconCommandInit('falcon:apk:clone', SfdxFalconCommandType.APPX_PACKAGE);

    // Run a Yeoman Generator to interact with and run tasks for the user.
    await super.runYeomanGenerator({
      generatorType:    'clone-appx-package-project',
      gitRemoteUri:     this.gitRemoteUri,
      outputDir:        this.outputDirectory,
      gitCloneDir:      this.gitCloneDirectory,
      options: []
    })
    .then(statusReport  => {this.onSuccess(statusReport)})  // <-- Preps this.falconJsonResponse for return
    .catch(error        => {this.onError(error)});          // <-- Wraps any errors and displays to user

    // Return the JSON Response that was created by onSuccess()
    return this.falconJsonResponse;
  }
}