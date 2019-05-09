//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @file          modules/sfdx-falcon-project/index.ts
 * @copyright     Vivek M. Chawla - 2018
 * @author        Vivek M. Chawla <@VivekMChawla>
 * @summary       Provides a consistent structure for getting SFDX-Falcon configuration and taking
 *                actions that are specific to the services offered by the SFDX-Falcon plugin.
 * @description   Provides a consistent structure for getting SFDX-Falcon configuration and taking
 *                actions that are specific to the services offered by the SFDX-Falcon plugin.
 * @license       MIT
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
// Import External Modules
import * as core                    from  '@salesforce/core';                 // Library. Allows us to use SFDX core functionality.
import {JsonMap}                    from  '@salesforce/ts-types';             // Core SFDX type. Use this instead of "any" whenever JSON is expected.
import * as path                    from  'path';                             // Library. Node's built-in path library.

// Import Local Modules
import {SfdxFalconDebug}            from  '../sfdx-falcon-debug';             // Class. Internal Debug module
import {SfdxFalconError}            from  '../sfdx-falcon-error';             // Class. Extends SfdxError to provide specialized error structures for SFDX-Falcon modules.
import {SfdxFalconRecipe}           from  '../sfdx-falcon-recipe';            // Class. Allows you to read, compile, and run an SFDX-Falcon Recipe.
import {SfdxFalconResult}           from  '../sfdx-falcon-result';            // Class. Provides framework for bubbling "results" up from nested calls.

// Import Falcon Types
import {ProjectResolutionOptions}   from  '../sfdx-falcon-types';             // Interface. Represents the options that can be set when calling SfdxFalconProject.resolve().
import {SfdxFalconProjectConfig}    from  '../sfdx-falcon-types';             // Interface. Represents the SFDX-Falcon specific part of a project's sfdx-project.json config file.
import {SfdxFalconLocalConfig}      from  '../sfdx-falcon-types';             // Interface. Represents the special, hidden "local config" file for an SFDX-Falcon project.
import {SfdxFalconGlobalConfig}     from  '../sfdx-falcon-types';             // Interface. Represents a "global" SFDX-Falcon configuration data structure. Not yet implmented.

// Set the File Local Debug Namespace
const dbgNs     = 'PROJECT:sfdx-falcon-project:';


//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @class       SfdxFalconProject
 * @summary     Represents a resolved SFDX-Falcon project configuration.
 * @description Implements a number of tools and services for resolving and inspecting a variety of
 *              JSON configuration files that can be found in an SFDX-Falcon project.
 * @public
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
export class SfdxFalconProject {

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      resolve
   * @param       {string}  projectPath  Required. Path to a valid SFDX-Falcon
   *              project inside the user's local environment.
   * @returns     {Promise<SfdxFalconProject>} Resolves with an instance
   *              of an SfdxFalconProject object that represents the
   *              project found at the projectRoot using a combination of SFDX
   *              and SFDX-Falcon config files.
   * @description Given the path to an SFDX-Falcon project directory,
   *              initializes an SfdxFalconProject object and returns
   *              it to the caller.
   * @public @static @async
   */
  //───────────────────────────────────────────────────────────────────────────┘
  public static async resolve(projectPath:string, opts:ProjectResolutionOptions={}):Promise<SfdxFalconProject> {

    // Set defaults for any options that were not provided.
    opts = {
      ...{
        resolveProjectConfig: true,
        resolveLocalConfig:   true,
        resolveGlobalConfig:  true
      },
      ...opts
    } as ProjectResolutionOptions;

    // Instantiate an SfdxFalconProject Object
    const sfdxFPO = new SfdxFalconProject();

    // Initialize project configuration variables
    await SfdxFalconProject.initializeConfig(projectPath, sfdxFPO, opts);

    // Initialize the paths for this project (all are relative to Project Path).
    await SfdxFalconProject.initializePaths(projectPath, sfdxFPO);

    // Initialize anything related to Source Tracking
    await SfdxFalconProject.initializeSourceTracking(projectPath, sfdxFPO);

    // Validate the overall configuration as specified by the config files we just resolved.
    await SfdxFalconProject.validateOverallConfig(sfdxFPO, opts);

    // The SFDX-Falcon Project Object should now be validated a a basic level. Return it to the caller.
    SfdxFalconDebug.obj(`${dbgNs}resolve:sfdxFPO:`, sfdxFPO, `sfdxFPO: `);
    return sfdxFPO;
  }


  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      resolveAggregatedSfdxConfig
   * @param       {string}  projectPath  Required. ???
   * @returns     {Promise<JsonMap>} ???
   * @description ???
   * @private @static @async
   */
  //───────────────────────────────────────────────────────────────────────────┘
  private static async resolveAggregatedSfdxConfig(projectPath:string):Promise<JsonMap> {

    // Resolve an SFDX Project from the provided project directory.
    const sfdxProject = await core.SfdxProject.resolve(projectPath);
    SfdxFalconDebug.obj(`${dbgNs}resolveAggregatedSfdxConfig:sfdxProject:`, sfdxProject, `sfdxProject: `);

    // Get the aggregated config (local, global, and sfdx-project.json) for the SFDX project.
    const sfdxAggregateConfig = await sfdxProject.resolveProjectConfig();
    SfdxFalconDebug.obj(`${dbgNs}resolveAggregatedSfdxConfig:sfdxAggregateConfig:`, sfdxAggregateConfig, `sfdxAggregateConfig: `);

    return sfdxAggregateConfig;
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      resolveGlobalSfdxFalconConfig
   * @returns     {Promise<SfdxFalconGlobalConfig>}  ???
   * @description ???
   * @private @static @async
   */
  //───────────────────────────────────────────────────────────────────────────┘
  private static async resolveGlobalSfdxFalconConfig():Promise<SfdxFalconGlobalConfig> {
    return {propertiesTBD: 'TBD'};
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      resolveLocalSfdxFalconConfig
   * @param       {string}  projectPath ???
   * @returns     {Promise<SfdxFalconLocalConfig>}  ???
   * @description ???
   * @private @static @async
   */
  //───────────────────────────────────────────────────────────────────────────┘
  private static async resolveSfdxFalconLocalConfig(projectPath:string):Promise<SfdxFalconLocalConfig> {

    // Build a ConfigOptions object that points to ./sfdx-falcon/sfdx-falcon-config.json.
    const configOptions = {
      rootFolder: path.join(projectPath, '.sfdx-falcon'),
      filename:   'sfdx-falcon-config.json',
      isGlobal:   false,
      isState:    false
    };
    SfdxFalconDebug.obj(`${dbgNs}resolveSfdxFalconLocalConfig:configOptions:`, configOptions, `configOptions: `);

    // Using the options set above, retrieve the local SFDX-Falcon Config file.
    const sfdxFalconLocalConfigFile = await core.ConfigFile.create(configOptions);

    // Make sure that the file actually exists on disk (as opposed to being created for us).
    if (await sfdxFalconLocalConfigFile.exists() === false) {
      const combinedPath = path.join(configOptions.rootFolder, configOptions.filename);
      throw new SfdxFalconError ( `Config file does not exist - ${combinedPath}`
                                , `FileNotFound`
                                , `${dbgNs}resolveSfdxFalconLocalConfig`);


    }
    SfdxFalconDebug.obj(`${dbgNs}resolveSfdxFalconLocalConfig:sfdxFalconLocalConfigFile:`, sfdxFalconLocalConfigFile, `falconLocalConfigFile: `);

    // Convert the SFDX-Falcon Local Config file to an object.
    const sfdxFalconLocalConfig:SfdxFalconLocalConfig = sfdxFalconLocalConfigFile.toObject() as unknown as SfdxFalconLocalConfig;
    SfdxFalconDebug.obj(`${dbgNs}resolveSfdxFalconLocalConfig:sfdxFalconLocalConfig:`, sfdxFalconLocalConfig, `sfdxFalconLocalConfig: `);

    // Return the local config object to the caller.
    return sfdxFalconLocalConfig;
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      initializeConfig
   * @param       {string}  projectPath Required. ???
   * @param       {SfdxFalconProject} sfdxFPO Required. ???
   * @param       {ProjectResolutionOptions}  opts  Required. ???
   * @returns     {Promise<void>} ???
   * @description Resolves various config files and saves copies of all relevant
   *              configuration JSON inside the given SFDX-Falcon Project Object.
   * @private @static @async
   */
  //───────────────────────────────────────────────────────────────────────────┘
  private static async initializeConfig(projectPath:string, sfdxFPO:SfdxFalconProject, opts:ProjectResolutionOptions):Promise<void> {
    
    // Resolve the aggregated config (local, global, and sfdx-project.json) for the SFDX project.
    sfdxFPO._sfdxAggregateConfig  = await SfdxFalconProject.resolveAggregatedSfdxConfig(projectPath);

    // Pull the SFDX-Falcon PROJECT Config out of the aggregated SFDX project config.
    sfdxFPO._falconProjectConfig  = opts.resolveProjectConfig ? sfdxFPO._sfdxAggregateConfig.plugins['sfdxFalcon'] : {};

    // Resolve the SFDX-Falcon LOCAL Config
    sfdxFPO._falconLocalConfig    = opts.resolveLocalConfig   ? await SfdxFalconProject.resolveSfdxFalconLocalConfig(projectPath) : {};

    // Resolve the GLOBAL SFDX-Falcon Config
    sfdxFPO._falconGlobalConfig   = opts.resolveGlobalConfig  ? await SfdxFalconProject.resolveGlobalSfdxFalconConfig() : {};
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      initializePaths
   * @param       {string}  projectPath  Required. ???
   * @param       {SfdxFalconProject} sfdxFPO  Required. ???
   * @returns     {Promise<void>} ???
   * @description Initializes all of the path variables inside the given SFDX-
   *              Falcon Project Object.
   * @private @static @async
   */
  //───────────────────────────────────────────────────────────────────────────┘
  private static async initializePaths(projectPath:string, sfdxFPO:SfdxFalconProject):Promise<void> {

    // We have a valid project configuration. Now we can set paths.
    sfdxFPO._projectPath      = projectPath;
    sfdxFPO._falconConfigPath = path.join(projectPath, `.sfdx-falcon`);
    sfdxFPO._templatesPath    = path.join(projectPath, `.templates`);
    sfdxFPO._configPath       = path.join(projectPath, `config`);
    sfdxFPO._mdapiSourcePath  = path.join(projectPath, `mdapi-source`);
    sfdxFPO._sfdxSourcePath   = path.join(projectPath, `sfdx-source`);
    sfdxFPO._dataPath         = path.join(projectPath, `data`);
    sfdxFPO._docsPath         = path.join(projectPath, `docs`);
    sfdxFPO._toolsPath        = path.join(projectPath, `tools`);
    sfdxFPO._tempPath         = path.join(projectPath, `temp`);
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      initializeSourceTracking
   * @param       {string}  projectPath  Required. ???
   * @param       {SfdxFalconProject} sfdxFPO  Required. ???
   * @returns     {Promise<void>} ???
   * @description Initializes all project variables related to source tracking.
   *              For now (ie. Aug 2018) this is more placeholder for future
   *              feature expansion than anything else.
   * @private @static @async
   */
  //───────────────────────────────────────────────────────────────────────────┘
  private static async initializeSourceTracking(projectPath:string, sfdxFPO:SfdxFalconProject):Promise<void> {

    // TODO: Implement this method (check if project is tracked by Git)
    // Find out if this project is currently tracked by Git
    sfdxFPO._trackedByGit = null;
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      validateFalconGlobalConfig
   * @param       {SfdxFalconProject}  sfdxFPO Required.
   * @returns     {boolean|string[]}  Returns TRUE if the GLOBAL config for
   *              SFDX-Falcon is valid. If not valid, returns an array of
   *              strings listing each key that had an invalid value.
   * @description ???
   * @private @static
   */
  //───────────────────────────────────────────────────────────────────────────┘
  private static validateFalconGlobalConfig(sfdxFPO:SfdxFalconProject):boolean|string[] {
    const invalidConfigKeys = new Array<string>();

    // Falcon Global config is not yet implemented. Keeping this here as a placeholder for future dev.
    //if (! sfdxFPO._falconGlobalConfig.xxxxxxxxxxx)     invalidConfigKeys.push('xxxxxxxxxxx');
    //if (! sfdxFPO._falconGlobalConfig.xxxxxxxxxxx)     invalidConfigKeys.push('xxxxxxxxxxx');
    //if (! sfdxFPO._falconGlobalConfig.xxxxxxxxxxx)     invalidConfigKeys.push('xxxxxxxxxxx');
    //if (! sfdxFPO._falconGlobalConfig.xxxxxxxxxxx)     invalidConfigKeys.push('xxxxxxxxxxx');
    //if (! sfdxFPO._falconGlobalConfig.xxxxxxxxxxx)     invalidConfigKeys.push('xxxxxxxxxxx');

    // These keys are optional.  Keeping them here commented out in case I require them later.
    //if (! sfdxFPO._falconGlobalConfig.xxxxxxxxxxx)     invalidConfigKeys.push('xxxxxxxxxxx');

    if (invalidConfigKeys.length > 0) {
      return invalidConfigKeys;
    }
    else {
      return true;
    }
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      validateFalconLocalConfig
   * @param       {SfdxFalconProject}  sfdxFPO Required.
   * @returns     {boolean|Array<string>}  Returns TRUE if the LOCAL config for
   *              SFDX-Falcon is valid. If not valid, returns an array of
   *              strings listing each key that had an invalid value.
   * @description ???
   * @private @static
   */
  //───────────────────────────────────────────────────────────────────────────┘
  private static validateFalconLocalConfig(sfdxFPO:SfdxFalconProject):boolean|string[] {
    const invalidConfigKeys = new Array<string>();

    if (! sfdxFPO._falconLocalConfig.devHubAlias)     invalidConfigKeys.push('devHubAlias');

    // These keys are optional.  Keeping them here commented out in case I require them later.
    //if (! sfdxFPO._falconLocalConfig.envHubAlias)     invalidConfigKeys.push('envHubAlias');

    if (invalidConfigKeys.length > 0) {
      return invalidConfigKeys;
    }
    else {
      return true;
    }
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      validateFalconProjectConfig
   * @param       {SfdxFalconProject}  sfdxFPO Required.
   * @returns     {boolean|Array<string>}  Returns TRUE if the PROJECT config
   *              for SFDX-Falcon is valid. If not valid, returns an array of
   *              strings listing each key that had an invalid value.
   * @description ???
   * @private @static
   */
  //───────────────────────────────────────────────────────────────────────────┘
  private static validateFalconProjectConfig(sfdxFPO:SfdxFalconProject):boolean|string[] {

    // Make sure there actually is a Falcon Project Config.
    if (typeof sfdxFPO._falconProjectConfig !== 'object') {
      throw new SfdxFalconError ( `${sfdxFPO.projectPath} does not contain a valid SFDX-Falcon project.`
                                , `InvalidSfdxFalconProject`
                                , `${dbgNs}validateFalconProjectConfig`);
    }

    const invalidConfigKeys = new Array<string>();

    if (! sfdxFPO._falconProjectConfig.projectAlias)    invalidConfigKeys.push('projectAlias');
    if (! sfdxFPO._falconProjectConfig.projectName)     invalidConfigKeys.push('projectName');
    if (! sfdxFPO._falconProjectConfig.projectType)     invalidConfigKeys.push('projectType');
    if (! sfdxFPO._falconProjectConfig.defaultRecipe)   invalidConfigKeys.push('defaultRecipe');
    if (! sfdxFPO._falconProjectConfig.projectVersion)  invalidConfigKeys.push('projectVersion');
    if (! sfdxFPO._falconProjectConfig.schemaVersion)   invalidConfigKeys.push('schemaVersion');
    if (! sfdxFPO._falconProjectConfig.pluginVersion)   invalidConfigKeys.push('pluginVersion');
    if (! sfdxFPO._falconProjectConfig.schemaVersion)   invalidConfigKeys.push('schemaVersion');

    // I'm thinking of making these optional keys. Commenting them out for now.
    //if (! sfdxFPO._falconProjectConfig.gitRemoteUri)    invalidConfigKeys.push('gitRemoteUri');
    //if (! sfdxFPO._falconProjectConfig.gitHubUrl)       invalidConfigKeys.push('gitHubUrl');
  
    if (invalidConfigKeys.length > 0) {
      return invalidConfigKeys;
    }
    else {
      return true;
    }
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      validateOverallConfig
   * @param       {SfdxFalconProject}  sfdxFPO Required. ???
   * @param       {ProjectResolutionOptions}  opts  Required. ???
   * @returns     {Promise<void>} ???
   * @description ???
   * @private @static @async
   */
  //───────────────────────────────────────────────────────────────────────────┘
  private static async validateOverallConfig(sfdxFPO:SfdxFalconProject, opts:ProjectResolutionOptions):Promise<void> {

    // Validate Falcon Project config
    if (opts.resolveProjectConfig) {
      const validationResponse = SfdxFalconProject.validateFalconProjectConfig(sfdxFPO);
      if (validationResponse !== true) {
        throw new SfdxFalconError ( `Configuration for "plugins.sfdxFalcon" in sfdx-project.json has missing/invalid settings (${validationResponse}).`
                                  , `InvalidConfig`
                                  , `${dbgNs}validateOverallConfig`);
      }
    }

    // Validate Falcon Local config
    if (opts.resolveLocalConfig) {
      const validationResponse = SfdxFalconProject.validateFalconLocalConfig(sfdxFPO);
      if (validationResponse !== true) {
        throw new SfdxFalconError ( `Configuration in ".sfdx-falcon/sfdx-falcon-config.json" has missing/invalid settings (${validationResponse}).`
                                  , `InvalidConfig`
                                  , `${dbgNs}validateOverallConfig`);
      }
    }

    // Validate Falcon Global config
    if (opts.resolveGlobalConfig) {
      const validationResponse = SfdxFalconProject.validateFalconGlobalConfig(sfdxFPO);
      if (validationResponse !== true) {
        throw new SfdxFalconError ( `Configuration in "~/.sfdx/sfdx-falcon-config.json" has missing/invalid settings (${validationResponse}).`
                                  , `InvalidConfig`
                                  , `${dbgNs}validateOverallConfig`);
      }
    }
  }

  // Keep references of all Parsed JSON config files in the SFDX-Falcon project.
  private _sfdxAggregateConfig: JsonMap;
          get sfdxAggregateConfig():JsonMap                   { return this._sfdxAggregateConfig; }
  private _falconProjectConfig: SfdxFalconProjectConfig;
          get falconProjectConfig():SfdxFalconProjectConfig   { return this._falconProjectConfig; }
  private _falconLocalConfig:   SfdxFalconLocalConfig;
          get falconLocalConfig():SfdxFalconLocalConfig       { return this._falconLocalConfig; }
  private _falconGlobalConfig:  SfdxFalconGlobalConfig;
          get falconGlobalConfig():SfdxFalconGlobalConfig     { return this._falconGlobalConfig; }

  // Make note of all the PATHS within the SFDX-Falcon project.
  private _projectPath: string;
          get projectPath():string                      { return this._projectPath; }
  private _falconConfigPath:  string;
          get falconConfigPath():string                 { return this._falconConfigPath; }
  private _templatesPath:     string;
          get templatesPath():string                    { return this._templatesPath; }
  private _configPath:        string;
          get configPath():string                       { return this._configPath; }
  private _mdapiSourcePath:   string;
          get mdapiSourcePath():string                  { return this._mdapiSourcePath; }
  private _sfdxSourcePath:    string;
          get sfdxSourcePath():string                   { return this._sfdxSourcePath; }
  private _dataPath:          string;
          get dataPath():string                         { return this._dataPath; }
  private _docsPath:          string;
          get docsPath():string                         { return this._docsPath; }
  private _toolsPath:         string;
          get toolsPath():string                        { return this._toolsPath; }
  private _tempPath:          string;
          get tempPath():string                         { return this._tempPath; }
          
  // Git / VCS related project properties
  private _trackedByGit:      string;
          get trackedByGit():string                     { return this._trackedByGit; }


  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @constructs  SfdxFalconProject
   * @description Private constructor. Should only be called by resolve().
   * @private
   */
  //───────────────────────────────────────────────────────────────────────────┘
  private constructor() {
    // Intentionally empty. Use resolve() to instantiate.
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      runChosenRecipe
   * @param       {JsonMap} [compileOptions]  Optional. Object containing
   *              options/overrides that are relevant to the Engine that the
   *              Recipe is specified to use.
   * @param       {JsonMap} [executionOptions]  Optional. Object containing any
   *              options/overrides that are relevant when the Recipe's
   *              execute() method is called.
   * @returns     {Promise<SfdxFalconResult>}  Resolves with a fully
   *              populated SFDX-Falcon Recipe Result on success or bubbles
   *              up thrown errors that should be caught and handled by the
   *              caller.
   * @description Usses the console to present the user with choices of recipe
   *              to run based on either the "demo recipes" or "developer recipes"
   *              key in the respective "appxPackage" or "appxDemo" keys.
   * @public @async
   */
  //───────────────────────────────────────────────────────────────────────────┘
  public async runChosenRecipe(compileOptions:JsonMap={}, executionOptions:JsonMap={}):Promise<SfdxFalconResult> {
    throw new SfdxFalconError ( `Method runChosenRecipe() is not yet implemented`
                              , `NotImplemented`
                              , `${dbgNs}runChosenRecipe`);
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      runDefaultRecipe
   * @param       {JsonMap} [compileOptions]  Optional. Object containing
   *              options/overrides that are relevant to the Engine that the
   *              Recipe is specified to use.
   * @param       {JsonMap} [executionOptions]  Optional. Object containing any
   *              options/overrides that are relevant when the Recipe's
   *              execute() method is called.
   * @returns     {Promise<SfdxFalconResult>}  Resolves with a fully
   *              populated SFDX-Falcon Recipe Result on success or bubbles
   *              up thrown errors that should be caught and handled by the
   *              caller.
   * @description ???
   * @public @async
   */
  //───────────────────────────────────────────────────────────────────────────┘
  public async runDefaultRecipe(compileOptions:JsonMap={}, executionOptions:JsonMap={}):Promise<SfdxFalconResult> {

    // Get the name of the default recipe from the internally held Falcon Project Config.
    const recipeName = this._falconProjectConfig.defaultRecipe;
    return await this.compileAndRunRecipe(recipeName, compileOptions, executionOptions);
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      runSpecifiedRecipe
   * @param       {string}  recipeName  Required. Name of the .json Recipe file
   *              as found within the Config Path of this project.
   * @param       {JsonMap} [compileOptions]  Optional. Object containing
   *              options/overrides that are relevant to the Engine that the
   *              Recipe is specified to use.
   * @param       {JsonMap} [executionOptions]  Optional. Object containing any
   *              options/overrides that are relevant when the Recipe's
   *              execute() method is called.
   * @returns     {Promise<SfdxFalconRecipeResponse>}  Resolves with a fully
   *              populated SFDX-Falcon Recipe Result on success or bubbles
   *              up thrown errors that should be caught and handled by the
   *              caller.
   * @description ???
   * @public @async
   */
  //───────────────────────────────────────────────────────────────────────────┘
  public async runSpecifiedRecipe(recipeName:string, compileOptions:JsonMap={}, executionOptions:JsonMap={}):Promise<SfdxFalconResult> {

    // Run the recipe specified by the caller. Recipe file must be found in the config directory.
    return await this.compileAndRunRecipe(recipeName, compileOptions, executionOptions);
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      compileAndRunRecipe
   * @param       {string}  recipeName  Required. Name of the .json Recipe file
   *              as found within the Config Path of this project.
   * @param       {JsonMap} [compileOptions]  Optional. Object containing
   *              options/overrides that are relevant to the Engine that the
   *              Recipe is specified to use.
   * @param       {JsonMap} [executionOptions]  Optional. Object containing any
   *              options/overrides that are relevant when the Recipe's
   *              execute() method is called.
   * @returns     {Promise<SfdxFalconResult>}  Resolves with a fully populated
   *              SFDX-Falcon RECIPE Result on success or bubbles up thrown
   *              errors that should be caught and handled by the caller.
   * @description Compiles and runs the recipe
   * @private @async
   */
  //───────────────────────────────────────────────────────────────────────────┘
  private async compileAndRunRecipe(recipeName:string, compileOptions:JsonMap={}, executionOptions:JsonMap={}):Promise<SfdxFalconResult> {

    // Read the specified Recipe.
    const recipeToRun = await SfdxFalconRecipe.read(this, recipeName);

    // Compile the Recipe.
    await recipeToRun.compile(compileOptions);

    // Execute the Recipe
    return await recipeToRun.execute(executionOptions);
  }
}
