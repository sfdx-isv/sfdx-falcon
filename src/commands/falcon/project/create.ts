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
    `$ sfdx falcon:project:create --projectname "My SFDX-Falcon Project" --namespace my_ns_prefix`,
    `$ sfdx falcon:project:create -n "My SFDX-Falcon Project" -s my_ns_prefix`
  ];
  
  //───────────────────────────────────────────────────────────────────────────┐
  // Define the flags used by this command.
  //───────────────────────────────────────────────────────────────────────────┘
  protected static flagsConfig = {
    projectname:  flags.string({required: true, char: 'n', description: messages.getMessage('projectnameFlagDescription')}),
    namespace:    flags.string({char: 's', description: messages.getMessage('namespaceFlagDescription')}),
    outputdir:    flags.string({char: 'd', description: messages.getMessage('outputdirFlagDescription')})
  };

  //───────────────────────────────────────────────────────────────────────────┐
  // Determine which core SFDX arguments/features are required by this command.
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
    const projectnameFlag = this.flags.projectname;
    const namespaceFlag   = this.flags.namespace  ||  'force-app';
    const outputdirFlag   = this.flags.outputdir  ||  '.';

    // TODO: Need to add validation of input values before running the generator
    //       At a minimum, we should check to see if the outputdirFlag is a valid
    //       filesystem name (eg no illegal chars like *).

    // Make an async call to the base object's generate() funtion.
    await super.generate('appx-project', {
      projectname: projectnameFlag,
      namespace: namespaceFlag,
      outputdir: outputdirFlag,
      options: []
    });

    // DEVTEST: This is an example of how you can create strings with variables and output them.
    let outputString = `Hello ${projectnameFlag}! This is your namespace: ${namespaceFlag}`;
    this.ux.log(outputString);

    // Return empty JSON.
    return { };
  }
}