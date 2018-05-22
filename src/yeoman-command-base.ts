import {SfdxCommand}  from '@salesforce/command';   // Required by child classe to create a CLI command
import {createEnv}    from 'yeoman-environment';    // Required to use Yeoman

/**
* ─────────────────────────────────────────────────────────────────────────────────────────────────┐
* Abstract class to add support for running a Yeoman Generator inside our Salesforce CLI command.
* ─────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
export default abstract class YeomanCommandBase extends SfdxCommand {

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
* should match the string passed by generatorType.  For example, if generatorType==="appx-project",
* then there MUST be a TS script file located at .generators/appx-project.ts
* ─────────────────────────────────────────────────────────────────────────────────────────────────┘
*/