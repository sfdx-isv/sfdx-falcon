//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @file          modules/sfdx-falcon-recipe/engines/index.ts
 * @copyright     Vivek M. Chawla - 2018
 * @author        Vivek M. Chawla <@VivekMChawla>
 * @version       1.0.0
 * @license       MIT
 * @summary       Types and classes relevant to all SFDX-Falcon Recipe Engines
 * @description   Types and classes relevant to all SFDX-Falcon Recipe Engines
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
// Local Module/Type Imports
import {SfdxFalconError}              from '../../sfdx-falcon-error';
import {SfdxFalconExecutorResponse}   from  '../executors'
import {SfdxFalconExecutorStatus}     from  '../executors'

// Requires
const chalk = require('chalk');
const util  = require('util');

//─────────────────────────────────────────────────────────────────────────────┐
// Declare Enums used across SFDX-Falcon Recipe sub-modules.
//─────────────────────────────────────────────────────────────────────────────┘
export enum SfdxFalconActionType {
  SFDX_CLI      = 'sfdx-cli',
  SFDC_API      = 'salesforce-api',
  SHELL_COMMAND = 'shell-command',
  PLUGIN        = 'plugin',
  UNSPECIFIED   = 'unspecified'
}
export enum SfdxFalconActionStatus {
  EXECUTING = 'EXECUTING',
  SUCCESS   = 'SUCCESS',
  FAILURE   = 'FAILURE',
  ERROR     = 'ERROR',
  WARNING   = 'WARNING',
  UNKNOWN   = 'UNKNOWN'
}
export enum SfdxFalconEngineStatus {
  EXECUTING = 'EXECUTING',
  SUCCESS   = 'SUCCESS',
  FAILURE   = 'FAILURE',
  ERROR     = 'ERROR',
  WARNING   = 'WARNING',
  UNKNOWN   = 'UNKNOWN'
}
export enum SfdxFalconRecipeStatus {
  EXECUTING = 'EXECUTING',
  SUCCESS   = 'SUCCESS',
  FAILURE   = 'FAILURE',
  ERROR     = 'ERROR',
  WARNING   = 'WARNING',
  UNKNOWN   = 'UNKNOWN'
}

//─────────────────────────────────────────────────────────────────────────────┐
// Declare Response Detail interfaces (Action and Engine)
//─────────────────────────────────────────────────────────────────────────────┘
export interface SfdxFalconErrorFailureDetail {
  totalRuntime:       number;
  errorCode?:         number;
  errorName?:         string;
  errorMessage?:      string;
  errorStack?:        string;
  failureMessage?:    string;
  failureCode?:       number;
  failureRespRaw?:    string;
  failureRespObj?:    any;
}
export interface SfdxFalconActionResponseDetail extends SfdxFalconErrorFailureDetail {
  actionStatus:       SfdxFalconActionStatus;
  executorsRun:       number;
  attemptedCmdRaw?:   string;
  attemptedCmdObj?:   any;
}
export interface SfdxFalconEngineResponseDetail extends SfdxFalconErrorFailureDetail {
  engineStatus:       SfdxFalconEngineStatus;
  actionsRun:         number;
  successfulActions:  Array<string>;
  failedAction?:      any;
}
export interface SfdxFalconRecipeResponseDetail extends SfdxFalconErrorFailureDetail {
  recipeStatus:       SfdxFalconRecipeStatus;
  enginesRun:         number;
  successfulEngines:  Array<string>;
  failedEngine?:      any;
}

//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @class       SfdxFalconActionResponse
 * @description Provides a structure for tracking one or more SFDX-Falcon Executors that are being
 *              run by an SFDX-Falcon Action.
 * @version     1.0.0
 * @public
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
export class SfdxFalconActionResponse {
  public actionName:    string;
  public actionStatus:  SfdxFalconActionStatus;
  public actionType:    SfdxFalconActionType;
  public actionContext: any;
  public actionOptions: any;
  public actionMessage: string;
  public actionDetail:  SfdxFalconActionResponseDetail;
  public execResponses: Array<SfdxFalconExecutorResponse>;
  public duration:      number;
  public error:         Error;

  public constructor(actionName:string, actionType:SfdxFalconActionType=SfdxFalconActionType.UNSPECIFIED) {
    this.actionName     = actionName;
    this.actionStatus   = SfdxFalconActionStatus.UNKNOWN;
    this.actionType     = actionType;
    this.actionContext  = {};
    this.actionOptions  = {};
    this.actionMessage  = `Action ${this.actionName}: Status Unknown`;
    this.execResponses  = new Array<SfdxFalconExecutorResponse>();
    this.duration       = 0;
    this.error          = {} as any;
  }

  public execComplete():void {
    this.actionStatus   =  SfdxFalconActionStatus.SUCCESS;
    this.actionMessage  =  `Action ${this.actionName} has successfully run ${this.execResponses.length} Executor${this.execResponses.length === 1 ? '' : 's' }`;
    this.error          = {} as any;
    this.actionDetail   = {
      actionStatus:     this.actionStatus,
      executorsRun:     this.execResponses.length,
      totalRuntime:     this.duration,
    };
}

  public execSuccess(execSuccessResponse:SfdxFalconExecutorResponse):void {
    this.execResponses.push(execSuccessResponse);
    this.actionStatus    =  SfdxFalconActionStatus.EXECUTING;
    this.duration       +=  execSuccessResponse.duration; 
    this.actionMessage   =  `Action ${this.actionName} has run ${this.execResponses.length} Executor${this.execResponses.length === 1 ? '' : 's' }`;
  }

  public execFailure(execFailureResponse:SfdxFalconExecutorResponse):void {

    // Special handling if an Error object is passed in.
    if (execFailureResponse instanceof Error) {
      this.actionStatus   = SfdxFalconActionStatus.ERROR;
      this.error          = execFailureResponse;
      this.actionMessage  = `Action '${this.actionName}' threw ${execFailureResponse.name}: ${execFailureResponse.message} `;
      return;
    }

    // If execFailureResponse is NOT an SFDX-Falcon Executor Response, attach an Error.
    if ((execFailureResponse instanceof SfdxFalconExecutorResponse) !== true) {
      this.actionStatus   = SfdxFalconActionStatus.ERROR;
      this.error          = new TypeError (`INVALID_TYPE: SfdxFalconActionResponse.execFailure() expects instanceof `
                                          +`'SfdxFalconExecutorResponse' but got '${execFailureResponse.constructor.name}'`);
      this.actionMessage  = `Action '${this.actionName}' passed an invalid type to  SfdxFalconActionResponse.execFailure()`;
      return;
    }

    // If we get here, add the Failure Response to the Responses array and record the duration.
    this.execResponses.push(execFailureResponse);
    this.duration += execFailureResponse.duration;

    // Customize settings based on the type of failure (thown error or determined failure)
    switch(execFailureResponse.status) {
      case SfdxFalconExecutorStatus.ERROR:
        this.actionStatus   = SfdxFalconActionStatus.ERROR;
        this.error          = execFailureResponse.error;
        this.actionMessage  = `Action ${this.actionName} encountered an unexpected error while executing ${execFailureResponse.name}`;
        this.actionDetail   = {
          actionStatus:     this.actionStatus,
          executorsRun:     this.execResponses.length,
          totalRuntime:     this.duration,
          attemptedCmdRaw:  execFailureResponse.cmdRaw,
          attemptedCmdObj:  execFailureResponse.cmdObj,
          errorCode:        execFailureResponse.code,
          errorName:        execFailureResponse.error.name,
          errorMessage:     execFailureResponse.error.message,
          errorStack:       execFailureResponse.error.stack
        };
        break;
      case SfdxFalconExecutorStatus.FAILURE:
        this.actionStatus   = SfdxFalconActionStatus.FAILURE;
        this.error          = {} as any;
        this.actionMessage  = `Action ${this.actionName} failed while executing ${execFailureResponse.name}`;
        this.actionDetail   = {
          actionStatus:     this.actionStatus,
          executorsRun:     this.execResponses.length,
          totalRuntime:     this.duration,
          attemptedCmdRaw:  execFailureResponse.cmdRaw,
          attemptedCmdObj:  execFailureResponse.cmdObj,
          failureMessage:   execFailureResponse.message,
          failureCode:      execFailureResponse.code,
          failureRespRaw:   execFailureResponse.respRaw,
          failureRespObj:   execFailureResponse.respObj
        };
      default:
        this.actionStatus   = SfdxFalconActionStatus.UNKNOWN;
        this.error          = {} as any;
        this.actionMessage  = `Action ${this.actionName} experienced an unknown failure while executing ${execFailureResponse.name}`;
        this.actionDetail   = {
          actionStatus:     this.actionStatus,
          executorsRun:     this.execResponses.length,
          totalRuntime:     this.duration,
          attemptedCmdRaw:  execFailureResponse.cmdRaw,
          attemptedCmdObj:  execFailureResponse.cmdObj,
          failureMessage:   execFailureResponse.message,
          failureCode:      execFailureResponse.code,
          failureRespRaw:   execFailureResponse.respRaw,
          failureRespObj:   execFailureResponse.respObj
        };
    }
  }
}

//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @class       SfdxFalconEngineResponse
 * @description Provides a structure for tracking SFDX-Falcon Actions that are being executed by
 *              the engine.
 * @version     1.0.0
 * @public
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
export class SfdxFalconEngineResponse {
  public engineName:      string;
  public engineDuration:  number;
  public engineStatus:    SfdxFalconEngineStatus;
  public engineMessage:   string;
  public engineDetail:    SfdxFalconEngineResponseDetail;
  public recipeName:      string;
  public actionResponses: Array<SfdxFalconActionResponse>;
  public error:           Error;

  public constructor(engineName:string, recipeName:string) {
    this.engineName       = engineName;
    this.engineStatus     = SfdxFalconEngineStatus.UNKNOWN;
    this.engineMessage    = `Engine ${this.engineName}: Status Unknown while running ${recipeName}`;
    this.engineDuration   = 0;
    this.recipeName       = recipeName;
    this.actionResponses  = new Array<SfdxFalconActionResponse>();
    this.error            = {} as any;
    this.engineDetail   = {
      engineStatus:       this.engineStatus,
      actionsRun:         0,
      totalRuntime:       0,
      successfulActions:  []
    };
  }

  public actionComplete():void {
    this.engineStatus   = SfdxFalconEngineStatus.SUCCESS;
    this.engineMessage  = `Engine ${this.engineName} has successfully executed ${this.actionResponses.length} Action${this.actionResponses.length === 1 ? '' : 's' }`;
    this.error          = {} as any;
    this.engineDetail   = {
      engineStatus:       this.engineStatus,
      actionsRun:         this.actionResponses.length,
      totalRuntime:       this.engineDuration,
      successfulActions:  this.getListOfSuccessfulActions()
    };
  }
  
  public actionSuccess(actionSuccessResponse:SfdxFalconActionResponse):void {
    this.actionResponses.push(actionSuccessResponse);
    this.engineStatus    =  SfdxFalconEngineStatus.EXECUTING;
    this.engineDuration +=  actionSuccessResponse.duration;
    this.engineMessage   =  `Engine ${this.engineName} has executed ${this.actionResponses.length} Action${this.actionResponses.length === 1 ? '' : 's' }`;
  }

  public actionFailure(actionFailureResponse:SfdxFalconActionResponse):void {

    // Check for Error object being passed in.
    if (actionFailureResponse instanceof Error) {
      this.engineStatus   = SfdxFalconEngineStatus.ERROR;
      this.error          = actionFailureResponse;
      this.engineMessage  = `Engine '${this.engineName}' threw ${actionFailureResponse.name}: ${actionFailureResponse.message} `;
      return;
    }

    // Check for the incoming argument NOT being an SfdxFalconActionResponse.
    if ((actionFailureResponse instanceof SfdxFalconActionResponse) !== true) {
      this.engineStatus   = SfdxFalconEngineStatus.ERROR;
      this.error          = new TypeError (`INVALID_TYPE: SfdxFalconEngineResponse.actionFailure() expects instanceof `
                                          +`'SfdxFalconActionResponse' but got '${actionFailureResponse.constructor.name}'`);
      this.engineMessage  = `Engine '${this.engineName}' passed an invalid type to  SfdxFalconEngineResponse.actionFailure()`;
      return;
    }

    // Compute the final duration
    this.engineDuration += actionFailureResponse.duration; 

    // Add the latest action to the array of Action Responses
    this.actionResponses.push(actionFailureResponse);

    // Populate properties and build a custom message based on the status of the failed Action.
    switch(actionFailureResponse.actionStatus) {
      case SfdxFalconActionStatus.ERROR:
        this.engineStatus   = SfdxFalconEngineStatus.ERROR;
        this.error          = actionFailureResponse.error;
        this.engineMessage  = `Engine ${this.engineName} encountered an unexpected error while running ${actionFailureResponse.actionName}`;
        this.engineDetail   = {
          engineStatus:       this.engineStatus,
          actionsRun:         this.actionResponses.length,
          totalRuntime:       this.engineDuration,
          successfulActions:  this.getListOfSuccessfulActions(),
          failedAction:       actionFailureResponse,
          errorName:          actionFailureResponse.error.name,
          errorMessage:       actionFailureResponse.error.message,
          errorStack:         actionFailureResponse.error.stack
        };
        break;
      case SfdxFalconActionStatus.FAILURE:
        this.engineStatus   = SfdxFalconEngineStatus.FAILURE;
        this.error          = {} as any;
        this.engineMessage  = `Engine ${this.engineName} failed while running ${actionFailureResponse.actionName}`;
        this.engineDetail   = {
          engineStatus:       this.engineStatus,
          actionsRun:         this.actionResponses.length,
          totalRuntime:       this.engineDuration,
          successfulActions:  this.getListOfSuccessfulActions(),
          failedAction:       actionFailureResponse,
          failureMessage:     actionFailureResponse.actionMessage
        };
      default:
        this.engineStatus   = SfdxFalconEngineStatus.UNKNOWN;
        this.error          = {} as any;
        this.engineMessage  = `Engine ${this.engineName} failed in an unknown manner while executing ${actionFailureResponse.actionName}`;
        this.engineDetail   = {
          engineStatus:       this.engineStatus,
          actionsRun:         this.actionResponses.length,
          totalRuntime:       this.engineDuration,
          successfulActions:  this.getListOfSuccessfulActions(),
          failedAction:       actionFailureResponse,
          failureMessage:     actionFailureResponse.actionMessage
        };
    }
  }
  private getListOfSuccessfulActions():Array<string> {
    // Build a list of the names of Actions that completed successfully;
    let successfulActions = new Array<string>();
    for (let actionResponse of this.actionResponses) {
      successfulActions.push(actionResponse.actionName);
    }
    return successfulActions;
  }
}

//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @class       SfdxFalconRecipeResponse
 * @description Provides a structure for tracking the results of an SFDX-Falcon Recipe running a
 *              compiled engine to (hopefully) a successful conclusion.
 * @version     1.0.0
 * @public
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
export class SfdxFalconRecipeResponse {
  public recipeName:      string;
  public recipeDuration:  number;
  public recipeStatus:    SfdxFalconRecipeStatus;
  public recipeMessage:   string;
  public recipeDetail:    SfdxFalconRecipeResponseDetail;
  public recipeEngines:   Array<any>;
  public engineResponses: Array<SfdxFalconEngineResponse>;
  public error:           Error;

  public constructor(recipeName:string) {
    this.recipeName       = recipeName;
    this.recipeStatus     = SfdxFalconRecipeStatus.UNKNOWN;
    this.recipeMessage    = `Recipe ${this.recipeName}: Status Unknown while running ${this.recipeEngines}`;
    this.recipeDuration   = 0;
    this.recipeName       = recipeName;
    this.error            = {} as any;
    this.recipeDetail     = {
      recipeStatus:       this.recipeStatus,
      enginesRun:         0,
      totalRuntime:       0,
      successfulEngines:  []
    };
    this.engineResponses  = new Array<SfdxFalconEngineResponse>();
  }

  public engineComplete():void {
    this.recipeStatus   = SfdxFalconRecipeStatus.SUCCESS;
    this.recipeMessage  = `Recipe ${this.recipeName} has successfully executed ${this.engineResponses.length} Engine${this.engineResponses.length === 1 ? '' : 's' }`;
    this.recipeDetail   = {
      recipeStatus:       this.recipeStatus,
      enginesRun:         this.engineResponses.length,
      totalRuntime:       this.recipeDuration,
      successfulEngines:  this.getListOfSuccessfulEngines()
    };
  }
  
  public engineSuccess(engineSuccessResponse:SfdxFalconEngineResponse):void {
    this.engineResponses.push(engineSuccessResponse);
    this.recipeStatus    =  SfdxFalconRecipeStatus.EXECUTING;
    this.recipeDuration +=  engineSuccessResponse.engineDuration;
    this.recipeMessage   =  `Recipe ${this.recipeName} has executed ${this.engineResponses.length} Engine${this.engineResponses.length === 1 ? '' : 's' }`;
  }

  public engineFailure(engineFailureResponse:SfdxFalconEngineResponse):void {

    // Compute the final duration
    this.recipeDuration += engineFailureResponse.engineDuration;

    // Add the latest engine to the array of Action Responses
    this.engineResponses.push(engineFailureResponse);

    // Populate properties and build a custom message based on the status of the failed Action.
    switch(engineFailureResponse.engineStatus) {
      case SfdxFalconEngineStatus.ERROR:
        this.recipeStatus   = SfdxFalconRecipeStatus.ERROR;
        this.recipeMessage  = `Recipe Engine ${engineFailureResponse.engineName} was unexpectedly unable to run the Recipe '${engineFailureResponse.recipeName}'`;
        this.error          = engineFailureResponse.error;
        this.recipeDetail   = {
          recipeStatus:       this.recipeStatus,
          enginesRun:         this.engineResponses.length,
          totalRuntime:       this.recipeDuration,
          successfulEngines:  this.getListOfSuccessfulEngines(),
          failedEngine:       engineFailureResponse
        };
        break;
      case SfdxFalconEngineStatus.FAILURE:
        this.recipeStatus   = SfdxFalconRecipeStatus.FAILURE;
        this.recipeMessage  = `Recipe Engine ${engineFailureResponse.engineName} failed to successfully run the Recipe '${engineFailureResponse.recipeName}'`;
        this.error          = engineFailureResponse.error;
        this.recipeDetail   = {
          recipeStatus:       this.recipeStatus,
          enginesRun:         this.engineResponses.length,
          totalRuntime:       this.recipeDuration,
          successfulEngines:  this.getListOfSuccessfulEngines(),
          failedEngine:       engineFailureResponse
        };
      default:
        this.recipeStatus   = SfdxFalconRecipeStatus.UNKNOWN;
        this.recipeMessage  = `Recipe Engine ${engineFailureResponse.engineName} failed in an unknown manner while running the Recipe '${engineFailureResponse.recipeName}'`;
        this.error          = engineFailureResponse.error;
        this.recipeDetail   = {
          recipeStatus:       this.recipeStatus,
          enginesRun:         this.engineResponses.length,
          totalRuntime:       this.recipeDuration,
          successfulEngines:  this.getListOfSuccessfulEngines(),
          failedEngine:       engineFailureResponse
        };
    }
  }
  
  private getListOfSuccessfulEngines():Array<string> {
    // Build a list of the names of Engines that completed successfully;
    let successfulEngines = new Array<string>();
    for (let engineResponse of this.engineResponses) {
      successfulEngines.push(engineResponse.engineName);
    }
    return successfulEngines;    
  }  
}

//─────────────────────────────────────────────────────────────────────────────┐
// Declare interfaces for SFDX-Falcon Recipes.
//─────────────────────────────────────────────────────────────────────────────┘
export enum RecipeType {
  APPX_DEMO     = 'appx:demo-recipe',
  APPX_PACKAGE  = 'appx:package-recipe'
}
export interface SfdxFalconRecipeResult {
  recipeName:     string;
  recipePath:     string;
  recipeType:     RecipeType;
  engineContext:  any;
  engineStatus:   any;
  originalRecipe: any;
  compiledRecipe: any;
  finalStatus:    number;
  finalMessage:   string;
}
