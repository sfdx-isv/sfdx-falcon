//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @file          modules/sfdx-falcon-project/index.ts
 * @copyright     Vivek M. Chawla - 2018
 * @author        Vivek M. Chawla <@VivekMChawla>
 * @summary       ???
 * @description   ???
 * @version       1.0.0
 * @license       MIT
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
// External Imports
import * as core                    from  '@salesforce/core';                 // Library. Allows us to use SFDX core functionality.
import * as path                    from  'path';                             // Library. Node's built-in path library.
// Local Imports
import {SfdxFalconDebug}            from  '../../modules/sfdx-falcon-debug';  // Class. Internal Debug module
import {SfdxFalconRecipe}           from  '../sfdx-falcon-recipe';            // Class. Allows you to read, compile, and run an SFDX-Falcon Recipe.
import {SfdxFalconRecipeResult}     from  '../sfdx-falcon-recipe';            // Interface. Represents the result of running an SFDX-Falcon Recipe.

// Set the File Local Debug Namespace
const dbgNs     = 'sfdx-falcon-project:';
const clsDbgNs  = 'SfdxFalconProject:';

//─────────────────────────────────────────────────────────────────────────────┐
// SFDX Falcon Config (Project, Local, and Global)
//─────────────────────────────────────────────────────────────────────────────┘
export interface SfdxFalconProjectConfig {
  projectAlias:   string;                   // eg. 'my-sfdx-falcon-project'
  projectName:    string;                   // eg. 'My SFDX Falcon Project'
  projectType:    string;                   // 'managed-package' | 'adk-single-demo' | 'adk-multi-demo'
  gitRemoteUri?:  string;                   // eg. 'https://github.com/my-org/my-sfdx-falcon-project.git'
  gitHubUrl?:     string;                   // eg. 'https://github.com/my-org/my-sfdx-falcon-project'
  defaultRecipe:  string;                   // eg. 'demo-recipe-1.json'
  projectVersion: string;                   // eg. '1.5.1'
  schemaVersion:  string;                   // eg. '1.0.0'
  pluginVersion:  string;                   // eg. '1.0.0'
  appxPackage?:   AppxPackageProjectConfig;
  appxDemo?:      AppxDemoProjectConfig;
}
export interface SfdxFalconLocalConfig {
  devHubAlias:    string;                   // eg. 'My_DevHub'
  envHubAlias?:   string;                   // eg. 'My_EnvHub'
  appxPackage?:   AppxPackageLocalConfig;
  appxDemo?:      AppxDemoLocalConfig;
}
export interface SfdxFalconGlobalConfig {
  propertiesTBD: any;
}

//─────────────────────────────────────────────────────────────────────────────┐
// AppxDemo Config (Project and Local)
//─────────────────────────────────────────────────────────────────────────────┘
export interface AppxDemoProjectConfig {
  demoRecipes:      Array<string>;          // eg. ['demo-recipe-1.json', 'demo-recipe-2.json']
  partnerAlias:     string;                 // eg. 'appy-inc'
  partnerName:      string;                 // eg. 'Appy Apps, Incorporated'
}
export interface AppxDemoLocalConfig {
  propertiesTBD: any;
}

//─────────────────────────────────────────────────────────────────────────────┐
// AppxPackage Config (Project and Local)
//─────────────────────────────────────────────────────────────────────────────┘
export interface AppxPackageProjectConfig {
  developerRecipes:   Array<string>;        // eg. ['developer-recipe-1.json', 'developer-recipe-2.json']
  namespacePrefix:    string;               // eg. 'my_ns_prefix'
  packageName:        string;               // eg. 'My Package Name'
  metadataPackageId:  string;               // eg. '033000000000000'
  packageVersionId: {
    stable: string;                         // eg. '04t111111111111'
    beta:   string;                         // eg. '04t222222222222'
  }
}
export interface AppxPackageLocalConfig {
  propertiesTBD: any;
}

//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @class       SfdxFalconProject
 * @access      public
 * @version     1.0.0
 * @summary     ????
 * @description ????
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
export class SfdxFalconProject {

  // Keep references of all Parsed JSON config files in the SFDX-Falcon project.
  private _sfdxAggregateConfig:any;
          get sfdxAggregateConfig():any                       {return this._sfdxAggregateConfig}
  private _falconProjectConfig:SfdxFalconProjectConfig;
          get falconProjectConfig():SfdxFalconProjectConfig   {return this._falconProjectConfig}
  private _falconLocalConfig:SfdxFalconLocalConfig;
          get falconLocalConfig():SfdxFalconLocalConfig       {return this._falconLocalConfig}
  private _falconGlobalConfig:SfdxFalconGlobalConfig;
          get falconGlobalConfig():SfdxFalconGlobalConfig     {return this._falconGlobalConfig}

  // Make note of all the PATHS within the SFDX-Falcon project.
  private _projectPath:string;
          get projectPath():string                      {return this._projectPath}
  private _falconConfigPath:string;
          get falconConfigPath():string                 {return this._falconConfigPath}
  private _templatesPath:string;
          get templatesPath():string                    {return this._templatesPath}
  private _configPath:string;
          get configPath():string                       {return this._configPath}
  private _mdapiSourcePath:string;
          get mdapiSourcePath():string                  {return this._mdapiSourcePath}
  private _sfdxSourcePath:string;
          get sfdxSourcePath():string                   {return this._sfdxSourcePath}
  private _dataPath:string;
          get dataPath():string                         {return this._dataPath}
  private _docsPath:  string;
          get docsPath():string                         {return this._docsPath}
  private _toolsPath:  string;
          get toolsPath():string                        {return this._toolsPath}
  private _tempPath:  string;
          get tempPath():string                         {return this._tempPath}

  // Git / VCS related project properties
  private _trackedByGit:  string;
          get trackedByGit():string                     {return this._trackedByGit}


  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @constructs  SfdxFalconProject
   * @description Private constructor. Should only be called by resolve().
   * @version     1.0.0
   * @private
   */
  //───────────────────────────────────────────────────────────────────────────┘
  private constructor() {
    // Intentionally empty. Use resolve() to instantiate .
  }

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
   * @version     1.0.0
   * @public @static @async
   */
  //───────────────────────────────────────────────────────────────────────────┘
  public static async resolve(projectPath:string):Promise<SfdxFalconProject> {

    // Instantiate an SfdxFalconProject Object
    let sfdxFPO = new SfdxFalconProject();

    // Initialize project configuration variables
    await SfdxFalconProject.initializeConfig(projectPath, sfdxFPO);

    // Initialize the paths for this project (all are relative to Project Path).
    await SfdxFalconProject.initializePaths(projectPath, sfdxFPO);

    // Initialize anything related to Source Tracking
    await SfdxFalconProject.initializeSourceTracking(projectPath, sfdxFPO);

    // Validate the overall configuration as specified by the config files we just resolved.
    await SfdxFalconProject.validateOverallConfig(sfdxFPO);

    // The SFDX-Falcon Project Object should now be validated a a basic level. Return it to the caller.
    SfdxFalconDebug.obj(`FALCON_XL:${dbgNs}`, sfdxFPO, `${clsDbgNs}resolve:sfdxFPO: `);
    return sfdxFPO;
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      resolveAggregatedSfdxConfig
   * @param       {string}  projectPath  Required. ???
   * @returns     {Promise<object>} ???
   * @description ???
   * @version     1.0.0
   * @private @static @async
   */
  //───────────────────────────────────────────────────────────────────────────┘
  private static async resolveAggregatedSfdxConfig(projectPath:string):Promise<object> {

    // Resolve an SFDX Project from the provided project directory.
    let sfdxProject = await core.SfdxProject.resolve(projectPath);
    SfdxFalconDebug.obj(`FALCON_XL:${dbgNs}`, sfdxProject, `${clsDbgNs}:resolveAggregatedSfdxConfig:sfdxProject: `);

    // Get the aggregated config (local, global, and sfdx-project.json) for the SFDX project.
    let sfdxAggregateConfig = await sfdxProject.resolveProjectConfig();
    SfdxFalconDebug.obj(`FALCON_XL:${dbgNs}`, sfdxAggregateConfig, `${clsDbgNs}resolveAggregatedSfdxConfig:sfdxAggregateConfig: `);

    return sfdxAggregateConfig;
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      resolveGlobalSfdxFalconConfig
   * @returns     {Promise<SfdxFalconGlobalConfig>}  ???
   * @description ???
   * @version     1.0.0
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
   * @version     1.0.0
   * @private @static @async
   */
  //───────────────────────────────────────────────────────────────────────────┘
  private static async resolveSfdxFalconLocalConfig(projectPath:string):Promise<SfdxFalconLocalConfig> {

    // Build a ConfigOptions object that points to ./sfdx-falcon/sfdx-falcon-config.json.
    let configOptions = {
      rootFolder: path.join(projectPath, '.sfdx-falcon'),
      filename:   'sfdx-falcon-config.json',
      isGlobal:   false,
      isState:    false,
    }
    SfdxFalconDebug.obj(`FALCON_XL:${dbgNs}`, configOptions, `${clsDbgNs}resolveSfdxFalconLocalConfig:configOptions: `);

    // Using the options set above, retrieve the local SFDX-Falcon Config file.
    let sfdxFalconLocalConfigFile = await core.ConfigFile.retrieve(configOptions);

    // Make sure that the file actually exists on disk (as opposed to being created for us).
    if (await sfdxFalconLocalConfigFile.exists() === false) {
      let combinedPath = path.join(configOptions.rootFolder, configOptions.filename);
      throw new Error(`ERROR_CONFIG_NOT_FOUND: File does not exist - ${combinedPath}`);
    }
    SfdxFalconDebug.obj(`FALCON_XL:${dbgNs}`, sfdxFalconLocalConfigFile, `${clsDbgNs}resolveSfdxFalconLocalConfig:falconLocalConfigFile: `);

    // Convert the SFDX-Falcon Local Config file to an object.
    let sfdxFalconLocalConfig:SfdxFalconLocalConfig = sfdxFalconLocalConfigFile.toObject() as any;
    SfdxFalconDebug.obj(`FALCON_XL:${dbgNs}`, sfdxFalconLocalConfig, `${clsDbgNs}resolveSfdxFalconLocalConfig:sfdxFalconLocalConfig: `);

    // Return the local config object to the caller.
    return sfdxFalconLocalConfig;
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      initializeConfig
   * @param       {string}  projectPath Required. ???
   * @param       {SfdxFalconProject} sfdxFPO Required. ???
   * @returns     {Promise<void>} ???
   * @description Resolves various config files and saves copies of all relevant
   *              configuration JSON inside the given SFDX-Falcon Project Object.
   * @version     1.0.0
   * @private @static @async
   */
  //───────────────────────────────────────────────────────────────────────────┘
  private static async initializeConfig(projectPath:string, sfdxFPO:SfdxFalconProject):Promise<void> {
    
    // Resolve the aggregated config (local, global, and sfdx-project.json) for the SFDX project.
    sfdxFPO._sfdxAggregateConfig  = await SfdxFalconProject.resolveAggregatedSfdxConfig(projectPath);

    // Pull the SFDX-Falcon Project Config out of the aggregated SFDX project config.
    sfdxFPO._falconProjectConfig  = sfdxFPO._sfdxAggregateConfig.plugins.sfdxFalcon;

    // Resolve the LOCAL SFDX-Falcon Config
    sfdxFPO._falconLocalConfig    = await SfdxFalconProject.resolveSfdxFalconLocalConfig(projectPath);

    // Resolve the GLOBAL SFDX-Falcon Config
    sfdxFPO._falconGlobalConfig   = await SfdxFalconProject.resolveGlobalSfdxFalconConfig();
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      initializePaths
   * @param       {string}  projectPath  Required. ???
   * @param       {SfdxFalconProject} sfdxFPO  Required. ???
   * @returns     {Promise<void>} ???
   * @description Initializes all of the path variables inside the given SFDX-
   *              Falcon Project Object.
   * @version     1.0.0
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
   * @version     1.0.0
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
   * @method      compileAndRunRecipe
   * @param       {string}  recipeName  Required. Name of the .json Recipe file
   *              as found within the Config Path of this project.
   * @param       {any}     [compileOptions]  Optional. Object containing
   *              options/overrides that are relevant to the Engine that the 
   *              Recipe is specified to use.
   * @param       {any}     [executionOptions]  Optional. Object containing any
   *              options/overrides that are relevant when the Recipe's
   *              execute() method is called.
   * @returns     {Promise<SfdxFalconRecipeResult>}  Resolves with a fully 
   *              populated SFDX-Falcon Recipe Result on success or bubbles
   *              up thrown errors that should be caught and handled by the
   *              caller.
   * @description Compiles and runs the recipe
   * @version     1.0.0
   * @private @async
   */
  //───────────────────────────────────────────────────────────────────────────┘
  private async compileAndRunRecipe(recipeName:string, compileOptions:any={}, executionOptions:any={}):Promise<SfdxFalconRecipeResult> {

    // Read the specified Recipe.
    let recipeToRun = await SfdxFalconRecipe.read(this, recipeName);

    // Compile the Recipe.
    await recipeToRun.compile(compileOptions);

    // Execute the Recipe
    return await recipeToRun.execute(executionOptions);
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      runChosenRecipe
   * @param       {any}     [compileOptions]  Optional. Object containing
   *              options/overrides that are relevant to the Engine that the 
   *              Recipe is specified to use.
   * @param       {any}     [executionOptions]  Optional. Object containing any
   *              options/overrides that are relevant when the Recipe's
   *              execute() method is called.
   * @returns     {Promise<SfdxFalconRecipeResult>}  Resolves with a fully 
   *              populated SFDX-Falcon Recipe Result on success or bubbles
   *              up thrown errors that should be caught and handled by the
   *              caller.
   * @description Usses the console to present the user with choices of recipe
   *              to run based on either the "demo recipes" or "developer recipes"
   *              key in the respective "appxPackage" or "appxDemo" keys.
   * @version     1.0.0
   * @public @async
   */
  //───────────────────────────────────────────────────────────────────────────┘
  public async runChosenRecipe(compileOptions:any={}, executionOptions:any={}):Promise<SfdxFalconRecipeResult> {

    throw new Error(`ERROR_NOT_IMPLEMENTED: Method runChosenRecipe() is not yet implemented`);

  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      runDefaultRecipe
   * @param       {any}     [compileOptions]  Optional. Object containing
   *              options/overrides that are relevant to the Engine that the 
   *              Recipe is specified to use.
   * @param       {any}     [executionOptions]  Optional. Object containing any
   *              options/overrides that are relevant when the Recipe's
   *              execute() method is called.
   * @returns     {Promise<SfdxFalconRecipeResult>}  Resolves with a fully 
   *              populated SFDX-Falcon Recipe Result on success or bubbles
   *              up thrown errors that should be caught and handled by the
   *              caller.
   * @description ???
   * @version     1.0.0
   * @public @async
   */
  //───────────────────────────────────────────────────────────────────────────┘
  public async runDefaultRecipe(compileOptions:any={}, executionOptions:any={}):Promise<SfdxFalconRecipeResult> {

    // Get the name of the default recipe from the internally held Falcon Project Config.
    let recipeName = this._falconProjectConfig.defaultRecipe;
    return await this.compileAndRunRecipe(recipeName, compileOptions, executionOptions);
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      runSpecifiedRecipe
   * @param       {string}  recipeName  Required. Name of the .json Recipe file
   *              as found within the Config Path of this project.
   * @param       {any}     [compileOptions]  Optional. Object containing
   *              options/overrides that are relevant to the Engine that the 
   *              Recipe is specified to use.
   * @param       {any}     [executionOptions]  Optional. Object containing any
   *              options/overrides that are relevant when the Recipe's
   *              execute() method is called.
   * @returns     {Promise<SfdxFalconRecipeResult>}  Resolves with a fully 
   *              populated SFDX-Falcon Recipe Result on success or bubbles
   *              up thrown errors that should be caught and handled by the
   *              caller.
   * @description ???
   * @version     1.0.0
   * @public @async
   */
  //───────────────────────────────────────────────────────────────────────────┘
  public async runSpecifiedRecipe(recipeName:string, compileOptions:any={}, executionOptions:any={}):Promise<SfdxFalconRecipeResult> {

    // Run the recipe specified by the caller. Recipe file must be found in the config directory.
    return await this.compileAndRunRecipe(recipeName, compileOptions, executionOptions);
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      validateFalconGlobalConfig
   * @param       {SfdxFalconProject}  sfdxFPO Required.
   * @returns     {boolean|Array<string>}  Returns TRUE if the GLOBAL config for
   *              SFDX-Falcon is valid. If not valid, returns an array of 
   *              strings listing each key that had an invalid value.
   * @description ???
   * @version     1.0.0
   * @private @static
   */
  //───────────────────────────────────────────────────────────────────────────┘
  private static validateFalconGlobalConfig(sfdxFPO:SfdxFalconProject):boolean|Array<string> {
    let invalidConfigKeys = new Array<string>();

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
   * @version     1.0.0
   * @private @static
   */
  //───────────────────────────────────────────────────────────────────────────┘
  private static validateFalconLocalConfig(sfdxFPO:SfdxFalconProject):boolean|Array<string> {
    let invalidConfigKeys = new Array<string>();

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
   * @version     1.0.0
   * @private @static
   */
  //───────────────────────────────────────────────────────────────────────────┘
  private static validateFalconProjectConfig(sfdxFPO:SfdxFalconProject):boolean|Array<string> {
    let invalidConfigKeys = new Array<string>();

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
   * @returns     {Promise<void>} ???
   * @description ???
   * @version     1.0.0
   * @private @static @async
   */
  //───────────────────────────────────────────────────────────────────────────┘
  private static async validateOverallConfig(sfdxFPO:SfdxFalconProject):Promise<void> {

    // Validate Falcon Project config
    let validationResponse = SfdxFalconProject.validateFalconProjectConfig(sfdxFPO);
    if (validationResponse !== true) {
      throw new Error(`ERROR_INVALID_CONFIG: Configuration for "plugins.sfdxFalcon" in sfdx-project.json has missing/invalid settings (${validationResponse}).`)
    }

    // Validate Falcon Local config
    validationResponse = SfdxFalconProject.validateFalconLocalConfig(sfdxFPO);
    if (validationResponse !== true) {
      throw new Error(`ERROR_INVALID_CONFIG: Configuration in ".sfdx-falcon/sfdx-falcon-config.json" has missing/invalid settings (${validationResponse}).`)
    }

    // Validate Falcon Global config
    validationResponse = SfdxFalconProject.validateFalconGlobalConfig(sfdxFPO);
    if (validationResponse !== true) {
      throw new Error(`ERROR_INVALID_CONFIG: Configuration in "~/.sfdx/sfdx-falcon-config.json" has missing/invalid settings (${validationResponse}).`)
    }
  }
}