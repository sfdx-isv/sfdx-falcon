//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @file          modules/sfdx-falcon-recipe/actions/create-scratch-org.ts
 * @copyright     Vivek M. Chawla - 2018
 * @author        Vivek M. Chawla <@VivekMChawla>
 * @version       1.0.0
 * @license       MIT
 * @summary       Exposes the CLI Command force:org:create
 * @description   Creates a new scratch org when given an Alias and a scratch-def.json file.
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
// Import External Modules
import * as path                from  'path';                                     // Node's path library.

// Import Local Modules
import {SfdxFalconDebug}        from  '../../../../sfdx-falcon-debug';            // Why?
import {executeSfdxCommand}     from  '../../../../sfdx-falcon-executors/sfdx';   // Why?
import {SfdxShellResult}        from  '../../../../sfdx-falcon-executors/sfdx';   // Why?

// Import Internal Engine Modules
import {AppxEngineAction}         from  '../../appx/actions';                       // Why?
import {AppxEngineContext}        from  '../../appx/';                              // Why?
import {AppxEngineActionContext}  from  '../../appx';                               // Why?
import {AppxEngineActionType}     from  '../../appx/';                              // Why?

// Set the File Local Debug Namespace
const dbgNs = 'create-scratch-org-action';


//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @class       CreateScratchOrg
 * @extends     AppxEngineAction
 * @description Implements the action "create-scratch-org".
 * @version     1.0.0
 * @public
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
export class CreateScratchOrgAction extends AppxEngineAction {

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @constructs  CreateScratchOrgAction
   * @description ???
   * @version     1.0.0
   * @public
   */
  //───────────────────────────────────────────────────────────────────────────┘
  constructor() {

    // Call parent constructor.
    super();

    // Set values for all the base member vars to better define THIS AppxEngineAction.
    this.actionType       = AppxEngineActionType.SFDX_CLI_COMMAND
    this.actionName       = 'Create Scratch Org';
    this.clsDbgNs         = 'CreateScratchOrgAction';
    this.successDelay     = 2;
    this.errorDelay       = 2;
    this.progressDelay    = 1000;
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      executeAction
   * @param       {any}   actionOptions Optional. Any options that the command
   *              execution logic will require in order to properly do its job.
   * @returns     {Promise<AppxEngineActionResult>}
   * @description Performs the custom logic that's wrapped by the execute method
   *              of the base class.
   * @version     1.0.0
   * @protected @async
   */
  //───────────────────────────────────────────────────────────────────────────┘
  protected async executeAction(actionContext:AppxEngineActionContext, actionOptions:any={}):Promise<SfdxShellResult> {

    // Set the progress, error, and success messages for this action execution.
    this.progressMessage  = `Creating scratch org '${actionOptions.scratchOrgAlias}' using ${actionOptions.scratchDefJson} (this can take 3-10 minutes)`;
    this.errorMessage     = `Failed to create scratch org using ${actionOptions.scratchDefJson}`;
    this.successMessage   = `Scratch org '${actionOptions.scratchOrgAlias}' created successfully using ${actionOptions.scratchDefJson}`;

    // Create an SFDX Command Definition object to specify which command the CLI will run.
    this.sfdxCommandDef = {
      command:      'force:org:create',
      progressMsg:  this.progressMessage,
      errorMsg:     this.errorMessage,
      successMsg:   this.successMessage,
      observer:     actionContext.listrExecOptions.observer,
      commandArgs:  [] as [string],
      commandFlags: {
        FLAG_TARGETDEVHUBUSERNAME:  actionContext.devHubAlias,
        FLAG_DEFINITIONFILE:        path.join(actionContext.configPath, actionOptions.scratchDefJson),
        FLAG_SETALIAS:              actionOptions.scratchOrgAlias,
        FLAG_DURATIONDAYS:          30,
        FLAG_WAIT:                  10,
        FLAG_NONAMESPACE:           true,
        FLAG_SETDEFAULTUSERNAME:    true,
        FLAG_JSON:                  true,
        FLAG_LOGLEVEL:              actionContext.logLevel
      }
    }
    SfdxFalconDebug.obj(`FALCON_EXT:${dbgNs}`, this.sfdxCommandDef, `${this.clsDbgNs}:executeAction:sfdxCommandDef: `);

    // Execute the SFDX Command using an SFDX Executor. Base class handles success/error.
    return executeSfdxCommand(this.sfdxCommandDef);
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      validateActionOptions
   * @param       {any}   actionOptions Required. ???
   * @returns     {void}  
   * @description ???
   * @version     1.0.0
   * @private
   */
  //───────────────────────────────────────────────────────────────────────────┘
  protected validateActionOptions(actionOptions:any):void {
    if (typeof actionOptions.scratchOrgAlias === 'undefined') throw new Error(`ERROR_MISSING_OPTION: 'scratchOrgAlias'`);
    if (typeof actionOptions.scratchDefJson  === 'undefined') throw new Error(`ERROR_MISSING_OPTION: 'scratchDefJson'`);
  }  
}