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
import {SfdxFalconDebug}        from '../../../../../modules/sfdx-falcon-debug';  // Why?
import {AppxEngineAction}       from '../../appx/actions';                        // Why?
import {AppxEngineActionResult} from '../../appx';                                // Why?
import {AppxEngineActionType}   from '../../appx/';                               // Why?
import {AppxEngineStepContext}  from '../../appx/';                               // Why?

//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @class       CreateScratchOrg
 * @extends     AppxEngineAction
 * @access      public
 * @description Implements the action "create-scratch-org".
 * @version     1.0.0
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
export class CreateScratchOrg extends AppxEngineAction {



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
  constructor(stepContext:AppxEngineStepContext, stepOptions:object={}) {

    // Call parent constructor.
    super(stepContext, stepOptions);

    // Set the Action Type
    this._actionType = AppxEngineActionType.SFDX_CLI_COMMAND

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
  public async execute():Promise<AppxEngineActionResult> {

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