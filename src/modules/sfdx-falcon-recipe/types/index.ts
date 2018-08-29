//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @file          modules/sfdx-falcon-recipe/types/index.ts
 * @copyright     Vivek M. Chawla - 2018
 * @author        Vivek M. Chawla <@VivekMChawla>
 * @version       1.0.0
 * @license       MIT
 * @summary       Types and classes relevant throughout the SFDX-Falcon Recipe Module
 * @description   Types and classes relevant throughout the SFDX-Falcon Recipe Module
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
var noOp = 'Workaround so JSDoc does sees the file header (above) as different from the first item';


//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @interface   ExecutorMessages
 * @description Represents the standard messages that most Executors use for Observer notifications.
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
export interface ExecutorMessages {
  progressMsg:  string;
  errorMsg:     string;
  successMsg:   string;
}
//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @enum        RecipeType
 * @description Describes the types of SFDX-Falcon Recipes (well, technically the Recipe Engines).
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
export enum RecipeType {
  APPX_DEMO     = 'appx:demo-recipe',
  APPX_PACKAGE  = 'appx:package-recipe'
}
//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @enum        SfdxFalconActionType
 * @description Describes the types of SFDX-Falcon Recipe Actions.
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
export enum SfdxFalconActionType {
  SFDX_CLI      = 'sfdx-cli',
  SFDC_API      = 'salesforce-api',
  SHELL_COMMAND = 'shell-command',
  PLUGIN        = 'plugin',
  UNSPECIFIED   = 'unspecified'
}
//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @interface   TargetOrg
 * @description Represents an org that will be the target of one or more CLI/JSForce operations.
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
export interface TargetOrg {
  orgName:        string;
  alias:          string;
  description:    string;
  isScratchOrg:   boolean;
  scratchDefJson: string;
  orgReqsJson:    string;
}



//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @class       ????
 * @description ????
 * @version     1.0.0
 * @public
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘


//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @class       ????
 * @description ????
 * @version     1.0.0
 * @public
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
