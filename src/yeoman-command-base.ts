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
import {createEnv}    from 'yeoman-environment';    // Required to use Yeoman

/**
* ─────────────────────────────────────────────────────────────────────────────────────────────────┐
* Abstract class to add support for running a Yeoman Generator inside our Salesforce CLI command.
* ─────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @class       SfdxYeomanCommand
 * @extends     SfdxCommand
 * @access      public
 * @version     1.0.0
 * @summary     Abstract base class class for building Salesforce CLI commands that use Yeoman.
 * @description Classes that extend SfdxYeomanCommand
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
export default abstract class SfdxYeomanCommand extends SfdxCommand {

  // Entrypoint for child classes to kick off Yeoman Generators
  protected async generate(generatorType: string, generatorOptions: object = {}) {

    // Create a Yeoman environment.
    const yeomanEnv = createEnv();

    // Register a generator with the Yeoman environment, based on generatorType.
    yeomanEnv.register(
      require.resolve(`./generators/${generatorType}`),
      `sfdx-falcon:${generatorType}`
    );

    // Asynchronously execute Yeoman's run() method to run the specified generator.
    await new Promise((resolve, reject) => {
      yeomanEnv.run(`sfdx-falcon:${generatorType}`, generatorOptions, (err: Error, results: any) => {
        if (err) reject(err);
        else resolve(results);
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
* then there MUST be a TS script file located at .generators/my-generator.ts
* ─────────────────────────────────────────────────────────────────────────────────────────────────┘
*/