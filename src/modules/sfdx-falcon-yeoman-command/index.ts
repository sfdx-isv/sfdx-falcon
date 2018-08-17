//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @file          modules/sfdx-falcon-yeoman-command/index.ts
 * @copyright     Vivek M. Chawla - 2018
 * @author        Vivek M. Chawla <@VivekMChawla>
 * @summary       Exports SfdxFalconYeomanCommand for use with custom Salesforce CLI commands.
 * @description   Exports an abstract class that adds support for running a Yeoman Generator inside
 *                of custom-built Salesforce CLI commands.
 * @version       1.0.0
 * @license       MIT
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
// Imports
import {SfdxFalconCommand}      from  '../sfdx-falcon-command'; // Abstract Class. Custom SFDX-Falcon base class for SFDX Commands.
import {SfdxFalconCommandType}  from  '../sfdx-falcon-command'; // Enum. Represents the types of SFDX-Falcon Commands.
import {GeneratorStatus}        from  './yeoman-helper';        // Helper object to get status back from Generators after they run.

// Requires
const yeoman  = require('yeoman-environment');      // Required to create a Yeoman Environment

//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @class       SfdxFalconYeomanCommand
 * @extends     SfdxFalconCommand
 * @summary     Abstract base class class for building Salesforce CLI commands that use Yeoman.
 * @description Classes that extend SfdxYeomanCommand will be able to run any Generator defined
 *              in the src/generators directory.  The file name in src/generators should match the 
 *              generatorType string passed into runYeomanGenerator().  For example, if 
 *              generatorType==="my-generator", then there MUST be a TS script file located at 
 *              src/generators/my-generator.ts.
 * @version     1.0.0
 * @public @abstract
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
export abstract class SfdxFalconYeomanCommand extends SfdxFalconCommand {

  // Define Yeoman-specific members (on top of what's in SfdxFalconCommand).
  protected generatorStatus:GeneratorStatus;

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @function    runYeomanGenerator
   * @param       {string}  generatorType     Required. ???
   * @param       {object}  generatorOptions  Required. ???
   * @returns     {Promise<any>}  ???
   * @description Runs the specified Yeoman generator using the given options.
   * @version     1.0.0
   * @protected @async
   */
  //───────────────────────────────────────────────────────────────────────────┘
  protected async runYeomanGenerator(generatorOptions:any) {

    // Add any incoming generatorOptions to the standard defaults
    let resolvedGeneratorOptions = {
      // Default options
      commandName:      this.falconCommandName,
      generatorStatus:  this.generatorStatus,
      options: [],
      // User options
      ...generatorOptions
    }

    // Pull the generator type out of the options.
    let generatorType = resolvedGeneratorOptions.generatorType;

    // Create a Yeoman environment.
    const yeomanEnv = yeoman.createEnv();

    // Register a generator with the Yeoman environment, based on generatorType.
    yeomanEnv.register(
      require.resolve(`../../generators/${generatorType}`),
      `sfdx-falcon:${generatorType}`
    );

    // Run the Yeoman Generator
    return new Promise((resolve, reject) => {
      yeomanEnv.run(`sfdx-falcon:${generatorType}`, resolvedGeneratorOptions, (results:any) => {
        resolve(results);
      });
    });
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @function    sfdxFalconCommandInit
   * @param       {string}  commandName Required. ???
   * @param       {SfdxFalconCommandType} commandType Required. ???
   * @returns     {void}
   * @description Initializes various SfdxFalconYeomandCommand structures before
   *              calling the same init function from SfdxFalconCommand.
   * @version     1.0.0
   * @protected
   */
  //───────────────────────────────────────────────────────────────────────────┘
  protected sfdxFalconCommandInit(commandName:string='UNSPECIFIED_FALCON_YEOMAN_COMMAND', commandType:SfdxFalconCommandType):void {

    // Initialize the Generator Status object.
    this.generatorStatus = new GeneratorStatus();
    
    // Now call the core init function in the parent class.
    super.sfdxFalconCommandInit(commandName, commandType);
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @function    onError
   * @param       {any}   error Required. ???
   * @returns     {void}
   * @description ???
   * @version     1.0.0
   * @protected
   */
  //───────────────────────────────────────────────────────────────────────────┘
  protected onError(error:any) {
    super.onError(error);

    // TODO: Implement special onError logic for an SfdxFalconYeomanCommand.
    
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @function    onSuccess
   * @param       {SfdxFalconStatus}  statusReport
   * @returns     {void}  
   * @description ???
   * @version     1.0.0
   * @private
   */
  //───────────────────────────────────────────────────────────────────────────┘
  protected onSuccess(statusReport:any):void {
    this.generatorStatus.printStatusMessages();
  }
}

/**
* ─────────────────────────────────────────────────────────────────────────────────────────────────┐
* Notes on Yeoman Generators:
* "Generators" are specialized TS classes that Yeoman environment executes via the run() command.
* By setting this up dynamically, we allow whoever extends this class will be able to choose the 
* proper Yeoman generator.
*
* The generator specified by generatorType must be present in the ./generators folder.  The file
* should match the string passed by generatorType.  For example, if generatorType==="my-generator",
* then there MUST be a TS script file located at ./generators/my-generator.ts
* ─────────────────────────────────────────────────────────────────────────────────────────────────┘
*/