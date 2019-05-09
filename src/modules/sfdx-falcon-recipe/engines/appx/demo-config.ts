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
import {JsonMap}                  from  '@salesforce/ts-types';         // Why?

// Import Local Modules
import {SfdxFalconDebug}          from '../../../sfdx-falcon-debug';    // Class. Internal Debug module

// Recipe Imports
import {SfdxFalconRecipe}         from '../../../sfdx-falcon-recipe';   // Class. Represents an instance of a valid SFDX-Falcon Recipe.
import {SfdxFalconRecipeJson}     from '../../../sfdx-falcon-recipe';   // Interface. Representation of the JSON schema for an SFDX-Falcon Recipe configuration file.

// Recipe Engine Imports
import {AppxRecipeEngine}         from '../../../sfdx-falcon-recipe/engines/appx';    // Why?
import {AppxEngineStepGroup}      from '../../../sfdx-falcon-recipe/engines/appx';    // Why?

// Action Imports (determines what is supported by appx:demo-config engine)
import {AppxEngineAction}         from '../appx/actions';                             // Why?
import {ConfigureAdminUserAction} from '../appx/actions/configure-admin-user';        // Why?
import {CreateScratchOrgAction}   from '../appx/actions/create-scratch-org';          // Why?
import {CreateUserAction}         from '../appx/actions/create-user';                 // Why?
import {DeleteScratchOrgAction}   from '../appx/actions/delete-scratch-org';          // Why?
import {DeployMetadataAction}     from '../appx/actions/deploy-metadata';             // Why?
import {ExecuteApexAction}        from '../appx/actions/execute-apex';                // Why?
import {ImportDataTreeAction}     from '../appx/actions/import-data-tree';            // Why?
import {InstallPackageAction}     from '../appx/actions/install-package';             // Why?

// Import Falcon Types
import {ListrContext}             from '../../../sfdx-falcon-types';      // Type. Alias to "any". Used in project to make code easier to read.
import {SfdxCliLogLevel}          from '../../../sfdx-falcon-types';      // Enum. Represents the LogLevel types from the Salesforce CLI.
import {YeomanChoice}             from '../../../sfdx-falcon-types';      // Interface. Represents a Yeoman/Inquirer choice object.
import {YeomanCheckboxChoice}     from '../../../sfdx-falcon-types';      // Interface. Represents a "checkbox choice" in Yeoman/Inquirer.

// Import Recipe Types
import {CompileOptions}           from  '../../types';  // Type. Alias to JsonMap.
import {ExecutionOptions}         from  '../../types';  // Type. Alias to JsonMap.

// Requires
const inquirer  = require('inquirer');    // Provides UX for getting feedback from the user.
const chalk     = require('chalk');       // Why?

// Set the File Local Debug Namespace
const dbgNs     = 'ENGINE:appx:demo-config:';


//─────────────────────────────────────────────────────────────────────────────┐
// Declare interfaces for AppxDemoConfigEngine
//─────────────────────────────────────────────────────────────────────────────┘
export interface AppxDemoConfigCompileOptions {
  targetOrgAlias: string;
  haltOnError:    boolean;
  skipOrgRefresh: boolean;
  skipGroups:     string[];
  skipActions:    string[];
}

//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @class       AppxDemoConfigEngine
 * @extends     AppxRecipeEngine
 * @summary     Implementation for an ADK specific AppX Recipe Engine.
 * @description Implementation for an ADK specific AppX Recipe Engine.
 * @public
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
export class AppxDemoConfigEngine extends AppxRecipeEngine {

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      compileRecipe
   * @param       {SfdxFalconRecipe}  recipe  Required.
   * @param       {CompileOptions}  compileOptions  Required.
   * @returns     {Promise<AppxDemoConfigEngine>} Resolves with a fully
   *              constructed AppxDemoConfigEngine. Implemented this way so
   *              we can use asynchronous code while constructing the object.
   * @description ???
   * @public @static @async
   */
  //───────────────────────────────────────────────────────────────────────────┘
  public static async compileRecipe(recipe:SfdxFalconRecipe, compileOptions:CompileOptions):Promise<AppxDemoConfigEngine> {

    // Instantiate a new Appx Demo Config Engine
    const compiledRecipeEngine = new AppxDemoConfigEngine('appx:demo-config', recipe.recipeName);

    // Compile the engine with the given Recipe and Compile Options (implemented by base class)
    await compiledRecipeEngine.compile(recipe, compileOptions);

    // Return the compiled Engine. It should be ready for the caller to run.
    return compiledRecipeEngine;
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
   * @method      executeEngine
   * @param       {ExecutionOptions} [executionOptions]  Optional.
   * @returns     {Promise<ListrContext>} Resolves with a ListrContext object
   *              (basically, a type alias for "any" since Listr doesn't expose
   *              a TypeScript type for their code).
   * @description Executes the Listr Tasks that were previously compiled into
   *              this Engine. Implemented here instead of in the base class so
   *              we can fine-tune error and success handling resulting from
   *              the Listr Task execution.
   * @protected @async
   */
  //───────────────────────────────────────────────────────────────────────────┘
  protected async executeEngine(executionOptions:ExecutionOptions={}):Promise<ListrContext> {

    // Print a message informing the user that installation is beginning.
    console.log(chalk`\n{yellow Recipe '${this.recipe.recipeName}' installing '${this.engineContext.targetOrg.orgName}' to ${this.engineContext.targetOrg.alias}:}`);

    // Execute the Listr Tasks that were compiled into this Engine.
    const listrContext = await this.listrTasks.run();

    // Return the Listr Context
    return listrContext;
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      initializeActionMap
   * @returns     {Promise<void>}  ???
   * @description ???
   * @protected @async
   */
  //───────────────────────────────────────────────────────────────────────────┘
  protected async initializeActionMap():Promise<void> {

    // Build a map of Action "aliases" to instances of the Action Classes that implement that alias.
    this.actionExecutorMap = new Map<string, AppxEngineAction>();
    this.actionExecutorMap.set('create-scratch-org',    new CreateScratchOrgAction());
    this.actionExecutorMap.set('create-user',           new CreateUserAction());
    this.actionExecutorMap.set('configure-admin-user',  new ConfigureAdminUserAction());
    this.actionExecutorMap.set('delete-scratch-org',    new DeleteScratchOrgAction());
    this.actionExecutorMap.set('deploy-metadata',       new DeployMetadataAction());
    this.actionExecutorMap.set('execute-apex',          new ExecuteApexAction());
    this.actionExecutorMap.set('import-data-tree',      new ImportDataTreeAction());
    this.actionExecutorMap.set('install-package',       new InstallPackageAction());
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      initializePostBuildStepGroups
   * @returns     {Promise<void>}
   * @description ???
   * @protected @async
   */
  //───────────────────────────────────────────────────────────────────────────┘
  protected async initializePostBuildStepGroups():Promise<void> {
    // Intentionally empty. No post-build steps needed for AppxDemoConfigEngine.
    // DEBUG (see all the pre-build step groups added in this call).
    SfdxFalconDebug.obj(`${dbgNs}initializePostBuildStepGroups:postBuildStepGroups:`, this.postBuildStepGroups, `postBuildStepGroups: `);
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      initializePreBuildStepGroups
   * @returns     {Promise<void>}
   * @description ???
   * @protected @async
   */
  //───────────────────────────────────────────────────────────────────────────┘
  protected async initializePreBuildStepGroups():Promise<void> {

    // If the Target Org is scratch AND skipOrgRefresh not specified as a compile option
    if (this.engineContext.targetOrg.isScratchOrg && this.engineContext.compileOptions.skipOrgRefresh !== true) {

      // Build an additional Recipe Step Group (RSG) to handle scratch org refresh.
      const rebuildScratchOrgRSG:AppxEngineStepGroup = {
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
    SfdxFalconDebug.obj(`${dbgNs}initializePreBuildStepGroups:preBuildStepGroups:`, this.preBuildStepGroups, `preBuildStepGroups: `);

  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      initializeRecipeEngineContext
   * @returns     {Promise<void>}
   * @description ???
   * @protected @async
   */
  //───────────────────────────────────────────────────────────────────────────┘
  protected async initializeRecipeEngineContext():Promise<void> {

    // Make sure that the recipe has been set and validated.
    if (typeof this.recipe === 'undefined' || this.recipe.validated !== true) {
      throw new Error (`ERROR_RECIPE_NOT_VALIDATED: The call to initializeRecipeEngineContext () `
                      +`was made before the incoming recipe was validated`);
    }
    SfdxFalconDebug.obj(`${dbgNs}initializeRecipeEngineContext:`, this.engineContext.compileOptions, `this.engineContext.compileOptions: `);

    // Store a reference to the Recipe's Project Context.
    this.engineContext.projectContext = this.recipe.projectContext;

    // Check for DevHub Alias override.
    this.engineContext.devHubAlias  = (this.engineContext.compileOptions.devHubAlias
                                      || this.engineContext.projectContext.falconLocalConfig.devHubAlias) as string;

    // Check for Halt on Error override.
    this.engineContext.haltOnError  = (this.engineContext.compileOptions.haltOnError
                                      || this.recipe.options.haltOnError) as boolean;

    // Check for Log Level override. Default to ERROR if not specifed.
    this.engineContext.logLevel     = (this.engineContext.compileOptions.logLevel
                                      || SfdxCliLogLevel.ERROR) as SfdxCliLogLevel;

    // Initialize basic context values
    this.engineContext.executing    = false;

    // Final DEBUG before returning.
    SfdxFalconDebug.obj(`${dbgNs}initializeRecipeEngineContext:engineContext:`, this.engineContext, `engineContext: (at end of Engine Context Initialization) `);
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      initializeSkipActions
   * @returns     {Promise<void>} ???
   * @description ???
   * @protected @async
   */
  //───────────────────────────────────────────────────────────────────────────┘
  protected async initializeSkipActions():Promise<void> {

    // If Compile Options define Skip Actions, that overrides the recipe.
    if (Array.isArray(this.engineContext.compileOptions.skipActions)) {
      this.engineContext.skipActions = this.engineContext.compileOptions.skipActions as string[];
      return;
    }

    // If we get here, just use the Skip Actions from the Recipe.
    this.engineContext.skipActions = this.recipe.options.skipActions as string[];
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      initializeSkipGroups
   * @returns     {Promise<void>}
   * @description ???
   * @protected @async
   */
  //───────────────────────────────────────────────────────────────────────────┘
  protected async initializeSkipGroups():Promise<void> {

    // If Compile Options define Skip Groups, that overrides the recipe AND user choice.
    if (Array.isArray(this.engineContext.compileOptions.skipGroups)) {
      this.engineContext.skipGroups = this.engineContext.compileOptions.skipGroups as string[];
      return;
    }

    // Check if the Recipe allows the user to customize the installation.
    if (this.recipe.options.noCustomInstall) {
      this.engineContext.skipGroups = this.recipe.options.skipGroups as string[];
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
   * @protected @async
   */
  //───────────────────────────────────────────────────────────────────────────┘
  protected async initializeTargetOrg():Promise<void> {

    // Try setting the Target Org Alias from the Compile Options.
    let targetOrgAlias  = this.engineContext.compileOptions.targetOrgAlias;

    // Create a variable so we know to skip final confirmation (askUserForTargetOrgAlias() does its own confirm prompts)
    let targetConfirmationRequired:boolean = null;

    // If Target Org Alias not provided in Compile Options, use what's in the Recipe
    if (! targetOrgAlias) {
      if ((this.recipe.options.targetOrgs as JsonMap[]).length === 1) {
        targetOrgAlias  = this.recipe.options.targetOrgs[0].alias;
        targetConfirmationRequired = true;
      }
      else {
        targetOrgAlias = await this.askUserForTargetOrgAlias();
        targetConfirmationRequired = false;
      }
    }

    // Make sure the Target Org Option matches one of the target orgs in the recipe.
    let selectedTargetOrg = null;
    for (const targetOrg of this.recipe.options.targetOrgs as JsonMap[]) {
      if (targetOrg.alias === targetOrgAlias) {
        selectedTargetOrg = targetOrg;
      }
    }

    // Make sure we found a match and populated the targetOrg member var.
    if (selectedTargetOrg === null) {
      throw new Error (`ERROR_COMPILE_RECIPE_FAILED: The specified Target Org Alias '${targetOrgAlias}'  `
                      +`does not match any of the targetOrgs in your recipe`);
    }

    SfdxFalconDebug.obj(`${dbgNs}initializeTargetOrg:selectedTargetOrg:`, selectedTargetOrg, `selectedTargetOrg: `);

    // Set the Engine Context's Target Org.
    this.engineContext.targetOrg = selectedTargetOrg;

    // If install confirmation is needed, confirm that the user wants to build a demo against the target org
    if (targetConfirmationRequired) {
      if (await this.confirmDemoTarget() === false) {
        console.log('');
        throw new Error(`INSTALLATION_CANCELLED: Installation cancelled at user's request`);
      }
    }
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      askUserForSkipGroups
   * @returns     {Promise<Array<string>>} Resolves with an Array of strings
   *              representing the FINAL set of "Skip Groups".  This will end
   *              up determining what actually gets compiled.
   * @description Runs an Inquirer interview to present the user with a list of
   *              Step groups and the ability to select/deselect them to
   *              compose the final set of "Skip Groups".
   * @private @async
   */
  //───────────────────────────────────────────────────────────────────────────┘
  private async askUserForSkipGroups():Promise<string[]> {
  
    const iqPromptOne = [
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
        message:  answerHash => {
          return `${chalk.red('Warning:')} Only advanced users should set these options. Proceed anyway?`;
        },
        when:     answerHash => {
          return (answerHash.proceed);
        }
      }
    ];

    // Prompt the user, then return the current SkipGroups (basically, user is accepting defaults).
    console.log('');
    const userSelectionsOne = await inquirer.prompt(iqPromptOne);
    if (userSelectionsOne.reallyProceed !== true) {
      return this.recipe.options.skipGroups as string[];
    }

    // If we get here, we're going to ask the user to customize which StepGroups will execute.
    // Start by defining the choices array for Inquirer.
    const stepGroupChoices = new Array<YeomanCheckboxChoice>();

    // Build choices for the PRE-BUILD Recipe Step Groups
    for (const recipeStepGroup of this.preBuildStepGroups as AppxEngineStepGroup[]) {
      stepGroupChoices.push({
        name:     recipeStepGroup.stepGroupName,
        value:    recipeStepGroup.alias,
        short:    recipeStepGroup.stepGroupName,
        checked:  (! (this.recipe.options.skipGroups as string[]).includes(recipeStepGroup.alias))
      });
    }

    // Build choices for the CORE Recipe Step Groups
    for (const recipeStepGroup of this.recipe.recipeStepGroups as unknown as AppxEngineStepGroup[]) {
      stepGroupChoices.push({
        name:     recipeStepGroup.stepGroupName,
        value:    recipeStepGroup.alias,
        short:    recipeStepGroup.stepGroupName,
        checked:  (! (this.recipe.options.skipGroups as string[]).includes(recipeStepGroup.alias))
      });
    }

    // Build choices for the POST-BUILD Recipe Step Groups
    for (const recipeStepGroup of this.postBuildStepGroups as AppxEngineStepGroup[]) {
      stepGroupChoices.push({
        name:     recipeStepGroup.stepGroupName,
        value:    recipeStepGroup.alias,
        short:    recipeStepGroup.stepGroupName,
        checked:  (! (this.recipe.options.skipGroups as string[]).includes(recipeStepGroup.alias))
      });
    }

    // Define the Inquirer Prompt (this powers the user interatcion in the CLI).
    const iqPromptTwo = [
      {
        type:     'checkbox',
        name:     'stepGroupChoices',
        message:  'Which install steps should be executed?',
        choices:  stepGroupChoices,
        pageSize: 8,
        filter:  userInput => {
          for (const stepGroupChoice of stepGroupChoices) {
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
        message:  answerHash => {
          return  `Proceed with installation?`;
        },
        when:     true
      },
      {
        type: 'confirm',
        name: 'tryAgain',
        message:  answerHash => {
          return `Would you like to change your selections?`;
        },
        when:     answerHash => {
          return (! answerHash.proceed);
        }
      }
    ];

    // Run the Inquirer prompt in a loop until the user wants out.
    let userSelectionsTwo;
    do {
      console.log('');
      userSelectionsTwo = await inquirer.prompt(iqPromptTwo);
    } while (userSelectionsTwo.proceed === false && userSelectionsTwo.tryAgain === true);

    // Debug
    SfdxFalconDebug.obj(`${dbgNs}askUserForSkipGroups:userSelectionsTwo:`, userSelectionsTwo, `userSelectionsTwo: `);

    // If the user did not affirmatively ask to PROCEED, then we must exit.
    if (userSelectionsTwo.proceed === false) {
      console.log('');
      throw new Error(`INSTALLATION_CANCELLED: Installation cancelled at user's request`);
    }

    // Go through the stepGroupChoices and build final Skip Groups using choices marked FALSE.
    const finalSkipGroups = new Array<string>();
    for (const stepGroupChoice of stepGroupChoices) {
      if (stepGroupChoice.checked === false) {
        finalSkipGroups.push(stepGroupChoice.value);
      }
    }

    // Done! This list of Skip Groups should be respected when the recipe is compiled.
    SfdxFalconDebug.obj(`${dbgNs}askUserForSkipGroups:finalSkipGroups:`, finalSkipGroups, `finalSkipGroups: `);
    return finalSkipGroups;
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      askUserForTargetOrgAlias
   * @returns     {Promise<string>} Resolves with the Alias of the target org
   *              as specified by the User via an Inquirer interview.
   * @description Runs an Inquirer interview to present the user with the choice
   *              of Target Orgs based on what's described in the Recipe.
   * @private @async
   */
  //───────────────────────────────────────────────────────────────────────────┘
  private async askUserForTargetOrgAlias():Promise<string> {

    // Prepare a list of choices based on Target Orgs in the recipe.
    const targetOrgChoices = new Array<YeomanChoice>();
    for (const targetOrg of this.recipe.options.targetOrgs as JsonMap[]) {
      targetOrgChoices.push({
        name:   `${targetOrg.orgName} -- ${targetOrg.description}`,
        value:  targetOrg as any,     // tslint:disable-line: no-any // TODO: Are we saving an object to this Listr choice? Is that possible?
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
    const iqPrompt = [
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
        message:  answerHash => {
          return  `The scratch org '${answerHash.targetOrg.alias}' will be `
                + `deleted before installing the demo. Proceed?`;
        },
        when:     answerHash => {
          return (answerHash.targetOrg.isScratchOrg && answerHash.targetOrg !== 'CANCEL_INSTALLATION');
        }
      },
      {
        type:     'confirm',
        name:     'proceed',
        default:  false,
        message:  answerHash => {
          return  `The alias '${answerHash.targetOrg.alias}' must be associated `
                + `with a compatible Salesforce org. Proceed with org validation?`;
        },
        when:     answerHash => {
          return (! answerHash.targetOrg.isScratchOrg && answerHash.targetOrg !== 'CANCEL_INSTALLATION');
        }
      },
      {
        type: 'confirm',
        name: 'tryAgain',
        message:  answerHash => {
          return `Would you like to select a different demo target?`;
        },
        when:     answerHash => {
          return (! answerHash.proceed && answerHash.targetOrg !== 'CANCEL_INSTALLATION');
        }
      }
    ];

    // Run the Inquirer prompt in a loop until the user wants out.
    let userSelections;
    do {
      console.log('');
      userSelections = await inquirer.prompt(iqPrompt);
    } while (userSelections.proceed === false && userSelections.tryAgain === true);

    // Debug
    SfdxFalconDebug.obj(`${dbgNs}askUserForTargetOrgAlias:userSelections:`, userSelections, `userSelections: `);

    // If the user did not affirmatively ask to PROCEED, then we must exit.
    if (userSelections.proceed !== true) {
      console.log('');
      throw new Error(`INSTALLATION_CANCELLED: Installation cancelled at user's request`);
    }

    // Make sure we actually got a target org alias choice from the user
    if (! userSelections.targetOrg.alias) {
      console.log('');
      throw new Error(`ERROR_MISSING_DATA: Missing a value for targetOrg.alias`);
    }

    // If we are still here, make member var assignments based on the user's chosen Target.
    return userSelections.targetOrg.alias;
  }
  
  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      confirmDemoTarget
   * @returns     {Promise<boolean>} Resolves TRUE if the user wants to start
   *              executing the Recipe against the Target Org.  FALSE if not.
   * @description Runs an Inquirer interview to ask the user if they want to
   *              start executing the Recipe against the specified Target org.
   * @version     1.0.0
   * @private @async
   */
  //───────────────────────────────────────────────────────────────────────────┘
  private async confirmDemoTarget():Promise<boolean> {
    if (typeof this.engineContext.targetOrg === 'undefined') {
      throw new Error (`ERROR_NO_TARGET_ORG: confirmDemoTarget was called `
                      +`before this.engineContext.targetOrg received a value`);
    }

    // Define the Inquirer Prompt (this powers the user interatcion in the CLI).
    const iqPrompt = [
      {
        type:     'confirm',
        name:     'proceed',
        default:  false,
        message:  answerHash => {
          return  `The Recipe '${this.recipe.recipeName}' will install `
                + `'${this.engineContext.targetOrg.orgName}' using the alias `
                + `'${this.engineContext.targetOrg.alias}'.`
                + `\n  If this points to an existing scratch org `
                + `it will be deleted before installation. Proceed?`;
        },
        when:   (this.engineContext.targetOrg.isScratchOrg === true)
      },
      {
        type:     'confirm',
        name:     'proceed',
        default:  false,
        message:  answerHash => {
          return  `The Recipe '${this.recipe.recipeName}' will install  `
                + `'${this.engineContext.targetOrg.orgName}' (${this.engineContext.targetOrg.description}) to the `
                + `standard (ie. non-scratch org). The alias ${this.engineContext.targetOrg.alias} `
                + `must be associated with a compatible Salesforce org. Proceed with org validation?`;
        },
        when:   (this.engineContext.targetOrg.isScratchOrg === false)
      }
    ];
    
    // Prompt the user.
    console.log('');
    const userSelections = await inquirer.prompt(iqPrompt);

    // Retrun the user's choice to the caller.
    return userSelections.proceed;
  }
}
