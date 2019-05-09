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
// Import External Modules/Types
import {JsonMap} from  '@salesforce/ts-types';     // Why?

/**
 * Type. Alias to JsonMap.
 */
export type ApexEngineStepOptions = JsonMap;

/**
 * Type. Alias to JsonMap.
 */
export type ActionOptions = JsonMap;

/**
 * Type. Alias to JsonMap.
 */
export type CompileOptions = JsonMap;

/**
 * Type. Alias to JsonMap.
 */
export type ExecutionOptions = JsonMap;

/**
 * Interface. Represents the standard messages that most Executors use for Observer notifications.
 */
export interface ExecutorMessages {
  progressMsg:  string;
  errorMsg:     string;
  successMsg:   string;
}

/**
 * Enum. Describes the types of SFDX-Falcon Recipes (well, technically the Recipe Engines).
 */
export enum RecipeType {
  APPX_DEMO     = 'appx:demo-recipe',
  APPX_PACKAGE  = 'appx:package-recipe'
}

/**
 * Enum. Describes the types of SFDX-Falcon Recipe Actions.
 */
export enum SfdxFalconActionType {
  SFDX_CLI      = 'sfdx-cli',
  SFDC_API      = 'salesforce-api',
  SHELL_COMMAND = 'shell-command',
  PLUGIN        = 'plugin',
  UNSPECIFIED   = 'unspecified'
}

/**
 * Interface. Represents an org that will be the target of one or more CLI/JSForce operations.
 */
export interface TargetOrg {
  orgName:        string;
  alias:          string;
  description:    string;
  isScratchOrg:   boolean;
  scratchDefJson: string;
  orgReqsJson:    string;
}
