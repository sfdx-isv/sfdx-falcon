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
// Import External Libraries, Modules, and Types
import {ConfigFile}         from  '@salesforce/core';     // Module. SFDX Core library.
import {JsonMap}            from  '@salesforce/ts-types'; // Type. Any JSON key-value structure.
import * as path            from  'path';                 // Module. Node's path library.
const uuid                  = require('uuid/v1');         // Generates a timestamp-based UUID

// Import Internal Libraries
import * as typeValidator   from  '../sfdx-falcon-validators/type-validator'; // Library of SFDX Helper functions specific to SFDX-Falcon.

// Import Internal Classes & Functions
import {SfdxFalconDebug}    from  '../sfdx-falcon-debug'; // Class. Internal Debug module
import {SfdxFalconError}    from  '../sfdx-falcon-error'; // Class. Provides custom Error structures for SFDX-Falcon.

// Set the File Local Debug Namespace
const dbgNs = 'UTILITY:general:';
SfdxFalconDebug.msg(`${dbgNs}`, `Debugging initialized for ${dbgNs}`);


// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    convertPropertyToBoolean
 * @param       {object}  targetObject Object containing the property the caller wants to convert.
 * @param       {string}  targetKey Key for the property the caller wants to convert.
 * @param       {boolean} [retainUnconvertedValues=true] Determines whether or not values that
 *              can not be successfully converted to Boolean should be kept as-is or should be
 *              assigned as `undefined` since that's how they come out of the `valueToBoolean()`
 *              function.
 * @returns     {void}
 * @description Given a target object and key that the caller wants to convert, attempts to coerce
 *              a `boolean` value based on the intent of the value currently in that property.
 *              Will have no effect on target properties that are `undefined`.
 * @public
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
export function convertPropertyToBoolean(targetObject:object, targetKey:string, retainUnconvertedValues=true):void {
  const dbgNsLocal = `${dbgNs}convertPropertyToBoolean`;
  typeValidator.throwOnNullInvalidObject      (targetObject,  `${dbgNsLocal}`,  `targetObject`);
  typeValidator.throwOnEmptyNullInvalidString (targetKey,     `${dbgNsLocal}`,  `targetKey`);
  if (typeof targetObject[targetKey] === 'string' || typeof targetObject[targetKey] === 'number') {
    const convertedValue = valueToBoolean(targetObject[targetKey]);
    if (typeof convertedValue === 'undefined' && retainUnconvertedValues === true) {
      return;
    }
    targetObject[targetKey] = convertedValue;
  }
  else {
    if (retainUnconvertedValues === false) {
      targetObject[targetKey] = undefined;
    }
  }
}

// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    convertPropertyToNumber
 * @param       {object}  targetObject Object containing the property the caller wants to convert.
 * @param       {string}  targetKey Key for the property the caller wants to convert.
 * @param       {boolean} [retainUnconvertedValues=true] Determines whether or not values that
 * @returns     {void}
 * @description Given a target object and key that the caller wants to convert, attempts to coerce
 *              a `number` value based on the intent of the value currently in that property, then
 *              stores that `number` in the same object property that was tested. Will have no
 *              effect on target properties that are `undefined` or `null`.
 * @public
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
export function convertPropertyToNumber(targetObject:object, targetKey:string, retainUnconvertedValues=true):void {
  const dbgNsLocal = `${dbgNs}convertPropertyToNumber`;
  typeValidator.throwOnNullInvalidObject      (targetObject,  `${dbgNsLocal}`,  `targetObject`);
  typeValidator.throwOnEmptyNullInvalidString (targetKey,     `${dbgNsLocal}`,  `targetKey`);
  if (typeof targetObject[targetKey] === 'string' || typeof targetObject[targetKey] === 'number' || targetObject[targetKey] === 'boolean') {
    const convertedValue = valueToNumber(targetObject[targetKey]);
    if (typeof convertedValue === 'undefined' && retainUnconvertedValues === true) {
      return;
    }
    targetObject[targetKey] = convertedValue;
  }
  else {
    if (retainUnconvertedValues === false) {
      targetObject[targetKey] = undefined;
    }
  }
}

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
  if (contentToParse === '') {
    contentToParse = '{}';
  }
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

// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    valueToBoolean
 * @param       {unknown} valueToParse  An `unknown` value to parse. Normally this should be a
 *              `string`, though it's possible that unexpected types will enter this function.
 * @returns     {boolean} Returns a `boolean` ONLY if the intent of the caller can be determined, and
 *              returns `undefined` otherwise.
 * @description Given an `unknown` value to parse, tries to determine what the boolean intent of the
 *              value is. For example, the string `'TrUe'` would result in boolean `true` being returned.
 *              On the other hand, `'random string'`, though true in a traditional boolean sense,
 *              would result in the return of `undefined`.
 * @public
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
export function valueToBoolean(valueToParse:unknown):boolean {
  if (typeof valueToParse === 'undefined' || typeof valueToParse === 'boolean' || valueToParse === null) {
    return valueToParse;
  }
  if (typeof valueToParse === 'number') {
    return valueToParse === 0 ? false : true;
  }
  if (typeof valueToParse === 'string') {
    switch (valueToParse.toLowerCase().trim()) {
      case 'true'   : case 'yes'  : case '1': return true;
      case 'false'  : case 'no'   : case '0': return false;
      case ''                               : return null;
    }
  }
  return undefined;
}

// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    valueToNumber
 * @param       {unknown} valueToParse  An `unknown` value to parse. Normally this should be a
 *              `string`, though it's possible that unexpected types will enter this function.
 * @returns     {boolean} Returns a `number` ONLY if the intent of the caller can be determined, and
 *              returns `undefined` otherwise.
 * @description Given an `unknown` value to parse, tries to determine what the numeric intent of the
 *              value is. For example, the string `'7'` would result in the number `7` being returned.
 *              On the other hand, `'random string'` would return `undefined`.
 * @public
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
export function valueToNumber(valueToParse:unknown, radix:number=10):number {
  if (typeof valueToParse === 'undefined' || typeof valueToParse === 'number' || valueToParse === null) {
    return valueToParse;
  }
  if (typeof valueToParse === 'boolean') {
    return valueToParse ? 1 : 0;
  }
  if (typeof valueToParse === 'string') {
    const parsedNumber = parseInt(valueToParse, (isNaN(radix) ? 10 : radix));
    if (isNaN(parsedNumber) === false) {
      return parsedNumber;
    }
  }
  return undefined;
}
