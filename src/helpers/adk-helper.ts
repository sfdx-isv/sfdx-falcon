//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @file          helpers/adk-helper.ts
 * @copyright     Vivek M. Chawla - 2018
 * @author        Vivek M. Chawla <@VivekMChawla>
 * @version       1.0.0
 * @license       MIT
 * @requires      module:debug
 * @requires      module:inquirer
 * @requires      module:path
 * @requires      module:shelljs
 * @requires      module:validators/core
 * @summary       AppExchange Demo Kit (ADK) helper library
 * @description   Exports classes & functions that provide the core services of the AppExchange 
 *                Demo Kit (ADK).
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
// Imports
//import * as _ from 'lodash';
//import { resolve } from 'path';
import * as path       from 'path';                         // Node's path library.
import { waitASecond } from './async-helper';

// Requires
const debug       = require('debug')('adk-helper');         // Utility for debugging. set debug.enabled = true to turn on.
const debugAsync  = require('debug')('adk-helper(ASYNC)');  // Utility for debugging. set debugAsync.enabled = true to turn on.
const shell       = require('shelljs');                     // Cross-platform shell access - use for setting up Git repo.

// File Globals


//─────────────────────────────────────────────────────────────────────────────┐
// Initialize debug settings.  These should be set FALSE to give the caller
// control over whether or not debug output is generated.
//─────────────────────────────────────────────────────────────────────────────┘
debug.enabled       = false;
debugAsync.enabled  = false;

//─────────────────────────────────────────────────────────────────────────────┐
// Set shelljs config to throw exceptions on fatal errors.  We have to do
// this so that Git/SFDX commands that return fatal errors can have their
// output suppresed while the generator is running.
//─────────────────────────────────────────────────────────────────────────────┘
shell.config.fatal = true;

//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @class       AdkProject
 * @access      public
 * @version     1.0.0
 * @description Creates an Object that represents an AppExchange Demo Kit project on the user's
 *              local machine.  This includes member variables that hold all of the ADK project
 *              variables and member functions that encapsulate all of the actions the ADK can 
 *              take on behalf of the user.
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
export class AdkProject {

  //───────────────────────────────────────────────────────────────────────────┐
  // Define class member variables/types.
  //───────────────────────────────────────────────────────────────────────────┘
  public  projectPath:        string;   // Why?
  public  targetOrgAlias:     string;   // Why?

  private adkConfig:          object;   // Why?

  //───────────────────────────────────────────────────────────────────────────────────────────────┐
  /**
   * @constructs  AdkProject
   * @version     1.0.0
   * @param       {string}  [projectDirectory] Optional.
   *              Specifies the path of a local directory that contains the root of an ADK project.
   *              When not specified, the local SFDX project context must be present.
   * @param       {boolean} [debugMode] Optional.
   *              Set to TRUE to enable debug output from inside AdkProject.
   * @description Constructs an AdkProject object.
   */
  //───────────────────────────────────────────────────────────────────────────────────────────────┘
  constructor(projectDirectory?: string, debugMode?:boolean) {
    // Activate debug mode if set by the user.
    debug.enabled = (debugMode === true);


    debug(`Hello! We are just getting started!`);


  }
}