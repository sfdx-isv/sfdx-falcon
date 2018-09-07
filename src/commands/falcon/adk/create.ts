//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @file          commands/falcon/adk/create.ts
 * @copyright     Vivek M. Chawla - 2018
 * @author        Vivek M. Chawla <@VivekMChawla>
 * @summary       Implements the CLI command "falcon:adk:create"
 * @description   Salesforce CLI Plugin command (falcon:adk:create) that allows a Salesforce DX
 *                developer to create an empty project based on the AppExchange Demo Kit (ADK)
 *                template.  Once the ADK project is created, the user is guided through an 
 *                interview where they define key ADK project settings which are then used to
 *                customize the ADK project scaffolding that gets created on their local machine.
 * @version       1.0.0
 * @license       MIT
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
// Import External Modules
import {Messages}                     from  '@salesforce/core'; // Messages library that simplifies using external JSON for string reuse.

// Import Local Modules
import {SfdxFalconYeomanCommand}      from  '../../../modules/sfdx-falcon-yeoman-command';  // Base class that CLI commands in this project that use Yeoman should use.

// Import Internal Types
import {SfdxFalconCommandType}        from  '../../../modules/sfdx-falcon-command'; // Enum. Represents the types of SFDX-Falcon Commands.


// Set the File Local Debug Namespace
//const dbgNs     = 'COMMAND:falcon-demo-create:';
//const clsDbgNs  = 'FalconDemoCreate:';

// Use SfdxCore's Messages framework to get the message bundle for this command.
Messages.importMessagesDirectory(__dirname);
const commandMessages = Messages.loadMessages('sfdx-falcon', 'falconAdkCreate');


//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @class       FalconDemoCreate
 * @extends     SfdxFalconYeomanCommand
 * @summary     Implements the CLI Command "falcon:adk:create"
 * @description The command "falcon:adk:create" creates a local AppExchange Demo Kit (ADK)
 *              project using the ADK template found at ???. Uses Yeoman to create customized ADK 
 *              project scaffolding on the user's local machine.
 * @version     1.0.0
 * @public
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
export default class FalconDemoCreate extends SfdxFalconYeomanCommand {

  // Define the basic properties of this CLI command.
  public static description = commandMessages.getMessage('commandDescription');
  public static hidden      = false;
  public static examples    = [
    `$ sfdx falcon:adk:create`,
    `$ sfdx falcon:adk:create --outputdir ~/ADK-Projects`
  ];

  // Identify the core SFDX arguments/features required by this command.
  protected static requiresProject        = false;  // True if an SFDX Project workspace is REQUIRED.
  protected static requiresUsername       = false;  // True if an org username is REQUIRED.
  protected static requiresDevhubUsername = false;  // True if a hub org username is REQUIRED.
  protected static supportsUsername       = false;  // True if an org username is OPTIONAL.
  protected static supportsDevhubUsername = false;  // True if a hub org username is OPTIONAL.
  
  //───────────────────────────────────────────────────────────────────────────┐
  // Define the flags used by this command.
  // -d --OUTPUTDIR   Directory where the AppX Demo Kit project will be created.
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
   * @description Entrypoint function for "sfdx falcon:adk:create".
   * @version     1.0.0
   * @public @async
   */
  //───────────────────────────────────────────────────────────────────────────┘
  public async run(): Promise<any> {

    // Initialize the SfdxFalconCommand (required by ALL classes that extend SfdxFalconCommand).
    this.sfdxFalconCommandInit('falcon:adk:create', SfdxFalconCommandType.APPX_DEMO);

    // Run a Yeoman Generator to interact with and run tasks for the user.
    await super.runYeomanGenerator({
      generatorType:  'create-appx-demo-project',
      outputDir:      this.outputDirectory,
      options: []
    })
    .then(statusReport  => {this.onSuccess(statusReport)})  // <-- Preps this.falconJsonResponse for return
    .catch(error        => {this.onError(error)});          // <-- Wraps any errors and displays to user

    // Return the JSON Response that was created by onSuccess()
    return this.falconJsonResponse;
  }
}