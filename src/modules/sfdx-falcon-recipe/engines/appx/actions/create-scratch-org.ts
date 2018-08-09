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
import {waitASecond}            from  '../../../../sfdx-falcon-async';            // Why?

// Import Internal Engine Modules
import {AppxEngineAction}       from  '../../appx/actions';                       // Why?
import {AppxEngineActionResult} from  '../../appx';                               // Why?
import {AppxEngineActionType}   from  '../../appx/';                              // Why?
import {AppxEngineStepContext}  from  '../../appx/';                              // Why?
import {AppxEngineContext}      from  '../../appx/';                              // Why?

// Set the File Local Debug Namespace
const dbgNs = 'create-scratch-org-action';


//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @class       CreateScratchOrg
 * @extends     AppxEngineAction
 * @access      public
 * @description Implements the action "create-scratch-org".
 * @version     1.0.0
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
export class CreateScratchOrgAction extends AppxEngineAction {

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @constructs  CreateScratchOrgAction
   * @param       {AppxEngineContext} engineContext ???? 
   * @description ???
   * @version     1.0.0
   * @public
   */
  //───────────────────────────────────────────────────────────────────────────┘
  constructor(engineContext:AppxEngineContext) {

    // Call parent constructor.
    super(engineContext);

    // Set the Action Type
    this.actionType       = AppxEngineActionType.SFDX_CLI_COMMAND
    this.actionName       = 'Create Scratch Org';
    this.clsDbgNs         = 'CreateScratchOrgAction';
    this.successDelay     = 2;
    this.errorDelay       = 2;
    this.progressDelay    = 1000;
    
    return;
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
  public async execute(actionOptions:any={}):Promise<AppxEngineActionResult> {

    // Validate Command Options
    if (typeof actionOptions.scratchOrgAlias === 'undefined') throw new Error(`ERROR_MISSING_OPTION: 'scratchOrgAlias'`);
    if (typeof actionOptions.scratchDefJson  === 'undefined') throw new Error(`ERROR_MISSING_OPTION: 'scratchDefJson'`);

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
      observer:     actionOptions.observer,
      commandArgs:  [] as [string],
      commandFlags: {
        FLAG_TARGETDEVHUBUSERNAME:  this.engineContext.devHubAlias,
        FLAG_DEFINITIONFILE:        path.join(this.engineContext.configPath, actionOptions.scratchDefJson),
        FLAG_SETALIAS:              actionOptions.scratchOrgAlias,
        FLAG_DURATIONDAYS:          30,
        FLAG_WAIT:                  10,
        FLAG_NONAMESPACE:           true,
        FLAG_SETDEFAULTUSERNAME:    true,
        FLAG_JSON:                  true,
        FLAG_LOGLEVEL:              this.engineContext.logLevel
      }
    }
    SfdxFalconDebug.obj(`FALCON_EXT:${dbgNs}`, this.sfdxCommandDef, `${this.clsDbgNs}:execute:sfdxCommandDef: `);

    // Execute the SFDX Command using an SFDX Executor function.
    await executeSfdxCommand(this.sfdxCommandDef)
      .then(result => {this.onSuccess(result)})
      .catch(error => {this.onError(error)});

    // Wait some number of seconds to give the user a chance to see the final status message.
    await waitASecond(this.successDelay);

    // Return whatever was put together by the onSuccess() method.
    return this.actionResult;
  }
}