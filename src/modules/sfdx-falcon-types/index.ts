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
import {AnyJson}              from  '@salesforce/ts-types';
import * as inquirer          from  'inquirer';
import {Observable}           from  'rxjs';

// Import Internal Modules/Types
import {Questions}            from  'yeoman-generator';         // Interface. Represents an array of Inquirer "question" objects.
import {Question}             from  'yeoman-generator';         // Interface. Represents an array of Inquirer "question" objects.
import {SfdxFalconTableData}  from  '../sfdx-falcon-util/ux';   // Interface. Represents and array of SfdxFalconKeyValueTableDataRow objects.

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

// ────────────────────────────────────────────────────────────────────────────────────────────────┐
// Listr related interfaces and types.
// ────────────────────────────────────────────────────────────────────────────────────────────────┘

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
export type ListrContext = any; // tslint:disable-line: no-any
/**
 * Represents an Observable for use with Listr.
 */
export type ListrObservable = any;  // tslint:disable-line: no-any

// ────────────────────────────────────────────────────────────────────────────────────────────────┐
// Yeoman/Inquirer/SfdxFalconInterview/SfdxFalconPrompt related interfaces and types.
// ────────────────────────────────────────────────────────────────────────────────────────────────┘

/**
 * Represents an answer hash (basically AnyJson) for Yeoman/Inquirer.
 */
export interface YeomanAnswerHash {
  [key:string]: any;  // tslint:disable-line: no-any
}
/**
 * Represents a Yeoman/Inquirer choice object.
 */
export interface YeomanChoice {
  name:       string;
  value:      string;
  short:      string;
  type?:      string;
  line?:      string;
}
/**
 * Represents a "checkbox choice" in Yeoman/Inquirer.
 */
export interface YeomanCheckboxChoice extends YeomanChoice {
  key?:       string;
  checked?:   boolean;
  disabled?:  boolean|string|YeomanChoiceDisabledFunction;
}
/**
 * Represents the function signature for a "Disabled" function.
 */
export type YeomanChoiceDisabledFunction = (answers:any) => boolean|string; // tslint:disable-line: no-any
/**
 * Represents what an answers hash should look like during Yeoman/Inquirer interactions
 * where the user is being asked to proceed/retry/abort something.
 */
export interface ConfirmationAnswers {
  proceed:  boolean;
  restart:  boolean;
  abort:    boolean;
}
/**
 * Type. Defines a function that displays answers to a user.
 */
export type AnswersDisplay<T extends object> = (userAnswers?:T) => Promise<void | SfdxFalconTableData>;

/**
 * Interface. Represents the options that can be set by the SfdxFalconPrompt constructor.
 */
export interface PromptOptions<T extends object> {
  questions:            Questions | QuestionsBuilder;             // Required. Questions for the user.
  defaultAnswers:       T;                                        // Required. Default answers to the Questions.
  confirmation?:        Questions | QuestionsBuilder;             // Optional. Confirmation Questions.
  invertConfirmation?:  boolean;                                  // Optional. Treats
  display?:             AnswersDisplay<T>;                        // ???
  context?:             object;                                   // Optional. The scope of the caller who creates an SfdxFalconPrompt.
  data?:                object;                                   // Optional. ???
}

/**
 * Interface. Represents the options that can be set by the SfdxFalconInterview constructor.
 */
export interface InterviewOptions<T extends object> {
  defaultAnswers:       T;                            // Required. Default answers to the Questions.
  confirmation?:        Questions | QuestionsBuilder; // Optional. Confirmation Questions.
  invertConfirmation?:  boolean;                      // Optional. Inverts the relevant Confirmation Answers before considering their value.
  display?:             AnswersDisplay<T>;            // Optional. ???
  context?:             object;                       // Optional. ???
  sharedData?:          object;                       // Optional. ???
}

/**
 * Interface. Represents the options that can be set by the InterviewGroup constructor.
 */
export interface InterviewGroupOptions<T extends object> {
  questions:            Questions | QuestionsBuilder;
  confirmation?:        Questions | QuestionsBuilder;
  invertConfirmation?:  boolean;
  display?:             AnswersDisplay<T>;
  when?:                ShowInterviewGroup;
  abort?:               AbortInterview;
}
/**
 * Interface. Represents a set of status indicators for an SfdxFalconInterview.
 */
export interface InterviewStatus {
  aborted?:   boolean;
  completed?: boolean;
  reason?:    string;
}

/**
 * Type alias defining a function that checks whether an Interview should be aborted.
 */
export type AbortInterview = (groupAnswers:InquirerAnswers, userAnswers?:InquirerAnswers) => boolean | string;

/**
 * Type alias defining a function that can be used to determine boolean control-flow inside an Interview.
 */
export type InterviewControlFunction = (userAnswers:InquirerAnswers, sharedData?:object) => boolean | Promise<boolean>;

/**
 * Type alias defining a function or simple boolean that checks whether an Interview Group should be shown.
 */
export type ShowInterviewGroup = boolean | InterviewControlFunction;
/**
 * Function type alias defining a function that returns Inquirer Questions.
 */
export type QuestionsBuilder = () => Questions;
/**
 * Alias to the Questions type from yeoman-generator. This is the "official" type for SFDX-Falcon.
 */
export type Questions = Questions;
/**
 * Alias to the Question type from yeoman-generator. This is the "official" type for SFDX-Falcon.
 */
export type Question = Question;

// ────────────────────────────────────────────────────────────────────────────────────────────────┐
// Miscellaneous interfaces and types.
// ────────────────────────────────────────────────────────────────────────────────────────────────┘

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
