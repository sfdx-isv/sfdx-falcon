//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @file          modules/sfdx-falcon-types/index.d.ts
 * @copyright     Vivek M. Chawla - 2018
 * @author        Vivek M. Chawla <@VivekMChawla>
 * @summary       Collection of interfaces and types used across SFDX-Falcon modules.
 * @description   Collection of interfaces and types used across SFDX-Falcon modules.
 * @version       1.0.0
 * @license       MIT
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
// Import External Modules/Types
import {AnyJson}      from  '@salesforce/ts-types';
import * as inquirer  from  'inquirer';
import {Observable}   from  'rx';

/**
 * Represents the local config options for an AppX Demo project.
 * TODO: Delete this interface if not used.
 */
/*
export interface AppxDemoLocalConfig {
  demoValidationOrgAlias: string;
  demoDeploymentOrgAlias: string;
  devHubAlias:            string;
  envHubAlias:            string;
}//*/
/**
 * Represents the configuration schema of an AppX Demo Project.
 */
/*
export interface AppxDemoProjectConfig {
  demoAlias:        string;
  demoConfig:       string;
  demoTitle:        string;
  demoType:         string;
  demoVersion:      string;
  gitHubUrl:        string;
  gitRemoteUri:     string;
  partnerAlias:     string;
  partnerName:      string;
  schemaVersion:    string;
}//*/
/**
 * Represents the sequence options for an AppX Demo project
 * TODO: Delete this if left unused.
 */
/*
export interface AppxDemoSequenceOptions {
  scratchDefJson:       string;
  rebuildValidationOrg: boolean;
  skipActions:          [string];
}//*/
/**
 * Represents local config settings for an APK (AppX Package) project
 * TODO: Delete this if left unused.
 */
/*
export interface AppxPackageLocalConfig {
  demoValidationOrgAlias: string;
  demoDeploymentOrgAlias: string;
  devHubAlias:            string;
  envHubAlias:            string;
}//*/
/**
 * TODO: Delete this if left unused.
 */
/*
export interface AppxPackageProjectConfig {
  gitHubUrl:          string;
  gitRemoteUri:       string;
  metadataPackageId:  string;
  namespacePrefix:    string;
  packageName:        string;
  packageVersionId: {
    stable: string;
    beta:   string;
  };
  partnerAlias:       string;
  partnerName:        string;
  projectAlias:       string;
  projectName:        string;
  projectType:        string;
  schemaVersion:      string;
}//*/
/**
 * TODO: Delete this if left unused
 */
/*
export interface AppxPackageSequenceOptions {
  scratchDefJson:    string;
}//*/
/**
 * TODO: Delete this if left unused
 */
/*
export interface FalconConfig {
  appxProject?:  AppxPackageProjectConfig;
  appxDemo?:     AppxDemoProjectConfig;
}//*/
/**
 * TODO: Delete this if left unused
 */
/*
export interface FalconCommandContext extends FalconSequenceContext {
  commandObserver:  any;  // tslint:disable-line: no-any
}//*/
/**
 * TODO: Delete this if left unused.
 */
/*
export interface FalconCommandHandler {
  changeMe: string;
}//*/
/**
 * Delete this if left unused.
 */
/*
export interface FalconCommandSequence {
  sequenceName:     string;
  sequenceType:     string;
  sequenceVersion:  string;
  description:      string;
  options:          any;  // tslint:disable-line: no-any
  sequenceGroups:   [FalconCommandSequenceGroup];
  handlers:         [FalconCommandHandler];
  schemaVersion:    string;
}//*/
/**
 * Delete this if left unused.
 */
/*
export interface FalconCommandSequenceGroup {
  groupId:        string;
  groupName:      string;
  description:    string;
  sequenceSteps:  FalconCommandSequenceStep[];
}//*/
/**
 * Delete this if left unused.
 */
/*
export interface FalconCommandSequenceStep {
  stepName:     string;
  description:  string;
  action:       string;
  options:      any;  // tslint:disable-line: no-any
  onSuccess?: {
    handler:  string;
  };
  onError?: {
    handler:  string;
  };
}//*/

export type InquirerChoice    = inquirer.objects.Choice;
export type InquirerChoices   = inquirer.objects.Choices;
export type InquirerQuestion  = inquirer.Question;
export type InquirerQuestions = inquirer.Questions;
export type InquirerAnswers   = inquirer.Answers;
/**
 * Represents the status code and JSON result that is sent to the caller when SFDX-Falcon CLI Commands are run.
 */
export interface SfdxFalconJsonResponse {
  falconStatus: number;
  falconResult: AnyJson;
}
/**
 * Delete this if left unused.
 */
/*
export interface FalconSequenceContext {
  devHubAlias:        string;
  targetOrgAlias:     string;
  targetIsScratchOrg: boolean;
  projectPath:        string;
  configPath:         string;
  mdapiSourcePath:    string;
  dataPath:           string;
  logLevel:           'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';
  sequenceObserver:   any;  // tslint:disable-line: no-any
}//*/
/**
 * Represents a Listr Task object that can be executed by a Listr Task Runner.
 */
export interface ListrTask {
  title:    string;
  task:     ListrTaskFunction;
  skip?:    boolean|ListrSkipFunction;
  enabled?: boolean|ListrEnabledFunction;
}
/**
 * Represents an "enabled" function for use in a Listr Task.
 */
export type ListrEnabledFunction =
  (context?:any)=> boolean; // tslint:disable-line: no-any
/**
 * Represents a "skip" function for use in a Listr Task.
 */
export type ListrSkipFunction =
  (context?:any) => boolean|string|Promise<boolean|string>;  // tslint:disable-line: no-any
/**
 * Represents a "task" function for use in a Listr Task.
 */
export type ListrTaskFunction =
  (context?:ListrContext, task?:ListrTask) => void|Promise<void>|Observable<any>; // tslint:disable-line: no-any
/**
 * Represents the set of "execution options" related to the use of Listr.
 */
export interface ListrExecutionOptions {
  listrContext: any;  // tslint:disable-line: no-any
  listrTask:    any;  // tslint:disable-line: no-any
  observer:     any;  // tslint:disable-line: no-any
}
/**
 * Represents the Listr "Context" that's passed to various functions set up inside Listr Tasks.
 */
export type ListrContext    = any;  // tslint:disable-line: no-any
/**
 * Represents an Observable for use with Listr.
 */
export type ListrObservable = any;  // tslint:disable-line: no-any
/**
 * Enum that stores the various CLI log level flag values.
 */
export enum SfdxCliLogLevel {
  TRACE = 'trace',
  DEBUG = 'debug',
  INFO  = 'info',
  WARN  = 'warn',
  ERROR = 'error',
  FATAL = 'fatal'
}
