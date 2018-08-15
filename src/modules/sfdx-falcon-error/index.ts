//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @file          modules/sfdx-falcon-error/index.ts
 * @copyright     Vivek M. Chawla - 2018
 * @author        Vivek M. Chawla <@VivekMChawla>
 * @summary       ???
 * @description   ???
 * @requires      module:???
 * @version       1.0.0
 * @license       MIT
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
// Imports
import {SfdxError}                      from  '@salesforce/core';                     // Why?
import {SfdxErrorConfig}                from  '@salesforce/core';                     // Why?
import {ERROR_TYPE}                     from  '../../enums';                          // Why?
import {FalconProgressNotifications}    from  '../../helpers/notification-helper'     // Why?
import {SfdxFalconDebug}                from  '../sfdx-falcon-debug';               // Why?
import {SfdxFalconExecutorResponse}     from  '../sfdx-falcon-recipe/executors';
import {SfdxFalconActionResponse}       from  '../sfdx-falcon-recipe/engines';
import {SfdxFalconEngineResponse}       from  '../sfdx-falcon-recipe/engines';


//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @class       FalconError
 * @access      public
 * @version     1.0.0
 * @summary     ????
 * @description ????
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
export class SfdxFalconError {
  public  name:           string;
  public  message:        string;
  public  falconMessage:  string;
  public  friendlyInfo:   string;
  public  status:         number;
  public  type:           ERROR_TYPE;
  public  source:         string;
  public  errRaw:         string;
  public  errObj:         any;

  private constructor() {
  }

  public static wrap(error:any):SfdxFalconError {
    if (error instanceof SfdxFalconError) {
      return error;
    }
    if (error instanceof SfdxFalconExecutorResponse) {
      error as SfdxFalconExecutorResponse;
      return {
        name:           `UNEXPECTED_EXECUTOR_ERROR (${error.name})`,
        message:        `${error.message}`,
        falconMessage:  `Unexpected error while running Executor '${error.name}'`,
        friendlyInfo:   error.message.split('\n')[0] || 'No additional details available',
        type:           ERROR_TYPE.EXECUTOR_ERROR,
        source:         `SfdxFalconExecutorResponse`,
        status:         error.code | -999,
        errObj:         error.respObj,
        errRaw:         error.respRaw
      }
    }    
    if (error instanceof SfdxFalconActionResponse) {
      error as SfdxFalconActionResponse;
      return {
        name:           `UNEXPECTED_ACTION_ERROR (${error.actionName})`,
        message:        `${error.actionMessage}`,
        falconMessage:  `Unexpected error while executing Action '${error.actionName}'`,
        friendlyInfo:   error.actionMessage.split('\n')[0] || 'No additional details available',
        type:           ERROR_TYPE.ACTION_ERROR,
        source:         `SfdxFalconActionResponse`,
        status:         -999,
        errObj:         error.execResponses,
        errRaw:         error.actionOptions
      }
    }
    if (error instanceof SfdxFalconEngineResponse) {
      error as SfdxFalconEngineResponse;
      return {
        name:           `UNEXPECTED_RECIPE_ENGINE_ERROR (${error.engineName})`,
        message:        `${error.engineMessage}`,
        falconMessage:  `Unexpected error while '${error.engineName}' ran Recipe '${error.recipeName}'`,
        friendlyInfo:   error.engineMessage || 'No additional details available',
        type:           ERROR_TYPE.ENGINE_ERROR,
        source:         `SfdxFalconEngineResponse`,
        status:         -999,
        errObj:         error.actionResponses,
        errRaw:         `N/A`
      }
    }
    else {
      return {
        name:           `UNEXPECTED_ERROR (${error.name})`,
        message:        `${error.message}`,
        falconMessage:  `There has been an unexpected error`,
        friendlyInfo:   error.message || 'No additional details available',
        type:           ERROR_TYPE.INTERNAL_ERROR,
        source:         `${error.constructor.name}`,
        status:         -999,
        errObj:         error,
        errRaw:         error.toString()
      }
    }
  }

  public static wrapCliError(stdErrString:string, customMessage:string=''):SfdxFalconError {
    let falconError = new SfdxFalconError();
    let stdErrJson  = <any>{};

    // Initialize errRaw since everybody gets that.
    falconError.errRaw  = stdErrString;
    
    // See if we can resolve the raw stderr output to an object.
    try {
      stdErrJson = JSON.parse(stdErrString);
    } catch (e) {
      // Could not parse the stderr string.
      falconError.type          = ERROR_TYPE.UNPARSED_ERROR;
      falconError.source        = 'UNPARSED_CLI_ERROR'
      falconError.name          = `UNPARSED_CLI_ERROR`;
      falconError.message       = `Unparsed CLI Error`;
      falconError.falconMessage = `The CLI threw an error that could not be parsed`;
      falconError.friendlyInfo  = `No additional information available`
      falconError.status        = -1;
      falconError.errObj        = <any>{};
      return falconError;
    }

    // Use the custom message for the Falcon Message (if provided).
    if (customMessage) {
      falconError.falconMessage = customMessage;
    }
    else {
      falconError.falconMessage = stdErrJson.message;
    }

    // Wrap the parsed error as best we can
    falconError.type          = ERROR_TYPE.CLI_ERROR;
    falconError.source        = 'PARSED_CLI_ERROR';
    falconError.name          = stdErrJson.name;
    falconError.message       = stdErrJson.message;
    falconError.status        = stdErrJson.status;
    falconError.errObj        = stdErrJson;
    falconError.friendlyInfo  = stdErrJson.message || 'No additional details available';

    return falconError;
  }
  
  public static terminateWithError(error:any, commandName:string, showErrorDebug:boolean=false):void {
  
    // Make sure any outstanding notifications are killed.
    FalconProgressNotifications.killAll();

    // Make sure that whatever we get is wrapped as a Falcon Error.
    let falconError = SfdxFalconError.wrap(error);

    // Build an SfdxErrorConfig object
    let sfdxErrorConfig = new SfdxErrorConfig(
      'sfdx-falcon',          // Package Name
      'sfdxFalconError',      // Bundle Name
      'errDefault'            // Error Message Key
    );

    // Display a formatted version of the stdError before throwing the SfdxError.
    if (showErrorDebug) {
      SfdxFalconDebug.displayFalconError(falconError);
    }

    sfdxErrorConfig.setErrorTokens([falconError.falconMessage, falconError.friendlyInfo]);

    // Search the SFDX error message to see if we can figure out a recommended action.
    switch (true) {
      case /VMC_DEV_TEST1/.test(falconError.errObj.message):
        sfdxErrorConfig.addAction('actionDevTest1', [`TEST_ONE`]);
        sfdxErrorConfig.addAction('actionDevTest2', [`TEST_TWO`]);
        break;
      case /^ERROR_UNKNOWN_ACTION:/.test(falconError.errObj.message):
        sfdxErrorConfig.addAction('ACTIONFOR_ERROR_UNKNOWN_ACTION');
        break;
      case /VMC_DEV_TEST3/.test(falconError.errObj.message):
        sfdxErrorConfig.addAction('actionDevTest2', [`TEST_FOUR`]);
        break;
    }

    // Create an SFDX Error, set the command name, and throw it.
    let sfdxError = SfdxError.create(sfdxErrorConfig);
    sfdxError.commandName = commandName;
    throw sfdxError;  
  }
}