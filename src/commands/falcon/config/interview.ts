import {flags} from '@oclif/command';
import {join} from 'path';
import {core, SfdxCommand} from '@salesforce/command';
import * as _ from 'lodash';

// Initialize Messages with the current plugin directory
core.Messages.importMessagesDirectory(__dirname);

// Load the specific messages for this file. Messages from @salesforce/command, @salesforce/core,
// or any library that is using the messages framework can also be loaded this way.
const messages = core.Messages.loadMessages('sfdx-falcon', 'interview');

/**
* ─────────────────────────────────────────────────────────────────────────────────────────────────┐
* CLI Command: falcon:config:interview
* ─────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
export default class Interview extends SfdxCommand {
  //─────────────────────────────────────────────────────────────────────────────┐
  // Set command-level properties.
  //─────────────────────────────────────────────────────────────────────────────┘
  public static description = messages.getMessage('commandDescription');
  public static hidden      = false;
  public static examples    = [
    `$ sfdx falcon:project:create`,
    `$ sfdx falcon:project:create --projectname "My SFDX-Falcon Project" --namespace my_ns_prefix`,
    `$ sfdx falcon:project:create -n "My SFDX-Falcon Project" -s my_ns_prefix`
  ];
  
  //─────────────────────────────────────────────────────────────────────────────┐
  // Define the flags used by this command.
  //─────────────────────────────────────────────────────────────────────────────┘
  protected static flagsConfig = {
    projectname:  flags.string({char: 'n', description: messages.getMessage('projectnameFlagDescription')}),
    namespace:    flags.string({char: 's', description: messages.getMessage('namespaceFlagDescription')})
  };

  //─────────────────────────────────────────────────────────────────────────────┐
  // Determine which core SFDX arguments/features are required by this command.
  //─────────────────────────────────────────────────────────────────────────────┘
  protected static requiresProject        = true;   // True if an SFDX Project workspace is REQUIRED.
  protected static requiresUsername       = false;  // True if an org username is REQUIRED.
  protected static requiresDevhubUsername = false;  // True if a hub org username is REQUIRED.
  protected static supportsUsername       = false;  // True if an org username is OPTIONAL.
  protected static supportsDevhubUsername = false;  // True if a hub org username is OPTIONAL.

  //─────────────────────────────────────────────────────────────────────────────┐
  // Implement the run() function (this is what actually powers the command)
  //─────────────────────────────────────────────────────────────────────────────┘
  public async run(): Promise<any> { // tslint:disable-line:no-any

    // Set default values for flags that were not provided.
    const projectname = this.flags.projectname  ||  '.';
    const namespace   = this.flags.namespace    ||  'force-app';

    // Determine the path
    const projectPath = 'some kind of code to get the path';

    

    // This is an example of how you can create strings with variables and output them.
    let outputString = `Hello ${projectname}! This is your namespace: ${namespace}`;
    this.ux.log(outputString);

    // this is an example of throwing an error
    //throw new core.SfdxError(messages.getMessage('errorGitNotInstalled'));


    // Return an object to be displayed with --json
    return { retVal: 'someting coming back', outputString };
  }
}