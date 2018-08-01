//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @file          yeoman-command-base.ts
 * @copyright     Vivek M. Chawla - 2018
 * @author        Vivek M. Chawla <@VivekMChawla>
 * @version       1.0.0
 * @license       MIT
 * @requires      module:salesforce/command
 * @requires      module:yeoman-environment
 * @summary       Exports SfdxYeomanCommand for use with custom Salesforce CLI commands.
 * @description   Exports an abstract class that adds support for running a Yeoman Generator inside
 *                of custom-built Salesforce CLI commands.
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
// Imports
import {SfdxCommand}  from '@salesforce/command';   // Required by child classe to create a CLI command

// Requires
const yeoman  = require('yeoman-environment');      // Required to create a Yeoman Environment

//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @abstract
 * @class       SfdxYeomanCommand
 * @extends     SfdxCommand
 * @access      public
 * @version     1.0.0
 * @summary     Abstract base class class for building Salesforce CLI commands that use Yeoman.
 * @description Classes that extend SfdxYeomanCommand will be able to run any Generator defined
 *              in the src/generators directory.  The file name in src/generators should match the 
 *              generatorType string passed into runYeomanGenerator().  For example, if 
 *              generatorType==="my-generator", then there MUST be a TS script file located at 
 *              src/generators/my-generator.ts.
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
export default abstract class SfdxYeomanCommand extends SfdxCommand {

  // Entrypoint for child classes to kick off Yeoman Generators
  protected async runYeomanGenerator(generatorType: string, generatorOptions: object = {}) {

    // Create a Yeoman environment.
    const yeomanEnv = yeoman.createEnv();

    // Register a generator with the Yeoman environment, based on generatorType.
    yeomanEnv.register(
      require.resolve(`./generators/${generatorType}`),
      `sfdx-falcon:${generatorType}`
    );

    // Execute Yeoman's run() method to run the specified generator.
    // Note that the callback passed to run() will always RESOLVE because 
    // Generator.run() only implements then(), and not catch(). If any
    // code invoked by Yeoman's run loop throws an Error, Yeoman won't catch
    // it and a hard stop will be forced and the stacktrace shown the user.
    return new Promise((resolve, reject) => {
      yeomanEnv.run(`sfdx-falcon:${generatorType}`, generatorOptions, (results:any) => {
        resolve(results);
      });
    });
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