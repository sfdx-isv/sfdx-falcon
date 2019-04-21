//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @file          commands/falcon/adk/install.ts
 * @copyright     Vivek M. Chawla - 2018
 * @author        Vivek M. Chawla <@VivekMChawla>
 * @summary       Implements the CLI command "falcon:adk:install"
 * @description   Salesforce CLI Plugin command (falcon:adk:install) that is expected to run inside
 *                of a fully-configured AppExchange Demo Kit (ADK) project.  Takes project and local
 *                settings from various JSON config files and uses them to power an Org Build
 *                based on the SFDX Falcon Recipe selected by the user.
 * @version       1.0.0
 * @license       MIT
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
// Import External Modules
import {flags}                        from  '@salesforce/command';  // Allows creation of flags for CLI commands.
import {SfdxError}                    from  '@salesforce/core';     // Generalized SFDX error which also contains an action.
import {Messages}                     from  '@salesforce/core';     // Messages library that simplifies using external JSON for string reuse.
import {AnyJson}                      from  '@salesforce/ts-types'; // Safe type for use where "any" might otherwise be used.
import {isEmpty}                      from  'lodash';               // Useful function for detecting empty objects.
import * as path                      from  'path';                 // Helps resolve local paths at runtime.

// Import Local Modules
import {SfdxFalconCommand}            from  '../../../modules/sfdx-falcon-command'; // Class. Base class used by all SFDX-Falcon commands.
import {SfdxFalconError}              from  '../../../modules/sfdx-falcon-error';   // Class. Extends SfdxError to provide specialized error structures for SFDX-Falcon modules.
import {SfdxFalconProject}            from  '../../../modules/sfdx-falcon-project'; // Class. Represents an SFDX-Falcon project, including locally stored project data.
import {SfdxFalconResult}             from  '../../../modules/sfdx-falcon-result';  // Class. Used to communicate results of SFDX-Falcon code execution at a variety of levels.
import {SfdxFalconResultType}         from  '../../../modules/sfdx-falcon-result';  // Enum. Represents the different types of sources where Results might come from.

// Import Internal Types
import {SfdxFalconCommandType}        from  '../../../modules/sfdx-falcon-command'; // Enum. Represents the types of SFDX-Falcon Commands.
import {CoreActionResultDetail}       from  '../../../modules/sfdx-falcon-recipe/engines/appx/actions'; // Interface. Represents the core set of "detail" information that every ACTION result should have.

// Set the File Local Debug Namespace
//const dbgNs     = 'COMMAND:falcon-demo-install:';

// Use SfdxCore's Messages framework to get the message bundles for this command.
Messages.importMessagesDirectory(__dirname);
const baseMessages    = Messages.loadMessages('sfdx-falcon', 'sfdxFalconCommand');
const commandMessages = Messages.loadMessages('sfdx-falcon', 'falconAdkInstall');

//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @class       FalconDemoInstall
 * @extends     SfdxFalconCommand
 * @summary     Implements the CLI Command "falcon:adk:install"
 * @description Reads an SFDX-Falcon Recipe (either the one specified as the project default inside
 *              sfdx-project.json or one specified at the command line) and uses the resulting
 *              compiled Recipe to perform a set of tasks that should result in a demo org being
 *              built to the specifications of the SFDX Falcon Recipe.
 * @version     1.0.0
 * @public
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
export default class FalconDemoInstall extends SfdxFalconCommand {

  // Define the basic properties of this CLI command.
  public static description = commandMessages.getMessage('commandDescription');
  public static hidden      = false;
  public static examples    = [
    `$ sfdx falcon:adk:install`,
    `$ sfdx falcon:adk:install --projectdir ~/demos/adk-projects/my-adk-project`,
    `$ sfdx falcon:adk:install --projectdir ~/demos/adk-projects/my-adk-project \\\n` +
    `                         --configfile my-alternate-demo-config.json`
  ];

  //───────────────────────────────────────────────────────────────────────────┐
  // -d --PROJECTDIR  Directory where a fully configured AppX Demo Kit (ADK)
  //                  project exists. All commands for deployment must be
  //                  defined inside this directory.
  // -f --CONFIGFILE  Name of the config file to override the normal demo
  //                  install process with.
  //───────────────────────────────────────────────────────────────────────────┘
  protected static flagsConfig = {
    projectdir: flags.directory({
      char: 'd',
      required: false,
      description: baseMessages.getMessage('projectdir_FlagDescription'),
      default: '.',
      hidden: false
    }),
    recipefile: flags.string({
      char: 'f',
      required: false,
      description: baseMessages.getMessage('recipefile_FlagDescription'),
      default: '',
      hidden: false
    }),
    extendedoptions: flags.string({
      char: 'x',
      required: false,
      description: baseMessages.getMessage('extendedoptions_FlagDescription'),
      default: '{}',
      hidden: false
    }),
    
    // IMPORTANT! The next line MUST be here to import the FalconDebug flags.
    ...SfdxFalconCommand.falconBaseflagsConfig
  };

  // Identify the core SFDX arguments/features required by this command.
  protected static requiresProject        = false;  // True if an SFDX Project workspace is REQUIRED.
  protected static requiresUsername       = false;  // True if an org username is REQUIRED.
  protected static requiresDevhubUsername = false;  // True if a hub org username is REQUIRED.
  protected static supportsUsername       = false;  // True if an org username is OPTIONAL.
  protected static supportsDevhubUsername = false;  // True if a hub org username is OPTIONAL.

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @function    run
   * @returns     {Promise<AnyJson>}  This should resolve by returning a JSON object
   *              that the CLI will then forward to the user if the --json flag
   *              was set when this command was called.
   * @description Entrypoint function used by the CLI when the user wants to
   *              run the command 'sfdx falcon:adk:install'.
   * @version     1.0.0
   * @public @async
   */
  //───────────────────────────────────────────────────────────────────────────┘
  public async run():Promise<AnyJson> {

    // Initialize the SfdxFalconCommand base (DO NOT REMOVE THIS LINE OF CODE!)
    this.sfdxFalconCommandInit('falcon:adk:install', SfdxFalconCommandType.APPX_DEMO);

    // Resolve the Project Directory (specified by the user) to a Project Path.
    const projectPath = path.resolve(this.projectDirectory);

    // Instantiate the SFDX-Falcon Project residing at the Project Path.
    const sfdxFalconProject = await SfdxFalconProject.resolve(projectPath);

    // If the user passed any Extended Options, use them as Compile Options.
    const compileOptions = this.extendedOptions;

    if (this.recipeFile) {

      // Run the specific Recipe supplied by the user.
      await sfdxFalconProject.runSpecifiedRecipe(this.recipeFile)
        .then(async falconRecipeResult  => { await this.onSuccess(falconRecipeResult); })  // Implemented by parent class
        .catch(async falconRecipeResult => { await this.onError(falconRecipeResult); });   // Implemented by parent class
    }
    else {

      // Run the Default Recipe as specified in sfdx-project.json.
      await sfdxFalconProject.runDefaultRecipe(compileOptions)
        .then(async falconRecipeResult  => { await this.onSuccess(falconRecipeResult); })  // Implemented by parent class
        .catch(async falconRecipeResult => { await this.onError(falconRecipeResult); });   // Implemented by parent class
    }


    // Return the JSON Response that was populated by onSuccess().
    return this.falconJsonResponse as unknown as AnyJson;
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      buildFinalError
   * @param       {SfdxFalconError} cmdError  Required. Error object used as
   *              the basis for the "friendly error message" being created
   *              by this method.
   * @returns     {SfdxError}
   * @description Builds a user-friendly error message that is appropriate to
   *              the CLI command that's being implemented by this class. The
   *              output of this method will always be used by the onError()
   *              method from the base class to communicate the end-of-command
   *              error state.
   * @protected
   */
  //───────────────────────────────────────────────────────────────────────────┘
  protected buildFinalError(cmdError:SfdxFalconError):SfdxError {
    let actionError:SfdxFalconError = cmdError;

    // Find the first Error Object that has an associated ACTION Result.
    while (actionError && (isEmpty(actionError) === false)) {
      if (actionError.data && actionError.data.sfdxFalconResult) {
        if (actionError.data.sfdxFalconResult.type === SfdxFalconResultType.ACTION) {
          // Found what we were looking for.
          const actionResult  = actionError.data.sfdxFalconResult as SfdxFalconResult;
          const actionDetail  = actionResult.detail as CoreActionResultDetail;
          let errorMessage  = '';
          try {
            const stepName = actionDetail.actionContext.listrExecOptions.listrTask._task.title;
            errorMessage = `The step "${stepName}" has failed. Its action, "${actionDetail.actionName}", returned the following error:`;
          } catch (err) {
            errorMessage = `A step with the action "${actionDetail.actionName}" has failed with the following error:`;
          }

          // Build the FINAL error that we'll throw to the CLI.
          const finalError =
            new SfdxError ( `${errorMessage}\n`
                          + `${actionError.rootCause.name}: ${actionError.rootCause.message}`
                          , `FailedCommand`
                          , actionError.rootCause.actions
                          , 1
                          , cmdError);
          finalError.commandName = `falcon:adk:install`;
          return finalError;
        }
      }
      // Get the next child error object.
      actionError = actionError.cause as SfdxFalconError;
    }
    // We could not find an ACTION error. Just reflect the COMMAND error.
    return cmdError;
  }
} // End of Class FalconDemoInstall
