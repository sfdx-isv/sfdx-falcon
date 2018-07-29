//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @file          helpers/adk-helper.ts
 * @copyright     Vivek M. Chawla - 2018
 * @author        Vivek M. Chawla <@VivekMChawla>
 * @version       1.0.0
 * @license       MIT
 * @requires      module:debug
 * @requires      module:inquirer
 * @requires      module:path
 * @requires      module:shelljs
 * @requires      module:validators/core
 * @summary       AppExchange Demo Kit (ADK) helper library
 * @description   Exports classes & functions that provide the core services of the AppExchange 
 *                Demo Kit (ADK).
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
// Imports
import * as core                from  '@salesforce/core';           // Allows us to use SFDX core functionality.
import * as path                from  'path';                        // Node's path library.
import {readConfigFile}         from  '../helpers/config-helper';  // Why?
import {AppxDemoProjectContext} from  '../helpers/falcon-helper';    // Why?
import {FalconStatusReport}     from  '../helpers/falcon-helper';    // Why?
import {SfdxCommandSequence}    from  '../helpers/sequence-helper';  // Why?
import {AppxDemoLocalConfig}    from  '../falcon-types';             // Why?
import {AppxDemoProjectConfig}  from  '../falcon-types';             // Why?
import {FalconCommandSequence}  from  '../falcon-types';             // Why?
import {FalconSequenceContext}  from  '../falcon-types';             // Why?
import {INTENT}                 from  '../enums';                    // Why?

// Requires
const debug         = require('debug')('adk-helper');             // Utility for debugging. set debug.enabled = true to turn on.
const debugAsync    = require('debug')('adk-helper(ASYNC)');      // Utility for debugging. set debugAsync.enabled = true to turn on.
const debugExtended = require('debug')('adk-helper(EXTENDED)');   // Utility for debugging. set debugExtended.enabled = true to turn on.

// Initialize Globals
debug.enabled         = false;
debugAsync.enabled    = false;
debugExtended.enabled = false;

//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @class       AppxDemoProject
 * @access      public
 * @version     1.0.0
 * @description Creates an Object that represents an AppExchange Demo Kit project on the user's
 *              local machine.  This includes member variables that hold all of the ADK project
 *              variables and member functions that encapsulate all of the actions the ADK can 
 *              take on behalf of the user.
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
export class AppxDemoProject {

  //───────────────────────────────────────────────────────────────────────────┐
  // Define class member variables/types.
  //───────────────────────────────────────────────────────────────────────────┘
  private   context:   AppxDemoProjectContext;   // Why?

  private   executionIntent:        INTENT;                 // Why?
  private   executingSequence:      boolean;                // Why?
 
//  private   appxDemoLocalConfig:    AppxDemoLocalConfig;    // Why?
//  private   appxDemoProjectConfig:  AppxDemoProjectConfig;  // Why?



  //───────────────────────────────────────────────────────────────────────────────────────────────┐
  /**
   * @constructs  AppxDemoProject
   * @version     1.0.0
   * @param       {SfdxProject} sfdxProject Required.
   *              An SfdxProject context as returned by a call to SfdxProject.resolve().
   * @param       {object}      sfdxProjectConfig Required.
   *              The resolved set of SFDX Project config settings for the SfdxProject.
   * @param       {ConfigFile}  localFalconConfigFile Required.
   *              A ConfigFile object that should have been populated by a local SFDX-Falcon config.
   * @description Constructs an AppxDemoProject object.
   */
  //───────────────────────────────────────────────────────────────────────────────────────────────┘
  constructor(sfdxProject:core.SfdxProject, sfdxProjectConfig:object, localFalconConfigFile:core.ConfigFile) {

    // Make sure that we get a value passed in to each parameter.
    if (typeof sfdxProject === 'undefined' 
    ||  typeof sfdxProjectConfig === 'undefined' 
    ||  typeof localFalconConfigFile === 'undefined') {
    throw new Error(`ERROR_MISSING_ARGUMENTS: Expected three arguments but only got ${arguments.length}`);
    }

    // Initialize the Appx Demo Project Context variable.
    this.context = new AppxDemoProjectContext();

    //─────────────────────────────────────────────────────────────────────────┐
    // Attempt to pull data from the incoming parameters.  If the proper 
    // data types were not provided, then it's likely that someone tried to
    // directly construct an AppxDemoProject object.  That's not allowed, so we 
    // want to catch anything unexpected then throw a custom ERROR.
    //─────────────────────────────────────────────────────────────────────────┘
    try {

      // Get the project path
      this.context.path = sfdxProject.getPath(); 
      debug(`this.context.path:\n%O`, this.context.path);

      // Get the PROJECT LEVEL configuration for an AppxDemo project.
      this.context.config.project = (sfdxProjectConfig as any).plugins.sfdxFalcon.appxDemo;
      debug(`this.context.config.project:\n%O`, this.context.config.project);  

      // Get the LOCAL configuration for an AppxDemo project.
      this.context.config.local = localFalconConfigFile.toObject().appxDemo as any;
      debug(`context.config.local:\n%O`, this.context.config.local);
    }
    catch (parseError) {
      throw new Error (`ERROR_UNPARSED_CONFIG: ${parseError}`);
    }

    // Set any final member variables.
    this.executingSequence  = false;
    this.executionIntent    = INTENT.NOT_SPECIFIED;

    // One final validation effort to make sure that we have everything.
    this.finalValidation();

    return;
  }
  //───────────────────────────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      resolve
   * @param       {string}  projectDirectory Required.
   *              Specifies the path of a local directory that contains the root of an ADK project.
   *              When not specified, the local SFDX project context must be present.
   * @param       {boolean} [debugMode] Optional.
   *              Set to TRUE to enable debug output from inside the AppxDemoProject object that this
   *              method will return.
   * @description Leverages the Project object from SFDX-Core to represent an SFDX project 
   *              directory.  This means that the directory must contain an sfdx-project.json file
   *              and (possibly) a hidden .sfdx folder that contains other local SFDX config files.
   * @version     1.0.0
   * @public @static @async 
   */
  //───────────────────────────────────────────────────────────────────────────────────────────────┘
  public static async resolve (projectDirectory: string, debugMode?:boolean) {

    //─────────────────────────────────────────────────────────────────────────┐
    // Activate debug mode if set to TRUE by the caller.
    //─────────────────────────────────────────────────────────────────────────┘
    debug.enabled = (debugMode === true);
    debugExtended.enabled = false;
    debug(`debug.enabled: ${debug.enabled}`);
    debug(`debugExtended.enabled: ${debugExtended.enabled}`);

    //─────────────────────────────────────────────────────────────────────────┐
    // Try to resolve an SFDX Project context using the project directory
    // that was passed in by the caller.
    //─────────────────────────────────────────────────────────────────────────┘
    // TODO: Add try/catch
    let sfdxProject = await core.SfdxProject.resolve(projectDirectory);
    debugExtended(`sfdxProject:\n%O`, sfdxProject);

    //─────────────────────────────────────────────────────────────────────────┐
    // Resolve the overall project config. A resolved config object will
    // contain a bunch of different properties from local and global
    // sfdx-project.json, aggregated config values, and (most importantly)
    // 3rd party custom properties like the ones for SFDX-Falcon.
    //─────────────────────────────────────────────────────────────────────────┘
    let sfdxProjectConfig = await sfdxProject.resolveProjectConfig();
    debugExtended(`sfdxProjectConfig:\n%O`, sfdxProjectConfig);

    //─────────────────────────────────────────────────────────────────────────┐
    // Try to get the local SFDX-Falcon Config File so we can parse it for 
    // settigns that belong to the local developer who is running this command.
    // To do this, we must first create a ConfigOptions object that points to
    // the sfdx-falcon-config.json file that should be found in the hidden
    // ".sfdx-falcon" directory at this project's root path.
    //─────────────────────────────────────────────────────────────────────────┘
    let falconLocalConfigOptions = {
      rootFolder: path.join(sfdxProject.getPath(), '.sfdx-falcon'),
      filename:   'sfdx-falcon-config.json',
      isGlobal:   false,
      isState:    false,
    }
    debugExtended(`fileConfigOptions:\n%O`, falconLocalConfigOptions);

    //─────────────────────────────────────────────────────────────────────────┐
    // Using the options set above, retrieve the SFDX-Falcon Config file, then
    // make sure that the file already exists on disk.
    //─────────────────────────────────────────────────────────────────────────┘
    let localFalconConfigFile = await core.ConfigFile.retrieve(falconLocalConfigOptions);

    if (await localFalconConfigFile.exists() === false) {
      let combinedPath = path.join(falconLocalConfigOptions.rootFolder, falconLocalConfigOptions.filename);
      throw new Error(`ERROR_CONFIG_NOT_FOUND: File does not exist - ${combinedPath}`);
    }
    debugExtended(`localFalconConfigFile: \n%O`, localFalconConfigFile);

    //─────────────────────────────────────────────────────────────────────────┐
    // Grab the JSON for "plugins.sfdxFalcon.appxDemo" from the resolved SFDX
    // Project Config object, then validate it to make sure all expected values
    // were provided.
    //─────────────────────────────────────────────────────────────────────────┘
    let appxDemoProjectConfig:AppxDemoProjectConfig = (sfdxProjectConfig as any).plugins.sfdxFalcon.appxDemo;
    let validationResponse = validateAppxDemoConfig(appxDemoProjectConfig);
    if (validationResponse !== true) {
      throw new Error(`ERROR_INVALID_CONFIG: Configuration for 'appxDemo' in sfdx-project.json has missing/invalid settings (${validationResponse}).`)
    }
    debugExtended(`appxDemoProjectConfig:\n%O`, appxDemoProjectConfig);

    //─────────────────────────────────────────────────────────────────────────┐
    // Construct a new AppxDemoProject object using the SFDX Project, SFDX Project
    // Config, and the SFDX-Falcon Config values.
    //─────────────────────────────────────────────────────────────────────────┘
    let newAdkProject = new AppxDemoProject(sfdxProject, 
                                            sfdxProjectConfig, 
                                            localFalconConfigFile);

    //─────────────────────────────────────────────────────────────────────────┐
    // Done configuring the new AppxDemoProject object. Send it to the caller.
    //─────────────────────────────────────────────────────────────────────────┘
    return newAdkProject;

  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @function      getDefaultSequenceContext
   * @returns       {FalconSequenceContext}  ???
   * @description   Returns a FalconSequenceContext object set with all 
   *                properties set to defaults.
   * @version       1.0.0
   * @private
   */
  //───────────────────────────────────────────────────────────────────────────┘
  private getDefaultSequenceContext():FalconSequenceContext {
    return {
      devHubAlias:        this.context.config.local.devHubAlias,
      targetOrgAlias:     null,
      targetIsScratchOrg: null,
      projectPath:        this.context.path,
      configPath:         path.join(this.context.path, 'demo-config'),
      mdapiSourcePath:    path.join(this.context.path, 'mdapi-source'),
      dataPath:           path.join(this.context.path, 'demo-data'),
      logLevel:           'error',
      sequenceObserver:   null
    }
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @function    deployDemo
   * @returns     {Promise<void>}  No return value, but may throw Errros.
   * @version     1.0.0
   * @description ????
   * @public @async
   */
  //───────────────────────────────────────────────────────────────────────────┘
  public async deployDemo() {

    // TODO: Implement this function. Copy from validateDemo()

  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @function      validateDemo
   * @returns       {Promise<FalconStatusReport>}  Resolves with a Falcon Status
   *                Report or bubbles up thrown errors.
   * @description   ????
   * @version       1.0.0
   * @public @async
   */
  //───────────────────────────────────────────────────────────────────────────┘
  public async validateDemo():Promise<FalconStatusReport> {

    // Create a Default Sequence Context.
    let sequenceContext = this.getDefaultSequenceContext();

    // Customize for validateDemo().
    sequenceContext.targetOrgAlias      = this.context.config.local.demoValidationOrgAlias;
    sequenceContext.targetIsScratchOrg  = true;
    debug(`validateDemo.sequenceContext:\n%O\n`, sequenceContext);

    // Load the sequence (reads file and then returns JS object)
    let demoBuildSequence = await readConfigFile( sequenceContext.configPath,               // rootFolder
                                                  this.context.config.project.demoConfig);  // filename
    debug(`validateDemo.demoBuildSequence:\n%O\n`, demoBuildSequence);

    // Validate the contents of the Demo Build Sequence object.
    let demoBuildConfigValidationResponse = validateDemoBuildConfig(demoBuildSequence);
    if (demoBuildConfigValidationResponse !== true) {
    throw new Error (`ERROR_INVALID_CONFIG: ` 
                    +`Configuration in ${path.join(sequenceContext.configPath, this.context.config.project.demoConfig)} `
                    +`has missing/invalid settings (${demoBuildConfigValidationResponse}).`)
    }
    
    // TODO: Deprecate this Use setIntent() to configure all member variables required by the intent.
    this.setIntent(INTENT.VALIDATE_DEMO);

    // This SFDX Command Sequence will provide our execution capabilities.
    let sfdxCommandSequence = new SfdxCommandSequence(demoBuildSequence, sequenceContext);

    // TODO: Delete the old scratch org.

    // TODO: Create a new scratch org.

    // Execute the Sequence.
    let statusReport = await sfdxCommandSequence.execute();

    // Perform post-execution tasks

    // Return the status report to the caller.
    return statusReport;

  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      finalValidation
   * @returns     {void}  No return value, but may throw Errros.
   * @description Goes through all of the member variables that are initialized
   *              by the constructor and checks each of them for validity and
   *              completeness.  Will throw an Error any time invalid or missing
   *              information is detected.
   * @version     1.0.0
   * @private
   */
  //───────────────────────────────────────────────────────────────────────────┘
  private finalValidation() {

    // TODO: Implement this function

    // DEVTEST
    //throw new Error('Hold your horses!');

  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      setIntent
   * @param       {INTENT}  intent  Required.  Enum indicating the caller's
   *                        intent when executing commands implemented by this
   *                        class.
   * @returns     {void}  No return value, but may throw Errros.
   * @description ???
   * @version     1.0.0
   * @private
   */
  //───────────────────────────────────────────────────────────────────────────┘
  private setIntent(intent:INTENT):void {

    // Make sure we're not already executing a command sequence.
    if (this.executingSequence === true) {
      throw new Error('ERROR_SEQUENCE_RUNNING: There is already another sequence running.')
    }
    else {
      this.executingSequence = true;
    }

    // Set the intent
    this.executionIntent  = intent;

    // Depending on the intent, it may be appropriate to take certain actions.
    switch(intent) {
      case INTENT.DEPLOY_DEMO:
        break;
      case INTENT.HEALTH_CHECK:
        throw new Error(`ERROR_INTENT_NOT_IMPLEMENTED: Your command uses an intent that is not yet implemented.`);
        break;
      case INTENT.REPAIR_PROJECT:
        throw new Error(`ERROR_INTENT_NOT_IMPLEMENTED: Your command uses an intent that is not yet implemented.`);
        break;
      case INTENT.VALIDATE_DEMO:
        break;
      default:
        throw new Error(`ERROR_UNKNOWN_INTENT: Your command did not specify a valid intent.`);
    }
  }
} // End of AppxDemoProject class definition.

// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    validateAppxDemoConfig
 * @param       {AppxDemoProjectConfig}  appxDemoConfig  ????
 * @returns     {boolean|Array<string>}  Returns TRUE if AppxDemoProjectConfig is valid. If not
 *                                       valid, returns an array of strings listing each key that
 *                                       had an invalid value.
 * @description ????
 * @version     1.0.0
 * @private
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
function validateAppxDemoConfig (appxDemoConfig:AppxDemoProjectConfig):boolean|Array<string> {
  let invalidConfigKeys = new Array<string>();

  if (! appxDemoConfig.demoAlias)       invalidConfigKeys.push('demoAlias');
  if (! appxDemoConfig.demoConfig)      invalidConfigKeys.push('demoConfig');
  if (! appxDemoConfig.demoTitle)       invalidConfigKeys.push('demoTitle');
  if (! appxDemoConfig.demoType)        invalidConfigKeys.push('demoType');
  if (! appxDemoConfig.demoVersion)     invalidConfigKeys.push('demoVersion');
  if (! appxDemoConfig.gitHubUrl)       invalidConfigKeys.push('gitHubUrl');
  if (! appxDemoConfig.gitRemoteUri)    invalidConfigKeys.push('gitRemoteUri');
  if (! appxDemoConfig.partnerAlias)    invalidConfigKeys.push('partnerAlias');
  if (! appxDemoConfig.partnerName)     invalidConfigKeys.push('partnerName');
  if (! appxDemoConfig.schemaVersion)   invalidConfigKeys.push('schemaVersion');

  if (invalidConfigKeys.length > 0) {
    return invalidConfigKeys;
  }
  else {
    return true;
  }
}

// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    validateDemoBuildConfig
 * @param       {FalconCommandSequence}  demoBuildSequence  ????
 * @returns     {boolean|Array<string>}  Returns TRUE if demoBuildSequence is valid. If not valid,
 *                                       returns an array of strings listing each key that had an
 *                                       invalid value.
 * @version     1.0.0
 * @description ????
 * @public
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
export function validateDemoBuildConfig (demoBuildSequence:FalconCommandSequence):boolean|Array<string> {

  // TODO: Need to implement this function.

  let invalidConfigKeys = new Array<string>();

  //DEVTEST
  //invalidConfigKeys.push('test-error');
  //return invalidConfigKeys;

  return true;
}

// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    validateConfig
 * @param       {any}  configToValidate ????
 * @param       {any}  configSchema     ????
 * @returns     {boolean|Array<string>}  Returns TRUE if configToValidate is valid. If not valid,
 *                                       returns an array of strings listing each key that had an
 *                                       invalid value.
 * @version     1.0.0
 * @description Uses ajv (https://www.npmjs.com/package/ajv) to validate object against schema.
 * @private
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
function validateConfig(configToValidate:any, configSchema:any):boolean|Array<string> {
  
  // TODO: Need to implement this instead of the single purpose functions

  // See "ajv" for a Node module that can do this for us 

  return false;
}






/*
Example of appxDemo JSON:
"appxDemo": {
  "demoAlias"         : "MyAppxDemo",
  "demoConfigJson"    : "demo-config/demo-config.json",
  "demoTitle"         : "My AppExchange Demo",
  "demoType"          : "ADK-SINGLE",
  "demoVersion"       : "0.0.1",
  "gitHubUrl"         : "https://github.com/my-org/my-repo",
  "gitRemoteUri"      : "https://github.com/my-org/my-repo.git",
  "partnerAlias"      : "AppyInc",
  "partnerName"       : "Appy Apps Incorporated",
  "schemaVersion"     : "0.0.1"
}
//*/

// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    functionName
 * @param       {string}  requiredParameter Required. Description can continue onto multiple lines.
 * @param       {string}  [optionalParameter] Optional. Description can continue onto multiple lines.
 * @returns     {Promise<any>}  Resolves with ???, otherwise Rejects with ???.
 * @description ???
 * @version     1.0.0
 * @public @async
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
/*
private myFunction() {

}
//*/

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @function    functionName
   * @param       {string}  requiredParameter Required. Description can
   *                        continue onto multiple lines.
   * @param       {string}  [optionalParameter] Optional. Description can
   *                        continue onto multiple lines.
   * @returns     {Promise<any>}  Resolves with ???, otherwise Rejects with ???.
   * @description ???
   * @version     1.0.0
   * @public @async
   */
  //───────────────────────────────────────────────────────────────────────────┘
  /*
  private myFunction() {

  }
  //*/