//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @file          modules/sfdx-falcon-recipe/engines/appx/demo-config.ts
 * @copyright     Vivek M. Chawla - 2018
 * @author        Vivek M. Chawla <@VivekMChawla>
 * @version       1.0.0
 * @license       MIT
 * @summary       ???
 * @description   ???
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
// Import External Modules
import * as path              from  'path';                                               // Why?

// Import Local Modules
import {SfdxFalconDebug}          from '../../../sfdx-falcon-debug';                        // Why?
import {SfdxFalconRecipe}         from '../../../sfdx-falcon-recipe';                       // Why?
import {AppxRecipeEngine}         from '../../../sfdx-falcon-recipe/engines/appx';          // Why?
import {AppxEngineStep}           from '../../../sfdx-falcon-recipe/engines/appx';          // Why?
import {AppxEngineStepGroup}      from '../../../sfdx-falcon-recipe/engines/appx';          // Why?
import {AppxEngineStepResult}     from '../../../sfdx-falcon-recipe/engines/appx';          // Why?
import {AppxEngineContext}        from '../../../sfdx-falcon-recipe/engines/appx';          // Why?
import {SfdxFalconStatus}         from '../../../../modules/sfdx-falcon-status';            // Why?
import {SfdxCliLogLevel}          from '../../../../modules/sfdx-falcon-types';             // Why?
import {YeomanChoice}             from '../../../sfdx-falcon-yeoman-command/yeoman-helper'; // Why?

// Import Actions supported by this engine (appx:demo-config).
import {CreateScratchOrgAction} from '../appx/actions/create-scratch-org';        // Why?

// Requires
const inquirer  = require('inquirer');                                              // Provides UX for getting feedback from the user.
const chalk     = require('chalk');                                                 // Why?

// Set the File Local Debug Namespace
const dbgNs = 'RecipeEngine:appx:demo-config:';


//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @class       AppxDemoConfigEngine
 * @extends     AppxRecipeEngine
 * @summary     ???
 * @description ???
 * @version     1.0.0
 * @public
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
export class AppxDemoConfigEngine extends AppxRecipeEngine {

  // Only define clsDbgNs. Everything else is in the base class.
  private clsDbgNs:string = 'AppxDemoConfigEngine';

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      askUserForTargetOrgAlias
   * @returns     {Promise<string>} Resolves with the Alias of the target org 
   *              as specified by the User via an Inquirer interview.
   * @description Runs an Inquirer interview to present the user with the choice
   *              of Target Orgs based on what's described in the Recipe.
   * @version     1.0.0
   * @private @async
   */
  //───────────────────────────────────────────────────────────────────────────┘
  private async askUserForTargetOrgAlias():Promise<string> {

    // Prepare a list of choices based on Target Orgs in the recipe.
    let targetOrgChoices = new Array<YeomanChoice>();
    for (let targetOrg of this.recipe.options.targetOrgs) {
      targetOrgChoices.push({
        name:   `${targetOrg.orgName} -- ${targetOrg.description}`,
        value:  targetOrg,
        short:  `${targetOrg.orgName}`
      });
    }

    // Add a separator to the list
    targetOrgChoices.push(new inquirer.Separator());

    // Add a cancel option to the list
    targetOrgChoices.push({
      name:   `Cancel Installation`,
      value:  `CANCEL_INSTALLATION`,
      short:  `Demo Installation Canceled`
    });
    
    // Define the Inquirer Prompt (this powers the user interatcion in the CLI).
    let iqPrompt = [
      {
        type: 'list',
        name: 'targetOrg',
        message: 'Please select the installation target for this demo',
        choices: targetOrgChoices,
        pageSize: 5
      },
      {
        type:     'confirm',
        name:     'proceed',
        default:  false,
        message:  (answerHash) => {
          return  `The scratch org '${answerHash.targetOrg.alias}' will be `
                + `deleted before installing the demo. Proceed?`
        },
        when:     (answerHash) => {
          return (answerHash.targetOrg.isScratchOrg && answerHash.targetOrg !== 'CANCEL_INSTALLATION');
        }
      },
      {
        type:     'confirm',
        name:     'proceed',
        default:  false,
        message:  (answerHash) => { 
          return  `The alias '${answerHash.targetOrg.alias}' must be associated `
                + `with a compatible Salesforce org. Proceed with org validation?`
        },
        when:     (answerHash) => {
          return (! answerHash.targetOrg.isScratchOrg && answerHash.targetOrg !== 'CANCEL_INSTALLATION');
        }
      },
      {
        type: 'confirm',
        name: 'tryAgain',
        message:  (answerHash) => {
          return `Would you like to select a different demo target?`
        },
        when:     (answerHash) => {
          return (! answerHash.proceed && answerHash.targetOrg !== 'CANCEL_INSTALLATION');
        }
      }
    ];

    // Run the Inquirer prompt in a loop until the user wants out.
    let userSelections
    do {
      console.log('');
      userSelections = await inquirer.prompt(iqPrompt);
    } while (userSelections.proceed === false && userSelections.tryAgain === true)

    // One more line break.
    console.log('');

    // Debug
    SfdxFalconDebug.obj(`FALCON:${dbgNs}`, userSelections, `${this.clsDbgNs}:askUserForTargetOrgAlias:userSelections: `);

    // If the user did not affirmatively ask to PROCEED, then we must exit.
    if (userSelections.proceed === false) {
      throw new Error(`INSTALLATION_CANCELLED: Installation cancelled at user's request`);
    }

    // Make sure we actually got a target org alias choice from the user
    if (! userSelections.targetOrg.alias) {
      throw new Error(`ERROR_MISSING_DATA: Missing a value for targetOrg.alias`);
    }

    // If we are still here, make member var assignments based on the user's chosen Target.
    return userSelections.targetOrg.alias;
  }
  
  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      compileRecipe
   * @param       {SfdxFalconRecipe}  recipe  Required.
   * @param       {any}               compileOptions  Required.
   * @returns     {Promise<AppxDemoConfigEngine>} Resolves with a fully 
   *              constructed AppxDemoConfigEngine. Implemented this way so
   *              we can use asynchronous code while constructing the object.
   * @description ???
   * @version     1.0.0
   * @public @static @async
   */
  //───────────────────────────────────────────────────────────────────────────┘
  public static async compileRecipe(recipe:SfdxFalconRecipe, compileOptions:any):Promise<AppxDemoConfigEngine> {
    let compiledRecipeEngine = new AppxDemoConfigEngine();
    await compiledRecipeEngine.compile(recipe, compileOptions);
    return compiledRecipeEngine;
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      execute
   * @param       {any} executionOptions ???? 
   * @returns     {Promise<SfdxFalconStatus>} ???
   * @description Starts the execution of a compiled recipe. Implemented here
   *              instead of in the base class so we can fine-tune error and
   *              success handling resulting from the Listr Task execution.
   * @version     1.0.0
   * @public @async
   */
  //───────────────────────────────────────────────────────────────────────────┘
  public async execute(executionOptions:any):Promise<SfdxFalconStatus> {

    return null;

  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      initializeActionMap
   * @returns     {Promise<void>}  ???
   * @description ???
   * @version     1.0.0
   * @protected @async
   */
  //───────────────────────────────────────────────────────────────────────────┘
  protected async initializeActionMap():Promise<void> {

    // Build a map of Action "aliases" to function 
    this.actionExecutorMap = new Map<string, any>();
    this.actionExecutorMap.set('create-scratch-org', new CreateScratchOrgAction());
     
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      initializeRecipeEngineContext
   * @returns     {Promise<void>}  ???
   * @description ???
   * @version     1.0.0
   * @protected @async
   */
  //───────────────────────────────────────────────────────────────────────────┘
  protected async initializeRecipeEngineContext():Promise<void> {
    if (typeof this.recipe === 'undefined' || this.recipe.validated !== true) {
      throw new Error (`ERROR_RECIPE_NOT_VALIDATED: The call to initializeRecipeEngineContext () `
                      +`was made before the incoming recipe was validated`);
    }
    SfdxFalconDebug.obj(`FALCON_EXT:${dbgNs}`, this.engineContext.compileOptions, `${this.clsDbgNs}:initializeRecipeEngineContext:this.engineContext.compileOptions: `);

    // Initialize basic context values
    this.engineContext.isExecuting    = false;
    this.engineContext.devHubAlias    = this.engineContext.compileOptions.devHubAlias;
    this.engineContext.haltOnError    = this.recipe.options.haltOnError;
    this.engineContext.status         = new SfdxFalconStatus();

    // Set all the path related context values.
    this.engineContext.projectPath      = this.recipe.projectPath;
    this.engineContext.configPath       = path.join(this.engineContext.projectPath, `demo-config`);
    this.engineContext.mdapiSourcePath  = path.join(this.engineContext.projectPath, `mdapi-source`);
    this.engineContext.sfdxSourcePath   = null;
    this.engineContext.dataPath         = path.join(this.engineContext.projectPath, `demo-data`);

    // Set the log level. Default to ERROR if not specifed
    this.engineContext.logLevel = this.engineContext.compileOptions.logLevel || SfdxCliLogLevel.ERROR;

    // Finally, initialize the Target Org
    await this.initializeTargetOrg(this.engineContext.compileOptions.targetOrgAlias);
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      initializeTargetOrg
   * @param       {string}  targetOrgAlias ???? 
   * @returns     {void} ???
   * @description ???
   * @version     1.0.0
   * @private @async
   */
  //───────────────────────────────────────────────────────────────────────────┘
  private async initializeTargetOrg(targetOrgAlias:string):Promise<void> {

    // If Target Org Alias was NOT provided, ask the user to choose one of the defined targetOrgs.
    if (! targetOrgAlias) {
      targetOrgAlias = await this.askUserForTargetOrgAlias()
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

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      validateInnerRecipe
   * @param       {SfdxFalconRecipe}  recipe  Required.
   * @returns     {Promise<void>} ???
   * @description ???
   * @version     1.0.0
   * @private @static
   */
  //───────────────────────────────────────────────────────────────────────────┘
  private static validateInnerRecipe(recipe:SfdxFalconRecipe):void {
    // Add any additonal "deep" validation here.
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      validateRecipe
   * @param       {SfdxFalconRecipe}  recipe  Required.
   * @returns     {void}  ???
   * @description ???
   * @version     1.0.0
   * @public @static
   */
  //───────────────────────────────────────────────────────────────────────────┘
  public static validateRecipe(recipe:SfdxFalconRecipe):void {
    // Sart by validating the OUTER recipe via the base class
    AppxRecipeEngine.validateOuterRecipe(recipe);

    // Next, validate the INNER recipe via this class
    AppxDemoConfigEngine.validateInnerRecipe(recipe);

    // If we get here without throwing an error, the recipe is VALID.
    return;
  }
} // End of class