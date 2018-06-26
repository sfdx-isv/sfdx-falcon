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
import {flags}              from '@oclif/command';                  // Allows us to define our own custom flags for this command.
import {core}               from '@salesforce/command';             // Salesforce CLI core library
import SfdxYeomanCommand    from '../../../sfdx-yeoman-command';    // Required because this CLI command will launch a Yeoman Generator.

//─────────────────────────────────────────────────────────────────────────────┐
// SFDX Core library has the ability to import a JSON file with message strings
// making it easy to separate logic from static output messages. The file
// referenced by the second parameter of loadMessages() must be found in the
// messages directory at the root of your project.
//─────────────────────────────────────────────────────────────────────────────┘
core.Messages.importMessagesDirectory(__dirname);
const messages = core.Messages.loadMessages('sfdx-falcon', 'falconProjectCreate');

//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @class       Create
 * @extends     SfdxYeomanCommand
 * @access      public
 * @version     1.0.0
 * @summary     SFDX CLI Command Class (falcon:project:create).
 * @description Creates a local SFDX project using the SFDX-Falcon Template.  Starts a Yeoman 
 *              interview process to create customized project scaffolding on the user's machine.
 *              This class extends SfdxYeomanCommand, which itself extends SfdxCommand.
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
export default class Create extends SfdxYeomanCommand {

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
  //───────────────────────────────────────────────────────────────────────────┘
  protected static flagsConfig = {
    outputdir: flags.string({
      char: 'd', 
      description: messages.getMessage('outputdirFlagDescription')
    }),
    falcondebug: flags.boolean({
      description: messages.getMessage('falcondebugFlagDescription'),
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

    // Grab values from flags.  Set defaults for optional flags not set by user.
    const outputdirFlag = this.flags.outputdir    ||  '.';
    const debugModeFlag = this.flags.falcondebug  ||  false;

    //─────────────────────────────────────────────────────────────────────────┐
    // Make an async call to the base object's generate() funtion.  This will
    // load and execute the Yeoman Generator defined in appx-project.ts.  All
    // user interactions for the rest of this command will come from Yeoman, so
    // there is no need to run anything after this call returns.
    //─────────────────────────────────────────────────────────────────────────┘
    await super.generate('create-falcon-project', {
      commandName:  'falcon:project:create',
      outputdir:    outputdirFlag,
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