//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @file          modules/sfdx-falcon-recipe/engines/appx/actions/index.ts
 * @copyright     Vivek M. Chawla - 2018
 * @author        Vivek M. Chawla <@VivekMChawla>
 * @version       1.0.0
 * @license       MIT
 * @requires      module:???
 * @summary       ???
 * @description   ???
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
// Import local modules
import {AppxEngineContext}          from  '../../../engines/appx';  // Why?
import {AppxEngineStepContext}      from  '../../../engines/appx';  // Why?
import {AppxEngineActionType}       from  '../../../engines/appx';  // Why?
import {AppxEngineActionResult}     from  '../../../engines/appx';  // Why?
import {SfdxFalconDebug}            from  '../../../../../modules/sfdx-falcon-debug';   // Why?



//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @class       AppxEngineAction
 * @access      public
 * @description Base class for all "actions" that are supported by the "Appx" Falcon Recipe Engine.
 * @version     1.0.0
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
export abstract class AppxEngineAction {

  // Basic properties of every AppxEngineAction.
  protected _actionType:AppxEngineActionType;       // Why?
            get actionType():AppxEngineActionType   {return this._actionType}
  protected _actionName:string;                     // Why?
            get actionName():string                 {return this._actionName}
  protected _successDelay:number;                   // Why?
            get successDelay():number               {return this._successDelay}
  protected _errorDelay:number;                     // Why?
            get errorDelay():number                 {return this._errorDelay}

  // Context and Options from the step that's calling the AppxEngineAction.
  protected _stepContext:AppxEngineStepContext;     // Why?
            get stepContext():AppxEngineStepContext {return this._stepContext}
  protected _stepOptions:object;                    // Why?
            get stepOptions():object                {return this._stepOptions}

  // Core set of messages every RecipeAction should implement.
  protected _progressMsg:string;                    // Why?
            get progressMsg():string                {return this._progressMsg}
  protected _errorMsg:string;                       // Why?
            get errorMsg():string                   {return this._errorMsg}
  protected _successMsg:string;                     // Why?
            get successMsg():string                 {return this._successMsg}

  // Abstract methods
  public async abstract execute():Promise<AppxEngineActionResult>;
  protected abstract    onSuccess(result:any):any;
  protected abstract    onError(error:any):any;
  public abstract       renderError(isErrorDebugEnabled:boolean):void;

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @constructs  AppxEngineAction
   * @param       {AppxEngineStepContext} stepContext ???? 
   * @param       {any} stepOptions ???? 
   * @description ???
   * @version     1.0.0
   * @protected
   */
  //───────────────────────────────────────────────────────────────────────────┘
  protected constructor(stepContext:AppxEngineStepContext, stepOptions:any={}) {

    // VALIDATION: StepContext and StepOptions are both required.
    if (typeof stepContext === 'undefined' || typeof stepOptions === 'undefined') {
      throw new Error (`ERROR_MISSING_PROPERTIES: Objects derived from AppxEngineAction must `
                      +`initialize with values for stepContext and stepOptions`);
    }

    // VALIDATION: If the target is a Scratch Org, then a DevHub must be provided.
    if (stepContext.targetOrg.isScratchOrg === true && (!stepContext.devHubAlias)) {
      throw new Error (`ERROR_INVALID_CONFIG: Target Org is identified as a scratch org, but `
                      +`no DevHub Alias was provided`)
    }

    // Begin initialization.
    this._stepContext = stepContext;
    this._stepOptions = stepOptions;

    // Set default values for any missing properties.
    this._successDelay  = 2;
    this._errorDelay    = 2;
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      renderBaseError
   * @param       {any} xxxx ???? 
   * @param       {any} xxxx ???? 
   * @description ???
   * @version     1.0.0
   * @protected
   */
  //───────────────────────────────────────────────────────────────────────────┘
  protected renderBaseError(isErrorDebugEnabled:boolean=false):void {
    console.log(`This is the base error`);


  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      validateActionConfig
   * @param       {any} xxxx ???? 
   * @param       {any} xxxx ???? 
   * @description ???
   * @version     1.0.0
   * @protected
   */
  //───────────────────────────────────────────────────────────────────────────┘
  protected validateActionConfig():void {

    // Debug (should show object state at end of constructors)
    SfdxFalconDebug.obj('FALCON_EXT:SfdxFalconRecipeAction', this, `CreateScratchOrg:validateActionConfig:this: `);
    
    // VALIDATION: Child class must set ActionType
    if (typeof  this._actionType === 'undefined') {
      throw new Error (`ERROR_MISSING_PROPERTIES: Objects derived from SfdxFalconRecipeAction must `
                      +`initialize with a value for Action Type`);
    }


  }
}





  //private _xxxxxxxxxx:string;     // Why?
  //        get xxxxxxxxxx():string {return this._xxxxxxxxxx}
