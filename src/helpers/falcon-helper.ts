//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @file          helpers/falcon-helper.ts
 * @copyright     Vivek M. Chawla - 2018
 * @author        Vivek M. Chawla <@VivekMChawla>
 * @version       1.0.0
 * @license       MIT
 * @requires      module:???
 * @summary       SFDX-Falcon general helper library
 * @description   Exports general helper classes & functions tightly related to the SFDX-Falcon
 *                framework.
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
// Imports
//import {SfdxError}                    from  '@salesforce/core';                     // Why?
//import {SfdxErrorConfig}              from  '@salesforce/core';                     // Why?
import {AppxDemoLocalConfig}          from '../falcon-types';         // Why?
import {AppxDemoProjectConfig}        from '../falcon-types';         // Why?
import {ERROR_TYPE}                   from '../enums';                // Why?
//import {FalconProgressNotifications}  from './notification-helper'    // Why?

import {SfdxFalconDebug} from  '../modules/sfdx-falcon-debug'; // Why?
import {SfdxFalconError} from  '../modules/sfdx-falcon-error'; // Why?



// Requires
const chalk = require('chalk');   // Why?
const util  = require('util');    // Why?



