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
import {SfdxFalconRecipeJson}     from '../../../sfdx-falcon-recipe';                       // Why?
import {SfdxFalconRecipeResult}   from '../../../sfdx-falcon-recipe';                       // Why?
import {AppxRecipeEngine}         from '../../../sfdx-falcon-recipe/engines/appx';          // Why?
import {AppxEngineStep}           from '../../../sfdx-falcon-recipe/engines/appx';          // Why?
import {AppxEngineStepGroup}      from '../../../sfdx-falcon-recipe/engines/appx';          // Why?
import {AppxEngineStepResult}     from '../../../sfdx-falcon-recipe/engines/appx';          // Why?
import {AppxEngineContext}        from '../../../sfdx-falcon-recipe/engines/appx';          // Why?
import {TargetOrg}                from '../../../sfdx-falcon-recipe/engines/appx';          // Why?
import {SfdxFalconStatus}         from '../../../../modules/sfdx-falcon-status';            // Why?
import {SfdxCliLogLevel}          from '../../../../modules/sfdx-falcon-types';             // Why?
import {YeomanChoice}             from '../../../sfdx-falcon-yeoman-command/yeoman-helper'; // Why?
import {YeomanCheckboxChoice}     from '../../../sfdx-falcon-yeoman-command/yeoman-helper'; // Why?

// Import Actions supported by this engine (appx:demo-config).
import {CreateScratchOrgAction} from '../appx/actions/create-scratch-org';                  // Why?

// Requires
const inquirer  = require('inquirer');                                              // Provides UX for getting feedback from the user.
const chalk     = require('chalk');                                                 // Why?

// Set the File Local Debug Namespace
const dbgNs     = 'RecipeEngine:appx:demo-config:';
const clsDbgNs  = 'AppxDemoConfigEngine:';

//─────────────────────────────────────────────────────────────────────────────┐
// Declare interfaces for AppxDemoConfigEngine
//─────────────────────────────────────────────────────────────────────────────┘
export interface AppxDemoConfigCompileOptions {
  targetOrgAlias: string;
  haltOnError:    boolean;
  skipOrgRefresh: boolean;
  skipGroups:     Array<string>;
  skipActions:    Array<string>;
}

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

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      askUserForSkipGroups
   * @returns     {Promise<Array<string>>} Resolves with an Array of strings
   *              representing the FINAL set of "Skip Groups".  This will end
   *              up determining what actually gets compiled.
   * @description Runs an Inquirer interview to present the user with a list of
   *              Step groups and the ability to select/deselect them to 
   *              compose the final set of "Skip Groups".
   * @version     1.0.0
   * @private @async
   */
  //───────────────────────────────────────────────────────────────────────────┘
  private async askUserForSkipGroups():Promise<Array<string>> {
  
    let iqPromptOne = [
      {
        type:     'confirm',
        name:     'proceed',
        default:  false,
        message:  'Set advanced options now?',
        when:     true
      },
      {
        type:     'confirm',
        name:     'reallyProceed',
        default:  false,
        message:  (answerHash) => {
          return `${chalk.red('Warning:')} Only advanced users should set these options. Proceed anyway?`
        },
        when:     (answerHash) => {
          return (answerHash.proceed);
        }
      }
    ];

    // Prompt the user, then return the current SkipGroups (basically, user is accepting defaults).
    console.log('');
    let userSelectionsOne = await inquirer.prompt(iqPromptOne);
    if (userSelectionsOne.reallyProceed === false) {
      return this.recipe.options.skipGroups;
    }

    // If we get here, we're going to ask the user to customize which StepGroups will execute.
    // Start by defining the choices array for Inquirer.
    let stepGroupChoices = new Array<YeomanCheckboxChoice>();
    for (let recipeStepGroup of this.recipe.recipeStepGroups as Array<AppxEngineStepGroup>) {
      stepGroupChoices.push({
        name:     recipeStepGroup.stepGroupName,
        value:    recipeStepGroup.alias,
        short:    recipeStepGroup.stepGroupName,
        checked:  (! this.recipe.options.skipGroups.includes(recipeStepGroup.alias))
      });
    }

    // Define the Inquirer Prompt (this powers the user interatcion in the CLI).
    let iqPromptTwo = [
      {
        type:     'checkbox',
        name:     'stepGroupChoices',
        message:  'Which install steps should be executed?',
        choices:  stepGroupChoices,
        pageSize: 8,
        filter:  (userInput) => {
          for (let stepGroupChoice of stepGroupChoices) {
            if (userInput.includes(stepGroupChoice.value)) stepGroupChoice.checked = true;
            else stepGroupChoice.checked = false;            
          }
          return userInput;
        }
      },
      {
        type:     'confirm',
        name:     'proceed',
        default:  false,
        message:  (answerHash) => {
          return  `Proceed with installation?`
        },
        when:     true
      },
      {
        type: 'confirm',
        name: 'tryAgain',
        message:  (answerHash) => {
          return `Would you like to change your selections?`
        },
        when:     (answerHash) => {
          return (! answerHash.proceed);
        }
      }
    ];

    // Run the Inquirer prompt in a loop until the user wants out.
    let userSelectionsTwo
    do {
      console.log('');
      userSelectionsTwo = await inquirer.prompt(iqPromptTwo);
    } while (userSelectionsTwo.proceed === false && userSelectionsTwo.tryAgain === true)

    // One more line break.
    console.log('');

    // Debug
    SfdxFalconDebug.obj(`FALCON:${dbgNs}`, userSelectionsTwo, `${clsDbgNs}askUserForSkipGroups:userSelections: `);

    // If the user did not affirmatively ask to PROCEED, then we must exit.
    if (userSelectionsTwo.proceed === false) {
      throw new Error(`INSTALLATION_CANCELLED: Installation cancelled at user's request`);
    }

    // Go through the stepGroupChoices and build final Skip Groups using choices marked FALSE.
    let finalSkipGroups = new Array<string>();
    for (let stepGroupChoice of stepGroupChoices) {
      if (stepGroupChoice.checked === false) {
        finalSkipGroups.push(stepGroupChoice.value);
      }
    }

    // Done! This list of Skip Groups should be respected when the recipe is compiled.
    SfdxFalconDebug.obj(`FALCON:${dbgNs}`, finalSkipGroups, `${clsDbgNs}askUserForSkipGroups:finalSkipGroups: `);
    return finalSkipGroups;
  }

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
      short:  `Installation Canceled`
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

    // Debug
    SfdxFalconDebug.obj(`FALCON:${dbgNs}`, userSelections, `${clsDbgNs}askUserForTargetOrgAlias:userSelections: `);

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
   * @param       {any} [executionOptions]  Optional. 
   * @returns     {Promise<SfdxFalconRecipeResult>} ???
   * @description Starts the execution of a compiled recipe. Implemented here
   *              instead of in the base class so we can fine-tune error and
   *              success handling resulting from the Listr Task execution.
   * @version     1.0.0
   * @public @async
   */
  //───────────────────────────────────────────────────────────────────────────┘
  public async execute(executionOptions:any={}):Promise<SfdxFalconRecipeResult> {

    
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
   * @method      initializePostBuildStepGroups
   * @returns     {Promise<void>}  ???
   * @description ???
   * @version     1.0.0
   * @protected @async
   */
  //───────────────────────────────────────────────────────────────────────────┘
  protected async initializePostBuildStepGroups():Promise<void> {
    // Intentionally empty. No post-build steps needed for AppxDemoConfigEngine.
    // DEBUG (see all the pre-build step groups added in this call).
    SfdxFalconDebug.obj(`FALCON:${dbgNs}`, this.postBuildStepGroups, `${clsDbgNs}initializePostBuildStepGroups:this.postBuildStepGroups: `);
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      initializePreBuildStepGroups
   * @returns     {Promise<void>}  ???
   * @description ???
   * @version     1.0.0
   * @protected @async
   */
  //───────────────────────────────────────────────────────────────────────────┘
  protected async initializePreBuildStepGroups():Promise<void> {

    // If the Target Org is scratch AND skipOrgRefresh not specified as a compile option
    if (this.engineContext.targetOrg.isScratchOrg && this.engineContext.compileOptions.skipOrgRefresh !== true) {

      // Build an additional Recipe Step Group (RSG) to handle scratch org refresh.
      let rebuildScratchOrgRSG:AppxEngineStepGroup = {
        stepGroupName:  "Refresh Scratch Org",
        alias:          "appx:demo-recipe:rebuild-scratch-org",
        description:    "Refresh (delete then create) the target scratch org before installing the demo",
        recipeSteps:  [
          {
            stepName:     'Delete Current Scratch Org',
            description:  'Deletes the current scratch org',
            action:       'delete-scratch-org',
            options:  {
              scratchOrgAlias:  `${this.engineContext.targetOrg.alias}`
            }
          },
          {
            stepName:     'Create New Scratch Org',
            description:  'Creates a new scratch org for this demo',
            action:       'create-scratch-org',
            options:  {
              scratchOrgAlias:  `${this.engineContext.targetOrg.alias}`,
              scratchDefJson:   `${this.engineContext.targetOrg.scratchDefJson}`
            }
          }
        ]
      };

      // Add the new "Rebuild Scratch Org" Step Group to the pre-build Step Groups array.
      this.preBuildStepGroups.push(rebuildScratchOrgRSG);
    }

    // DEBUG (see all the pre-build step groups added in this call).
    SfdxFalconDebug.obj(`FALCON:${dbgNs}`, this.preBuildStepGroups, `${clsDbgNs}initializePreBuildStepGroups:this.preBuildStepGroups: `);

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

    // Make sure that the recipe has been set and validated.
    if (typeof this.recipe === 'undefined' || this.recipe.validated !== true) {
      throw new Error (`ERROR_RECIPE_NOT_VALIDATED: The call to initializeRecipeEngineContext () `
                      +`was made before the incoming recipe was validated`);
    }
    SfdxFalconDebug.obj(`FALCON_EXT:${dbgNs}`, this.engineContext.compileOptions, `${clsDbgNs}initializeRecipeEngineContext:this.engineContext.compileOptions: `);

    // Initialize basic context values
    this.engineContext.executing    = false;
    this.engineContext.devHubAlias  = this.engineContext.compileOptions.devHubAlias;
    this.engineContext.haltOnError  = this.recipe.options.haltOnError;
    this.engineContext.status       = new SfdxFalconStatus();

    // Store a reference to the Recipe's Project Context.
    this.engineContext.projectContext = this.recipe.projectContext;

    // Set the log level. Default to ERROR if not specifed
    this.engineContext.logLevel = this.engineContext.compileOptions.logLevel || SfdxCliLogLevel.ERROR;

    // Final DEBUG before returning.
    SfdxFalconDebug.obj(`FALCON_EXT:${dbgNs}`, this.engineContext, `${clsDbgNs}initializeRecipeEngineContext:this.engineContext: (at end of Engine Context Initialization) `);
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      initializeSkipActions
   * @returns     {Promise<void>} ???
   * @description ???
   * @version     1.0.0
   * @protected @async
   */
  //───────────────────────────────────────────────────────────────────────────┘
  protected async initializeSkipActions():Promise<void> {

    // If Compile Options define Skip Actions, that overrides the recipe.
    if (Array.isArray(this.engineContext.compileOptions.skipActions)) {
      this.engineContext.skipActions = this.engineContext.compileOptions.skipActions
      return;
    }

    // If we get here, just use the Skip Actions from the Recipe.
    this.engineContext.skipActions = this.recipe.options.skipActions;
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      initializeSkipGroups
   * @returns     {Promise<void>} ???
   * @description ???
   * @version     1.0.0
   * @protected @async
   */
  //───────────────────────────────────────────────────────────────────────────┘
  protected async initializeSkipGroups():Promise<void> {

    // If Compile Options define Skip Groups, that overrides the recipe AND user choice.
    if (Array.isArray(this.engineContext.compileOptions.skipGroups)) {
      this.engineContext.skipGroups = this.engineContext.compileOptions.skipGroups
      return;
    }

    // Check if the Recipe allows the user to customize the installation.
    if (this.recipe.options.noCustomInstall) {
      this.engineContext.skipGroups = this.recipe.options.skipGroups;
      return;
    }

    // If we get here, then we let the user decide what the Skip Groups are.
    this.engineContext.skipGroups = await this.askUserForSkipGroups();
    return;
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      initializeTargetOrg
   * @returns     {Promise<void>} ???
   * @description ???
   * @version     1.0.0
   * @protected @async
   */
  //───────────────────────────────────────────────────────────────────────────┘
  protected async initializeTargetOrg():Promise<void> {

    // If Target Org Alias not provided in Compile Options, ask user to choose one of the defined targetOrgs.
    let targetOrgAlias = this.engineContext.compileOptions.targetOrgAlias;
    if (! targetOrgAlias) {
      targetOrgAlias = await this.askUserForTargetOrgAlias()
    }

    // Make sure the Target Org Option matches one of the target orgs in the recipe.
    let selectedTargetOrg = null;
    for (let targetOrg of this.recipe.options.targetOrgs) {
      if (targetOrg.alias === targetOrgAlias) {
        selectedTargetOrg = targetOrg;
      }
    }

    // Make sure we found a match and populated the targetOrg member var.
    if (selectedTargetOrg === null) {
      throw new Error (`ERROR_COMPILE_RECIPE_FAILED: The specified Target Org Alias '${targetOrgAlias}'  `
                      +`does not match any of the targetOrgs in your recipe`);
    }

    // Set the Engine Context's Target Org.
    this.engineContext.targetOrg = selectedTargetOrg;
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      validateInnerRecipe
   * @param       {SfdxFalconRecipeJson}  sfdxFalconRecipeJson  Required.
   * @returns     {Promise<void>} ???
   * @description ???
   * @version     1.0.0
   * @private @static
   */
  //───────────────────────────────────────────────────────────────────────────┘
  private static validateInnerRecipe(sfdxFalconRecipeJson:SfdxFalconRecipeJson):void {
    // Add any additonal "deep" validation here.
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      validateRecipe
   * @param       {SfdxFalconRecipeJson}  sfdxFalconRecipeJson  Required.
   * @returns     {void}  ???
   * @description ???
   * @version     1.0.0
   * @public @static
   */
  //───────────────────────────────────────────────────────────────────────────┘
  public static validateRecipe(sfdxFalconRecipeJson:SfdxFalconRecipeJson):void {
    // Sart by validating the OUTER recipe via the base class
    AppxRecipeEngine.validateOuterRecipe(sfdxFalconRecipeJson);

    // Next, validate the INNER recipe via this class
    AppxDemoConfigEngine.validateInnerRecipe(sfdxFalconRecipeJson);

    // If we get here without throwing an error, the recipe is VALID.
    return;
  }
} // End of class