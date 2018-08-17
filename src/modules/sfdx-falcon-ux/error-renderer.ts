//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @file          modules/sfdx-falcon-ux/render-error.ts
 * @copyright     Vivek M. Chawla - 2018
 * @author        Vivek M. Chawla <@VivekMChawla>
 * @summary       ???
 * @description   ???
 * @version       1.0.0
 * @license       MIT
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
import {SfdxFalconDebug}              from  '../sfdx-falcon-debug';

import {SfdxFalconRecipeResponse}     from  '../sfdx-falcon-recipe/engines';
import {SfdxFalconRecipeStatus}       from  '../sfdx-falcon-recipe/engines';

import {SfdxFalconActionResponse}     from  '../sfdx-falcon-recipe/engines';
import {SfdxFalconActionStatus}       from  '../sfdx-falcon-recipe/engines';

import {SfdxFalconExecutorResponse}   from  '../sfdx-falcon-recipe/executors';
import {SfdxFalconExecutorStatus}     from  '../sfdx-falcon-recipe/executors';


const chalk = require('chalk');           // Why?
const util  = require('util');            // Why?


//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    renderRecipeError
 * @description Table rendering code borrowed from oclif's cli-ux module. Original code can be found
 *              at https://github.com/oclif/cli-ux/blob/master/src/styled/table.ts
 * @version     1.0.0
 * @public
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
export function renderRecipeError(recipeErrorResponse:SfdxFalconRecipeResponse):void {

  // Establish color/style parameters
  let falconErrorColor = 'blue';
  let errorColor, errorLabel;

  // Output the core Error info
  console.log('');
  console.log(chalk.red.bold(`RECIPE_EXECUTION_ERROR:`));
  console.log(chalk`{${falconErrorColor} Recipe Name:}     ${recipeErrorResponse.recipeName}`);
  console.log(chalk`{${falconErrorColor} Recipe Msg:}      ${recipeErrorResponse.recipeMessage}`);
  console.log(chalk`{${falconErrorColor} Recipe Status:}   ${recipeErrorResponse.recipeStatus}`);
  console.log(chalk`{${falconErrorColor} Recipe Duration:} ${recipeErrorResponse.recipeDuration}`);
  console.log(chalk`{${falconErrorColor} Recipe Engines:}\n${util.inspect(recipeErrorResponse.engineResponses, {depth:8, colors:true})}`);
  console.log('');


}




/*
    switch(engineFailureResponse.engineStatus) {
      case SfdxFalconEngineStatus.ERROR:
        this.recipeStatus   = SfdxFalconRecipeStatus.ERROR;
        this.recipeMessage  = `Recipe Engine ${engineFailureResponse.engineName} was unexpectedly unable to run the Recipe '${engineFailureResponse.recipeName}'\n`
                            + `Total Runtime:      ${this.recipeDuration}s)\n`
                            + `Total Engines Run:  ${this.engineResponses.length}\n`
                            + `Successful Engines: ${successfulEngines || 'None'}\n`
                            + `Failed Engine Name: ${engineFailureResponse.engineName}`;
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

//*/

/*

    switch(actionFailureResponse.actionStatus) {
      case SfdxFalconActionStatus.ERROR:
        this.engineStatus   = SfdxFalconEngineStatus.ERROR;
        this.engineMessage  = `Engine ${this.engineName} encountered an unexpected error while running ${actionFailureResponse.actionName}`;
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

//*/