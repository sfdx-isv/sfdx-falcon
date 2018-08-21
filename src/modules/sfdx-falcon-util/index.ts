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
var noOp = 'Workaround so JSdoc sees the preceeding comment block as a file header';

// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    safeParse
 * @param       {any} contentToParse  Required. The content to be parsed.
 *                                      that will be parsed to create an SFDX Command String.
 * @returns     {object}  A JavaScript object based on the content to parse.
 * @description Given any content to parse, returns a JavaScript object based on that content. If
 *              the content is not parseable, it is returned as an object with one key: unparsed.
 * @version     1.0.0
 * @public
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
export function safeParse(contentToParse:any):object {
    try {
      return JSON.parse(contentToParse);
    } catch(e) {
      return {unparsed: `${contentToParse}`}
    }
}