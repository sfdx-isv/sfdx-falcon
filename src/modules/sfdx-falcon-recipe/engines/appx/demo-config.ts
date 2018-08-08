//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @file          modules/sfdx-falcon-recipe/engines/appx/demo-config.ts
 * @copyright     Vivek M. Chawla - 2018
 * @author        Vivek M. Chawla <@VivekMChawla>
 * @version       1.0.0
 * @license       MIT
 * @requires      module:???
 * @summary       ???
 * @description   ???
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
// Import External Modules
import * as path              from  'path';                                               // Why?

// Import Local Modules
import {SfdxFalconRecipe}     from '../../../sfdx-falcon-recipe';              // Why?
import {AppxRecipeEngine}     from '../../../sfdx-falcon-recipe/engines/appx'; // Why?
import {AppxEngineStep}       from '../../../sfdx-falcon-recipe/engines/appx'; // Why?
import {AppxEngineStepGroup}  from '../../../sfdx-falcon-recipe/engines/appx'; // Why?
import {AppxEngineStepResult} from '../../../sfdx-falcon-recipe/engines/appx'; // Why?
import {AppxEngineContext}    from '../../../sfdx-falcon-recipe/engines/appx'; // Why?
import {SfdxFalconStatus}     from '../../../../modules/sfdx-falcon-status';   // Why?
import {SfdxCliLogLevel}      from '../../../../modules/sfdx-falcon-types';    // Why?
import { SfdxFalconDebug } from '../../../sfdx-falcon-debug';

// Require External Modules

//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @class       AppxDemoConfigEngine
 * @extends     AppxRecipeEngine
 * @description ???
 * @version     1.0.0
 * @public
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
export class AppxDemoConfigEngine extends AppxRecipeEngine {





  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      execute
   * @param       {any} executionOptions ???? 
   * @description ???
   * @version     1.0.0
   * @public @async
   */
  //───────────────────────────────────────────────────────────────────────────┘
  public async execute(executionOptions:any):Promise<SfdxFalconStatus> {

    return null;

  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      executeStep
   * @param       {any} xxxx ???? 
   * @param       {any} xxxx ???? 
   * @description ???
   * @version     1.0.0
   * @protected @async
   */
  //───────────────────────────────────────────────────────────────────────────┘
  protected async executeStep(step:AppxEngineStep, observer:any):Promise<AppxEngineStepResult> {

    return null;

  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      initializeActionMap
   * @returns     {void}  ???
   * @description ???
   * @version     1.0.0
   * @protected
   */
  //───────────────────────────────────────────────────────────────────────────┘
  protected initializeActionMap():void {

    // Build a map of Action "aliases" to function 
    this.actionMap  = new Map<string, any>();
     
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      initializeRecipeEngineContext
   * @param       {any}   compileOptions ???? 
   * @returns     {void}  ???
   * @description ???
   * @version     1.0.0
   * @protected
   */
  //───────────────────────────────────────────────────────────────────────────┘
  protected initializeRecipeEngineContext(compileOptions:any={}):void {
    if (typeof this.recipe === 'undefined') {
      throw new Error (`ERROR_RECIPE_NOT_VALIDATED: The call to initializeRecipeEngineContext () `
                      +`was made before the incoming recipe was validated`);
    }
    SfdxFalconDebug.obj('FALCON_EXT:appx-demo-config', compileOptions, `AppxDemoConfigEngine:initializeRecipeEngineContext:compileOptions `);

    // Initialize the Recipe Engine Context object.
    this.engineContext = <AppxEngineContext>{};
 
    // Initialize basic context values
    this.engineContext.isExecuting  = false;
    this.engineContext.devHubAlias  = compileOptions.devHubAlias;
    this.engineContext.haltOnError  = this.recipe.options.haltOnError;
    this.engineContext.status       = new SfdxFalconStatus();

    // Set all the path related context values.
    this.engineContext.projectPath      = this.recipe.projectPath;
    this.engineContext.configPath       = path.join(this.engineContext.projectPath, `demo-config`);
    this.engineContext.mdapiSourcePath  = path.join(this.engineContext.projectPath, `mdapi-source`);
    this.engineContext.sfdxSourcePath   = null;
    this.engineContext.dataPath         = path.join(this.engineContext.projectPath, `demo-data`);

    // Set the log level. Default to ERROR if not specifed
    this.engineContext.logLevel = compileOptions.logLevel || SfdxCliLogLevel.ERROR;

    // Finally, initialize the Target Org
    this.initializeTargetOrg(compileOptions.targetOrgAlias);
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      initializeTargetOrg
   * @param       {string}  targetOrgAlias ???? 
   * @returns     {void} ???
   * @description ???
   * @version     1.0.0
   * @private
   */
  //───────────────────────────────────────────────────────────────────────────┘
  private initializeTargetOrg(targetOrgAlias:string):void {

    // Make sure a Target Org Option was specified.
    if (! targetOrgAlias) {
      throw new Error (`ERROR_COMPILE_RECIPE_FAILED: Target org alias not specified`);
    }
    // Make sure the Target Org Option matches one of the target orgs.
    for (let targetOrg of this.recipe.options.targetOrgs) {
      if (targetOrg.alias === targetOrgAlias) {
        this.engineContext.targetOrg = targetOrg;
      }
    }
    // Make sure we found a match and populated the targetOrg member var.
    if (typeof this.engineContext.targetOrg === 'undefined') {
      throw new Error (`ERROR_COMPILE_RECIPE_FAILED: The specified Target Org Alias '${targetOrgAlias}'  `
                      +`does not match any of the targetOrgs in your recipe`);
    }
  }
} // End of class






  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      xxxxxxxxxxx
   * @param       {any} xxxx ???? 
   * @param       {any} xxxx ???? 
   * @description ???
   * @version     1.0.0
   * @protected
   */
  //───────────────────────────────────────────────────────────────────────────┘
