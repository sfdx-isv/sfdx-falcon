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
import {Connection}           from  '@salesforce/core';         // Why?
import {AnyJson}              from  '@salesforce/ts-types';     // Why?
import * as inquirer          from  'inquirer';                 // Why?
import {QueryResult}          from  'jsforce';                  // Why?
//import {Query}                from  'jsforce';                  // Why?
//import {Record}               from  'jsforce';                  // Why?
import {RequestInfo}          from  'jsforce';                  // Why?
import {Observable}           from  'rxjs';                     // Why?
import {Observer}             from  'rxjs';                     // Why?
import {Subscriber}           from  'rxjs';                     // Why?
import {Questions}            from  'yeoman-generator';         // Interface. Represents an array of Inquirer "question" objects.
import {Question}             from  'yeoman-generator';         // Interface. Represents an array of Inquirer "question" objects.

// Import Internal Modules/Types
import {SfdxFalconResult}     from  '../sfdx-falcon-result';    // Class. Implements a framework for creating results-driven, informational objects with a concept of heredity (child results) and the ability to "bubble up" both Errors (thrown exceptions) and application-defined "failures".
import {SfdxOrgInfo}          from  '../sfdx-falcon-util/sfdx'; // Class. Stores information about orgs that are connected to the local Salesforce CLI.
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

/**
 * Represents the status code and JSON result that is sent to the caller when SFDX-Falcon CLI Commands are run.
 */
export interface SfdxFalconJsonResponse {
  falconStatus: number;
  falconResult: AnyJson;
}


// ────────────────────────────────────────────────────────────────────────────────────────────────┐
// Falcon and SFDX Config-related interfaces and types.
// ────────────────────────────────────────────────────────────────────────────────────────────────┘

/**
 * Interface. Represents the SFDX-Falcon specific part of a project's sfdx-project.json config file.
 */
export interface SfdxFalconProjectConfig {
  developerAlias?:  string;                   // eg. 'univ-ctrs'
  developerName?:   string;                   // eg. 'Universal Containers'
  projectAlias?:    string;                   // eg. 'my-sfdx-falcon-project'
  projectName?:     string;                   // eg. 'My SFDX Falcon Project'
  projectFamily?:   string;                   // 'ADK' | 'APK'
  projectType?:     string;                   // '1GP:managed' | '1GP:unmanaged' | '2GP:managed' | '2GP:unlocked' | 'single-demo' | 'multi-demo'
  defaultRecipe?:   string;                   // eg. 'demo-recipe-1.json'
  gitRemoteUri?:    string;                   // eg. 'https://github.com/my-org/my-sfdx-falcon-project.git'
  gitHubUrl?:       string;                   // eg. 'https://github.com/my-org/my-sfdx-falcon-project'
  projectVersion?:  string;                   // eg. '1.5.1'
  schemaVersion?:   string;                   // eg. '1.0.0'
  pluginVersion?:   string;                   // eg. '1.0.0'
  appxPackage?:     AppxPackageProjectConfig;
  appxDemo?:        AppxDemoProjectConfig;
}

/**
 * Interface. Represents the special, hidden "local config" file for an SFDX-Falcon project.
 */
export interface SfdxFalconLocalConfig {
  devHubAlias?:    string;                   // eg. 'My_DevHub'
  envHubAlias?:   string;                   // eg. 'My_EnvHub'
  pkgOrgAlias?:   string;                   // eg. 'My_PkgOrg'
  appxPackage?:   AppxPackageLocalConfig;
  appxDemo?:      AppxDemoLocalConfig;
}

/**
 * Interface. Represents a "global" SFDX-Falcon configuration data structure. Not yet implmented.
 */
export interface SfdxFalconGlobalConfig {
  propertiesTBD?: any;                       // tslint:disable-line: no-any
}

/**
 * Interface. Represents the portion of an SFDX-Falcon Project Config that is specific to ADK projects.
 */
export interface AppxDemoProjectConfig {
  demoRecipes:      string[];               // eg. ['demo-recipe-1.json', 'demo-recipe-2.json']
  partnerAlias:     string;                 // eg. 'appy-inc'
  partnerName:      string;                 // eg. 'Appy Apps, Incorporated'
}

/**
 * Interface. Represents the portion of the hidden SFDX-Falcon "local config" that is specific to ADK projects.
 */
export interface AppxDemoLocalConfig {
  propertiesTBD: any;                       // tslint:disable-line: no-any
}

/**
 * Interface. Represents the portion of an SFDX-Falcon Project Config that is specific to APK projects.
 */
export interface AppxPackageProjectConfig {
  developerRecipes:   string[];             // eg. ['developer-recipe-1.json', 'developer-recipe-2.json']
  namespacePrefix:    string;               // eg. 'my_ns_prefix'
  packageName:        string;               // eg. 'My Package Name'
  metadataPackageId:  string;               // eg. '033000000000000'
  packageVersionId: {
    stable: string;                         // eg. '04t111111111111'
    beta:   string;                         // eg. '04t222222222222'
  };
}

/**
 * Interface. Represents the portion of the hidden SFDX-Falcon "local config" that is specific to APK projects.
 */
export interface AppxPackageLocalConfig {
  propertiesTBD: any;                       // tslint:disable-line: no-any
}

/**
 * Interface. Represents the options that can be set when calling SfdxFalconProject.resolve().
 */
export interface ProjectResolutionOptions {
  resolveProjectConfig?: boolean;
  resolveLocalConfig?:   boolean;
  resolveGlobalConfig?:  boolean;
}


// ────────────────────────────────────────────────────────────────────────────────────────────────┐
// Packaging-related types.
// ────────────────────────────────────────────────────────────────────────────────────────────────┘


/**
 * Interface. Represents a Metadata Package (033). Can be managed or unmanaged.
 */
export interface MetadataPackage {
  Id:                       string;
  Name:                     string;
  NamespacePrefix:          string;
  MetadataPackageVersions:  MetadataPackageVersion[];
}

/**
 * Interface. Represents a Metadata Package Version (04t).
 */
export interface MetadataPackageVersion {
  Id:                 string;
  Name:               string;
  MetadataPackageId:  string;
  MajorVersion:       number;
  MinorVersion:       number;
  PatchVersion:       number;
  BuildNumber:        number;
  ReleaseState:       string;
}


// ────────────────────────────────────────────────────────────────────────────────────────────────┐
// Listr related interfaces and types.
// ────────────────────────────────────────────────────────────────────────────────────────────────┘

/**
 * Interface. Represents a "runnable" Listr object (ie. an object that has the run() method attached).
 */
export interface ListrObject extends Object {
  run():Promise<any>; // tslint:disable-line: no-any
}

/**
 * Interface. Represents a Listr Task object that can be executed by a Listr Task Runner.
 */
export interface ListrTask {
  title:    string;
  task:     ListrTaskFunction;
  skip?:    boolean|ListrSkipFunction|ListrSkipCommand;
  enabled?: boolean|ListrEnabledFunction;
}

/**
 * Represents an "enabled" function for use in a Listr Task.
 */
export type ListrEnabledFunction =
  (context?:any)=> boolean; // tslint:disable-line: no-any

/**
 * Type. Represents a "skip" function for use in a Listr Task.
 */
export type ListrSkipFunction =
  (context?:any) => boolean|string|Promise<boolean|string>;  // tslint:disable-line: no-any

/**
 * Type. A built-in function of the "this task" Listr Task object that gets passed into executable task code.
 */
export type ListrSkipCommand =
  (message?:string) => void;

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
  sharedData?:  object;
}

/**
 * Represents the Listr "Context" that's passed to various functions set up inside Listr Tasks.
 */
export type ListrContext = any; // tslint:disable-line: no-any

/**
 * Interface. Represents the Listr Context variables used by the "finalizeGit" task collection.
 */
export interface ListrContextFinalizeGit {
  gitInstalled:           boolean;
  gitInitialized:         boolean;
  projectFilesStaged:     boolean;
  projectFilesCommitted:  boolean;
  gitRemoteIsValid:       boolean;
  gitRemoteAdded:         boolean;
}

/**
 * Interface. Represents the Listr Context variables used by the "Package Retrieve/Extract/Convert" task collection.
 */
export interface ListrContextPkgRetExCon {
  packagesRetrieved:  boolean;
  sourceExtracted:    boolean;
  sourceConverted:    boolean;
}

/**
 * Represents an Observable for use with Listr.
 */
export type ListrObservable = any;  // tslint:disable-line: no-any

/**
 * Type. Alias to an rxjs Observer<any> type.
 */
export type Observer = Observer<any>;  // tslint:disable-line: no-any


/**
 * Type. Alias to an rxjs Subscriber<any> type.
 */
export type Subscriber = Subscriber<any>; // tslint:disable-line: no-any


// ────────────────────────────────────────────────────────────────────────────────────────────────┐
// Yeoman/Inquirer/SfdxFalconInterview/SfdxFalconPrompt related interfaces and types.
// ────────────────────────────────────────────────────────────────────────────────────────────────┘


export type InquirerChoice    = inquirer.objects.Choice;
export type InquirerChoices   = inquirer.objects.Choices;
export type InquirerQuestion  = inquirer.Question;
export type InquirerQuestions = inquirer.Questions;
export type InquirerAnswers   = inquirer.Answers;

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
 * Type. Alias to a combination of Error or SfdxFalconResult.
 */
export type ErrorOrResult = Error | SfdxFalconResult;

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
  confirmationHeader?:  string;                       // Optional. Text to be shown above the Interview's Confirmation Question.
  invertConfirmation?:  boolean;                      // Optional. Inverts the relevant Confirmation Answers before considering their value.
  display?:             AnswersDisplay<T>;            // Optional. Async function that returns void if the function renders something, or an array of Falcon Data Table rows if not.
  displayHeader?:       string;                       // Optional. Text to be shown above the Display Table.
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
  title?:               string;
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
// Salesforce DX / JSForce related types.
// ────────────────────────────────────────────────────────────────────────────────────────────────┘


/**
 * Type. Represents either an Org Alias or a JSForce Connection.
 */
export type AliasOrConnection = string | Connection;

/**
 * Interface. Represents a resolved (active) JSForce connection to a Salesforce Org.
 */
export interface ResolvedConnection {
  connection:       Connection;
  orgIdentifier:    string;
}

/**
 * Interface. Represents information needed to make a REST API request via a JSForce connection.
 */
export interface RestApiRequestDefinition {
  aliasOrConnection:  string|Connection;
  request:            RequestInfo;
  options?:           {any};
}

/**
 * Type. Alias to a Map with string keys and MetadataPackageVersion values.
 */
export type PackageVersionMap = Map<string, MetadataPackageVersion[]>;

/**
 * Type. Alias to the JSForce definition of QueryResult.
 */
export type QueryResult<T> = QueryResult<T>;

/**
 * Interface. Represents the data returned by the sfdx force:org:list command.
 */
export interface RawSfdxOrgInfo {
  alias:                    string;                       // Why?
  username:                 string;                       // Why?
  orgId:                    string;                       // Why?
  connectedStatus:          string;                       // Why?
  isDevHub:                 boolean;                      // Why?
}

/**
 * Type. Alias for a Map with string keys holding SfdxOrgInfo values.
 */
export type SfdxOrgInfoMap = Map<string, SfdxOrgInfo>;

/**
 * Interface. Represents the subset of Org Information that's relevant to SFDX-Falcon logic.
 */
export interface SfdxOrgInfoSetup {
  alias:                    string;                       // Why?
  username:                 string;                       // Why?
  orgId:                    string;                       // Why?
  connectedStatus:          string;                       // Why?
  isDevHub:                 boolean;                      // Why?
  metadataPackageResults?:  QueryResult<MetadataPackage>; // Why?
}

/**
 * Enum. Represents the various CLI log level flag values.
 */
export enum SfdxCliLogLevel {
  TRACE = 'trace',
  DEBUG = 'debug',
  INFO  = 'info',
  WARN  = 'warn',
  ERROR = 'error',
  FATAL = 'fatal'
}

/**
 * Interface. Represents the result of a call to shell.execL().
 */
export interface ShellExecResult {
  code?:     number;
  stdout?:   string;
  stderr?:   string;
  message?:  string;
  resolve?:  boolean;
}

/**
 * Interface. Represents the REST response provided for an Object Describe.
 */
export interface ObjectDescribe {
  activateable?:        boolean;
  createable?:          boolean;
  custom?:              boolean;
  customSetting?:       boolean;
  deletable?:           boolean;
  deprecatedAndHidden?: boolean;
  feedEnabled?:         boolean;
  hasSubtypes?:         boolean;
  isSubtype?:           boolean;
  keyPrefix?:           string;
  label?:               string;
  labelPlural?:         string;
  layoutable?:          boolean;
  mergeable?:           boolean;
  mruEnabled?:          boolean;
  name?:                string;
  queryable?:           boolean;
  replicateable?:       boolean;
  retrieveable?:        boolean;
  searchable?:          boolean;
  triggerable?:         boolean;
  undeletable?:         boolean;
  updateable?:          boolean;
  urls?:                any;      // tslint:disable-line: no-any
}


// ────────────────────────────────────────────────────────────────────────────────────────────────┐
// SObject related types.
// ────────────────────────────────────────────────────────────────────────────────────────────────┘


/**
 * Interface. Represents a baseline SObject.
 */
export interface SObject {
  id?:    string;
  name?:  string;
}

/**
 * Interface. Represents the Salesforce Profile SObject.
 */
export type Profile = SObject;

/**
 * Interface. Represents the Salesforce PermissionSetAssignment SObject.
 */
export interface PermissionSetAssignment extends SObject {
  PermissionSetId:  string;
  AssigneeId:       string;
}

/**
 * Interface. Represents the Salesforce User SObject.
 */
export interface User extends SObject {
  username?: string;
}

/**
 * Type. Alias for an array of objects that may have "Id" and "Name" properties.
 */
export type SObjectFindResult = Array<{Id?: string; Name?: string; }>;
