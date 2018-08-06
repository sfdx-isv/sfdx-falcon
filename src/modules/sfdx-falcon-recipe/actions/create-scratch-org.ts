//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @file          modules/sfdx-falcon-recipe/actions/create-scratch-org.ts
 * @copyright     Vivek M. Chawla - 2018
 * @author        Vivek M. Chawla <@VivekMChawla>
 * @version       1.0.0
 * @license       MIT
 * @requires      module:???
 * @summary       ???
 * @description   ???
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
import {SfdxFalconDebug}        from '../../../modules/sfdx-falcon-debug';  // Why?
import {SfdxFalconRecipeAction} from '../actions';                          // Why?
import {RecipeActionResult}     from '../actions';                          // Why?
import {RecipeActionType}       from '../actions';                          // Why?
import {SfdxFalconStepContext}  from '../actions';                          // Why?

//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @class       CreateScratchOrg
 * @extends     SfdxFalconRecipeAction
 * @access      public
 * @description Implements the action "create-scratch-org".
 * @version     1.0.0
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
export class CreateScratchOrg extends SfdxFalconRecipeAction {



  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @constructs  CreateScratchOrg
   * @param       {any} xxxx ???? 
   * @param       {any} xxxx ???? 
   * @description ???
   * @version     1.0.0
   * @public
   */
  //───────────────────────────────────────────────────────────────────────────┘
  constructor(stepContext:SfdxFalconStepContext, stepOptions:object={}) {

    // Call parent constructor.
    super(stepContext, stepOptions);

    // Set the Action Type
    this._actionType = RecipeActionType.SFDX_CLI_COMMAND

    // Run Base Validation
    this.validateActionConfig();
    
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      execute
   * @returns     {void}
   * @description ???
   * @version     1.0.0
   * @public @async
   */
  //───────────────────────────────────────────────────────────────────────────┘
  public async execute():Promise<RecipeActionResult> {

    return null;

  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      onError
   * @param       {any} xxxx ???? 
   * @param       {any} xxxx ???? 
   * @description ???
   * @version     1.0.0
   * @public
   */
  //───────────────────────────────────────────────────────────────────────────┘
  protected onError(error:any):any {

    // TODO: Add Implementation

  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      onSuccess
   * @param       {any} xxxx ???? 
   * @param       {any} xxxx ???? 
   * @description ???
   * @version     1.0.0
   * @public
   */
  //───────────────────────────────────────────────────────────────────────────┘
  protected onSuccess(result:any):any {

    // TODO: Add Implementation

  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      renderError
   * @param       {any} xxxx ???? 
   * @param       {any} xxxx ???? 
   * @description ???
   * @version     1.0.0
   * @public
   */
  //───────────────────────────────────────────────────────────────────────────┘
  public renderError(isErrorDebugEnabled:boolean=false):void {

    // Render (ie. "print to terminal") the "base" of the error.
    this.renderBaseError(isErrorDebugEnabled);

    // Add customizations based on the needs of the derived class.
    console.log(`Rendered from the derived class`);
  }

}