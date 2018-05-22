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

    // DEVTEST
    this.ux.log('generate() function called');

    // Create a Yeoman environment.
    const yeomanEnv = createEnv();

    // DEVTEST
    const generatorsFolder = require.resolve(`./generators/${generatorType}`);
    this.ux.log(generatorsFolder);

    // Register a generator with the Yeoman environment, based on generatorType.
    yeomanEnv.register(
      require.resolve(`./generators/${generatorType}`),
      `sfdx-falcon:${generatorType}`
    );

    // DEVTEST
    this.ux.log(yeomanEnv.getGeneratorsMeta());
    this.ux.log('We made it past the register command');

    // Asynchronously execute the Yeoman environment's run() method.
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
* ─────────────────────────────────────────────────────────────────────────────────────────────────┘
*/