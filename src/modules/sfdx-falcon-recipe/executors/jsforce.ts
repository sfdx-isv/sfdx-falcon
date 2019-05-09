//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @file          modules/sfdx-falcon-recipe/executors/jsforce.ts
 * @copyright     Vivek M. Chawla - 2018
 * @author        Vivek M. Chawla <@VivekMChawla>
 * @summary       Executor logic that is specific to JSForce.
 * @description   Executor logic that is specific to JSForce.
 * @version       1.0.0
 * @license       MIT
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
// Import External Modules
import {Connection}         from '@salesforce/core';  // Why?
import * as jsf             from 'jsforce';           // Why?

// Import Internal Modules
//import {SfdxFalconDebug}      from  '../../../modules/sfdx-falcon-debug';   // Why?

// Import Falcon Types

// Import Utility Functions
//import {resolveConnection}    from  '../../sfdx-falcon-util/sfdx';          // Why?

// Set the File Local Debug Namespace
//const dbgNs     = 'EXECUTOR:jsforce:';


//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @interface   JSForceCommandDefinition
 * @description Represents the data required to execute a command through JSForce
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
export interface JSForceCommandDefinition {
  aliasOrConnection:  string|Connection;
  progressMsg:        string;
  errorMsg:           string;
  successMsg:         string;
  request:            jsf.RequestInfo;
  options?:           any;              // tslint:disable-line: no-any
}
