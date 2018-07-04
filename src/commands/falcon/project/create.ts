//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @file          commands/falcon/project/create.ts
 * @copyright     Vivek M. Chawla - 2018
 * @author        Vivek M. Chawla <@VivekMChawla>
 * @version       1.0.0
 * @license       MIT
 * @requires      module:oclif/command
 * @requires      module:salesforce/command
 * @requires      ../../../yeoman-command-base
 * @requires      ../../../../messages/create
 * @summary       Yeoman Generator for scaffolding an SFDX-Falcon project.
 * @description   Salesforce CLI Plugin command (falcon:project:create) that allows a Salesforce DX
 *                developer to create an empty project based on the  SFDX-Falcon template.  Before
 *                the project is created, the user is guided through an interview where they define
 *                key project settings which are then used to customize the project scaffolding
 *                that gets created on their local machine.
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
// Imports
import {core}                   from  '@salesforce/command';             // Salesforce CLI core library
import {flags}                  from  '@oclif/command';                  // Allows us to define our own custom flags for this command.
import {GeneratorStatus}        from  '../../../helpers/yeoman-helper'; // Helper object to get status back from Generators after they run.
import SfdxYeomanCommand        from  '../../../sfdx-yeoman-command';    // Required because this CLI command will launch a Yeoman Generator.
import {validateLocalPath}      from  '../../../validators/core';       // Core validation function to check that local path values don't have invalid chars.

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
const messages = core.Messages.loadMessages('sfdx-falcon', 'falconProjectCreate');

//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @class       FalconProjectCreate
 * @extends     SfdxYeomanCommand
 * @access      public
 * @version     1.0.0
 * @summary     Implements the CLI Command falcon:project:clone
 * @description Extends SfdxYeomanCommand, which itself extends SfdxCommand.  Implements the CLI
 *              Command falcon:project:create. This command creates a local SFDX project using 
 *              the SFDX-Falcon Template found at https://github.com/sfdx-isv/sfdx-falcon-template.
 *              Starts a Yeoman interview process to create customized project scaffolding on the
 *              user's machine.
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
export default class FalconProjectCreate extends SfdxYeomanCommand {

  //───────────────────────────────────────────────────────────────────────────┐
  // Set command-level properties.
  //───────────────────────────────────────────────────────────────────────────┘
  public static description = messages.getMessage('commandDescription');
  public static hidden      = false;
  public static examples    = [
    `$ sfdx falcon:project:create`,
    `$ sfdx falcon:project:create --outputdir ~/projects/sfdx-falcon-projects`
  ];
  
  //───────────────────────────────────────────────────────────────────────────┐
  // Define the flags used by this command.
  // -d --OUTPUTDIR   Directory where SFDX-Falcon project will be created.
  //                  Defaults to . (current directory) if not specified.
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

    // Grab values from CLI command flags.  Set defaults for optional flags not set by user.
    const outputdirFlag = this.flags.outputdir    ||  '.';
    const debugModeFlag = this.flags.falcondebug  ||  false;

    // Make sure that outputFirFlag has a valid local path
    if (validateLocalPath(outputdirFlag) === false) {
      throw new Error('Target Directory can not begin with a ~, have unescaped spaces, or contain these invalid characters (\' \" * |)');
    }

    //─────────────────────────────────────────────────────────────────────────┐
    // Declare and initialize a GeneratorStatus object. This will let us get
    // status messages back from the Yeoman Generator and we can display them
    // to the user once the Generator completes it's run.
    //─────────────────────────────────────────────────────────────────────────┘
    let generatorStatus = new GeneratorStatus();

    //─────────────────────────────────────────────────────────────────────────┐
    // Make an async call to the base object's generate() funtion.  This will
    // load and execute the Yeoman Generator defined in create-falcon-project.ts.
    // All user interactions for the rest of this command will come from Yeoman,
    // so there is no need to run anything after this call returns.
    //─────────────────────────────────────────────────────────────────────────┘
    await super.runYeomanGenerator('create-falcon-project', {
      commandName:      'falcon:project:create',
      generatorStatus:  generatorStatus,
      outputDir:        outputdirFlag,
      debugMode:        debugModeFlag,
      options: []
    })

    // Print all status messages for the user.
    generatorStatus.printStatusMessages();

    // Return empty JSON since this is meant to be a human-readable command only.
    return { };
  }
}