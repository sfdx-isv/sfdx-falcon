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
// Import External Modules
import {Observable}               from  'rxjs';                                           // Why?
// Import Local Modules
import {SfdxFalconDebug}          from '../../../../modules/sfdx-falcon-debug';           // Why?
import {SfdxFalconProject}        from '../../../../modules/sfdx-falcon-project';         // Why?
import {SfdxFalconStatus}         from '../../../../modules/sfdx-falcon-status';          // Why?
// Import Local Types
import {ListrContext}             from '../../../../modules/sfdx-falcon-types';           // Type. Alias to "any". Used in project to make code easier to read.
import {ListrExecutionOptions}    from '../../../../modules/sfdx-falcon-types';           // Why?
import {SfdxCliLogLevel}          from '../../../../modules/sfdx-falcon-types';           // Why?
// Recipe Imports
import {SfdxFalconRecipe}         from '../../../../modules/sfdx-falcon-recipe';          // Why?
import {SfdxFalconRecipeJson}     from '../../../../modules/sfdx-falcon-recipe';          // Why?
import {SfdxFalconActionResponse} from '../../../../modules/sfdx-falcon-recipe/engines';  // Why?
import {SfdxFalconEngineResponse} from '../../../../modules/sfdx-falcon-recipe/engines';  // Why?
import {AppxEngineAction}         from '../appx/actions';                                 // Why?


// Require Modules
const Listr                 = require('listr');                                   // Official Task Runner of Project Falcon ;-)
const FalconUpdateRenderer  = require('falcon-listr-update-renderer');            // Custom renderer for Listr

// Set the File Local Debug Namespace
const dbgNs     = 'RecipeEngine:appx:';
const clsDbgNs  = 'AppxRecipeEngine:';

//─────────────────────────────────────────────────────────────────────────────┐
// Declare interfaces for AppxEngine (and derived classes)
//─────────────────────────────────────────────────────────────────────────────┘
export interface AppxEngineContext {
  compileOptions:     any;
  recipeObserver:     any;
  executing:          boolean;
  initialized:        boolean;
  haltOnError:        boolean;
  skipGroups:         Array<string>;
  skipActions:        Array<string>;
  devHubAlias:        string;
  projectContext:     SfdxFalconProject;
  logLevel:           SfdxCliLogLevel;
  status:             SfdxFalconStatus;
  targetOrg:          TargetOrg;
}
export interface AppxEngineActionContext extends AppxEngineContext {
  listrExecOptions:  ListrExecutionOptions;
}
export interface AppxEngineActionFunction {
  (actionContext:AppxEngineActionContext, actionOptions:any):Promise<SfdxFalconActionResponse>;
}
/*
export interface AppxEngineActionResult {
  action:     string;                 // Name (identifier) of the executed Action
  type:       AppxEngineActionType;   // Type of Action being executed (ie. CLI or JSForce)
  cmdDef:     any;                    // The "command definition". Varies by type of command.
  status:     number;                 // Status indicator, taken from executed command. 
  message:    string;                 // Brief message on what happened when the action was executed.
  strResult:  string;                 // Result of the executed command as a string.
  objResult:  object;                 // If the result can be converted to an object, this would hold it.
}
export interface AppxEngineActionError {
  actionContext:  AppxEngineActionContext;
  actionOptions:  any;
  errorObj:       Error;
}
*/
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
export interface TargetOrg {
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
  protected actionExecutorMap:    Map<string, AppxEngineAction>;
  protected listrTasks:           any;
  protected recipe:               SfdxFalconRecipe;
  protected engineResponse:       SfdxFalconEngineResponse;
  protected preBuildStepGroups:   Array<AppxEngineStepGroup>;
  protected postBuildStepGroups:  Array<AppxEngineStepGroup>;
  protected engineContext:        AppxEngineContext;
  protected engineStatus:         SfdxFalconStatus;

  // Declare abstract methods.
  protected abstract async  executeEngine(executionOptions:any):  Promise<ListrContext>;
  protected abstract async  initializeActionMap():          Promise<void>;
  protected abstract async  initializePostBuildStepGroups():Promise<void>;
  protected abstract async  initializePreBuildStepGroups(): Promise<void>;
  protected abstract async  initializeRecipeEngineContext():Promise<void>;
  protected abstract async  initializeSkipActions():        Promise<void>;
  protected abstract async  initializeSkipGroups():         Promise<void>;
  protected abstract async  initializeTargetOrg():          Promise<void>;

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @constructs  AppxRecipeEngine
   * @param       {string}  engineName  Required. Name of the specific Engine
   *              that is extending this class.
   * @param       {string}  recipeName  Required. Name of the Recipe being 
   *              compiled into the Engine.
   * @description Creates an instance ONLY for use of the compileRecipe() and
   *              compile() functions.  That is how instances of this object
   *              are passed back to the caller.  
   * @version     1.0.0
   * @protected
   */
  //───────────────────────────────────────────────────────────────────────────┘
  protected constructor(engineName:string, recipeName:string) {
    // Initialize object/array member variables.
    this.engineContext        = <AppxEngineContext>{};
    this.engineStatus         = new SfdxFalconStatus();
    this.preBuildStepGroups   = new Array<AppxEngineStepGroup>();
    this.postBuildStepGroups  = new Array<AppxEngineStepGroup>();
    this.engineResponse       = new SfdxFalconEngineResponse(engineName, recipeName);
    this.listrTasks           = null;
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

    // Make sure that the incoming recipe has been validated.
    if (recipe.validated !== true) {
      throw new Error(`ERROR_INVALID_RECIPE: Can not compile a recipe that has not been validated`);
    }
    else {
      this.recipe = recipe;
    }

    // Save any compile options passed in by the caller.
    this.engineContext.compileOptions = compileOptions;

    // STEP ONE: Initialize the Recipe Engine Context (implemented inside child class)
    await this.initializeRecipeEngineContext();

    // STEP TWO: Initialize the Target Org (implemented inside child class).
    await this.initializeTargetOrg();

    // STEP THREE: Initialize the pre-build Step Groups (implemented inside child class)
    await this.initializePreBuildStepGroups();

    // STEP FOUR: Initialize the post-build Step Groups (implemented inside child class)
    await this.initializePostBuildStepGroups();

    // STEP FIVE: Initialize the Skip ACTIONS (implemented inside child class).
    await this.initializeSkipActions();

    // STEP SIX: Initialize the Skip GROUPS (implemented inside child class).
    await this.initializeSkipGroups();

    // STEP SEVEN: Initialize the Action Map for this engine (implemented inside child class).
    await this.initializeActionMap();

    // Validate Engine Initialization (implemented here inside parent class).
    this.validateEngine();

    // Compile all of the Listr Tasks for this engine (implemented here inside parent class)
    this.compileAllTasks();

    // We should be done by this point. Debug and return.
    SfdxFalconDebug.obj(`FALCON_XL:${dbgNs}`, this, `${clsDbgNs}constructor:this: `)
    return;
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      compileAllTasks
   * @returns     {void}
   * @description Compiles all of the Listr tasks required by the recipe and
   *              adds them to the listrTasks member var.
   * @version     1.0.0
   * @private
   */
  //───────────────────────────────────────────────────────────────────────────┘
  private compileAllTasks():void {

    // Make sure the Engine Context has been marked as initialized.
    if (this.engineContext.initialized !== true) {
      throw new Error (`ERROR_ENGINE_NOT_INITIALIZED: The engine must be fully initialized before `
                      +`compiling all tasks.`);
    }

    // Debug - See what the pre and post build Step Groups are, and how they bookend the core group.
    SfdxFalconDebug.obj(`FALCON_EXT:${dbgNs}`, this.preBuildStepGroups, `${clsDbgNs}compileAllTasks:this.preBuildStepGroups: `)
    SfdxFalconDebug.obj(`FALCON_EXT:${dbgNs}`, this.recipe.recipeStepGroups, `${clsDbgNs}compileAllTasks:this.recipe.recipeStepGroups: `)
    SfdxFalconDebug.obj(`FALCON_EXT:${dbgNs}`, this.postBuildStepGroups, `${clsDbgNs}compileAllTasks:this.postBuildStepGroups: `)

    // Join the pre and post-build Recipe Step Groups with the "core" given to us by the Recipe.
    let completeRecipeStepGroups = [
      ...this.preBuildStepGroups, 
      ...this.recipe.recipeStepGroups,
      ...this.postBuildStepGroups
    ];

    // Debug - Show the combined Step Groups
    SfdxFalconDebug.obj(`FALCON_EXT:${dbgNs}`, completeRecipeStepGroups, `${clsDbgNs}compileAllTasks:completeRecipeStepGroups: `)

    // Call compileParentTasks() from the Recipe's "Step Group root" and all tasks should compile.
    this.listrTasks = this.compileParentTasks(completeRecipeStepGroups);
    return;
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      compileParentTasks
   * @param       {Array<AppxEngineStepGroup>}  recipeStepGroups Required. ???
   * @returns     {object} Returns an instantiated Listr object fully populated
   *              with SubTasks.
   * @description ???
   * @version     1.0.0
   * @private
   */
  //───────────────────────────────────────────────────────────────────────────┘
  private compileParentTasks(recipeStepGroups:Array<AppxEngineStepGroup>):object {

    // Create a Listr object to hold Falcon Command Sequence Steps as TASKS.
    let parentTasks = new Listr({concurrent:false,collapse:false,renderer:FalconUpdateRenderer});

    // Iterate over all Recipe Step Groups and create Listr Tasks / Groups as needed.
    for (let recipeStepGroup of recipeStepGroups) {
      
      // Check if we need to skip compilation of this group
      if (this.skipGroup(recipeStepGroup.alias) === true) {
        continue;
      }
      // Check if the recipeStepGroup has any tasks
      if (this.stepGroupHasActiveTasks(recipeStepGroup) === false) {
        continue;
      }

      // Compile the SubTasks for this group and add them to the Parent Tasks we're creating
      parentTasks.add({
        title:  recipeStepGroup.stepGroupName,
        task:   (listrContext) => { return this.compileSubTasks(recipeStepGroup, listrContext) }
      });
    }

    // Return the Parent Tasks that we just created
    return parentTasks;
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      compileSubTasks
   * @param       {AppxRecipeStepGroup} recipeStepGroup Required. ???
   * @param       {any}                 parentContext Required. ???
   * @returns     {any} Returns an instantiated Listr object fully populated by
   *              all active Sub Tasks based on the Recipe Step Group.
   * @description ???
   * @version     1.0.0
   * @private
   */
  //───────────────────────────────────────────────────────────────────────────┘
  private compileSubTasks(recipeStepGroup:AppxEngineStepGroup, parentContext:any=null):any {

    // Make sure we have at least one step in the group.
    if (recipeStepGroup.recipeSteps.length < 1) {
      throw new Error(`ERROR_NO_STEPS: The Recipe Step Group '${recipeStepGroup.stepGroupName}' contains no Steps`);
    }

    // Create a Listr object for the subtasks.
    let listrSubTasks = new Listr({concurrent:false,collapse:false,renderer:FalconUpdateRenderer});

    // For each Recipe Step, add a new SUB TASK to the group if the step's action is not on the skip list.
    for (let recipeStep of recipeStepGroup.recipeSteps) {
      if (this.skipAction(recipeStep.action) === true) {
        continue;
      }
      listrSubTasks.add({
        title:  recipeStep.stepName,
        task:   (listrContext, thisTask) => {
          return new Observable(observer => { 
            let listrExecOptions:ListrExecutionOptions = {
              listrContext: listrContext,
              listrTask:    thisTask,
              observer:     observer
            }
            this.executeStep(recipeStep, listrExecOptions)
              .then(actionSuccessResponse => {
                this.engineResponse.actionSuccess(actionSuccessResponse);
                observer.complete();
              })
              .catch(actionFailureResponse => {
                this.engineResponse.actionFailure(actionFailureResponse);
                observer.error(actionFailureResponse);
              });
          });
        }
      });
    }
    // Return the Listr Sub Tasks to the caller.
    return listrSubTasks;
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      endExecution
   * @returns     {void}
   * @description Lets the Engine know that execution has stopped without error.
   * @version     1.0.0
   * @private
   */
  //───────────────────────────────────────────────────────────────────────────┘
  private endExecution():void {
    // Start the status timer.
    this.engineStatus.stopTimer();
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      execute
   * @param       {any} [executionOptions]  Optional. 
   * @returns     {Promise<SfdxFalconRecipeResponse>} ???
   * @description Starts the execution of a compiled recipe.  Execution starutp
   *              and cleanup are handled here in the base class. Relies on the
   *              extended class to actually execute the Listr Tasks, though. 
   *              This gives the extended class the ability to inject any final
   *              pre or post task execution logic.
   * @version     1.0.0
   * @public @async
   */
  //───────────────────────────────────────────────────────────────────────────┘
  public async execute(executionOptions:any={}):Promise<SfdxFalconEngineResponse> {

    // Make sure that the Engine is compiled by checking for at least one Listr Task.
    if (this.listrTasks == null) {
      throw new Error('ERROR_RECIPE_NOT_COMPILED: AppxRecipeEngine.execute() called before compiling a Recipe');
    }

    // Let the engine know that execution is starting
    this.startExecution();

    // Ask the child class to execute the Listr Tasks that are currently compiled into the Engine.
    await this.executeEngine(executionOptions)
      .then(listrContextSuccess  => {this.onSuccess(listrContextSuccess)})
      .catch(listrContextFailure => {this.onError(listrContextFailure)});

    // Run the execution closing tasks.
    this.endExecution();

    // Return the SFDX-Falcon Engine Response for this instance (should be fully populated)
    return this.engineResponse;
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      executeStep
   * @param       {AppxEngineStep}  recipeStep  Required. The step to execute.
   * @param       {ListrExecutionOptions} executionOptions  Required. Holds a
   *              number of execution options (context, task, and observer).
   * @returns     {Promise<SfdxFalconActionResponse>}  Resolves AND rejects with
   *              an SFDX-Falcon Action Response object.  If any other type
   *              of object bubbles up, it should be an Error.
   * @description Given a valid Falcon Recipe Step object, tries to
   *              route the requested Step Action to the appropriate Executor.
   * @version     1.0.0
   * @private @async
   */
  //───────────────────────────────────────────────────────────────────────────┘
  private async executeStep(recipeStep:AppxEngineStep, listrExecOptions:ListrExecutionOptions):Promise<SfdxFalconActionResponse> {

    // Build the context the Action Executor will need to correctly do its job.
    let actionContext:AppxEngineActionContext =  { 
      ...this.engineContext,
      listrExecOptions: listrExecOptions
    }

    // Find the Executor for the specified Action.
    let actionExecutor = this.actionExecutorMap.get(recipeStep.action);

    // Make sure we actually found an Executor.
    if (typeof actionExecutor === 'undefined') {
      throw new Error (`ERROR_UNKNOWN_ACTION: '${recipeStep.action}' is not recognized `
                      +`by the ${this.recipe.recipeType} eninge`);
    }

    // Execute the Action.  The caller (a listr task) will handle .then() and .catch().
    return await actionExecutor.execute(actionContext, recipeStep.options);
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
  /*
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
  //*/
  
  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      onError
   * @param       {ListrContext}  listrContextError Required.
   * @returns     {void}
   * @description Handles rejected calls returning from this.executeEngine().
   * @version     1.0.0
   * @private
   */
  //───────────────────────────────────────────────────────────────────────────┘
  private onError(listrContextError:ListrContext):void {

    // Debug the contents of the Executor Response.
    SfdxFalconDebug.obj(`FALCON_EXT:${dbgNs}`, listrContextError, `${clsDbgNs}onError:listrContextError: `);

    // The Engine Response should have ERROR, FAILURE, or UNKNOWN status.
    SfdxFalconDebug.obj(`FALCON_EXT:${dbgNs}`, this.engineResponse, `${clsDbgNs}onError:this.engineResponse: `);

    // Stop the timer so we can get an accurate Run Time if desired.
    this.engineStatus.stopTimer();

    // Since thie was a FAILUIRE, throw the Action Response to inform the caller who started the Engine.
    throw this.engineResponse;
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      onSuccess
   * @param       {ListrContext}  listrContextSuccess Required.
   * @returns     {void}
   * @description Called upon successful return from this.executeEngine().
   * @version     1.0.0
   * @private
   */
  //───────────────────────────────────────────────────────────────────────────┘
  private onSuccess(listrContextSuccess:ListrContext):void {

    // Debug the contents of the Listr Context
    // TODO: Do we really need to know what's in the Listr Context var?
    SfdxFalconDebug.obj(`FALCON_EXT:${dbgNs}`, listrContextSuccess, `${clsDbgNs}onSuccess:listrContextSuccess: `);

    // All Actions should now be COMPlETE. Let the SFDX-Falcon Engine Response object know.
    this.engineResponse.actionComplete();

    // Done.
    return;
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      skipAction
   * @param       {string}  actionToCheck Required. The Action to check.
   * @returns     {boolean} Returns true if the action should be skipped.
   * @description Checks if an action should be skipped during compile.
   * @version     1.0.0
   * @private
   */
  //───────────────────────────────────────────────────────────────────────────┘
  private skipAction(actionToCheck:string=''):boolean {
    return this.engineContext.skipActions.includes(actionToCheck);
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      skipGroup
   * @param       {string}  groupToCheck Required. The Step Group Name to check.
   * @returns     {boolean} Returns true if the group should be skipped.
   * @description Checks if a group of steps should be skipped during compile.
   * @version     1.0.0
   * @private
   */
  //───────────────────────────────────────────────────────────────────────────┘
  private skipGroup(groupToCheck:string=''):boolean {
    return this.engineContext.skipGroups.includes(groupToCheck);
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      startExecution
   * @returns     {void}
   * @description Lets the Engine know that execution is starting.
   * @version     1.0.0
   * @private
   */
  //───────────────────────────────────────────────────────────────────────────┘
  private startExecution():void {
    // Start the status timer.
    this.engineStatus.startTimer();
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      stepGroupHasActiveTasks
   * @param       {AppxEngineStepGroup}  stepGroupToCheck Required. The Step
   *              Group object that will be inspected by this method.
   * @returns     {boolean} Returns true if the group has at least one active
   *              step. An "active step" is one whose Action is not on the
   *              skipActions list.
   * @description Checks if a Step Group has at least one active step.
   * @version     1.0.0
   * @private
   */
  //───────────────────────────────────────────────────────────────────────────┘
  private stepGroupHasActiveTasks(stepGroupToCheck:AppxEngineStepGroup):boolean {
    if (stepGroupToCheck.recipeSteps.length < 1) {
      return false;
    }    
    for (let step of stepGroupToCheck.recipeSteps) {
      if (this.skipAction(step.action) === false) {
        return true;
      }
    }
    // If we get this far, every single step action was on the skip list.
    return false;
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      validateEngine
   * @returns     {void}
   * @description Validates the overall state of the AppxRecipeEngine and 
   *              determines if it is ready for compilation.
   * @version     1.0.0
   * @private
   */
  //───────────────────────────────────────────────────────────────────────────┘
  private validateEngine():void {

    // Make sure the Action/Executor Map exists and has at least one mapped action.
    if (this.actionExecutorMap instanceof Map && this.actionExecutorMap.size < 1) {
      throw new Error (`ERROR_INVALID_ENGINE: actionExecutorMap is invalid or empty. `
                      +`Check your implementation of initializeActionMap() to troubleshoot.`);
    }
    // Make sure the Engine has an array of pre-build Step Groups (OK if array is empty)
    if (Array.isArray(this.preBuildStepGroups) === false) {
      throw new Error (`ERROR_INVALID_ENGINE: preBuildStepGroups is not an array. `
                      +`Check your implementation of initializePreBuildStepGroups() to troubleshoot.`);
    }
    // Make sure the Engine has an array of post-build Step Groups (OK if array is empty)
    if (Array.isArray(this.postBuildStepGroups) === false) {
      throw new Error (`ERROR_INVALID_ENGINE: postBuildStepGroups is not an array. `
                      +`Check your implementation of initializePostBuildStepGroups() to troubleshoot.`);
    }
    // Make sure the Engine Context has a Target Org with an alias
    if ((! this.engineContext.targetOrg)  || (! this.engineContext.targetOrg.alias)) {
      throw new Error (`ERROR_INVALID_ENGINE_CONTEXT: engineContext.targetOrg is invalid or empty. `
                      +`Check your implementation of initializeTargetOrg() to troubleshoot.`);
    }
    // Make sure the Engine Context has an Array of Skip Actions
    if (Array.isArray(this.engineContext.skipActions) === false) {
      throw new Error (`ERROR_INVALID_ENGINE_CONTEXT: engineContext.skipActions is invalid. `
                      +`Check your implementation of initializeSkipActions() to troubleshoot.`);
    }
    // Make sure the Engine Context has an Array of Skip Groups
    if (Array.isArray(this.engineContext.skipGroups) === false) {
      throw new Error (`ERROR_INVALID_ENGINE_CONTEXT: engineContext.skipGroups is invalid. `
                      +`Check your implementation of initializeSkipGroups() to troubleshoot.`);
    }
    // If we get here, it's safe to say the engine has been successfully initialized.
    this.engineContext.initialized = true;
    return;
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      validateHandler
   * @param       {AppxEngineHandler} handler Required. 
   * @returns     {void}
   * @description ???
   * @version     1.0.0
   * @private @static
   */
  //───────────────────────────────────────────────────────────────────────────┘
  private static validateHandler(handler:AppxEngineHandler):void {

    // TODO: Implement this validation method.
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      validateOuterRecipe
   * @param       {SfdxFalconRecipeJson} recipe Required. 
   * @returns     {void}
   * @description ???
   * @version     1.0.0
   * @protected @static
   */
  //───────────────────────────────────────────────────────────────────────────┘
  protected static validateOuterRecipe(recipe:SfdxFalconRecipeJson):void {

    // Make sure the Recipe contains an "options" key.
    if (typeof recipe.options === 'undefined') {
      throw new Error (`ERROR_INVALID_RECIPE: Recipes in the AppX family (eg. '${recipe.recipeType}' `
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
      AppxRecipeEngine.validateTargetOrg(targetOrg);
    }
    // Make sure there is an Array of Recipe Step Groups
    if (Array.isArray(recipe.recipeStepGroups) === false) {
      throw new Error (`ERROR_INVALID_RECIPE: An array of Recipe Step Groups must be provided at the root `
                      +`level of your recipe. The value you provided was of type `
                      +`${typeof recipe.recipeStepGroups}`);
    }
    // Validate every member of the Taget Orgs array.
    for (let recipeStepGroup of recipe.recipeStepGroups) {
      AppxRecipeEngine.validateRecipeStepGroup(recipeStepGroup);
    }
    // Make sure there is an Array of Handlers
    if (Array.isArray(recipe.handlers) === false) {
      throw new Error (`ERROR_INVALID_RECIPE: An array of Handlers must be provided at the root `
                      +`level of your recipe. The value you provided was of type `
                      +`${typeof recipe.handlers}`);
    }
    // Validate every member of the Handlers array.
    for (let handler of recipe.handlers as Array<AppxEngineHandler>) {
      AppxRecipeEngine.validateHandler(handler);
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
   * @private @static
   */
  //───────────────────────────────────────────────────────────────────────────┘
  private static validateRecipeStep(recipeStep:AppxEngineStep):void {

    // TODO: Implement this validation method.

  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      validateRecipeStepGroup
   * @param       {AppxRecipeStepGroup} stepGroup Required. 
   * @returns     {void}
   * @description ???
   * @version     1.0.0
   * @private @static
   */
  //───────────────────────────────────────────────────────────────────────────┘
  private static validateRecipeStepGroup(stepGroup:AppxEngineStepGroup):void {

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
      AppxRecipeEngine.validateRecipeStep(recipeStep);
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
  private static validateTargetOrg(targetOrg:TargetOrg):void {

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