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
import {SfdxFalconDebug}                from  '../sfdx-falcon-debug';                 // Why?


export {SfdxFalconError2} from './index.2';


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
  public  type:           ERROR_TYPE;
  public  name:           string;
  public  source:         string;
  public  status:         number;
  public  falconMessage:  string;
  public  friendlyInfo:   string;
  public  message:        string;
  public  error:          Error;
  public  details:        any;

  private constructor() {
    // Intentionally empty
  }

  public static wrap(objectToWrap:any):SfdxFalconError {
    if (objectToWrap instanceof SfdxFalconError) {
      return objectToWrap;
    }
    // Handle instance of Error
    if (objectToWrap instanceof Error) {
      objectToWrap as Error;
      return {
        type:           ERROR_TYPE.INTERNAL_ERROR,
        name:           `UNEXPECTED_ERROR (${objectToWrap.name})`,
        source:         objectToWrap.name,
        status:         -999,
        falconMessage:  `There has been an unexpected error`,
        friendlyInfo:   `${objectToWrap.name}: ${objectToWrap.message}`,
        message:        objectToWrap.message,
        details:        objectToWrap.stack,
        error:          objectToWrap
      }
    }
    // Handle instance of SFDX-Falcon Executor Response
    /*
    if (objectToWrap instanceof SfdxFalconExecutorResponse) {
      objectToWrap as SfdxFalconExecutorResponse;
      return {
        type:           ERROR_TYPE.EXECUTOR_ERROR,
        name:           `UNEXPECTED_EXECUTOR_ERROR (${objectToWrap.name})`,
        source:         `SfdxFalconExecutorResponse`,
        status:         objectToWrap.code | -999,
        falconMessage:  `Unexpected error while running Executor '${objectToWrap.name}'`,
        friendlyInfo:   objectToWrap.message.split('\n')[0] || 'No additional details available',
        message:        objectToWrap.message,
        details:  {
          cmdRaw: objectToWrap.cmdRaw,
          cmdObj: objectToWrap.cmdObj,
          respRaw:  objectToWrap.respRaw,
          respObj:  objectToWrap.respObj
        },
        error:          objectToWrap.error
      }
    }    
    if (objectToWrap instanceof SfdxFalconActionResponse) {
      objectToWrap as SfdxFalconActionResponse;
      return {
        type:           ERROR_TYPE.ACTION_ERROR,
        name:           `UNEXPECTED_ACTION_ERROR (${objectToWrap.actionName})`,
        source:         `SfdxFalconActionResponse`,
        status:         -998,
        falconMessage:  `Unexpected error while executing Action '${objectToWrap.actionName}'`,
        friendlyInfo:   objectToWrap.actionMessage.split('\n')[0] || 'No additional details available',
        message:        `${objectToWrap.actionMessage}`,
        details:        objectToWrap.actionDetail,
        error:          objectToWrap.error
      }
    }
    if (objectToWrap instanceof SfdxFalconEngineResponse) {
      objectToWrap as SfdxFalconEngineResponse;
      return {
        type:           ERROR_TYPE.ENGINE_ERROR,
        name:           `UNEXPECTED_RECIPE_ENGINE_ERROR (${objectToWrap.engineName})`,
        source:         `SfdxFalconEngineResponse`,
        status:         -997,
        falconMessage:  `Unexpected error while '${objectToWrap.engineName}' ran Recipe '${objectToWrap.recipeName}'`,
        friendlyInfo:   objectToWrap.engineMessage || 'No additional details available',
        message:        `${objectToWrap.engineMessage}`,
        details:        objectToWrap.engineDetail,
        error:          objectToWrap.error
      }
    }
    if (objectToWrap instanceof SfdxFalconRecipeResponse) {
      objectToWrap as SfdxFalconRecipeResponse;
      return {
        type:           ERROR_TYPE.RECIPE_ERROR,
        name:           `UNEXPECTED_RECIPE_ERROR (${objectToWrap.recipeName})`,
        source:         `SfdxFalconRecipeResponse`,
        status:         -996,
        falconMessage:  `Unexpected error while executing the Recipe '${objectToWrap.recipeName}'`,
        friendlyInfo:   objectToWrap.recipeMessage || 'No additional details available',
        message:        `${objectToWrap.recipeMessage}`,
        details:        objectToWrap.recipeDetail,
        error:          objectToWrap.error
      }
    }
    //*/
    else {
      return {
        type:           ERROR_TYPE.UNPARSED_ERROR,
        name:           `UNEXPECTED_ERROR (${objectToWrap.name})`,
        source:         `${objectToWrap.constructor.name}`,
        status:         -995,
        falconMessage:  `There has been an unexpected error`,
        friendlyInfo:   objectToWrap.message || 'No additional details available',
        message:        `${objectToWrap.message}`,
        details:  {
          unknownError: objectToWrap
        },
        error:          new Error(`UNEXPECTED_ERROR: ${objectToWrap.name}`)
      }
    }
  }

  public static wrapCliError(stdErrString:string, customMessage:string=''):SfdxFalconError {
    let falconError = new SfdxFalconError();
    let stdErrJson  = <any>{};

    // Initialize errRaw since everybody gets that.
    falconError.details = {errRaw: stdErrString};
    
    // See if we can resolve the raw stderr output to an object.
    try {
      stdErrJson = JSON.parse(stdErrString);
    } catch (parseError) {
      // Could not parse the stderr string.
      falconError.type          = ERROR_TYPE.UNPARSED_ERROR;
      falconError.name          = `UNPARSED_CLI_ERROR`;
      falconError.source        = 'UNPARSED_CLI_ERROR'
      falconError.status        = -1;
      falconError.falconMessage = `The CLI threw an error that could not be parsed`;
      falconError.friendlyInfo  = `No additional information available`
      falconError.message       = `Unparsed CLI Error`;
      falconError.error         = parseError;
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
    falconError.name          = stdErrJson.name;
    falconError.source        = 'PARSED_CLI_ERROR';
    falconError.status        = stdErrJson.status;
    falconError.friendlyInfo  = stdErrJson.message || 'No additional details available';
    falconError.message       = stdErrJson.message;
    falconError.details       = {
      ...falconError.details,
      errObj: stdErrJson
    }

    return falconError;
  }
  
  public static terminateWithError(error:any, commandName:string, showErrorDebug:boolean=false):void {
  
    // Make sure any outstanding notifications are killed.
    FalconProgressNotifications.killAll();
    
    // Make sure that whatever we get is wrapped as a Falcon Error.
    let falconError = SfdxFalconError.wrap(error);

    // Display a formatted version of the stdError before throwing the SfdxError.
    if (showErrorDebug) {
      SfdxFalconDebug.displayFalconError(falconError, SfdxFalconDebug.debugDepth);
    }

    // Build an SfdxErrorConfig object
    let sfdxErrorConfig = new SfdxErrorConfig(
      'sfdx-falcon',          // Package Name
      'sfdxFalconError',      // Bundle Name
      'errDefault'            // Error Message Key
    );

    // Designate the core Message and extra "friendly info" as tokens for the final Error Message output
    sfdxErrorConfig.setErrorTokens([falconError.falconMessage, falconError.friendlyInfo]);

    // Search the SFDX error message to see if we can figure out a recommended action.
    switch (true) {
      case /VMC_DEV_TEST1/.test(falconError.error.message):
        sfdxErrorConfig.addAction('actionDevTest1', [`TEST_ONE`]);
        sfdxErrorConfig.addAction('actionDevTest2', [`TEST_TWO`]);
        break;
      case /^ERROR_UNKNOWN_ACTION:/.test(falconError.error.message):
        sfdxErrorConfig.addAction('ACTIONFOR_ERROR_UNKNOWN_ACTION');
        break;
      case /VMC_DEV_TEST3/.test(falconError.error.message):
        sfdxErrorConfig.addAction('actionDevTest2', [`TEST_FOUR`]);
        break;
    }

    // Create an SFDX Error, set the command name, and throw it.
    let sfdxError = SfdxError.create(sfdxErrorConfig);
    sfdxError.commandName = commandName;
    throw sfdxError;  
  }
}