import {flags}              from '@oclif/command';                  // Why?
import {core}               from '@salesforce/command';             // Why?
import {join}               from 'path';                            // Why?
import YeomanCommandBase    from '../../../yeoman-command-base';    // Why?
import * as _               from 'lodash';                          // Why?


// Initialize Messages with the current plugin directory
core.Messages.importMessagesDirectory(__dirname);

// Load the specific messages for this file. Messages from @salesforce/command, @salesforce/core,
// or any library that is using the messages framework can also be loaded this way.
const messages = core.Messages.loadMessages('sfdx-falcon', 'create');

/**
* ─────────────────────────────────────────────────────────────────────────────────────────────────┐
* CLI Command: falcon:project:create
* Extends YeomanCommandBase, which itself extends SfdxCommand
* ─────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
export default class Create extends YeomanCommandBase {
  //───────────────────────────────────────────────────────────────────────────┐
  // Set command-level properties.
  //───────────────────────────────────────────────────────────────────────────┘
  public static description = messages.getMessage('commandDescription');
  public static hidden      = false;
  public static examples    = [
    `$ sfdx falcon:project:create`,
    `$ sfdx falcon:project:create --outputdir ~/projects/sfdx-projects`
  ];
  
  //───────────────────────────────────────────────────────────────────────────┐
  // Define the flags used by this command.
  // -d --OUTPUTDIR   Directory where SFDX-Falcon project will be created.
  //                  Defaults to . (current directory) is not specified.
  //───────────────────────────────────────────────────────────────────────────┘
  protected static flagsConfig = {
    outputdir: flags.string({char: 'd', description: messages.getMessage('outputdirFlagDescription')})
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
    const outputdirFlag = this.flags.outputdir  ||  '.';

    // TODO: Need to add validation of input values before running the generator
    //       At a minimum, we should check to see if the outputdirFlag is a valid
    //       filesystem name (eg no illegal chars like *).

    // Make an async call to the base object's generate() funtion.  This will
    // load and execute the Yeoman Generator defined in appx-project.ts.  All
    // user interactions for the rest of this command will come from Yeoman, so
    // there is no need to run anything after this call returns.
    await super.generate('appx-project', {
      outputdir: outputdirFlag,
      options: []
    });

    // Return empty JSON.
    return { };
  }
}