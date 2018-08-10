//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @file          modules/sfdx-falcon-recipe/index.ts
 * @copyright     Vivek M. Chawla - 2018
 * @author        Vivek M. Chawla <@VivekMChawla>
 * @version       1.0.0
 * @license       MIT
 * @requires      module:???
 * @summary       ???
 * @description   ???
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
// External Imports
import * as core                        from  '@salesforce/core';                 // Allows us to use SFDX core functionality.
import * as path                        from  'path';                             // Why?

// Local Imports
import {SfdxCliLogLevel}                from  '../sfdx-falcon-types';             // Why?
import {SfdxFalconDebug}                from  '../../modules/sfdx-falcon-debug';  // Why?
import {AppxDemoConfigEngine}           from  './engines/appx/demo-config';
import {SfdxFalconStatus}               from  '../sfdx-falcon-status';                       // Why?

//─────────────────────────────────────────────────────────────────────────────┐
// Declare interfaces for SFDX-Falcon Recipes.
//─────────────────────────────────────────────────────────────────────────────┘
enum RecipeType {
  APPX_DEMO     = 'appx:demo-recipe',
  APPX_PACKAGE  = 'appx:package-recipe'
}

//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @class       SfdxFalconRecipe
 * @summary     Represents an SFDX-Falcon "recipe"
 * @description Use the SfdxFalconRecipe.read() static method to locate an SFDX-Falcon recipe in
 *              the local environment and then provide compile/execute cabability on that recipe.
 * @version     1.0.0
 * @public
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
export class SfdxFalconRecipe {

  // Define read-only member variables that come from the Recipe File
  private _recipeName:string;                           // Name of the recipe (eg. "Build ADK Demo Org")
          get recipeName():string                       {return this._recipeName}
  private _description:string;                          // Short description (eg. "FSC-DriveWealth Demo")
          get description():string                      {return this._description}
  private _recipeType:RecipeType;                       // Type of recipe. (eg. "appx-demo-config")
          get recipeType():RecipeType                   {return this._recipeType}
  private _recipeVersion:string;                        // Recipe version (eg. "1.0.0")
          get recipeVersion():string                    {return this._recipeVersion}
  private _schemaVersion:string;                        // Schema version (eg. "1.0.0")
          get schemaVersion():string                    {return this._schemaVersion}
  private _options:any;                                 // Sets options for executing this recipe
          get options():any                             {return this._options}
  private _recipeStepGroups:Array<any>;                 // Groups of steps to execute when the recipe runs
          get recipeStepGroups():Array<any>             {return this._recipeStepGroups}
  private _handlers:Array<any>;                         // Special handler actions
          get handlers():Array<any>                     {return this._handlers}

  // Define read-only vars that DO NOT come from the Recipe File.
  private _compiled:boolean;                            // TRUE if the recipe has been compiled.
          get compiled():boolean                        {return this._compiled}
  private _projectPath:string;                          // Stores the Listr Tasks that will be run when the Recipe is executed.
          get projectPath():string                      {return this._projectPath}
  private _recipeTasks:any;                             // Stores the Listr Tasks that will be run when the Recipe is executed.
          get recipeTasks():any                         {return this._recipeTasks}
  private _recipeEngine:any;                            // Stores the Listr Tasks that will be run when the Recipe is executed.
          get recipeEngine():any                        {return this._recipeEngine}

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @constructs  SfdxFalconRecipe
   * @description EMPTY CONSTRUCTOR. SfdxFalconRecipe.read() should be used to
   *              instantiate SFDX Falcon Recipes.
   * @version     1.0.0
   * @private
   */
  //───────────────────────────────────────────────────────────────────────────┘
  private constructor() {
    // Intentionally Empty.
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      read
   * @param       {string}  projectPath ???
   * @param       {string}  recipeDirectory ???
   * @param       {string}  recipeFile  ???
   * @description ???
   * @version     1.0.0
   * @public @static @async
   */
  //───────────────────────────────────────────────────────────────────────────┘
  public static async read(projectPath:string, recipeDirectory:string, recipeFile:string):Promise<SfdxFalconRecipe> {

    // Join the Project Path and Recipe Directory to get the Recipe Path.
    let recipePath = path.join(projectPath, recipeDirectory);

    // Read the SFDX-Falcon Recipe file specified by the caller.
    let sfdxFalconRecipe:any = await SfdxFalconRecipe.resolveSfdxFalconRecipe(recipePath, recipeFile);

    // Validate the overall Recipe before continuing.
    SfdxFalconRecipe.validateOverallRecipe(sfdxFalconRecipe);

    // Instantiate an SfdxFalconRecipe object so we can populate and return it.
    let sfdxFR = new SfdxFalconRecipe();

    sfdxFR._projectPath       = projectPath;
    sfdxFR._recipeName        = sfdxFalconRecipe.recipeName;
    sfdxFR._description       = sfdxFalconRecipe.description;
    sfdxFR._recipeType        = sfdxFalconRecipe.recipeType;
    sfdxFR._recipeVersion     = sfdxFalconRecipe.recipeVersion;
    sfdxFR._schemaVersion     = sfdxFalconRecipe.schemaVersion;
    sfdxFR._options           = sfdxFalconRecipe.options;
    sfdxFR._recipeStepGroups  = sfdxFalconRecipe.recipeStepGroups;
    sfdxFR._handlers          = sfdxFalconRecipe.handlers;

    // Done with the initial read.  Return the SfdxFalconRecipe we just created.
    return sfdxFR;
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      compile
   * @param       {any}  compileOptions Optional. ???
   * @description ???
   * @version     1.0.0
   * @public @async
   */
  //───────────────────────────────────────────────────────────────────────────┘
  public async compile(compileOptions:any={}):Promise<void> {    

    SfdxFalconDebug.obj('FALCON_EXT:sfdx-falcon-recipe', compileOptions, `SfdxFalconRecipe:compile:compileOptions: `);

    // Figure out which Engine to use
    switch (this._recipeType) {
      case RecipeType.APPX_DEMO:
        this._recipeEngine = await AppxDemoConfigEngine.compileRecipe(this, compileOptions);
        break;
      case RecipeType.APPX_PACKAGE:
        //this._recipeEngine = new AppxPackageRecipeEngine(this, compileOptions);
        break;
      default:
        throw new Error (`ERROR_INVALID_RECIPE: The value '${this._recipeType}' is not a valid recipe type`)
    }
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      execute
   * @param       {any}  executionOptions Optional. ???
   * @returns     {Promise<any>}  ???
   * @description ???
   * @version     1.0.0
   * @public @async
   */
  //───────────────────────────────────────────────────────────────────────────┘
  public async execute(executionOptions:any={}):Promise<any> {

    // Ask the compiled engine to Execute.
    await this._recipeEngine.execute(executionOptions);

    // TODO: Implement then() and catch() for the above call.
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      resolveSfdxFalconRecipeFile
   * @param       {string}  recipePath ???
   * @param       {string}  recipeFile ???
   * @returns     {Promise<object>}  ???
   * @description ???
   * @version     1.0.0
   * @private @static @async
   */
  //───────────────────────────────────────────────────────────────────────────┘
  private static async resolveSfdxFalconRecipe(recipePath:string, recipeFile:string):Promise<object> {

    // Build a ConfigOptions object that points to the specified Falcon Recipe.
    let configOptions = {
      rootFolder: recipePath,
      filename:   recipeFile,
      isGlobal:   false,
      isState:    false,
    }
    SfdxFalconDebug.obj('FALCON_XL:sfdx-falcon-recipe', configOptions, `SfdxFalconRecipe:resolveSfdxFalconRecipe:configOptions: `);

    // Using the options set above, retrieve the SFDX-Falcon Recipe file.
    let sfdxFalconRecipeFile = await core.ConfigFile.retrieve(configOptions);

    // Make sure that the file actually exists on disk (as opposed to being created for us).
    if (await sfdxFalconRecipeFile.exists() === false) {
      let combinedPath = path.join(configOptions.rootFolder, configOptions.filename);
      throw new Error(`ERROR_CONFIG_NOT_FOUND: Recipe does not exist - ${combinedPath}`);
    }
    SfdxFalconDebug.obj('FALCON_XL:sfdx-falcon-recipe', sfdxFalconRecipeFile, `SfdxFalconRecipe:resolveSfdxFalconRecipe:sfdxFalconRecipeFile: `);

    // Convert the SFDX-Falcon Recipe file to an object
    let sfdxFalconRecipe:any = sfdxFalconRecipeFile.toObject() as any;
    SfdxFalconDebug.obj('FALCON_XL:sfdx-falcon-recipe', sfdxFalconRecipe, `SfdxFalconRecipe:resolveSfdxFalconRecipe:sfdxFalconRecipe: `);

    // Done. Return the resolved Recipe object to the caller.
    return sfdxFalconRecipe;
  }
  
  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      validateOverallRecipe
   * @param       {SfdxFalconProjectContext}  sfdxFPC Required. ???
   * @returns     {void}  ???
   * @description ???
   * @version     1.0.0
   * @private @static
   */
  //───────────────────────────────────────────────────────────────────────────┘
  private static validateOverallRecipe(sfdxFalconRecipe:any):void {

    // Validate top-level Falcon Recipe config.
    let validationResponse = SfdxFalconRecipe.validateTopLevelProperties(sfdxFalconRecipe);
    if (validationResponse !== true) {
      throw new Error(`ERROR_INVALID_RECIPE: The selected recipe has missing/invalid settings (${validationResponse}).`)
    }
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      validateTopLevelProperties
   * @param       {any}  sfdxFalconRecipe Required. ???
   * @returns     {boolean|Array<string>}  Returns TRUE if the top-level
   *              properties of the Recipe are valid. If not valid, returns an
   *              array of strings listing each key that had an invalid value.
   * @description ???
   * @version     1.0.0
   * @private @static
   */
  //───────────────────────────────────────────────────────────────────────────┘
  private static validateTopLevelProperties(sfdxFalconRecipe:any):boolean|Array<string>  {
    let invalidConfigKeys = new Array<string>();

    // Validate the high-level recipe config
    if (! sfdxFalconRecipe.recipeName)         invalidConfigKeys.push('recipeName');
    if (! sfdxFalconRecipe.description)        invalidConfigKeys.push('description');
    if (! sfdxFalconRecipe.recipeType)         invalidConfigKeys.push('recipeType');
    if (! sfdxFalconRecipe.recipeVersion)      invalidConfigKeys.push('recipeVersion');
    if (! sfdxFalconRecipe.schemaVersion)      invalidConfigKeys.push('schemaVersion');
    if (! sfdxFalconRecipe.options)            invalidConfigKeys.push('options');
    if (! sfdxFalconRecipe.recipeStepGroups)   invalidConfigKeys.push('recipeStepGroups');
    if (! sfdxFalconRecipe.handlers)           invalidConfigKeys.push('handlers');

    if (invalidConfigKeys.length > 0) {
      return invalidConfigKeys;
    }
    else {
      return true;
    }
  }
} // End of SfdxFalconRecipe class.