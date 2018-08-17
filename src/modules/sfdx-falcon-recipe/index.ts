//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @file          modules/sfdx-falcon-recipe/index.ts
 * @copyright     Vivek M. Chawla - 2018
 * @author        Vivek M. Chawla <@VivekMChawla>
 * @summary       ???
 * @description   ???
 * @version       1.0.0
 * @license       MIT
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
// Import External Modules
import * as core                        from  '@salesforce/core';                   // Allows us to use SFDX core functionality.
import * as path                        from  'path';                               // Why?
// Import Local Modules
import {SfdxFalconDebug}                from  '../../modules/sfdx-falcon-debug';    // Why?
import {SfdxFalconProject}              from  '../../modules/sfdx-falcon-project';  // Why?
// Engine/Action Imports
import {AppxDemoConfigEngine}           from  './engines/appx/demo-config';         // Why?
import {AppxRecipeEngine}               from  './engines/appx';                     // Why?
import {RecipeType}                     from  './engines';                          // Why?
import {SfdxFalconRecipeResponse}       from  './engines';                          // Why?
import {SfdxFalconEngineResponse}       from  './engines';                          // Why?

// Set the File Local Debug Namespace
const dbgNs     = 'sfdx-falcon-recipe:';
const clsDbgNs  = 'SfdxFalconRecipe:';

//─────────────────────────────────────────────────────────────────────────────┐
// Declare interfaces for SFDX-Falcon Recipes.
//─────────────────────────────────────────────────────────────────────────────┘
export interface SfdxFalconRecipeJson {
  recipeName:       string;
  description:      string;
  recipeType:       string;
  recipeVersion:    string;
  schemaVersion:    string;
  options:          any;
  recipeStepGroups: Array<any>;
  handlers:         Array<any>;
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
  private _projectContext:SfdxFalconProject;            // Stores a reference to the SFDX-Falcon Project that instantiated this recipe.
          get projectContext():SfdxFalconProject        {return this._projectContext}
  private _recipeTasks:any;                             // Stores the Listr Tasks that will be run when the Recipe is executed.
          get recipeTasks():any                         {return this._recipeTasks}
  private _recipeEngine:AppxRecipeEngine;               // The instance of an SFDX-Falcon Recipe Engine that can be run by this Recipe.
          get recipeEngine():AppxRecipeEngine           {return this._recipeEngine}
  private _recipeResponse:SfdxFalconRecipeResponse;     // Consolidates responses from Recipe Engine runs and holds info to send back to caller.
          get recipeResponse():SfdxFalconRecipeResponse {return this._recipeResponse}
  private _validated:boolean;                           // TRUE if the recipe has been compiled.
          get validated():boolean                       {return this._validated}

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
    // Intentionally Empty. Instantiate SfdxFalconRecipe objects with read();
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      read
   * @param       {SfdxFalconProject} sfdxFPO Required. SFDX-Falcon Project
   *              Object associated with the project context that this Recipe
   *              is being read into.
   * @param       {string}  recipeFile  Required. Name of a Recipe.json file
   *              that will be expected to reside inside the /config directory
   *              within the SFDX-Falcon Project.
   * @description ???
   * @version     1.0.0
   * @public @static @async
   */
  //───────────────────────────────────────────────────────────────────────────┘
  public static async read(sfdxFPO:SfdxFalconProject, recipeFile:string):Promise<SfdxFalconRecipe> {

    // The recipe path should be the config directory, as specified in the SFDX-Falcon Project.
    let recipePath = sfdxFPO.configPath;

    // Read the SFDX-Falcon Recipe file specified by the caller.
    let recipe:any = await SfdxFalconRecipe.resolveSfdxFalconRecipe(recipePath, recipeFile);

    // Validate the overall Recipe before continuing.
    SfdxFalconRecipe.validate(recipe);

    // Instantiate an SfdxFalconRecipe object so we can populate and return it.
    let sfdxFR = new SfdxFalconRecipe();

    // Initialize members that get thier values from what's in the Recipe File
    sfdxFR._recipeName        = recipe.recipeName;
    sfdxFR._description       = recipe.description;
    sfdxFR._recipeType        = recipe.recipeType;
    sfdxFR._recipeVersion     = recipe.recipeVersion;
    sfdxFR._schemaVersion     = recipe.schemaVersion;
    sfdxFR._options           = recipe.options;
    sfdxFR._recipeStepGroups  = recipe.recipeStepGroups;
    sfdxFR._handlers          = recipe.handlers;

    // Initialize members that DO NOT get info from the Recipe File
    sfdxFR._validated         = true;
    sfdxFR._projectContext    = sfdxFPO;
    sfdxFR._recipeResponse    = new SfdxFalconRecipeResponse(sfdxFR.recipeName);

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

    SfdxFalconDebug.obj(`FALCON_EXT:${dbgNs}`, compileOptions, `${clsDbgNs}compile:compileOptions: `);

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

    // If we get here, it means the recipe compiled successfully.
    this._compiled = true;
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
  public async execute(executionOptions:any={}):Promise<SfdxFalconRecipeResponse> {

    // Make sure that the Recipe has been compiled before allowing execution.
    if (this._compiled !== true) {
      throw new Error (`ERROR_RECIPE_NOT_COMPILED: The compile() method must be called before you can  `
                      +`execute this recipe`);
    }

    // Ask the Recipe Engine (determined during compile) to execute the recipe.
    await this._recipeEngine.execute(executionOptions)
      .then(engineSuccessResponse => {
        this.onSuccess(engineSuccessResponse);
      })
      .catch(engineFailureResponse => {
        this.onError(engineFailureResponse);
      });

    // Use stardard Debug to show the entire Recipe Response results.
    SfdxFalconDebug.debugObject(`FALCON:${dbgNs}`, this._recipeResponse, `${clsDbgNs}execute:this._recipeResponse: `);

    // Render a "success message" to the user via the Console.
    this.renderSuccessMessage();

    // Return the SFDX-Falcon Recipe Response to the caller.
    return this._recipeResponse;
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      onError
   * @param       {SfdxFalconEngineResponse}  engineErrorResponse Required.
   * @returns     {void}
   * @description Handles rejected calls returning from this.executeEngine().
   * @version     1.0.0
   * @private
   */
  //───────────────────────────────────────────────────────────────────────────┘
  private onError(engineErrorResponse:SfdxFalconEngineResponse):void {

    // Debug the contents of the Engine Response.
    SfdxFalconDebug.obj(`FALCON_EXT:${dbgNs}`, engineErrorResponse, `${clsDbgNs}onError:engineErrorResponse: `);

    // Put the Engine Response into the FAILURE bucket of the Recipe Response
    this._recipeResponse.engineFailure(engineErrorResponse);

    // Since thie was a FAILUIRE, throw the Action Response to inform the caller who started the Engine.
    throw this._recipeResponse;
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      onSuccess
   * @param       {SfdxFalconEngineResponse}  engineSuccessResponse Required.
   * @returns     {void}
   * @description Called upon successful return from this.execute().
   * @version     1.0.0
   * @private
   */
  //───────────────────────────────────────────────────────────────────────────┘
  private onSuccess(engineSuccessResponse:SfdxFalconEngineResponse):void {

    // Debug the contents of the Engine Success Response.
    SfdxFalconDebug.obj(`FALCON_EXT:${dbgNs}`, engineSuccessResponse, `${clsDbgNs}onSuccess:engineSuccessResponse: `);

    // Add the successful engine to the Recipe's array of engine success.
    this._recipeResponse.engineSuccess(engineSuccessResponse);

    // Right now, we're only running one Recipe at a time, so mark the Recipe as complete, too.
    this._recipeResponse.engineComplete();

    // Done.
    return;
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      renderSuccessMessage
   * @returns     {void}
   * @description Renders summary output to the Console providing information 
   *              about the Recipe that was just executed.
   * @version     1.0.0
   * @private
   */
  //───────────────────────────────────────────────────────────────────────────┘
  private renderSuccessMessage():void {

    console.log(`Recipe Executed Successfully`);

    // TODO: Implement any sort of user messaging here (eg. "All done! Command took 135 seconds")

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
    SfdxFalconDebug.obj(`FALCON_XL:${dbgNs}`, configOptions, `${clsDbgNs}resolveSfdxFalconRecipe:configOptions: `);

    // Using the options set above, retrieve the SFDX-Falcon Recipe file.
    let sfdxFalconRecipeFile = await core.ConfigFile.retrieve(configOptions);

    // Make sure that the file actually exists on disk (as opposed to being created for us).
    if (await sfdxFalconRecipeFile.exists() === false) {
      let combinedPath = path.join(configOptions.rootFolder, configOptions.filename);
      throw new Error(`ERROR_CONFIG_NOT_FOUND: Recipe does not exist - ${combinedPath}`);
    }
    SfdxFalconDebug.obj(`FALCON_XL:${dbgNs}`, sfdxFalconRecipeFile, `${clsDbgNs}resolveSfdxFalconRecipe:sfdxFalconRecipeFile: `);

    // Convert the SFDX-Falcon Recipe file to an object
    let sfdxFalconRecipe:any = sfdxFalconRecipeFile.toObject() as any;
    SfdxFalconDebug.obj(`FALCON_XL:${dbgNs}`, sfdxFalconRecipe, `${clsDbgNs}resolveSfdxFalconRecipe:sfdxFalconRecipe: `);

    // Done. Return the resolved Recipe object to the caller.
    return sfdxFalconRecipe;
  }
  
  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      validate
   * @param       {SfdxFalconRecipeJson}  sfdxFalconRecipeJson Required. Parsed
   *              JSON object that is a direct representation of an SFDX-Falcon
   *              Recipe file as read from the local filesystem.
   * @returns     {void}  Throws an error if the Recipe is found to be invalid.
   * @description Given a Recipe already parsed into a JS Object, takes multiple
   *              actions to ensure that the recipe is valid. Throws an error if
   *              the Recipe is invalid.
   * @version     1.0.0
   * @private @static
   */
  //───────────────────────────────────────────────────────────────────────────┘
  private static validate(sfdxFalconRecipeJson:SfdxFalconRecipeJson ):void {

    // Validate top-level Falcon Recipe config.
    SfdxFalconRecipe.validateTopLevelProperties(sfdxFalconRecipeJson);

    // Let the specific Recipe Engine take a shot at validation.
    switch (sfdxFalconRecipeJson.recipeType) {
      case RecipeType.APPX_DEMO:
        AppxDemoConfigEngine.validateRecipe(sfdxFalconRecipeJson);
        break;
      case RecipeType.APPX_PACKAGE:
        //AppxPackageConfigEngine.validateRecipe(sfdxFalconRecipeJson);
        break;
      default:
        throw new Error (`ERROR_INVALID_RECIPE: '${sfdxFalconRecipeJson.recipeType}' is not a valid SFDX-Falcon Recipe type`)
    }
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      validateTopLevelProperties
   * @param       {SfdxFalconRecipeJson}  sfdxFalconRecipe Required. JS Object 
   *              that is a direct representation of an SFDX-Falcon Recipe file
   *              as read from the local filesystem.
   * @returns     {void}  Throws Error listing invalid/missing top-level keys.
   * @description Given a Recipe already parsed into a JS Object, throws an 
   *              error with a list of top-level keys that are missing or 
   *              invalid. Nothing happens validation is successful.
   * @version     1.0.0
   * @private @static
   */
  //───────────────────────────────────────────────────────────────────────────┘
  private static validateTopLevelProperties(sfdxFalconRecipe:SfdxFalconRecipeJson):void  {

    // Declare a local variable to hold invalid top-level keys.
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

    // Check if any invalid keys were found.
    if (invalidConfigKeys.length > 0) {
      throw new Error(`ERROR_INVALID_RECIPE: The selected recipe has missing/invalid settings (${invalidConfigKeys}).`)
    }
  }
} // End of SfdxFalconRecipe class.