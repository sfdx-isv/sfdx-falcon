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
  public execResponses: Array<SfdxFalconExecutorResponse>;
  public duration:      number;

  public constructor(actionName:string, actionType:SfdxFalconActionType) {
    this.actionName     = actionName;
    this.actionStatus   = SfdxFalconActionStatus.UNKNOWN;
    this.actionType     = SfdxFalconActionType.UNSPECIFIED;
    this.actionContext  = {};
    this.actionOptions  = {};
    this.actionMessage  = `Action ${this.actionName}: Status Unknown`;
    this.execResponses  = new Array<SfdxFalconExecutorResponse>();
    this.duration       = 0;
  }

  public execComplete():void {
    this.actionStatus    =  SfdxFalconActionStatus.SUCCESS;
    this.actionMessage   =  `Action ${this.actionName} has successfully run ${this.execResponses.length} Executor${this.execResponses.length === 1 ? '' : 's' }`;
  }

  public execSuccess(execSuccessResponse:SfdxFalconExecutorResponse):void {
    this.execResponses.push(execSuccessResponse);
    this.actionStatus    =  SfdxFalconActionStatus.EXECUTING;
    this.duration       +=  execSuccessResponse.duration; 
    this.actionMessage   =  `Action ${this.actionName} has run ${this.execResponses.length} Executor${this.execResponses.length === 1 ? '' : 's' }`;
  }

  public execFailure(execFailureResponse:SfdxFalconExecutorResponse):void {

    // If the type of the incoming Executor Failure Response is NOT SfdxFalconExecutorResponse, wrap it.
    if ((execFailureResponse instanceof SfdxFalconExecutorResponse) !== true) {
      let newExecResponse = new SfdxFalconExecutorResponse(`Unknown Executor (called by '${this.actionName}')`);
      newExecResponse.error(execFailureResponse);
      execFailureResponse = newExecResponse;
    }

    // Add the Failure Response to the Responses array and record the duration.
    this.execResponses.push(execFailureResponse);
    this.duration += execFailureResponse.duration;

    // Customize settings based on the type of failure (thown error or determined failure)
    switch(execFailureResponse.status) {
      case SfdxFalconExecutorStatus.ERROR:
        this.actionStatus   = SfdxFalconActionStatus.ERROR;
        this.actionMessage  = `Action ${this.actionName} encountered an unexpected error while executing ${execFailureResponse.name}\n`
                            + `Action Status: ${this.actionStatus}\n`
                            + `Executors Run: ${this.execResponses.length}\n`
                            + `Total Runtime: ${this.duration}s)\n`
                            + `Attempted Cmd (raw):\n${execFailureResponse.cmdRaw}\n`
                            + `Attempted Cmd (obj):\n${util.inspect(execFailureResponse.cmdObj, {depth:8, colors:true})}\n`
                            + `Error Name:    ${execFailureResponse.respObj.name}\n`
                            + `Error Message: ${execFailureResponse.respObj.message}\n`
                            + `Error Code:    ${execFailureResponse.code}\n`
                            + `Stack Trace: \n${execFailureResponse.respObj.stack}`;
        break;
      case SfdxFalconExecutorStatus.FAILURE:
        this.actionStatus   = SfdxFalconActionStatus.FAILURE;
        this.actionMessage  = `Action ${this.actionName} failed while executing ${execFailureResponse.name}\n`
                            + `Action Status:   ${this.actionStatus}\n`
                            + `Executors Run:   ${this.execResponses.length}\n`
                            + `Total Runtime:   ${this.duration} seconds\n`
                            + `Attempted Cmd (raw):\n${execFailureResponse.cmdRaw}\n`
                            + `Attempted Cmd (obj):\n${util.inspect(execFailureResponse.cmdObj, {depth:8, colors:true})}\n`
                            + `Failure Message: ${execFailureResponse.message}\n`
                            + `Failure Code:    ${execFailureResponse.code}\n`
                            + `Failure Response (raw):   \n${execFailureResponse.respRaw}\n`
                            + `Failure Response (object):\n${util.inspect(execFailureResponse.respObj, {depth:8, colors:true})}`;
      default:
        this.actionStatus   = SfdxFalconActionStatus.UNKNOWN;
        this.actionMessage  = `Action ${this.actionName} experienced an unknown failure while executing ${execFailureResponse.name}\n`
                            + `Action Status:       ${this.actionStatus}\n`
                            + `Executors Run:       ${this.execResponses.length}\n`
                            + `Total Runtime:       ${this.duration}s)\n`
                            + `Attempted Cmd (raw): ${execFailureResponse.cmdRaw}\n`
                            + `Attempted Cmd (obj): ${util.inspect(execFailureResponse.cmdObj, {depth:8, colors:true})}\n`
                            + `Failure Message:     ${execFailureResponse.message}\n`
                            + `Failure Code:        ${execFailureResponse.code}\n`
                            + `Failure Response (raw):   \n${execFailureResponse.respRaw}\n`
                            + `Failure Response (object):\n${util.inspect(execFailureResponse.respObj, {depth:8, colors:true})}`;
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
  public recipeName:      string;
  public actionResponses: Array<SfdxFalconActionResponse>;

  public constructor(engineName:string, recipeName:string) {
    this.engineName       = engineName;
    this.engineStatus     = SfdxFalconEngineStatus.UNKNOWN;
    this.engineMessage    = `Engine ${this.engineName}: Status Unknown while running ${recipeName}`;
    this.engineDuration   = 0;
    this.recipeName       = recipeName;
    this.actionResponses  = new Array<SfdxFalconActionResponse>();
  }

  public actionComplete():void {
    this.engineStatus   = SfdxFalconEngineStatus.SUCCESS;
    this.engineMessage  = `Engine ${this.engineName} has successfully executed ${this.actionResponses.length} Action${this.actionResponses.length === 1 ? '' : 's' }`;
  }
  
  public actionSuccess(actionSuccessResponse:SfdxFalconActionResponse):void {
    this.actionResponses.push(actionSuccessResponse);
    this.engineStatus    =  SfdxFalconEngineStatus.EXECUTING;
    this.engineDuration +=  actionSuccessResponse.duration;
    this.engineMessage   =  `Engine ${this.engineName} has executed ${this.actionResponses.length} Action${this.actionResponses.length === 1 ? '' : 's' }`;
  }

  public actionFailure(actionFailureResponse:SfdxFalconActionResponse):void {

    // Compute the final duration
    this.engineDuration += actionFailureResponse.duration; 

    // Build a list of the names of Actions that completed successfully;
    let successfulActions = new Array<string>();
    for (let actionResponse of this.actionResponses) {
      successfulActions.push(actionResponse.actionName);
    }

    // Add the latest action to the array of Action Responses
    this.actionResponses.push(actionFailureResponse);

    // Populate properties and build a custom message based on the status of the failed Action.
    switch(actionFailureResponse.actionStatus) {
      case SfdxFalconActionStatus.ERROR:
        this.engineStatus   = SfdxFalconEngineStatus.ERROR;
        this.engineMessage  = `Engine ${this.engineName} encountered an unexpected error while running ${actionFailureResponse.actionName}\n`
                            + `Total Runtime:      ${this.engineDuration}s)\n`
                            + `Total Actions Run:  ${this.actionResponses.length}\n`
                            + `Successful Actions: ${successfulActions}\n`
                            + `Failed Action:    \n${util.inspect(actionFailureResponse, {depth:8, colors:true})}`;
        break;
      case SfdxFalconActionStatus.FAILURE:
        this.engineStatus   = SfdxFalconEngineStatus.FAILURE;
        this.engineMessage  = `Engine ${this.engineName} failed while running ${actionFailureResponse.actionName}\n`
                            + `Total Runtime:      ${this.engineDuration}s)\n`
                            + `Total Actions Run:  ${this.actionResponses.length}\n`
                            + `Successful Actions: ${successfulActions}\n`
                            + `Failed Action:    \n${util.inspect(actionFailureResponse, {depth:8, colors:true})}`;
      default:
        this.engineStatus   = SfdxFalconEngineStatus.UNKNOWN;
        this.engineMessage  = `Engine ${this.engineName} failed in an unknown manner while executing ${actionFailureResponse.actionName}\n`
                            + `Total Runtime:      ${this.engineDuration}s)\n`
                            + `Total Actions Run:  ${this.actionResponses.length}\n`
                            + `Successful Actions: ${successfulActions}\n`
                            + `Failed Action:    \n${util.inspect(actionFailureResponse, {depth:8, colors:true})}`;
    }
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
  public recipeEngines:   Array<any>;
  public engineResponses: Array<SfdxFalconEngineResponse>;

  public constructor(recipeName:string) {
    this.recipeName       = recipeName;
    this.recipeStatus     = SfdxFalconRecipeStatus.UNKNOWN;
    this.recipeMessage    = `Recipe ${this.recipeName}: Status Unknown while running ${this.recipeEngines}`;
    this.recipeDuration   = 0;
    this.recipeName       = recipeName;
    this.engineResponses  = new Array<SfdxFalconEngineResponse>();
  }

  public engineComplete():void {
    this.recipeStatus   = SfdxFalconRecipeStatus.SUCCESS;
    this.recipeMessage  = `Recipe ${this.recipeName} has successfully executed ${this.engineResponses.length} Engine${this.engineResponses.length === 1 ? '' : 's' }`;
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

    // Build a list of the names of Actions that completed successfully;
    let successfulEngines = new Array<string>();
    for (let engineResponse of this.engineResponses) {
      successfulEngines.push(engineResponse.engineName);
    }

    // Add the latest engine to the array of Action Responses
    this.engineResponses.push(engineFailureResponse);

    // Populate properties and build a custom message based on the status of the failed Action.
    switch(engineFailureResponse.engineStatus) {
      case SfdxFalconEngineStatus.ERROR:
        this.recipeStatus   = SfdxFalconRecipeStatus.ERROR;
        this.recipeMessage  = `Recipe Engine ${engineFailureResponse.engineName} was unexpectedly unable to run the Recipe '${engineFailureResponse.recipeName}'\n`
                            + `Total Runtime:      ${this.recipeDuration}s)\n`
                            + `Total Engines Run:  ${this.engineResponses.length}\n`
                            + `Successful Engines: ${successfulEngines}\n`
                            + `Failed Engine:    \n${util.inspect(engineFailureResponse, {depth:8, colors:true})}`;
        break;
      case SfdxFalconEngineStatus.FAILURE:
        this.recipeStatus   = SfdxFalconRecipeStatus.FAILURE;
        this.recipeMessage  = `Recipe Engine ${engineFailureResponse.engineName} failed to successfully run the Recipe '${engineFailureResponse.recipeName}'\n`
                            + `Total Runtime:      ${this.recipeDuration}s)\n`
                            + `Total Engines Run:  ${this.engineResponses.length}\n`
                            + `Successful Engines: ${successfulEngines}\n`
                            + `Failed Engine:    \n${util.inspect(engineFailureResponse, {depth:8, colors:true})}`;
        default:
        this.recipeStatus   = SfdxFalconRecipeStatus.UNKNOWN;
        this.recipeMessage  = `Recipe Engine ${engineFailureResponse.engineName} failed in an unknown manner while running the Recipe '${engineFailureResponse.recipeName}'\n`
                            + `Total Runtime:      ${this.recipeDuration}s)\n`
                            + `Total Engines Run:  ${this.engineResponses.length}\n`
                            + `Successful Engines: ${successfulEngines}\n`
                            + `Failed Engine:    \n${util.inspect(engineFailureResponse, {depth:8, colors:true})}`;
    }
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
