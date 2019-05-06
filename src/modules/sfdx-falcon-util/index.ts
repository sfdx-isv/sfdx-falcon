//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @file          modules/sfdx-falcon-util/index.ts
 * @copyright     Vivek M. Chawla - 2018
 * @author        Vivek M. Chawla <@VivekMChawla>
 * @summary       SFDX-Falcon Utility Module
 * @description   Exports functions that provide common, helpful utility logic.
 * @version       1.0.0
 * @license       MIT
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
// Import External Modules
import {ConfigFile}         from  '@salesforce/core';     // Module. SFDX Core library.
import {JsonMap}            from  '@salesforce/ts-types'; // Type. Any JSON key-value structure.
import * as path            from  'path';                 // Module. Node's path library.

// Import Local Modules
import {SfdxFalconDebug}    from  '../sfdx-falcon-debug'; // Class. Internal Debug module
import {SfdxFalconError}    from  '../sfdx-falcon-error'; // Class. Provides custom Error structures for SFDX-Falcon.

// Require Modules
const uuid = require('uuid/v1');  // Generates a timestamp-based UUID

// Set the File Local Debug Namespace
const dbgNs     = 'UTILITY:general:';


// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    createUniqueUsername
 * @param       {string}  baseUsername  The starting point for the username.  It should already be
 *                                      in the form of an email, eg 'name@domain.org'.
 * @returns     {string}  Returns the baseUsername with a pseudo-uuid appended to the end.
 * @description Given a base username to start with (eg. 'name@domain.org'), returns what should be
 *              a globally unique username with a pseudo-uuid appended the end of the username base.
 * @version     1.0.0
 * @public
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
export function createUniqueUsername(baseUsername:string):string {
  const usernameMaxLength = 35;
  if (typeof baseUsername === 'undefined') throw new SfdxFalconError(`Function createUniqueUsername() expects a value for baseUsername but got undefined`, `InvalidArgument`);
  if (baseUsername.length > usernameMaxLength) throw new SfdxFalconError(`Username can not be longer than ${usernameMaxLength} chars to keep room for appending a UUID`, `InvalidUsername` );
  return baseUsername + uuid();
}

// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    readConfigFile
 * @param       {string}  rootFolder  Required. The root folder where the config file is stored.
 * @param       {string}  filename    Required. The name of the config file.
 * @returns     {Promise<any>}    Resolves by returning the config file contents as a JS Object.
 * @description Given a path and filename, attempts to load the contents of the config file and
 *              convert them into a JavaScript Object.
 * @version     1.0.0
 * @public @async
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
export async function readConfigFile(rootFolder:string, filename:string):Promise<JsonMap> {
  // Combine rootFolder and filename to get a complete path
  const filePath = path.join(rootFolder, filename);

  // Get the DemoConfigJson file that (should be) referenced in project config.
  const configFileOptions = {
    rootFolder: rootFolder,
    filename:   filename,
    isGlobal:   false,
    isState:    false
  };
  SfdxFalconDebug.obj(`${dbgNs}readConfigFile:configFileOptions:`, configFileOptions, `configFileOptions: `);

  // Retrieve the config file specified by the Config File Options.
  const configFile = await ConfigFile.create(configFileOptions);

  // Verify that the file exists before trying to parse it.
  if (await configFile.exists() === false) {
    throw new SfdxFalconError(`Config file does not exist - ${filePath}`, `FileNotFound`);
  }
  SfdxFalconDebug.obj(`${dbgNs}readConfigFile:configFile:`, configFile, `configFile: `);

  // Parse the Demo Build Config File to get a Demo Build Sequence object.
  return configFile.toObject() as JsonMap;
}

// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    safeParse
 * @param       {any} contentToParse  Required. The content to be parsed.
 * @returns     {object}  A JavaScript object based on the content to parse.
 * @description Given any content to parse, returns a JavaScript object based on that content. If
 *              the content is not parseable, it is returned as an object with one key: unparsed.
 * @public
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
export function safeParse(contentToParse:string):JsonMap {
  SfdxFalconDebug.obj(`${dbgNs}safeParse:contentToParse:`, {contentToParse: contentToParse}, `contentToParse: `);
  try {
    return JSON.parse(contentToParse);
  } catch (e) {
    return {unparsed: `${contentToParse}`};
  }
}

// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    findJson
 * @param       {string} contentToSearch  Required. A string buffer that may contain JSON.
 * @returns     {JsonMap}  A parsed JavaScript object found in the string buffer, or NULL.
 * @description Given any string buffer, search that buffer to find a single JSON object. If
 *              a parseable object is found, it is returned as an object. Otherwise returns NULL.
 * @public
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
export function findJson(contentToSearch:string):JsonMap {
  SfdxFalconDebug.str(`${dbgNs}findJson:contentToSearch:`, contentToSearch, `contentToSearch: `);
  const possibleJson  = contentToSearch.substring(contentToSearch.indexOf('{'), contentToSearch.lastIndexOf('}')+1);
  let foundJson     = safeParse(possibleJson);
  if (foundJson.hasOwnProperty('unparsed')) {
    foundJson = null;
  }
  return foundJson;
}
