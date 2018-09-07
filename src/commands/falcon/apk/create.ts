//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @file          commands/falcon/apk/create.ts
 * @copyright     Vivek M. Chawla - 2018
 * @author        Vivek M. Chawla <@VivekMChawla>
 * @summary       Yeoman Generator for scaffolding an SFDX-Falcon project.
 * @description   Salesforce CLI Plugin command (falcon:apk:create) that allows a Salesforce DX
 *                developer to create an empty project based on the  SFDX-Falcon template.  Before
 *                the project is created, the user is guided through an interview where they define
 *                key project settings which are then used to customize the project scaffolding
 *                that gets created on their local machine.
 * @version       1.0.0
 * @license       MIT
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
// External Imports
import {Messages}                     from  '@salesforce/core'; // Messages library that simplifies using external JSON for string reuse.

// Import Internal Modules
import {SfdxFalconYeomanCommand}      from  '../../../modules/sfdx-falcon-yeoman-command';  // Base class that CLI commands in this project that use Yeoman should use.

// Import Internal Types
import {SfdxFalconCommandType}        from  '../../../modules/sfdx-falcon-command'; // Enum. Represents the types of SFDX-Falcon Commands.


// Set the File Local Debug Namespace
//const dbgNs     = 'COMMAND:falcon-apk-create:';
//const clsDbgNs  = 'FalconApkCreate:';

// Use SfdxCore's Messages framework to get the message bundle for this command.
Messages.importMessagesDirectory(__dirname);
const commandMessages = Messages.loadMessages('sfdx-falcon', 'falconApkCreate');


//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @class       FalconApkCreate
 * @extends     SfdxFalconYeomanCommand
 * @summary     Implements the CLI Command "falcon:apk:create"
 * @description The command "falcon:apk:create" creates a local SFDX project using the
 *              scaffolding found at https://github.com/sfdx-isv/sfdx-falcon-appx-package-kit.
 *              Uses Yeoman to create customized project scaffolding on the user's machine.
 * @version     1.0.0
 * @public
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
export default class FalconApkCreate extends SfdxFalconYeomanCommand {

  // Define the basic properties of this CLI command.
  public static description = commandMessages.getMessage('commandDescription');
  public static hidden      = false;
  public static examples    = [
    `$ sfdx falcon:apk:create`,
    `$ sfdx falcon:apk:create --outputdir ~/projects/sfdx-falcon-projects`
  ];

  // Identify the core SFDX arguments/features required by this command.
  protected static requiresProject        = false;  // True if an SFDX Project workspace is REQUIRED.
  protected static requiresUsername       = false;  // True if an org username is REQUIRED.
  protected static requiresDevhubUsername = false;  // True if a hub org username is REQUIRED.
  protected static supportsUsername       = false;  // True if an org username is OPTIONAL.
  protected static supportsDevhubUsername = false;  // True if a hub org username is OPTIONAL.

  //───────────────────────────────────────────────────────────────────────────┐
  // Define the flags used by this command.
  // -d --OUTPUTDIR   Directory where SFDX-Falcon project will be created.
  //                  Defaults to . (current directory) if not specified.
  //───────────────────────────────────────────────────────────────────────────┘
  protected static flagsConfig = {
    outputdir: {
      char: 'd', 
      required: false,
      type: 'directory',
      description: commandMessages.getMessage('outputdir_FlagDescription'),
      default: '.',
      hidden: false
    },

    // IMPORTANT! The next line MUST be here to import the FalconDebug flags.
    ...SfdxFalconYeomanCommand.falconBaseflagsConfig
  };

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @function    run
   * @returns     {Promise<any>}  Resolves with a JSON object that the CLI will
   *              pass to the user as stdout if the --json flag was set.
   * @description Entrypoint function for "sfdx falcon:apk:create".
   * @version     1.0.0
   * @public @async
   */
  //───────────────────────────────────────────────────────────────────────────┘
  public async run(): Promise<any> {

    // Initialize the SfdxFalconCommand (required by ALL classes that extend SfdxFalconCommand).
    this.sfdxFalconCommandInit('falcon:apk:create', SfdxFalconCommandType.APPX_PACKAGE);

    // Run a Yeoman Generator to interact with and run tasks for the user.
    await super.runYeomanGenerator({
      generatorType:    'create-appx-package-project',
      gitRemoteUri:     this.gitRemoteUri,
      outputDir:        this.outputDirectory,
      options: []
    })
    .then(statusReport  => {this.onSuccess(statusReport)})  // <-- Preps this.falconJsonResponse for return
    .catch(error        => {this.onError(error)});          // <-- Wraps any errors and displays to user

    // Return the JSON Response that was created by onSuccess()
    return this.falconJsonResponse;
  }
}