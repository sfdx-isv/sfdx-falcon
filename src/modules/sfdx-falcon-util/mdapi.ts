//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @file          modules/sfdx-falcon-util/mdapi.ts
 * @copyright     Vivek M. Chawla - 2019
 * @author        Vivek M. Chawla <@VivekMChawla>
 * @summary       Utility Module - MDAPI
 * @description   Utility functions related to the Salesforce Metadata API.
 * @version       1.0.0
 * @license       MIT
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
// Import Internal Modules
import {SfdxFalconDebug}        from  '../sfdx-falcon-debug';         // Class. Specialized debug provider for SFDX-Falcon code.
import {SfdxFalconError}        from  '../sfdx-falcon-error';         // Class. Extends SfdxError to provide specialized error structures for SFDX-Falcon modules.

// Set the File Local Debug Namespace
const dbgNs = 'UTILITY:mdapi:';


// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    createDeveloperName
 * @param       {string}  nameToTransform Required. The name that will be transformed into a valid
 *              Salesforce API name.
 * @returns     {string}
 * @description Given any string, returns a transformed version of that string that is compatible
 *              with the Salesforce Developer Name / Full Name conventions.
 * @public
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
export function createDeveloperName(nameToTransform:string):string {

  // Debug incoming arguments
  SfdxFalconDebug.obj(`${dbgNs}createDeveloperName:arguments:`, arguments, `arguments: `);

  // Make sure that the caller passed us a non-empty string.
  if (typeof nameToTransform !== 'string' || nameToTransform === '') {
    throw new SfdxFalconError( `Expected nameToTransform to be a non-empty string but got '${typeof nameToTransform}' instead.`
                             , `TypeError`
                             , `${dbgNs}createDeveloperName`);
  }

  // Rules for Developer/API Names:
  // 1. Must be unique within a specific org.
  // 2. Can contain only underscores and alphanumeric characters
  // 3. Must begin with a letter
  // 4. Must NOT include spaces
  // 5. Must NOT end with an underscore
  // 6. Must NOT contain two consecutive underscores
  // 7. Must be 80 chars or less in length.

  // Trim leading and trailing whitespace.
  const trimmedNameToTransform = nameToTransform.trim();
  SfdxFalconDebug.str(`${dbgNs}createDeveloperName:trimmedNameToTransform:`, trimmedNameToTransform);

  // Convert all non-word chars to underscores
  const nonWordCharsToUnderscore = trimmedNameToTransform.replace(/\W/g, '_');
  SfdxFalconDebug.str(`${dbgNs}createDeveloperName:nonWordCharsToUnderscore:`, nonWordCharsToUnderscore);

  // Convert all groups of underscore chars to a single underscore for each group.
  const multiToSingleUnderscores = nonWordCharsToUnderscore.replace(/[_]+/g, '_');
  SfdxFalconDebug.str(`${dbgNs}createDeveloperName:multiToSingleUnderscores:`, multiToSingleUnderscores);
  
  // Remove leading and trailing underscores.
  const noLeadingOrTrailingUnderscores = multiToSingleUnderscores.replace(/^_|_$/g, '');
  SfdxFalconDebug.str(`${dbgNs}createDeveloperName:noLeadingOrTrailingUnderscores:`, noLeadingOrTrailingUnderscores);

  // Make sure the first character is a-Z ONLY. Add an "x" if not.
  const firstCharAlphaOnly  = new RegExp(/^[^a-zA-Z]/g).test(noLeadingOrTrailingUnderscores.charAt(0))
                            ? 'x' + noLeadingOrTrailingUnderscores  // First char wasn't alpha.
                            : noLeadingOrTrailingUnderscores;       // First char was alpha.
  SfdxFalconDebug.str(`${dbgNs}createDeveloperName:firstCharAlphaOnly:`, firstCharAlphaOnly);

  // Final Developer Name must be 80 characters or less.
  const eightyCharsOnly = firstCharAlphaOnly.slice(0, 79);
  SfdxFalconDebug.str(`${dbgNs}createDeveloperName:eightyCharsOnly:`, eightyCharsOnly);

  // One last check to make sure the LAST character isn't an underscore.
  const developerName = eightyCharsOnly.replace(/_$/g, '');
  SfdxFalconDebug.str(`${dbgNs}createDeveloperName:developerName:`, developerName);

  // Done!
  return developerName;
}
