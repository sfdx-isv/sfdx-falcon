//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @file          modules/sfdx-falcon-recipe/engines/appx/index.ts
 * @copyright     Vivek M. Chawla - 2018
 * @author        Vivek M. Chawla <@VivekMChawla>
 * @version       1.0.0
 * @license       MIT
 * @summary       ???
 * @description   ???
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
// Import Local Modules
import {SfdxFalconRecipe}         from '../../../../modules/sfdx-falcon-recipe';     // Why?
import {SfdxFalconStatus}         from '../../../../modules/sfdx-falcon-status';     // Why?
import {SfdxCliLogLevel}          from '../../../../modules/sfdx-falcon-types';      // Why?
import {SfdxFalconDebug}          from '../../../sfdx-falcon-debug';

// Set the File Local Debug Namespace
const dbgNs = 'RecipeEngine:appx:';

//─────────────────────────────────────────────────────────────────────────────┐
// Declare interfaces for AppxEngine (and derived classes)
//─────────────────────────────────────────────────────────────────────────────┘
export interface AppxEngineContext {
  isExecuting:        boolean;
  devHubAlias:        string;
  targetOrg:          TargetOrg;
  haltOnError:        boolean;
  projectPath:        string;
  configPath:         string;
  mdapiSourcePath:    string;
  sfdxSourcePath:     string;
  dataPath:           string;
  logLevel:           SfdxCliLogLevel;
  recipeObserver:     any;
  status:             SfdxFalconStatus;
}
export interface AppxEngineStepGroupContext extends AppxEngineContext {
  stepGroupObserver:  any;
}
export interface AppxEngineStepContext      extends AppxEngineStepGroupContext {
  stepObserver:  any;
}
export interface AppxEngineActionContext    extends AppxEngineStepContext {
  actionObserver:  any;
}
export interface AppxEngineActionResult {
  type:       AppxEngineActionType;
  cmdDef:     any;
  status:     number;
  message:    string;
  strResult:  string;
  objResult:  object;
}
export interface AppxEngineActionError {
  stepContext:  AppxEngineStepContext;
  stepOptions:  object;
  errorObj:     Error;
}
export enum AppxEngineActionType {
  SFDX_CLI_COMMAND    = 'sfdx-cli-command',
  DIRECT_API_COMMAND  = 'direct-api-command',
  SHELL_COMMAND       = 'shell-command',
  UNSPECIFIED         = 'unspecified'
}
export interface AppxEngineHandler {
  handlerName: string;
  // TODO: Flesh out this interface
}
export interface AppxEngineStepGroup {
  stepGroupName:  string;
  alias:          string;
  description:    string;
  recipeSteps:    Array<AppxEngineStep>;
}
export interface AppxEngineStep {
  stepName:     string;
  description:  string;
  action:       string;
  options:      any;
  onSuccess?:   string;
  onError?:     string;
}
export interface AppxEngineStepResult {
  status:   AppxEngineStepResultStatus;
  message:  string;
  data:     any;
}
export enum AppxEngineStepResultStatus {
  SUCCESS = 'success',
  WARNING = 'warning',
  ERROR   = 'error'  
}
interface TargetOrg {
  orgName:        string;
  alias:          string;
  description:    string;
  isScratchOrg:   boolean;
  scratchDefJson: string;
  orgReqsJson:    string;
}

//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @class       AppxRecipeEngine
 * @summary     ???
 * @description ???
 * @version     1.0.0
 * @public @abstract
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
export abstract class AppxRecipeEngine {

  // Declare class member vars.
  private   baseClsDbgNs:         string = 'AppxRecipeEngine';
  protected actionMap:            Map<string, any>;
  protected listrTasks:           any;
  protected recipe:               SfdxFalconRecipe;
  protected engineContext:        AppxEngineContext;
  protected engineStatus:         SfdxFalconStatus;

  // Declare abstract methods.
  public    abstract async  execute(executionOptions:any):Promise<SfdxFalconStatus>;
  protected abstract async  executeStep(step:AppxEngineStep, observer:any):Promise<AppxEngineStepResult>;
  protected abstract async  initializeActionMap(compileOptions:any):Promise<void>;
  protected abstract async  initializeRecipeEngineContext(compileOptions:any):Promise<void>;
  protected abstract async  validateInnerRecipe(recipe:SfdxFalconRecipe):Promise<void>;

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @constructs  AppxRecipeEngine
   * @description Empty, private constructor. Instantiate with compileRecipe().
   * @version     1.0.0
   * @private
   */
  //───────────────────────────────────────────────────────────────────────────┘
  protected constructor() {
    // Constructor is INTENTIONALLY empty.  Do not add code here.
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      compile
   * @param       {SfdxFalconRecipe}  recipe  Required.
   * @param       {any}               compileOptions  Required.
   * @returns     {Promise<any>} ???
   * @description ???
   * @version     1.0.0
   * @protected @async
   */
  //───────────────────────────────────────────────────────────────────────────┘
  protected async compile(recipe:SfdxFalconRecipe, compileOptions:any):Promise<any> {

    // Validate the recipe.  If we make it through without an error, save a ref to this instance.
    this.validateOuterRecipe(recipe);
    this.validateInnerRecipe(recipe);
    this.recipe = recipe;

    // Initialize the Recipe Engine Context.
    await this.initializeRecipeEngineContext(compileOptions);

    // Initialize the Action Map for this engine.
    await this.initializeActionMap(compileOptions);
 
    // Prepare the Listr Tasks.
    this.compileListrTasks(compileOptions);

    // We should be done by this point. Debug and return
    SfdxFalconDebug.obj(`FALCON_XL:${dbgNs}`, this, `${this.baseClsDbgNs}:constructor:this: `)
    return;


  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      compileListrTasks
   * @param       {any}  compileOptions Required.
   * @returns     {void} ???
   * @description ???
   * @version     1.0.0
   * @private
   */
  //───────────────────────────────────────────────────────────────────────────┘
  private compileListrTasks(compileOptions:any):void {

    this.listrTasks = {};

  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      skipAction
   * @param       {string}  actionToCheck Required. The Action to check.
   * @returns     {boolean} Returns true if the action should be skipped.
   * @description ???
   * @version     1.0.0
   * @protected
   */
  //───────────────────────────────────────────────────────────────────────────┘
  protected skipAction(actionToCheck:string=''):boolean {
    return false;

  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      skipGroup
   * @param       {string}  groupToCheck Required. The Step Group Name to check.
   * @returns     {boolean} Returns true if the group should be skipped.
   * @description ???
   * @version     1.0.0
   * @protected
   */
  //───────────────────────────────────────────────────────────────────────────┘
  protected skipGroup(groupToCheck:string=''):boolean {
    return false;

  }


  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      startExecution
   * @param       {any} xxxx ???? 
   * @param       {any} xxxx ???? 
   * @returns     {any}
   * @description ???
   * @version     1.0.0
   * @protected
   */
  //───────────────────────────────────────────────────────────────────────────┘
  protected startExecution():void {



  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      killExecution
   * @param       {any} xxxx ???? 
   * @param       {any} xxxx ???? 
   * @returns     {any}
   * @description ???
   * @version     1.0.0
   * @protected
   */
  //───────────────────────────────────────────────────────────────────────────┘
  protected killExecution(errorMessage:string):void {

    // Use a generic Error Message if one was not passed in to us.
    if (errorMessage === '') {
      errorMessage = 'ERROR_UNKOWN_EXCEPTION: An unknown error has occured';
    }

    // Stop the timer so we can get an accurate Run Time if desired.
    this.engineStatus.stopTimer();

    // Throw an error using the provided error message.
    throw new Error(errorMessage);


  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      validateHandler
   * @param       {AppxEngineHandler} handler Required. 
   * @returns     {void}
   * @description ???
   * @version     1.0.0
   * @private
   */
  //───────────────────────────────────────────────────────────────────────────┘
  private validateHandler(handler:AppxEngineHandler):void {
    // TODO: Implement this validation method.
  }
  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      validateOuterRecipe
   * @param       {SfdxFalconRecipe} recipe Required. 
   * @returns     {void}
   * @description ???
   * @version     1.0.0
   * @private
   */
  //───────────────────────────────────────────────────────────────────────────┘
  private validateOuterRecipe(recipe:SfdxFalconRecipe):void {

    // Make sure the Recipe contains an "options" key.
    if (typeof recipe.options === 'undefined') {
      throw new Error (`ERROR_INVALID_RECIPE: Recipes in the AppX family (eg. '${this.recipe.recipeType}' `
                      +`must provide values in the 'options' key of your recipe`);
    }
    // Make sure there is an Array of Skip Groups
    if (Array.isArray(recipe.options.skipGroups) === false) {
      throw new Error (`ERROR_INVALID_RECIPE: An array of strings must be provided in the `
                      +`'options.skipGroups' key of your recipe.  The value provided was of type `
                      +`${typeof recipe.options.skipGroups}`);
    }
    // Make sure there is an Array of Skip Actions
    if (Array.isArray(recipe.options.skipActions) === false) {
      throw new Error (`ERROR_INVALID_RECIPE: An array of strings must be provided for the `
                      +`'options.skipActions' key of your recipe.  The value you provided was of type `
                      +`${typeof recipe.options.skipActions}`);
    }
    // Make sure that haltOnError is a boolean
    if (typeof recipe.options.haltOnError !== 'boolean') {
      throw new Error (`ERROR_INVALID_RECIPE: A boolean value must be provided for the `
                      +`'options.haltOnError' key of your recipe.  The value you provided was of type `
                      +`${typeof recipe.options.haltOnError}`);
    }
    // Make sure there is an Array of Target Orgs
    if (Array.isArray(recipe.options.targetOrgs) === false || recipe.options.targetOrgs.length < 1) {
      throw new Error (`ERROR_INVALID_RECIPE: An array with at least one Target Org must be provided in the `
                      +`'options.targetOrgs' key of your recipe.`);
    }
    // Validate every member of the Taget Orgs array.
    for (let targetOrg of recipe.options.targetOrgs) {
      this.validateTargetOrg(targetOrg);
    }
    // Make sure there is an Array of Recipe Step Groups
    if (Array.isArray(recipe.recipeStepGroups) === false) {
      throw new Error (`ERROR_INVALID_RECIPE: An array of Recipe Step Groups must be provided at the root `
                      +`level of your recipe. The value you provided was of type `
                      +`${typeof recipe.recipeStepGroups}`);
    }
    // Validate every member of the Taget Orgs array.
    for (let recipeStepGroup of recipe.recipeStepGroups) {
      this.validateRecipeStepGroup(recipeStepGroup);
    }
    // Make sure there is an Array of Handlers
    if (Array.isArray(recipe.handlers) === false) {
      throw new Error (`ERROR_INVALID_RECIPE: An array of Handlers must be provided at the root `
                      +`level of your recipe. The value you provided was of type `
                      +`${typeof recipe.handlers}`);
    }
    // Validate every member of the Handlers array.
    for (let handler of recipe.handlers as Array<AppxEngineHandler>) {
      this.validateHandler(handler);
    }
    // Done with validation
    return;
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      validateRecipeStep
   * @param       {AppxEngineStep} recipeStep Required. 
   * @returns     {void}
   * @description ???
   * @version     1.0.0
   * @private
   */
  //───────────────────────────────────────────────────────────────────────────┘
  private validateRecipeStep(recipeStep:AppxEngineStep):void {

    // TODO: Implement this validation method.

  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      validateRecipeStepGroup
   * @param       {AppxRecipeStepGroup} stepGroup Required. 
   * @returns     {void}
   * @description ???
   * @version     1.0.0
   * @private
   */
  //───────────────────────────────────────────────────────────────────────────┘
  private validateRecipeStepGroup(stepGroup:AppxEngineStepGroup):void {

    // Make sure that the Step Group Name is a string
    if (typeof stepGroup.stepGroupName !== 'string' || stepGroup.stepGroupName === '') {
      throw new Error (`ERROR_INVALID_RECIPE: Missing string value for 'stepGroupName' in  `
                      +`one of your 'recipeStepGroup' definitions `
                      +`(type provided: ${typeof stepGroup.stepGroupName})`);
    }
    // Make sure that the Alias is a string
    if (typeof stepGroup.alias !== 'string' || stepGroup.alias === '') {
      throw new Error (`ERROR_INVALID_RECIPE: Missing string value for 'alias' in the `
                      +`recipeStepGroup '${stepGroup.stepGroupName}' `
                      +`(type provided: ${typeof stepGroup.alias})`);
    }
    // Make sure that the Description is a string
    if (typeof stepGroup.description !== 'string' || stepGroup.description === '') {
      throw new Error (`ERROR_INVALID_RECIPE: Missing string value 'description' in `
                      +`one of your 'recipeStepGroup' definitions `
                      +`(type provided: ${typeof stepGroup.description})`);
    }
    // Make sure there is an Array of Recipe Steps in this group
    if (Array.isArray(stepGroup.recipeSteps) === false) {
      throw new Error (`ERROR_INVALID_RECIPE: Missing array of Recipe Steps in `
                      +`one of your 'recipeStepGroup' definitions. `
                      +`(type provided: ${typeof stepGroup.recipeSteps})`);
    }
    // Validate every member of the Recipe Steps array.
    for (let recipeStep of stepGroup.recipeSteps) {
      this.validateRecipeStep(recipeStep);
    }
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      validateTargetOrg
   * @param       {TargetOrg} targetOrg Required. 
   * @returns     {void}
   * @description ???
   * @version     1.0.0
   * @private
   */
  //───────────────────────────────────────────────────────────────────────────┘
  private validateTargetOrg(targetOrg:TargetOrg):void {

    // Make sure that orgName is a string
    if (typeof targetOrg.orgName !== 'string' || targetOrg.orgName === '') {
      throw new Error (`ERROR_INVALID_RECIPE: A string value must be provided for the `
                      +`'orgName' key in each targetOrg in your recipe.  The value you provided was of type `
                      +`${typeof targetOrg.orgName}`);
    }
    // Make sure that alias is a string
    if (typeof targetOrg.alias !== 'string' || targetOrg.alias === '') {
      throw new Error (`ERROR_INVALID_RECIPE: A string value must be provided for the `
                      +`'alias' key in each targetOrg in your recipe.  The value you provided was of type `
                      +`${typeof targetOrg.alias}`);
    }
    // Make sure that description is a string
    if (typeof targetOrg.description !== 'string' || targetOrg.description === '') {
      throw new Error (`ERROR_INVALID_RECIPE: A string value must be provided for the `
                      +`'description' key in each targetOrg in your recipe.  The value you provided was of type `
                      +`${typeof targetOrg.description}`);
    }
    // Make sure that isScratchOrg is a boolean
    if (typeof targetOrg.isScratchOrg !== 'boolean') {
      throw new Error (`ERROR_INVALID_RECIPE: A boolean value must be provided for the `
                      +`'isScratchOrg' key in each targetOrg in your recipe.  The value you provided was of type `
                      +`${typeof targetOrg.isScratchOrg}`);
    }
    // Make sure that scratchDefJson is a string if isScratchOrg is set to TRUE
    if (targetOrg.isScratchOrg === true && (typeof targetOrg.scratchDefJson !== 'string' || targetOrg.scratchDefJson === '')) {
      throw new Error (`ERROR_INVALID_RECIPE: If targetOrg.isScratchOrg is TRUE then a string value must be provided for the `
                      +`'scratchDefJson' key in that targetOrg's definition in your recipe.  The value you provided was of type `
                      +`${typeof targetOrg.scratchDefJson}`);
    }
    // Make sure that orgReqsJson is a string if isScratchOrg is set to FALSE
    if (targetOrg.isScratchOrg === false && (typeof targetOrg.orgReqsJson !== 'string' || targetOrg.orgReqsJson === '')) {
      throw new Error (`ERROR_INVALID_RECIPE: If targetOrg.isScratchOrg is FALSE then a string value must be provided for the `
                      +`'orgReqsJson' key in that targetOrg's definition in your recipe.  The value you provided was of type `
                      +`${typeof targetOrg.orgReqsJson}`);
    }
  }
} // End of class