//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @file          modules/sfdx-falcon-projects/index.ts
 * @copyright     Vivek M. Chawla - 2018
 * @author        Vivek M. Chawla <@VivekMChawla>
 * @summary       ???
 * @description   ???
 * @requires      module:???
 * @version       1.0.0
 * @license       MIT
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
// External Imports
import * as core                    from  '@salesforce/core';             // Allows us to use SFDX core functionality.
import * as path                    from  'path';                         // Node's path library.

// Local Imports
import {SfdxFalconDebug}                from  '../../modules/sfdx-falcon-debug';     // Why?


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
 * @class       SfdxFalconProjectContext
 * @access      public
 * @version     1.0.0
 * @summary     ????
 * @description ????
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
export class SfdxFalconProjectContext {

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
  private _configPath:string;
          get configPath():string                       {return this._configPath}
  private _mdapiSourcePath:string;
          get mdapiSourcePath():string                  {return this._mdapiSourcePath}
  private _sfdxSourcePath:string;
          get sfdxSourcePath():string                   {return this._sfdxSourcePath}
  private _dataPath:string;
          get dataPath():string                         {return this._dataPath}
  private _shellToolsPath:  string;
          get shellToolsPath():string                   {return this._shellToolsPath}

  // TODO: Any other project-level config?

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @constructs  SfdxFalconProjectContext
   * @description Private constructor. Should only be called by resolve().
   * @version     1.0.0
   * @private
   */
  //───────────────────────────────────────────────────────────────────────────┘
  private constructor() {
    // All object initialization tasks are handled inside resolve().
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      resolve
   * @param       {string}  projectDirectory  Required. ???
   * @param       {string}  [recipeOverride]  Optional. ???
   * @returns     {Promise<SfdxFalconProjectContext>} Resolves with an instance
   *              of an SfdxFalconProjectContext object that represents the
   *              project found at the projectRoot using a combination of SFDX
   *              and SFDX-Falcon config files.
   * @description Given the path to an SFDX-Falcon project directory, 
   *              initializes an SfdxFalconProjectContext object and returns
   *              it to the caller.
   * @version     1.0.0
   * @public @static @async
   */
  //───────────────────────────────────────────────────────────────────────────┘
  public static async resolve(projectDirectory:string, recipeOverride:string=''):Promise<SfdxFalconProjectContext> {

    // Instantiate an SfdxFalconProjectContext object
    let sfdxFPC = new SfdxFalconProjectContext();

    // Resolve the aggregated config (local, global, and sfdx-project.json) for the SFDX project.
    sfdxFPC._sfdxAggregateConfig  = await SfdxFalconProjectContext.resolveAggregatedSfdxConfig(projectDirectory);

    // Pull the SFDX-Falcon Project Config out of the aggregated SFDX project config.
    sfdxFPC._falconProjectConfig  = sfdxFPC._sfdxAggregateConfig.plugins.sfdxFalcon;

    // Resolve the LOCAL SFDX-Falcon Config
    sfdxFPC._falconLocalConfig    = await SfdxFalconProjectContext.resolveSfdxFalconLocalConfig(projectDirectory);

    // Resolve the GLOBAL SFDX-Falcon Config
    sfdxFPC._falconGlobalConfig   = await SfdxFalconProjectContext.resolveGlobalSfdxFalconConfig();

    // If a recipeOverride was passed in, assign it to the new SFDX Falcon Project Context.
    if (recipeOverride) {
      sfdxFPC._falconProjectConfig.defaultRecipe = recipeOverride;
      SfdxFalconDebug.str('FALCON_XL:sfdx-falcon-projects', recipeOverride, `SfdxFalconProjectContext:resolve:recipeOverride: `);
    }

    // Validate the overall configuration as specified by the config files we just resolved.
    SfdxFalconProjectContext.validateOverallConfig(sfdxFPC);
    
    // The SFDX-Falcon Project Context should now be verified a a basic level. Return it to the caller.
    SfdxFalconDebug.obj('FALCON_XL:sfdx-falcon-projects', sfdxFPC, `SfdxFalconProjectContext:resolve:sfdxFPC: `);
    return sfdxFPC;
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      resolveAggregatedSfdxConfig
   * @param       {string}  projectDirectory  Required. ???
   * @returns     {Promise<object>} ???
   * @description ???
   * @version     1.0.0
   * @private @static @async
   */
  //───────────────────────────────────────────────────────────────────────────┘
  private static async resolveAggregatedSfdxConfig(projectDirectory:string):Promise<object> {

    // Resolve an SFDX Project from the provided project directory.
    let sfdxProject = await core.SfdxProject.resolve(projectDirectory);
    SfdxFalconDebug.obj('FALCON_XL:sfdx-falcon-projects', sfdxProject, `SfdxFalconProjectContext:resolveAggregatedSfdxConfig:sfdxProject: `);

    // Get the aggregated config (local, global, and sfdx-project.json) for the SFDX project.
    let sfdxAggregateConfig = await sfdxProject.resolveProjectConfig();
    SfdxFalconDebug.obj('FALCON_XL:sfdx-falcon-projects', sfdxAggregateConfig, `SfdxFalconProjectContext:resolveAggregatedSfdxConfig:sfdxAggregateConfig: `);

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
    SfdxFalconDebug.obj('FALCON_XL:sfdx-falcon-projects', configOptions, `SfdxFalconProjectContext:resolveSfdxFalconLocalConfig:configOptions: `);

    // Using the options set above, retrieve the local SFDX-Falcon Config file.
    let sfdxFalconLocalConfigFile = await core.ConfigFile.retrieve(configOptions);

    // Make sure that the file actually exists on disk (as opposed to being created for us).
    if (await sfdxFalconLocalConfigFile.exists() === false) {
      let combinedPath = path.join(configOptions.rootFolder, configOptions.filename);
      throw new Error(`ERROR_CONFIG_NOT_FOUND: File does not exist - ${combinedPath}`);
    }
    SfdxFalconDebug.obj('FALCON_XL:sfdx-falcon-projects', sfdxFalconLocalConfigFile, `SfdxFalconProjectContext:resolveSfdxFalconLocalConfig:falconLocalConfigFile: `);

    // Convert the SFDX-Falcon Local Config file to an object.
    let sfdxFalconLocalConfig:SfdxFalconLocalConfig = sfdxFalconLocalConfigFile.toObject() as any;
    SfdxFalconDebug.obj('FALCON_XL:sfdx-falcon-projects', sfdxFalconLocalConfig, `SfdxFalconProjectContext:resolveSfdxFalconLocalConfig:sfdxFalconLocalConfig: `);

    // Return the local config object to the caller.
    return sfdxFalconLocalConfig;
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      validateFalconGlobalConfig
   * @param       {SfdxFalconProjectContext}  sfdxFPC Required.
   * @returns     {boolean|Array<string>}  Returns TRUE if the GLOBAL config for
   *              SFDX-Falcon is valid. If not valid, returns an array of 
   *              strings listing each key that had an invalid value.
   * @description ???
   * @version     1.0.0
   * @private @static
   */
  //───────────────────────────────────────────────────────────────────────────┘
  private static validateFalconGlobalConfig(sfdxFPC:SfdxFalconProjectContext):boolean|Array<string> {
    let invalidConfigKeys = new Array<string>();

    // Falcon Global config is not yet implemented. Keeping this here as a placeholder for future dev.
    //if (! sfdxFPC._falconGlobalConfig.xxxxxxxxxxx)     invalidConfigKeys.push('xxxxxxxxxxx');
    //if (! sfdxFPC._falconGlobalConfig.xxxxxxxxxxx)     invalidConfigKeys.push('xxxxxxxxxxx');
    //if (! sfdxFPC._falconGlobalConfig.xxxxxxxxxxx)     invalidConfigKeys.push('xxxxxxxxxxx');
    //if (! sfdxFPC._falconGlobalConfig.xxxxxxxxxxx)     invalidConfigKeys.push('xxxxxxxxxxx');
    //if (! sfdxFPC._falconGlobalConfig.xxxxxxxxxxx)     invalidConfigKeys.push('xxxxxxxxxxx');

    // These keys are optional.  Keeping them here commented out in case I require them later.
    //if (! sfdxFPC._falconGlobalConfig.xxxxxxxxxxx)     invalidConfigKeys.push('xxxxxxxxxxx');

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
   * @param       {SfdxFalconProjectContext}  sfdxFPC Required.
   * @returns     {boolean|Array<string>}  Returns TRUE if the LOCAL config for
   *              SFDX-Falcon is valid. If not valid, returns an array of 
   *              strings listing each key that had an invalid value.
   * @description ???
   * @version     1.0.0
   * @private @static
   */
  //───────────────────────────────────────────────────────────────────────────┘
  private static validateFalconLocalConfig(sfdxFPC:SfdxFalconProjectContext):boolean|Array<string> {
    let invalidConfigKeys = new Array<string>();

    if (! sfdxFPC._falconLocalConfig.devHubAlias)     invalidConfigKeys.push('devHubAlias');

    // These keys are optional.  Keeping them here commented out in case I require them later.
    //if (! sfdxFPC._falconLocalConfig.envHubAlias)     invalidConfigKeys.push('envHubAlias');

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
   * @param       {SfdxFalconProjectContext}  sfdxFPC Required.
   * @returns     {boolean|Array<string>}  Returns TRUE if the PROJECT config
   *              for SFDX-Falcon is valid. If not valid, returns an array of 
   *              strings listing each key that had an invalid value.
   * @description ???
   * @version     1.0.0
   * @private @static
   */
  //───────────────────────────────────────────────────────────────────────────┘
  private static validateFalconProjectConfig(sfdxFPC:SfdxFalconProjectContext):boolean|Array<string> {
    let invalidConfigKeys = new Array<string>();

    if (! sfdxFPC._falconProjectConfig.projectAlias)    invalidConfigKeys.push('projectAlias');
    if (! sfdxFPC._falconProjectConfig.projectName)     invalidConfigKeys.push('projectName');
    if (! sfdxFPC._falconProjectConfig.projectType)     invalidConfigKeys.push('projectType');
    if (! sfdxFPC._falconProjectConfig.defaultRecipe)   invalidConfigKeys.push('defaultRecipe');
    if (! sfdxFPC._falconProjectConfig.projectVersion)  invalidConfigKeys.push('projectVersion');
    if (! sfdxFPC._falconProjectConfig.schemaVersion)   invalidConfigKeys.push('schemaVersion');
    if (! sfdxFPC._falconProjectConfig.pluginVersion)   invalidConfigKeys.push('pluginVersion');
    if (! sfdxFPC._falconProjectConfig.schemaVersion)   invalidConfigKeys.push('schemaVersion');

    // I'm thinking of making these optional keys. Commenting them out for now.
    //if (! sfdxFPC._falconProjectConfig.gitRemoteUri)    invalidConfigKeys.push('gitRemoteUri');
    //if (! sfdxFPC._falconProjectConfig.gitHubUrl)       invalidConfigKeys.push('gitHubUrl');
  
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
   * @param       {SfdxFalconProjectContext}  sfdxFPC Required. ???
   * @returns     {void}  ???
   * @description ???
   * @version     1.0.0
   * @private @static
   */
  //───────────────────────────────────────────────────────────────────────────┘
  private static validateOverallConfig(sfdxFPC:SfdxFalconProjectContext):void {

    // Validate Falcon Project config
    let validationResponse = SfdxFalconProjectContext.validateFalconProjectConfig(sfdxFPC);
    if (validationResponse !== true) {
      throw new Error(`ERROR_INVALID_CONFIG: Configuration for "plugins.sfdxFalcon" in sfdx-project.json has missing/invalid settings (${validationResponse}).`)
    }

    // Validate Falcon Local config
    validationResponse = SfdxFalconProjectContext.validateFalconLocalConfig(sfdxFPC);
    if (validationResponse !== true) {
      throw new Error(`ERROR_INVALID_CONFIG: Configuration in ".sfdx-falcon/sfdx-falcon-config.json" has missing/invalid settings (${validationResponse}).`)
    }

    // Validate Falcon Global config
    validationResponse = SfdxFalconProjectContext.validateFalconGlobalConfig(sfdxFPC);
    if (validationResponse !== true) {
      throw new Error(`ERROR_INVALID_CONFIG: Configuration in "~/.sfdx/sfdx-falcon-config.json" has missing/invalid settings (${validationResponse}).`)
    }
  }
}


// TODO: The code below is deprecated and must be erased.





export interface AppxDemoLocalConfig_OLD {
  demoValidationOrgAlias: string;
  demoDeploymentOrgAlias: string;
  devHubAlias:            string;
  envHubAlias:            string;
}

export interface AppxDemoProjectConfig_OLD {
  demoAlias:        string;
  demoConfig:       string;
  demoTitle:        string;
  demoType:         string;
  demoVersion:      string;
  gitHubUrl:        string;
  gitRemoteUri:     string;
  partnerAlias:     string;
  partnerName:      string;
  schemaVersion:    string;
}

//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @class       AppxDemoProjectContext
 * @access      public
 * @version     1.0.0
 * @summary     ????
 * @description ????
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
export class AppxDemoProjectContext_OLD {
  // Interface
  public config: {
    local:    AppxDemoLocalConfig_OLD;
    project:  AppxDemoProjectConfig_OLD;
    global:   any;
  }
  public path: string;
  // Constructor
  constructor() {
    this.config = {
      local:    <AppxDemoLocalConfig_OLD>{},
      project:  <AppxDemoProjectConfig_OLD>{},
      global:   {}
    };
  }
}
