//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @file          modules/sfdx-falcon-recipe/string-substitution-map.ts
 * @copyright     Vivek M. Chawla - 2018
 * @author        Vivek M. Chawla <@VivekMChawla>
 * @version       1.0.0
 * @license       MIT
 * @requires      module:???
 * @summary       ???
 * @description   ???
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
/*
const falconSubstitutionMap = new Map<string, any>([
  ['uuid',          generateUuid],
  ['companyName',   fetchCompanyName],
  ['recipeName',    fetchRecipeName],
  ['recipeVersion', fetchRecipeVersion],
  ['schemaVersion', fetchSchemaVersion]
]);//*/

//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @class       StringSubstitution
 * @summary     ???
 * @description ???
 * @version     1.0.0
 * @public
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
export class StringSubstitution {
  /*
  // @ts-ignore - Temporary exclusion while this module is under development
  private substitutionMap:Map<string, any>    = new Map<string, any>();
  // @ts-ignore - Temporary exclusion while this module is under development
  private ignoreInvalidKeys:boolean           = false;
  // @ts-ignore - Temporary exclusion while this module is under development
  private openingTag:string                   = '<@';
  // @ts-ignore - Temporary exclusion while this module is under development
  private closingTag:string                   = '@>';
  //*/

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @constructs  StringSubstitutionMap
   * @description ???
   * @version     1.0.0
   * @public
   */
  //───────────────────────────────────────────────────────────────────────────┘
  /*
  public constructor (substitutionMap:Map<string,any>=falconSubstitutionMap, userOptions:any={}) {
    this.substitutionMap = substitutionMap;
    let defaultOptions = {
      ignoreInvalidKeys:  false,
      openingTag:         '<@',
      closingTag:         '@>'
    }
    let resolvedOptions = {
      ...defaultOptions,
      ...userOptions
    }
    this.ignoreInvalidKeys  = resolvedOptions.ignoreInvalidKeys;
    this.openingTag         = resolvedOptions.openingTag;
    this.closingTag         = resolvedOptions.closingTag;
  }//*/

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      replaceStrings
   * @param       ???
   * @description ???
   * @version     1.0.0
   * @public
   */
  //───────────────────────────────────────────────────────────────────────────┘
  /*
  public replaceStrings(contentBody:string):string {
    return 'NOT_IMPLEMENTED';
  }//*/

}
//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    ???
 * @param       ???
 * @returns     {string}  ???
 * @description ???
 * @version     1.0.0
 * @private @async
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
/*
function generateUuid():string {
  return 'NOT_IMPLEMENTED';
}//*/

//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    ???
 * @returns     {string}  ???
 * @description ???
 * @version     1.0.0
 * @private @async
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
/*
function fetchCompanyName():string {
  return 'NOT_IMPLEMENTED';
}//*/

//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    ???
 * @returns     {string}  ???
 * @description ???
 * @version     1.0.0
 * @private @async
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
/*
function fetchRecipeName():string {
  return 'NOT_IMPLEMENTED';
}//*/

//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    ???
 * @returns     {string}  ???
 * @description ???
 * @version     1.0.0
 * @private @async
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
/*
function fetchRecipeVersion():string {
  return 'NOT_IMPLEMENTED';
}//*/


//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    ???
 * @returns     {string}  ???
 * @description ???
 * @version     1.0.0
 * @private @async
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
/*
function fetchSchemaVersion():string {
  return 'NOT_IMPLEMENTED';
}//*/
