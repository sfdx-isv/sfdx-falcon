//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @file          helpers/config-helper.ts
 * @copyright     Vivek M. Chawla - 2018
 * @author        Vivek M. Chawla <@VivekMChawla>
 * @version       1.0.0
 * @license       MIT
 * @requires      module:debug
 * @requires      module:path
 * @summary       Configuration helper library
 * @description   Exports classes and functions that help read and write various config files used
 *                by the SFDX-Falcon framework.
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
// Imports
import * as core                      from  '@salesforce/core';             // Allows us to use SFDX core functionality.
import * as path                      from  'path';                         // Node's path library.
import * as sfdxHelper                from  './sfdx-helper'                  // Library of SFDX commands.

// Requires
const debug                 = require('debug')('config-helper');            // Utility for debugging. set debug.enabled = true to turn on.
const debugAsync            = require('debug')('config-helper(ASYNC)');     // Utility for debugging. set debugAsync.enabled = true to turn on.
const debugExtended         = require('debug')('config-helper(EXTENDED)');  // Utility for debugging. set debugExtended.enabled = true to turn on.

// Initialize debug settings.
debug.enabled         = false;
debugAsync.enabled    = false;
debugExtended.enabled = false;

// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    readConfigFile
 * @param       {string}  rootFolder  Required. The root folder where the config file is stored.
 * @param       {string}  filename    Required. The name of the config file.
 * @returns     {Promise<any>}  Resolves by returning the contents of the config file as an object.
 * @description ????
 * @version     1.0.0
 * @public @async
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
export async function readConfigFile(rootFolder:string, filename:string):Promise<any> {
  // Combine rootFolder and filename to get a complete path
  let filePath = path.join(rootFolder, filename);

  // Get the DemoConfigJson file that (should be) referenced in project config.
  let configFileOptions = {
    rootFolder: rootFolder,
    filename:   filename,
    isGlobal:   false,
    isState:    false,
  }
  debugAsync(`readConfigFile.configFileOptions:\n%O\n`, configFileOptions);

  // Retrieve the config file specified by the Config File Options.
  let configFile = await core.ConfigFile.retrieve(configFileOptions);

  // Verify that the file exists before trying to parse it.
  if (await configFile.exists() === false) {
    throw new Error(`ERROR_CONFIG_NOT_FOUND: File does not exist - ${filePath}`);
  }
  debugAsync(`readConfigFile.configFile:\n%O\n`, configFile);

  // Parse the Demo Build Config File to get a Demo Build Sequence object.
  return configFile.toObject();
}

