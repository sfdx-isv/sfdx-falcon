//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @file          modules/sfdx-falcon-util/listr.ts
 * @copyright     Vivek M. Chawla / Salesforce - 2019
 * @author        Vivek M. Chawla <@VivekMChawla>
 * @summary       Utility Module. Exposes functionality specific to the Listr task runner.
 * @description   Utility functions related to the Listr task runner. Does not contain any Tasks
 *                or Task Bundles.  For those, see ???.
 * @version       1.0.0
 * @license       MIT
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
// Import Internal Classes & Functions
import {SfdxFalconDebug}  from  '../sfdx-falcon-debug';   // Class. Specialized debug provider for SFDX-Falcon code.

// Import Internal Types
import {ClassConstructor} from  '../sfdx-falcon-types';        // Interface. Represents the request body required to create a Bulk API 2.0 job.

// Requires
const falconUpdateRenderer  = require('falcon-listr-update-renderer');  // Custom renderer for Listr

// Set the File Local Debug Namespace
const dbgNs = 'UTILITY:listr:';
SfdxFalconDebug.msg(`${dbgNs}`, `Debugging initialized for ${dbgNs}`);


// ────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    chooseListrRenderer
 * @returns     {ClassConstructor|string} Constructor for a custom Listr Renderer or a string
 *              designating one of the default renderers.
 * @description Returns either a custom Listr Renderer or a string designating the default "verbose"
 *              renderer depending on whether or not the user specified any Debug Namespaces when
 *              the currently running command was initiated.
 * @public
 */
// ────────────────────────────────────────────────────────────────────────────────────────────────┘
export function chooseListrRenderer():ClassConstructor|string {
  if (SfdxFalconDebug.enabledDebugNamespaceCount === 0) {
    return falconUpdateRenderer;
  }
  else {
    return 'verbose';
  }
}
