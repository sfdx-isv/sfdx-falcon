//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @file          commands/falcon/demo/clone.ts
 * @copyright     Vivek M. Chawla - 2018
 * @author        Vivek M. Chawla <@VivekMChawla>
 * @version       1.0.0
 * @license       MIT
 * @requires      module:validators/core
 * @summary       Implements the falcon:demo:clone CLI command
 * @description   Salesforce CLI Plugin command (falcon:demo:clone) that allows a Salesforce DX
 *                developer to clone an existing AppExchange Demo Kit (ADK) based project. After
 *                the ADK project code is cloned, the user is taken through an interview to help
 *                set up developer-specific project variables.
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
const messages = core.Messages.loadMessages('sfdx-falcon', 'falconDemoClone');

//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @class       FalconDemoClone
 * @extends     SfdxYeomanCommand
 * @access      public
 * @version     1.0.0
 * @summary     Implements the CLI Command falcon:demo:clone
 * @description Extends SfdxYeomanCommand, which itself extends SfdxCommand.  Implements the CLI
 *              Command falcon:demo:clone. This command allows a Salesforce DX developer to
 *              clone an existing project based on the AppExchange Demo Kit (ADK) template.  After
 *              the project code is cloned, the user is taken through an interview to help set up 
 *              developer-specific project variables.
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
export default class FalconDemoClone extends SfdxYeomanCommand {
  //───────────────────────────────────────────────────────────────────────────┐
  // Set command-level properties.
  //───────────────────────────────────────────────────────────────────────────┘
  public static description = messages.getMessage('commandDescription');
  public static hidden      = false;
  public static examples    = [
    `$ sfdx falcon:demo:clone git@github.com:GitHubUser/my-repository.git`,
    `$ sfdx falcon:demo:clone https://github.com/GitHubUser/my-repository.git`,
    `$ sfdx falcon:demo:clone https://github.com/GitHubUser/my-repository.git \\
                           --outputdir ~/demos/appexchange-demo-kit-projects`
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
  // -d --OUTPUTDIR   Directory where AppX Demo Kit (ADK) project will be cloned
  //                  to.  Defaults to . (current directory) is not specified.
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
  // Implement the run() function (this is what powers the SFDX command)
  //───────────────────────────────────────────────────────────────────────────┘
  public async run(): Promise<any> { // tslint:disable-line:no-any

    // Grab values from CLI command arguments.
    const gitRemoteUriArg = this.args.GIT_REMOTE_URI;

    // Grab values from CLI command flags.  Set defaults for optional flags not set by user.
    const outputDirFlag = this.flags.outputdir  ||  '.';
    const debugModeFlag = this.flags.falcondebug || false;

    // Make sure that outputFirFlag has a valid local path
    if (validateLocalPath(outputDirFlag) === false) {
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
    // load and execute the Yeoman Generator defined in clone-falcon-project.ts.
    // All user interactions for the rest of this command will come from Yeoman,
    // so there is no need to run anything after this call returns.
    //─────────────────────────────────────────────────────────────────────────┘
    await super.runYeomanGenerator('clone-falcon-demo', {
      commandName:      'falcon:demo:clone',
      generatorStatus:  generatorStatus,
      gitRemoteUri:     gitRemoteUriArg,
      outputDir:        outputDirFlag,
      debugMode:        debugModeFlag,
      options: []
    })

    // Print all status messages for the user.
    generatorStatus.printStatusMessages();

    // Return empty JSON since this is meant to be a human-readable command only.
    return {};
  }
}