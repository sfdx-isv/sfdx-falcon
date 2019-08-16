//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @file          modules/sfdx-falcon-validators/type-validator.ts
 * @copyright     Vivek M. Chawla - 2019
 * @author        Vivek M. Chawla <@VivekMChawla>
 * @summary       Type validation library. Useful for validating incoming arguments inside functions.
 * @description   Exports basic validation functions for ensuring a variable has the expected type
 *                and/or meets certain basic requirements like not empty, not null, etc.
 * @version       1.0.0
 * @license       MIT
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
// Import External Libraries & Modules
import * as fs              from  'fs-extra';               // Extended set of File System utils.
import  {isEmpty}           from  'lodash';                 // Useful function for detecting empty objects.

// Import Internal Classes & Functions
import  {SfdxFalconDebug}   from  '../sfdx-falcon-debug';   // Class. Specialized debug provider for SFDX-Falcon code.
import  {SfdxFalconError}   from  '../sfdx-falcon-error';   // Class. Extends SfdxError to provide specialized error structures for SFDX-Falcon modules.

// Import Internal Types
import  {ClassConstructor}  from  '../sfdx-falcon-types';   // Type. Represents the constructor for a Class, ie. something that can be the right operand of the instanceof operator.

// Set the File Local Debug Namespace
const dbgNs = 'VALIDATOR:type:';
SfdxFalconDebug.msg(`${dbgNs}`, `Debugging initialized for ${dbgNs}`);


// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    errMsgEmptyNullInvalidArray
 * @param       {unknown} arg Required. The argument involved in the error.
 * @param       {string}  argName Required. The variable name of the argument involved in the error.
 * @returns     {string}  A standardized error message reporting an empty, null, or invalid array
 *              was provided.
 * @description Given an argument and the name of that argument, returns a standardized error
 *              message reporting an empty, null, or invalid array was provided.
 * @public
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
export function errMsgEmptyNullInvalidArray(arg:unknown, argName:string):string {
  if (isEmptyNullInvalidString(argName)) {
    argName = 'the argument';
  }
  return `Expected ${argName} to be a non-null, non-empty array${Array.isArray(arg) !== true ? ` but got type '${typeof arg}' instead.` : `.`}`;
}

// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    errMsgEmptyNullInvalidObject
 * @param       {unknown} arg Required. The argument involved in the error.
 * @param       {string}  argName Required. The variable name of the argument involved in the error.
 * @returns     {string}  A standardized error message reporting an empty, null, or invalid object
 *              was provided.
 * @description Given an argument and the name of that argument, returns a standardized error
 *              message reporting an empty, null, or invalid object was provided.
 * @public
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
export function errMsgEmptyNullInvalidObject(arg:unknown, argName:string):string {
  if (isEmptyNullInvalidString(argName)) {
    argName = 'the argument';
  }
  return `Expected ${argName} to be a non-null, non-empty object${typeof arg !== 'object' ? ` but got type '${typeof arg}' instead.` : `.`}`;
}

// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    errMsgEmptyNullInvalidString
 * @param       {unknown} arg Required. The argument involved in the error.
 * @param       {string}  argName Required. The variable name of the argument involved in the error.
 * @returns     {string}  A standardized error message reporting an empty, null, or invalid string
 *              was provided.
 * @description Given an argument and the name of that argument, returns a standardized error
 *              message reporting an empty, null, or invalid string was provided.
 * @public
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
export function errMsgEmptyNullInvalidString(arg:unknown, argName:string):string {
  if (isEmptyNullInvalidString(argName)) {
    argName = 'the argument';
  }
  return `Expected ${argName} to be a non-null, non-empty string${typeof arg !== 'string' ? ` but got type '${typeof arg}' instead.` : `.`}`;
}

// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    errMsgInvalidArray
 * @param       {unknown} arg Required. The argument involved in the error.
 * @param       {string}  argName Required. The variable name of the argument involved in the error.
 * @returns     {string}  A standardized error message reporting an invalid array was provided.
 * @description Given an argument and the name of that argument, returns a standardized error
 *              message reporting an invalid array was provided.
 * @public
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
export function errMsgInvalidArray(arg:unknown, argName:string):string {
  if (isEmptyNullInvalidString(argName)) {
    argName = 'the argument';
  }
  return `Expected ${argName} to be an array but got type '${typeof arg}' instead.`;
}

// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    errMsgInvalidBoolean
 * @param       {unknown} arg Required. The argument involved in the error.
 * @param       {string}  argName Required. The variable name of the argument involved in the error.
 * @returns     {string}  A standardized error message reporting an invalid object was provided.
 * @description Given an argument and the name of that argument, returns a standardized error
 *              message reporting an invalid boolean was provided.
 * @public
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
export function errMsgInvalidBoolean(arg:unknown, argName:string):string {
  if (isEmptyNullInvalidString(argName)) {
    argName = 'the argument';
  }
  return `Expected ${argName} to be a boolean but got type '${typeof arg}' instead.`;
}

// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    errMsgInvalidInstance
 * @param       {unknown} arg Required. The argument involved in the error.
 * @param       {ClassConstructor}  classConstructor  Required. Constructor function of the object
 *              that the argument was tested against.
 * @param       {string}  argName Required. The variable name of the argument involved in the error.
 * @returns     {string}  A standardized error message reporting an object that is not an instance
 *              of the expected class.
 * @description Given an argument and the name of that argument, returns a standardized error
 *              message reporting an object that is not an instance of the expected class.
 * @public
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
export function errMsgInvalidInstance(arg:unknown, classConstructor:ClassConstructor, argName:string):string {
  if (isEmptyNullInvalidString(argName)) {
    argName = 'the argument';
  }
  // Figure out the name of the Expected Instance.
  let expectedInstanceOf = 'unknown';
  if (typeof classConstructor !== 'undefined' && classConstructor !== null) {
    if (classConstructor.constructor) {
      expectedInstanceOf = classConstructor.constructor.name;
    }
  }
  // Figure out the name of the Actual Instance.
  let actualInstanceOf = '';
  if (typeof arg !== 'undefined' && arg !== null) {
    if (arg.constructor) {
      actualInstanceOf = arg.constructor.name;
    }
  }
  // Build and return the Error Message.
  return `Expected ${argName} to be an instance of '${expectedInstanceOf}'`
       + actualInstanceOf ? ` but got an instance of ${actualInstanceOf} instead` : ``
       + `.`;
}

// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    errMsgInvalidObject
 * @param       {unknown} arg Required. The argument involved in the error.
 * @param       {string}  argName Required. The variable name of the argument involved in the error.
 * @returns     {string}  A standardized error message reporting an invalid object was provided.
 * @description Given an argument and the name of that argument, returns a standardized error
 *              message reporting an invalid object was provided.
 * @public
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
export function errMsgInvalidObject(arg:unknown, argName:string):string {
  if (isEmptyNullInvalidString(argName)) {
    argName = 'the argument';
  }
  return `Expected ${argName} to be an object but got type '${typeof arg}' instead.`;
}

// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    errMsgInvalidString
 * @param       {unknown} arg Required. The argument involved in the error.
 * @param       {string}  argName Required. The variable name of the argument involved in the error.
 * @returns     {string}  A standardized error message reporting an invalid string was provided.
 * @description Given an argument and the name of that argument, returns a standardized error
 *              message reporting an invalid string was provided.
 * @public
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
export function errMsgInvalidString(arg:unknown, argName:string):string {
  if (isEmptyNullInvalidString(argName)) {
    argName = 'the argument';
  }
  return `Expected ${argName} to be a string but got type '${typeof arg}' instead.`;
}

// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    errMsgNonReadablePath
 * @param       {string}  path  Required. The path involved in the Error.
 * @param       {string}  argName Required. The variable name of the argument involved in the error.
 * @returns     {string}  A standardized error message reporting a non-readable path was provided.
 * @description Given a path and the name of an argument associated with that path, returns a
 *              standardized error message reporting a non-existant or inaccessible path.
 * @public
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
export function errMsgNonReadablePath(path:string, argName:string):string {
  if (isEmptyNullInvalidString(argName)) {
    argName = '';
  }
  return  ( argName ? `Expected ${argName} to reference a readable path, but ` : `` )
          + `'${path}' does not exist or is not accessible by the currently running user.`;
}

// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    errMsgNullInvalidArray
 * @param       {unknown} arg Required. The argument involved in the error.
 * @param       {string}  argName Required. The variable name of the argument involved in the error.
 * @returns     {string}  A standardized error message reporting a null or invalid array was provided.
 * @description Given an argument and the name of that argument, returns a standardized error
 *              message reporting a null or invalid array was provided.
 * @public
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
export function errMsgNullInvalidArray(arg:unknown, argName:string):string {
  if (isEmptyNullInvalidString(argName)) {
    argName = 'the argument';
  }
  return `Expected ${argName} to be a non-null array${Array.isArray(arg) !== true ? ` but got type '${typeof arg}' instead.` : `.`}`;
}

// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    errMsgNullInvalidBoolean
 * @param       {unknown} arg Required. The argument involved in the error.
 * @param       {string}  argName Required. The variable name of the argument involved in the error.
 * @returns     {string}  A standardized error message reporting a null or invalid boolean was provided.
 * @description Given an argument and the name of that argument, returns a standardized error
 *              message reporting a null or invalid boolean was provided.
 * @public
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
export function errMsgNullInvalidBoolean(arg:unknown, argName:string):string {
  if (isEmptyNullInvalidString(argName)) {
    argName = 'the argument';
  }
  return `Expected ${argName} to be a non-null boolean${typeof arg !== 'boolean' ? ` but got type '${typeof arg}' instead.` : `.`}`;
}

// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    errMsgNullInvalidInstance
 * @param       {unknown} arg Required. The argument involved in the error.
 * @param       {ClassConstructor}  classConstructor  Required. Constructor function of the object
 *              that the argument was tested against.
 * @param       {string}  argName Required. The variable name of the argument involved in the error.
 * @returns     {string}  A standardized error message reporting a null object or an object that
 *              is not an instance of the expected class.
 * @description Given an argument and the name of that argument, returns a standardized error
 *              message reporting a null object or an object that is not an instance of the
 *              expected class.
 * @public
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
export function errMsgNullInvalidInstance(arg:unknown, classConstructor:ClassConstructor, argName:string):string {
  if (isEmptyNullInvalidString(argName)) {
    argName = 'the argument';
  }
  // Figure out the name of the Expected Instance.
  let expectedInstanceOf = 'unknown';
  if (typeof classConstructor !== 'undefined' && classConstructor !== null) {
    if (classConstructor.prototype && classConstructor.prototype.constructor) {
      expectedInstanceOf = classConstructor.prototype.constructor.name;
    }
  }
  // Figure out the name of the Actual Instance.
  let actualInstanceOf = '';
  if (typeof arg !== 'undefined' && arg !== null) {
    if (arg.constructor) {
      actualInstanceOf = arg.constructor.name;
    }
  }
  // Build and return the Error Message.
  return `Expected ${argName} to be a non-null instance of '${expectedInstanceOf}'` +
         (actualInstanceOf ? ` but got an instance of '${actualInstanceOf}' instead` : ``) +
         `.`;
}

// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    errMsgNullInvalidObject
 * @param       {unknown} arg Required. The argument involved in the error.
 * @param       {string}  argName Required. The variable name of the argument involved in the error.
 * @returns     {string}  A standardized error message reporting a null or invalid object was provided.
 * @description Given an argument and the name of that argument, returns a standardized error
 *              message reporting a null or invalid object was provided.
 * @public
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
export function errMsgNullInvalidObject(arg:unknown, argName:string):string {
  if (isEmptyNullInvalidString(argName)) {
    argName = 'the argument';
  }
  return `Expected ${argName} to be a non-null object${typeof arg !== 'object' ? ` but got type '${typeof arg}' instead.` : `.`}`;
}

// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    errMsgNullInvalidString
 * @param       {unknown} arg Required. The argument involved in the error.
 * @param       {string}  argName Required. The variable name of the argument involved in the error.
 * @returns     {string}  A standardized error message reporting a null or invalid string was provided.
 * @description Given an argument and the name of that argument, returns a standardized error
 *              message reporting a null or invalid string was provided.
 * @public
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
export function errMsgNullInvalidString(arg:unknown, argName:string):string {
  if (isEmptyNullInvalidString(argName)) {
    argName = 'the argument';
  }
  return `Expected ${argName} to be a non-null string${typeof arg !== 'string' ? ` but got type '${typeof arg}' instead.` : `.`}`;
}

// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    isEmptyNullInvalidArray
 * @param       {unknown} variable  Required. The variable whose type will be validated.
 * @returns     {boolean}
 * @description Checks if the given variable is NOT an array, or is a null or empty array.
 * @public
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
export function isEmptyNullInvalidArray(variable:unknown):boolean {
  return (Array.isArray(variable) !== true || variable === null || (variable as []).length < 1);
}

// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    isEmptyNullInvalidString
 * @param       {unknown} variable  Required. The variable whose type will be validated.
 * @returns     {boolean}
 * @description Checks if the given variable is NOT a string, or is a null or empty string.
 * @public
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
export function isEmptyNullInvalidString(variable:unknown):boolean {
  return (typeof variable !== 'string' || variable === null || variable === '');
}

// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    isEmptyNullInvalidObject
 * @param       {unknown} variable  Required. The variable whose type will be validated.
 * @returns     {boolean}
 * @description Checks if the given variable is NOT an object, or is a null or empty object.
 * @public
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
export function isEmptyNullInvalidObject(variable:unknown):boolean {
  return (typeof variable !== 'object' || variable === null || isEmpty(variable));
}

// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    isInvalidArray
 * @param       {unknown} variable  Required. The variable whose type will be validated.
 * @returns     {boolean}
 * @description Checks if the given variable is NOT an array.
 * @public
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
export function isInvalidArray(variable:unknown):boolean {
  return (Array.isArray(variable) !== true);
}

// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    isInvalidBoolean
 * @param       {unknown} variable  Required. The variable whose type will be validated.
 * @returns     {boolean}
 * @description Checks if the given variable is NOT a boolean.
 * @public
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
export function isInvalidBoolean(variable:unknown):boolean {
  return (typeof variable !== 'boolean');
}

// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    isInvalidInstance
 * @param       {unknown} variable  Required. The variable whose type will be validated.
 * @param       {ClassConstructor}  classConstructor  Required. Constructor function of the object
 *              that the variable will be tested against.
 * @returns     {boolean}
 * @description Checks if the given variable is NOT an instance of a the expected class.
 * @public
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
export function isInvalidInstance(variable:unknown, classConstructor:ClassConstructor):boolean {
  return (typeof variable !== 'object' || ((variable instanceof classConstructor) !== true));
}

// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    isInvalidObject
 * @param       {unknown} variable  Required. The variable whose type will be validated.
 * @returns     {boolean}
 * @description Checks if the given variable is NOT an object.
 * @public
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
export function isInvalidObject(variable:unknown):boolean {
  return (typeof variable !== 'object');
}

// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    isInvalidString
 * @param       {unknown} variable  Required. The variable whose type will be validated.
 * @returns     {boolean}
 * @description Checks if the given variable is NOT a string.
 * @public
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
export function isInvalidString(variable:unknown):boolean {
  return (typeof variable !== 'string');
}

// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    isNullInvalidArray
 * @param       {unknown} variable  Required. The variable whose type will be validated.
 * @returns     {boolean}
 * @description Checks if the given variable is NOT an array, or if it is null.
 * @public
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
export function isNullInvalidArray(variable:unknown):boolean {
  return (Array.isArray(variable) !== true || variable === null);
}

// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    isNullInvalidBoolean
 * @param       {unknown} variable  Required. The variable whose type will be validated.
 * @returns     {boolean}
 * @description Checks if the given variable is NOT a boolean, or if it is null.
 * @public
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
export function isNullInvalidBoolean(variable:unknown):boolean {
  return (typeof variable !== 'boolean' || variable === null);
}

// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    isNullInvalidInstance
 * @param       {unknown} variable  Required. The variable whose type will be validated.
 * @param       {ClassConstructor}  classConstructor  Required. Constructor function of the object
 *              that the variable will be tested against.
 * @returns     {boolean}
 * @description Checks if the given variable is null or is NOT an instance of the expected class.
 * @public
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
export function isNullInvalidInstance(variable:unknown, classConstructor:ClassConstructor):boolean {
  return (typeof variable !== 'object' || variable === null || ((variable instanceof classConstructor) !== true));
}

// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    isNullInvalidObject
 * @param       {unknown} variable  Required. The variable whose type will be validated.
 * @returns     {boolean}
 * @description Checks if the given variable is NOT an object, or if it is null.
 * @public
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
export function isNullInvalidObject(variable:unknown):boolean {
  return (typeof variable !== 'object' || variable === null);
}

// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    isNullInvalidString
 * @param       {unknown} variable  Required. The variable whose type will be validated.
 * @returns     {boolean}
 * @description Checks if the given variable is NOT a string, or if it is null.
 * @public
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
export function isNullInvalidString(variable:unknown):boolean {
  return (typeof variable !== 'string' || variable === null);
}

// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    isReadablePath
 * @param       {string}  path  Required. Path that will be checked for readability.
 * @returns     {boolean}
 * @description Checks if the given path exists AND is readable by the currently running user.
 * @public
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
export function isReadablePath(path:string):boolean {
  try {
    fs.accessSync(path, fs.constants.R_OK);
  }
  catch (accessError) {
    return false;
  }
  return true;
}

// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    isNotEmptyNullInvalidArray
 * @param       {unknown} variable  Required. The variable whose type will be validated.
 * @returns     {boolean}
 * @description Checks for the inverse of isEmptyNullInvalidArray().
 * @public
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
export function isNotEmptyNullInvalidArray(variable:unknown):boolean {
  return !isEmptyNullInvalidArray(variable);
}

// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    isNotEmptyNullInvalidString
 * @param       {unknown} variable  Required. The variable whose type will be validated.
 * @returns     {boolean}
 * @description Checks for the inverse of isEmptyNullInvalidString().
 * @public
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
export function isNotEmptyNullInvalidString(variable:unknown):boolean {
  return !isEmptyNullInvalidString(variable);
}

// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    isNotEmptyNullInvalidObject
 * @param       {unknown} variable  Required. The variable whose type will be validated.
 * @returns     {boolean}
 * @description Checks for the inverse of isEmptyNullInvalidObject().
 * @public
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
export function isNotEmptyNullInvalidObject(variable:unknown):boolean {
  return !isEmptyNullInvalidObject(variable);
}

// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    isNotInvalidArray
 * @param       {unknown} variable  Required. The variable whose type will be validated.
 * @returns     {boolean}
 * @description Checks for the inverse of isInvalidArray().
 * @public
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
export function isNotInvalidArray(variable:unknown):boolean {
  return !isInvalidArray(variable);
}

// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    isNotInvalidBoolean
 * @param       {unknown} variable  Required. The variable whose type will be validated.
 * @returns     {boolean}
 * @description Checks for the inverse of isInvalidBoolean().
 * @public
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
export function isNotInvalidBoolean(variable:unknown):boolean {
  return !isInvalidBoolean(variable);
}

// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    isNotInvalidInstance
 * @param       {unknown} variable  Required. The variable whose type will be validated.
 * @param       {ClassConstructor}  classConstructor  Required. Constructor function of the object
 *              that the variable will be tested against.
 * @returns     {boolean}
 * @description Checks for the inverse of isInvalidInstance().
 * @public
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
export function isNotInvalidInstance(variable:unknown, classConstructor:ClassConstructor):boolean {
  return !isInvalidInstance(variable, classConstructor);
}

// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    isNotInvalidObject
 * @param       {unknown} variable  Required. The variable whose type will be validated.
 * @returns     {boolean}
 * @description Checks for the inverse of isInvalidObject().
 * @public
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
export function isNotInvalidObject(variable:unknown):boolean {
  return !isInvalidObject(variable);
}

// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    isNotInvalidString
 * @param       {unknown} variable  Required. The variable whose type will be validated.
 * @returns     {boolean}
 * @description Checks for the inverse of isInvalidString().
 * @public
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
export function isNotInvalidString(variable:unknown):boolean {
  return !isInvalidString(variable);
}

// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    isNotNullInvalidArray
 * @param       {unknown} variable  Required. The variable whose type will be validated.
 * @returns     {boolean}
 * @description Checks for the inverse of isNullInvalidArray().
 * @public
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
export function isNotNullInvalidArray(variable:unknown):boolean {
  return !isNullInvalidArray(variable);
}

// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    isNotNullInvalidBoolean
 * @param       {unknown} variable  Required. The variable whose type will be validated.
 * @returns     {boolean}
 * @description Checks for the inverse of isNullInvalidBoolean().
 * @public
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
export function isNotNullInvalidBoolean(variable:unknown):boolean {
  return !isNullInvalidBoolean(variable);
}

// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    isNotNullInvalidInstance
 * @param       {unknown} variable  Required. The variable whose type will be validated.
 * @param       {ClassConstructor}  classConstructor  Required. Constructor function of the object
 *              that the variable will be tested against.
 * @returns     {boolean}
 * @description Checks for the inverse of isNullInvalidInstance().
 * @public
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
export function isNotNullInvalidInstance(variable:unknown, classConstructor:ClassConstructor):boolean {
  return !isNullInvalidInstance(variable, classConstructor);
}

// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    isNotNullInvalidObject
 * @param       {unknown} variable  Required. The variable whose type will be validated.
 * @returns     {boolean}
 * @description Checks for the inverse of isNullInvalidObject().
 * @public
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
export function isNotNullInvalidObject(variable:unknown):boolean {
  return !isNullInvalidObject(variable);
}

// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    isNotNullInvalidString
 * @param       {unknown} variable  Required. The variable whose type will be validated.
 * @returns     {boolean}
 * @description Checks for the inverse of isNullInvalidString().
 * @public
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
export function isNotNullInvalidString(variable:unknown):boolean {
  return !isNullInvalidString(variable);
}

// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    isNotReadablePath
 * @param       {string}  path  Required. Path that will be checked for readability.
 * @returns     {boolean}
 * @description Checks for the inverse of isReadablePath().
 * @public
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
export function isNotReadablePath(path:string):boolean {
  return !isReadablePath(path);
}

// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    throwOnEmptyNullInvalidArray
 * @param       {unknown} arg Required. The argument whose type will be validated.
 * @param       {string}  dbgNsExt  Required. The debug namespace of the external caller.
 * @param       {string}  [argName] Optional. The variable name of the argument being validated.
 * @returns     {void}
 * @description Given an argument of unknown type, attempts to validate that the argument is a
 *              non-null, non-empty array. Uses the debug namespace of the external caller as the
 *              base of the "source" string used by the thrown SfdxFalconError.
 * @public
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
export function throwOnEmptyNullInvalidArray(arg:unknown, dbgNsExt:string, argName?:string):void {
  if (isEmptyNullInvalidArray(arg)) {
    throw new SfdxFalconError( errMsgEmptyNullInvalidArray(arg, argName)
                             , `TypeError`
                             , `${dbgNsExt}`);
  }
}

// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    throwOnEmptyNullInvalidObject
 * @param       {unknown} arg Required. The argument whose type will be validated.
 * @param       {string}  dbgNsExt  Required. The debug namespace of the external caller.
 * @param       {string}  [argName] Optional. The variable name of the argument being validated.
 * @returns     {void}
 * @description Given an argument of unknown type, attempts to validate that the argument is a
 *              non-null, non-empty object. Uses the debug namespace of the external caller as the
 *              base of the "source" string used by the thrown SfdxFalconError.
 * @public
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
export function throwOnEmptyNullInvalidObject(arg:unknown, dbgNsExt:string, argName?:string):void {
  if (isEmptyNullInvalidObject(arg)) {
    throw new SfdxFalconError( errMsgEmptyNullInvalidObject(arg, argName)
                             , `TypeError`
                             , `${dbgNsExt}`);
  }
}

// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    throwOnEmptyNullInvalidString
 * @param       {unknown} arg Required. The argument whose type will be validated.
 * @param       {string}  dbgNsExt  Required. The debug namespace of the external caller.
 * @param       {string}  [argName] Optional. The variable name of the argument being validated.
 * @returns     {void}
 * @description Given an argument of unknown type, attempts to validate that the argument is a
 *              non-null, non-empty string. Uses the debug namespace of the external caller as the
 *              base of the "source" string used by the thrown SfdxFalconError.
 * @public
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
export function throwOnEmptyNullInvalidString(arg:unknown, dbgNsExt:string, argName?:string):void {
  if (isEmptyNullInvalidString(arg)) {
    throw new SfdxFalconError( errMsgEmptyNullInvalidString(arg, argName)
                             , `TypeError`
                             , `${dbgNsExt}`);
  }
}

// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    throwOnInvalidArray
 * @param       {unknown} arg Required. The argument whose type will be validated.
 * @param       {string}  dbgNsExt  Required. The debug namespace of the external caller.
 * @param       {string}  [argName] Optional. The variable name of the argument being validated.
 * @returns     {void}
 * @description Given an argument of unknown type, attempts to validate that the argument is an
 *              array. Uses the debug namespace of the external caller as the base of
 *              the "source" string used by the thrown SfdxFalconError.
 * @public
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
export function throwOnInvalidArray(arg:unknown, dbgNsExt:string, argName?:string):void {
  if (isInvalidArray(arg)) {
    throw new SfdxFalconError( errMsgInvalidArray(arg, argName)
                             , `TypeError`
                             , `${dbgNsExt}`);
  }
}

// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    throwOnInvalidBoolean
 * @param       {unknown} arg Required. The argument whose type will be validated.
 * @param       {string}  dbgNsExt  Required. The debug namespace of the external caller.
 * @param       {string}  [argName] Optional. The variable name of the argument being validated.
 * @returns     {void}
 * @description Given an argument of unknown type, attempts to validate that the argument is a
 *              boolean. Uses the debug namespace of the external caller as the base of
 *              the "source" string used by the thrown SfdxFalconError.
 * @public
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
export function throwOnInvalidBoolean(arg:unknown, dbgNsExt:string, argName?:string):void {
  if (isInvalidBoolean(arg)) {
    throw new SfdxFalconError( errMsgInvalidBoolean(arg, argName)
                             , `TypeError`
                             , `${dbgNsExt}`);
  }
}

// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    throwOnInvalidInstance
 * @param       {unknown} arg Required. The argument whose type will be validated.
 * @param       {ClassConstructor}  classConstructor  Required. Constructor function of the object
 *              that the argument will be tested against.
 * @param       {string}  dbgNsExt  Required. The debug namespace of the external caller.
 * @param       {string}  [argName] Optional. The variable name of the argument being validated.
 * @returns     {void}
 * @description Given an argument of unknown type, attempts to validate that the argument is an
 *              object that's an instace of the specified class. Uses the debug namespace of the
 *              external caller as the base of the "source" string used by the thrown SfdxFalconError.
 * @public
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
export function throwOnInvalidInstance(arg:unknown, classConstructor:ClassConstructor, dbgNsExt:string, argName?:string):void {
  if (isInvalidInstance(arg, classConstructor))  {
    throw new SfdxFalconError( errMsgInvalidInstance(arg, classConstructor, argName)
                             , `TypeError`
                             , `${dbgNsExt}`);
  }
}

// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    throwOnInvalidObject
 * @param       {unknown} arg Required. The argument whose type will be validated.
 * @param       {string}  dbgNsExt  Required. The debug namespace of the external caller.
 * @param       {string}  [argName] Optional. The variable name of the argument being validated.
 * @returns     {void}
 * @description Given an argument of unknown type, attempts to validate that the argument is an
 *              object. Uses the debug namespace of the external caller as the base of
 *              the "source" string used by the thrown SfdxFalconError.
 * @public
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
export function throwOnInvalidObject(arg:unknown, dbgNsExt:string, argName?:string):void {
  if (isInvalidObject(arg)) {
    throw new SfdxFalconError( errMsgInvalidObject(arg, argName)
                             , `TypeError`
                             , `${dbgNsExt}`);
  }
}

// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    throwOnInvalidString
 * @param       {unknown} arg Required. The argument whose type will be validated.
 * @param       {string}  dbgNsExt  Required. The debug namespace of the external caller.
 * @param       {string}  [argName] Optional. The variable name of the argument being validated.
 * @returns     {void}
 * @description Given an argument of unknown type, attempts to validate that the argument is a
 *              string. Uses the debug namespace of the external caller as the base of
 *              the "source" string used by the thrown SfdxFalconError.
 * @public
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
export function throwOnInvalidString(arg:unknown, dbgNsExt:string, argName?:string):void {
  if (isInvalidString(arg)) {
    throw new SfdxFalconError( errMsgInvalidString(arg, argName)
                             , `TypeError`
                             , `${dbgNsExt}`);
  }
}

// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    throwOnNullInvalidArray
 * @param       {unknown} arg Required. The argument whose type will be validated.
 * @param       {string}  dbgNsExt  Required. The debug namespace of the external caller.
 * @param       {string}  [argName] Optional. The variable name of the argument being validated.
 * @returns     {void}
 * @description Given an argument of unknown type, attempts to validate that the argument is a
 *              non-null array. Uses the debug namespace of the external caller as the base of
 *              the "source" string used by the thrown SfdxFalconError.
 * @public
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
export function throwOnNullInvalidArray(arg:unknown, dbgNsExt:string, argName?:string):void {
  if (isNullInvalidArray(arg)) {
    throw new SfdxFalconError( errMsgNullInvalidArray(arg, argName)
                             , `TypeError`
                             , `${dbgNsExt}`);
  }
}

// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    throwOnNullInvalidBoolean
 * @param       {unknown} arg Required. The argument whose type will be validated.
 * @param       {string}  dbgNsExt  Required. The debug namespace of the external caller.
 * @param       {string}  [argName] Optional. The variable name of the argument being validated.
 * @returns     {void}
 * @description Given an argument of unknown type, attempts to validate that the argument is a
 *              non-null boolean. Uses the debug namespace of the external caller as the base of
 *              the "source" string used by the thrown SfdxFalconError.
 * @public
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
export function throwOnNullInvalidBoolean(arg:unknown, dbgNsExt:string, argName?:string):void {
  if (isNullInvalidBoolean(arg)) {
    throw new SfdxFalconError( errMsgNullInvalidBoolean(arg, argName)
                             , `TypeError`
                             , `${dbgNsExt}`);
  }
}

// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    throwOnNullInvalidInstance
 * @param       {unknown} arg Required. The argument whose type will be validated.
 * @param       {ClassConstructor}  classConstructor  Required. Constructor function of the object
 *              that the argument will be tested against.
 * @param       {string}  dbgNsExt  Required. The debug namespace of the external caller.
 * @param       {string}  argName Required. The variable name of the argument being validated.
 * @returns     {void}
 * @description Given an argument of unknown type, attempts to validate that the argument is a
 *              non-null object that's an instace of the specified class. Uses the debug namespace
 *              of the external caller as the base of the "source" string used by the thrown
 *              SfdxFalconError.
 * @public
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
export function throwOnNullInvalidInstance(arg:unknown, classConstructor:ClassConstructor, dbgNsExt:string, argName:string):void {
  if (isNullInvalidInstance(arg, classConstructor))  {
    throw new SfdxFalconError( errMsgNullInvalidInstance(arg, classConstructor, argName)
                             , `TypeError`
                             , `${dbgNsExt}`);
  }
}

// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    throwOnNullInvalidObject
 * @param       {unknown} arg Required. The argument whose type will be validated.
 * @param       {string}  dbgNsExt  Required. The debug namespace of the external caller.
 * @param       {string}  [argName] Optional. The variable name of the argument being validated.
 * @returns     {void}
 * @description Given an argument of unknown type, attempts to validate that the argument is a
 *              non-null object. Uses the debug namespace of the external caller as the base of
 *              the "source" string used by the thrown SfdxFalconError.
 * @public
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
export function throwOnNullInvalidObject(arg:unknown, dbgNsExt:string, argName?:string):void {
  if (isNullInvalidObject(arg)) {
    throw new SfdxFalconError( errMsgNullInvalidObject(arg, argName)
                             , `TypeError`
                             , `${dbgNsExt}`);
  }
}

// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    throwOnNullInvalidString
 * @param       {unknown} arg Required. The argument whose type will be validated.
 * @param       {string}  dbgNsExt  Required. The debug namespace of the external caller.
 * @param       {string}  [argName] Optional. The variable name of the argument being validated.
 * @returns     {void}
 * @description Given an argument of unknown type, attempts to validate that the argument is a
 *              non-null string. Uses the debug namespace of the external caller as the base of
 *              the "source" string used by the thrown SfdxFalconError.
 * @public
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
export function throwOnNullInvalidString(arg:unknown, dbgNsExt:string, argName?:string):void {
  if (isNullInvalidString(arg)) {
    throw new SfdxFalconError( errMsgNullInvalidString(arg, argName)
                             , `TypeError`
                             , `${dbgNsExt}`);
  }
}

// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    throwOnNonReadablePath
 * @param       {string}  path  Required. Path that will be checked for readability.
 * @param       {string}  dbgNsExt  Required. The debug namespace of the external caller.
 * @param       {string}  [argName] Optional. The variable name of the argument being validated.
 * @returns     {void}
 * @description Given a string containing a filesystem path, attempts to validate that the path is
 *              readable by the running user. Uses the debug namespace of the external caller as the
 *              base of the "source" string used by the thrown SfdxFalconError.
 * @public
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
export function throwOnNonReadablePath(path:string, dbgNsExt:string, argName?:string):void {
  if (isNotReadablePath(path))  {
    throw new SfdxFalconError( errMsgNonReadablePath(path, argName)
                             , `PathError`
                             , `${dbgNsExt}`);
  }
}

// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    validateTheValidator
 * @returns     {void}
 * @description Ensures that the three expected arguments (unknown[], string, and string[]) were
 *              provided to a "validator" function. Who watches the watchers? The same one who
 *              validates the validators! :-)
 * @public
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
export function validateTheValidator():void {

  // Debug incoming arguments.
  SfdxFalconDebug.obj(`${dbgNs}validateTheValidator:arguments:`, arguments);

  // Validate "args". Throw on null or invalid Array.
  throwOnNullInvalidArray(arguments[0], dbgNs, 'args');
  
  // Validate "dbgNsExt". Throw on null, invalid, or empty String.
  throwOnEmptyNullInvalidString(arguments[1], dbgNs, 'dbgNsExt');

  // Validate "argNames". Throw on null or invalid Array.
  throwOnNullInvalidArray(arguments[2], dbgNs, 'argNames');
}
