//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @file          modules/sfdx-falcon-types/index.ts
 * @copyright     Vivek M. Chawla / Salesforce - 2019
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
import {JsonMap}              from  '@salesforce/ts-types';     // Why?
import {Observable}           from  'rxjs';                     // Why?
import {Observer}             from  'rxjs';                     // Why?
import {Subscriber}           from  'rxjs';                     // Why?
import {Questions}            from  'yeoman-generator';         // Interface. Represents an array of Inquirer "question" objects.
import {Question}             from  'yeoman-generator';         // Interface. Represents an array of Inquirer "question" objects.

// Import Internal Modules/Types
import {SfdxFalconResult}     from  '../sfdx-falcon-result';    // Class. Implements a framework for creating results-driven, informational objects with a concept of heredity (child results) and the ability to "bubble up" both Errors (thrown exceptions) and application-defined "failures".
import {StandardOrgInfo}      from  '../sfdx-falcon-util/sfdx'; // Class. Stores information about a standard (ie. non-scratch) org that is connected to the local Salesforce CLI.
import {ScratchOrgInfo}       from  '../sfdx-falcon-util/sfdx'; // Class. Stores information about a scratch orgs that is connected to the local Salesforce CLI.
import {SfdxFalconTableData}  from  '../sfdx-falcon-util/ux';   // Interface. Represents and array of SfdxFalconKeyValueTableDataRow objects.

//
//
//
//
//─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
// Fundamental Types
//─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
//
//
//
//

/**
 * Type. Represents the constructor for a Class, ie. something that can be the right operand of the instanceof operator.
 */
export type ClassConstructor = any;  // tslint:disable-line: no-any

/**
 * Interface. Allows for specification of a message string and chalk-specific styling information.
 */
export interface StyledMessage extends JsonMap {
  /** Required. The text of the desired message. */
  message:  string;
  /** Required. Chalk styles to be applied to the message. Uses the "tagged template literal" format. */
  styling:  string;
}

/**
 * Interface. Represents options that determine how a generic interval operates.
 */
export interface IntervalOptions extends JsonMap {
  /** The initial interval, in seconds. */
  initial?:     number;
  /** The amount to increment the interval by, in seconds, each time it completes. */
  incrementBy?: number;
  /** The maximum value, in seconds, that the interval can grow to. */
  maximum?:     number;
  /** The number of seconds before the interval-based operation times-out */
  timeout?:     number;
}

/**
 * Type. Represents an SObject Record ID.
 */
export type SObjectRecordId = string;

/**
 * Enum. Represents a generic set of commonly used Status values.
 */
export enum Status {
  NOT_STARTED = 'NOT_STARTED',
  WAITING     = 'WAITING',
  WORKING     = 'WORKING',
  COMPLETE    = 'COMPLETE',
  PENDING     = 'PENDING',
  SKIPPED     = 'SKIPPED',
  FAILED      = 'FAILED'
}

/**
 * Interface. Represents a "state aware" message. Contains a title, a message, and a type.
 */
export interface StatusMessage extends JsonMap {
  /** Required. The title of the status message. */
  title:    string;
  /** Required. The text of the status message. */
  message:  string;
  /** Required. The type of the status message. */
  type:     StatusMessageType;
}

/**
 * Enum. Represents the various types/states of a Status Message.
 */
export enum StatusMessageType {
  ERROR   = 'error',
  INFO    = 'info',
  SUCCESS = 'success',
  WARNING = 'warning',
  FATAL   = 'fatal'
}

//
//
//
//
//─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
// Metadata API Types
//─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
//
//
//
//

/**
 * Interface. Modeled on the MDAPI Object `CodeCoverageResult`. May be part of the results returned by `force:mdapi:deploy` or `force:apex:test:report`.
 *
 * Contains information about whether or not the compile of the specified Apex and run of the unit tests was successful. Child of the `RunTestsResult`.
 *
 * Reference: https://developer.salesforce.com/docs/atlas.en-us.api_meta.meta/api_meta/meta_retrieveresult.htm
 */
export interface CodeCoverageResult extends JsonMap {
  /** For each class or trigger tested, for each portion of code tested, this property contains the DML statement locations, the number of times the code was executed, and the total cumulative time spent in these calls. This can be helpful for performance monitoring. */
  dmlInfo?:             CodeLocation[];
  /** The ID of the CodeLocation. The ID is unique within an organization. */
  id?:                  string;
  /** For each class or trigger tested, if any code is not covered, the line and column of the code not tested, and the number of times the code was executed. */
  locationsNotCovered?: CodeLocation[];
  /** For each class or trigger tested, the method invocation locations, the number of times the code was executed, and the total cumulative time spent in these calls. This can be helpful for performance monitoring. */
  methodInfo?:          CodeLocation[];
  /** The name of the class or trigger covered. */
  name?:                string;
  /** The namespace that contained the unit tests, if one is specified. */
  namespace?:           string;
  /** The total number of code locations. */
  numLocations?:        number;
  /** For each class or trigger tested, the location of SOQL statements in the code, the number of times this code was executed, and the total cumulative time spent in these calls. This can be helpful for performance monitoring. */
  soqlInfo?:            CodeLocation[];
  /** Do not use. In early, unsupported releases, used to specify class or package. */
  type?:                string;
}

/**
 * Interface. Modeled on the MDAPI Object `CodeCoverageWarning`. May be part of the results returned by `force:mdapi:deploy`.
 *
 * Contains information about the Apex class which generated warnings. Child of the `RunTestsResult` object.
 *
 * Reference: https://developer.salesforce.com/docs/atlas.en-us.api_meta.meta/api_meta/meta_deployresult.htm
 */
export interface CodeCoverageWarning extends JsonMap {
  /** The ID of the CodeLocation. The ID is unique within an organization. */
  id?:        string;
  /** The message of the warning generated. */
  message?:   string;
  /** The namespace that contained the unit tests, if one is specified. */
  name?:      string;
  /** The namespace that contained the unit tests, if one is specified. */
  namespace?: string;
}

/**
 * Interface. Modeled on the MDAPI Object `CodeLocation`. May be part of the results returned by `force:mdapi:deploy`.
 *
 * Child of the `RunTestsResult` object.
 *
 * Reference: https://developer.salesforce.com/docs/atlas.en-us.api_meta.meta/api_meta/meta_deployresult.htm
 */
export interface CodeLocation extends JsonMap {
  /** The column location of the Apex tested. */
  column?:        number;
  /** The line location of the Apex tested. */
  line?:          number;
  /** The number of times the Apex was executed in the test run. */
  numExecutions?: number;
  /** The total cumulative time spent at this location. This can be helpful for performance monitoring. */
  time?:          number;
}

/**
 * Interface. Modeled on the MDAPI Object `DeployDetails`. May be part of the results returned by `force:mdapi:deploy`.
 *
 * While a deployment is still in-progress, the `DeployDetails` object only contains `componentFailures` data. After the deployment process finishes, the other fields populate with the data for the entire deployment.
 *
 * Reference: https://developer.salesforce.com/docs/atlas.en-us.api_meta.meta/api_meta/meta_deployresult.htm
 */
export interface DeployDetails extends JsonMap {
  /** One or more DeployMessage objects containing deployment errors for each component. */
  componentFailures?:   DeployMessage[];
  /** One or more DeployMessage objects containing successful deployment details for each component. */
  componentSuccesses?:  DeployMessage[];
  /** If the performRetrieve parameter was specified for the deploy() call, a retrieve() call is performed immediately after the deploy() process completes. This field contains the results of that retrieval. */
  retrieveResult?:      RetrieveResult;
  /** If tests were run for the deploy() call, this field contains the test results. While a deployment is still in-progress, this field only contains error data. After the deployment process finishes, this field populates with the data for the entire deployment. */
  runTestResult?:       RunTestsResult;
}

/**
 * Interface. Modeled on the MDAPI object `DeployMessage`. May be part of the results returned by `force:mdapi:deploy`.
 *
 * Contains information about the deployment success or failure of a component in the deployment .zip file. `DeployResult` objects contain one or more `DeployMessage` objects.
 *
 * Reference: https://developer.salesforce.com/docs/atlas.en-us.api_meta.meta/api_meta/meta_deployresult.htm
 */
export interface DeployMessage extends JsonMap {
  /** If true, the component was changed as a result of this deployment. If false, the deployed component was the same as the corresponding component already in the organization. */
  changed?:       boolean;
  /** Each component is represented by a text file. If an error occurred during deployment, this field represents the column of the text file where the error occurred. */
  columnNumber?:  number;
  /** The metadata type of the component in this deployment. */
  componentType?: string;
  /** If true, the component was created as a result of this deployment. If false, the component was either deleted or modified as a result of the deployment. */
  created?:       boolean;
  /** The date and time when the component was created as a result of this deployment. */
  createdDate?:   string;
  /** If true, the component was deleted as a result of this deployment. If false, the component was either new or modified as result of the deployment. */
  deleted?:       boolean;
  /** The name of the file in the .zip file used to deploy this component. */
  fileName?:      string;
  /** The full name of the component. */
  fullName?:      string;
  /** ID of the component being deployed. */
  id?:            string;
  /** Each component is represented by a text file. If an error occurred during deployment, this field represents the line number of the text file where the error occurred. */
  lineNumber?:    number;
  /** If an error or warning occurred, this field contains a description of the problem that caused the compile to fail. */
  problem?:       string;
  /** Indicates the problem type. The problem details are tracked in the problem field. The valid values are: */
  problemType?:   'Warning'|'Error';
  /** Indicates whether the component was successfully deployed (true) or not (false). */
  success?:       boolean;
}

/**
 * Interface. Modeled on the MDAPI Object `DeployResult`. Returned by a call to `force:mdapi:deploy`.
 *
 * Contains information about the success or failure of the associated `force:mdapi:deploy` call.
 *
 * Reference: https://developer.salesforce.com/docs/atlas.en-us.api_meta.meta/api_meta/meta_deployresult.htm
 */
export interface DeployResult extends JsonMap {
  /** ID of the component being deployed. */
  id?:                        string;
  /** The ID of the user who canceled the deployment. */
  canceledBy?:                string;
  /** The full name of the user who canceled the deployment. */
  canceledByName?:            string;
  /** Indicates whether this deployment is being used to check the validity of the deployed files without making any changes in the organization (true) or not (false). A check-only deployment does not deploy any components or change the organization in any way. */
  checkOnly?:                 boolean;
  /** Timestamp for when the deployment process ended. */
  completedDate?:             string;
  /** The ID of the user who created the deployment. */
  createdBy?:                 string;
  /** The full name of the user who created the deployment. */
  createdByName?:             string;
  /** Timestamp for when the `force:mdapi:deploy` call was received. */
  createdDate?:               string;
  /** Provides the details of a deployment that is in-progress or ended */
  details?:                   DeployDetails;
  /** Indicates whether the server finished processing the `force:mdapi:deploy` call for the specified `id`. */
  done?:                      boolean;
  /** Message corresponding to the values in the errorStatusCode field, if any. */
  errorMessage?:              string;
  /** If an error occurred during the `force:mdapi:deploy` call, a status code is returned, and the message corresponding to the status code is returned in the `errorMessagefield`. */
  errorStatusCode?:           string;
  /** Optional. Defaults to false. Specifies whether a deployment should continue even if the deployment generates warnings. Do not set this argument to true for deployments to production organizations. */
  ignoreWarnings?:            boolean;
  /** Timestamp of the last update for the deployment process. */
  lastModifiedDate?:          string;
  /** The number of components that generated errors during this deployment. */
  numberComponentErrors?:     number;
  /** The number of components deployed in the deployment process. Use this value with the numberComponentsTotal value to get an estimate of the deployment’s progress. */
  numberComponentsDeployed?:  number;
  /** The total number of components in the deployment. Use this value with the numberComponentsDeployed value to get an estimate of the deployment’s progress. */
  numberComponentsTotal?:     number;
  /** The number of Apex tests that have generated errors during this deployment. */
  numberTestErrors?:          number;
  /** The number of completed Apex tests for this deployment. Use this value with the numberTestsTotal value to get an estimate of the deployment’s test progress. */
  numberTestsCompleted?:      number;
  /** The total number of Apex tests for this deployment. Use this value with the numberTestsCompleted value to get an estimate of the deployment’s test progress. The value in this field is not accurate until the deployment has started running tests for the components being deployed. */
  numberTestsTotal?:          number;
  /** Indicates whether Apex tests were run as part of this deployment (true) or not (false). Tests are either automatically run as part of a deployment or can be set to run using the `--testlevel` flag for the `force:mdapi:deploy` call. */
  runTestsEnabled?:           boolean;
  /** Optional. Defaults to true. Indicates whether any failure causes a complete rollback (true) or not (false). If false, whatever set of actions can be performed without errors are performed, and errors are returned for the remaining actions. This parameter must be set to true if you are deploying to a production organization. */
  rollbackOnError?:           boolean;
  /** Timestamp for when the deployment process began. */
  startDate?:                 string;
  /** Indicates which component is being deployed or which Apex test class is running. */
  stateDetail?:               string;
  /** Indicates the current state of the deployment. */
  status?:                    'Pending'|'InProgress'|'Succeeded'|'SucceededPartial'|'Failed'|'Canceling'|'Canceled';
  /** Indicates whether the deployment was successful (true) or not (false). */
  success?:                   boolean;
}

/**
 * Interface. Modeled on the MDAPI Object `FileProperties`. May be part of the results returned by `force:mdapi:retrieve`.
 *
 * Contains information about the properties of each component in the .zip file, and the manifest file `package.xml`.
 * One object per component is returned. Note that this component does not contain information about any associated
 * metadata files in the .zip file, only the component files and manifest file. `FileProperties` contains the
 * following properties:
 *
 * Reference: https://developer.salesforce.com/docs/atlas.en-us.api_meta.meta/api_meta/meta_retrieveresult.htm
 */
export interface FileProperties extends JsonMap {
  /** ID of the user who created the file. */
  createdById?:         string;
  /** Name of the user who created the file. */
  createdByName?:       string;
  /** Date and time when the file was created. */
  createdDate?:         string;
  /** Name of the file. */
  fileName?:            string;
  /** The file developer name used as a unique identifier for API access. The value is based on the fileName but the characters allowed are more restrictive. The fullName can contain only underscores and alphanumeric characters. It must be unique, begin with a letter, not include spaces, not end with an underscore, and not contain two consecutive underscores. */
  fullName?:            string;
  /** ID of the file. */
  id?:                  string;
  /** ID of the user who last modified the file. */
  lastModifiedById?:    string;
  /** Name of the user who last modified the file. */
  lastModifiedByName?:  string;
  /** Date and time that the file was last modified. */
  lastModifiedDate?:    string;
  /** Indicates the manageable state of the specified component if it is contained in a package. */
  manageableState?:     'beta'|'deleted'|'deprecated'|'installed'|'released'|'unmanaged';
  /** If any, the namespace prefix of the component. */
  namespacePrefix?:     string;
  /** Required. The metadata type, such as CustomObject, CustomField, or ApexClass. */
  type?:                string;
}

/**
 * Interface. Modeled on the MDAPI Object `FlowCoverageResult`. May be part of the results returned by `force:mdapi:deploy`.
 *
 * Contains information about the flow version and the number of elements executed by a test run. Available in API version 44.0 and later.
 *
 * Reference: https://developer.salesforce.com/docs/atlas.en-us.api_meta.meta/api_meta/meta_deployresult.htm
 */
export interface FlowCoverageResult extends JsonMap {
  /** List of elements in the flow version that weren’t executed by the test run. */
  elementsNotCovered?:    string;
  /** The ID of the flow version. The ID is unique within an org. */
  flowId?:                string;
  /** The name of the flow that was executed by the test run. */
  flowName?:              string;
  /** The namespace that contains the flow, if one is specified. */
  flowNamespace?:         string;
  /** The total number of elements in the flow version. */
  numElements?:           number;
  /** The number of elements in the flow version that weren’t executed by the test run */
  numElementsNotCovered?: number;
  /** The process type of the flow version. */
  processType?:  string;
}

/**
 * Interface. Modeled on the MDAPI Object `FlowCoverageWarning`. May be part of the results returned by `force:mdapi:deploy`.
 *
 * Contains information about the flow version that generated warnings. Available in API version 44.0 and later.
 *
 * Reference: https://developer.salesforce.com/docs/atlas.en-us.api_meta.meta/api_meta/meta_deployresult.htm
 */
export interface FlowCoverageWarning extends JsonMap {
  /** The ID of the flow version that generated the warning. */
  flowId:         string;
  /** The name of the flow that generated the warning. If the warning applies to the overall test coverage of flows within your org, this value is null. */
  flowName:       string;
  /** The namespace that contains the flow, if one was specified. */
  flowNamespace:  string;
  /** The message of the warning that was generated. */
  message:        string;
}

/**
 * Interface. Modeled on the MDAPI Object `RetrieveResult`. Returned by a call to `force:mdapi:retrieve`.
 *
 * Contains information about the success or failure of the associated `force:mdapi:retrieve` call.
 *
 * Reference: https://developer.salesforce.com/docs/atlas.en-us.api_meta.meta/api_meta/meta_retrieveresult.htm
 */
export interface RetrieveResult extends JsonMap {
  /** Required. Indicates whether the retrieve() call is completed (true) or not (false). */
  done?:            boolean;
  /** If an error occurs during the force:mdapi:retrieve call, this field contains a descriptive message about this error. */
  errorMessage?:    string;
  /** If an error occurs during the force:mdapi:retrieve call, this field contains the status code for this error. */
  errorStatusCode?: string;
  /** Contains information about the properties of each component in the .zip file, and the manifest file package.xml. One object per component is returned. */
  fileProperties?:  FileProperties;
  /** ID of the component being retrieved. */
  id?:              string;
  /** Contains information about the success or failure of the force:mdapi:retrieve call. */
  messages?:        RetrieveMessage[];
  /** The status of the retrieve() call. Valid values are 'Pending', 'InProgress', 'Succeeded', and 'Failed' */
  status?:          'Pending'|'InProgress'|'Succeeded'|'Failed';
  /** Indicates whether the retrieve() call was successful (true) or not (false).  */
  success?:         boolean;
  /** The zip file returned by the retrieve request. Base 64-encoded binary data.  */
  zipFile?:         string;
}

/**
 * Interface. Modeled on the MDAPI Object `RunTestsResult`. May be part of the results returned by `force:mdapi:deploy`.
 *
 * Contains information about the execution of unit tests, including whether unit tests were completed successfully, code coverage results, and failures.
 *
 * Reference: https://developer.salesforce.com/docs/atlas.en-us.api_meta.meta/api_meta/meta_deployresult.htm
 */
export interface RunTestsResult extends JsonMap {
  /** The ID of an `ApexLog` object that is created at the end of a test run. The `ApexLog` object is created if there is an active trace flag on the user running an Apex test, or on a class or trigger being executed. */
  apexLogId?:             string;
  /** An array of one or more `CodeCoverageResult` objects that contains the details of the code coverage for the specified unit tests. */
  codeCoverage?:          CodeCoverageResult[];
  /** An array of one or more code coverage warnings for the test run. The results include both the total number of lines that could have been executed, as well as the number, line, and column positions of code that was not executed. */
  codeCoverageWarnings?:  CodeCoverageWarning[];
  /** An array of one or more `RunTestFailure` objects that contain information about the unit test failures, if there are any. */
  failures?:              RunTestFailure[];
  /** An array of results from test runs that executed flows */
  flowCoverage?:          FlowCoverageResult[];
  /** An array of warnings generated by test runs that executed flows. */
  flowCoverageWarnings?:  FlowCoverageWarning[];
  /** The number of failures for the unit tests. */
  numFailures?:           number;
  /** The number of unit tests that were run. */
  numTestsRun?:           number;
  /** An array of one or more `RunTestSuccess` objects that contain information about successes, if there are any. */
  successes?:             RunTestSuccess[];
  /** The total cumulative time spent running tests. This can be helpful for performance monitoring. */
  totalTime?:             number;
}

/**
 * Interface. Modeled on the MDAPI Object `RunTestFailure`. May be part of the results returned by `force:mdapi:deploy`.
 *
 * Contains information about failures during the unit test run.
 *
 * Reference: https://developer.salesforce.com/docs/atlas.en-us.api_meta.meta/api_meta/meta_deployresult.htm
 */
export interface RunTestFailure extends JsonMap {
  /** The ID of the class which generated failures. */
  id?:          string;
  /** The failure message. */
  message?:     string;
  /** The name of the method that failed. */
  methodName?:  string;
  /** The name of the class that failed. */
  name?:        string;
  /** The namespace that contained the class, if one was specified. */
  namespace?:   string;
  /** Indicates whether the test method has access to organization data (true) or not (false). This field is available in API version 33.0 and later. */
  seeAllData?:  boolean;
  /** The stack trace for the failure. */
  stackTrace?:  string;
  /** The time spent running tests for this failed operation. This can be helpful for performance monitoring. */
  time?:        number;
  /** Do not use. In early, unsupported releases, used to specify class or package. */
  type?:        string;
}

/**
 * Interface. Modeled on the MDAPI Object `RunTestSuccess`. May be part of the results returned by `force:mdapi:deploy`.
 *
 * Contains information about successes during the unit test run.
 *
 * Reference: https://developer.salesforce.com/docs/atlas.en-us.api_meta.meta/api_meta/meta_deployresult.htm
 */
export interface RunTestSuccess extends JsonMap {
  /** The ID of the class which generated the success. */
  id?:	        string;
  /** The name of the method that succeeded. */
  methodName:	  string;
  /** The name of the class that succeeded. */
  name?:	      string;
  /** The namespace that contained the unit tests, if one is specified. */
  namespace?:	  string;
  /** Indicates whether the test method has access to organization data (true) or not (false). */
  seeAllData?:	boolean;
  /** The time spent running tests for this operation. This can be helpful for performance monitoring. */
  time?:	      number;
}

/**
 * Interface. Modeled on the MDAPI Object `RetrieveMessage`. May be returned by a call to `force:mdapi:retrieve`.
 *
 * Contains information about the success or failure of the `force:mdapi:retrieve` call. One object per problem is returned.
 *
 * Reference: https://developer.salesforce.com/docs/atlas.en-us.api_meta.meta/api_meta/meta_retrieveresult.htm
 */
export interface RetrieveMessage extends JsonMap {
  /** The name of the file in the retrieved .zip file where a problem occurred. */
  fileName?:  string;
  /** A description of the problem that occurred. */
  problem?:   string;
}

//
//
//
//
//─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
// Falcon and SFDX Config-related interfaces and types.
//─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
//
//
//
//

/**
 * Represents the status code and JSON result that is sent to the caller when SFDX-Falcon CLI Commands are run.
 */
export interface SfdxFalconJsonResponse extends JsonMap {
  falconStatus: number;
  falconResult: AnyJson;
}

//
//
//
//
//─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
// Packaging-related types.
//─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
//
//
//
//

/**
 * Interface. Represents a Metadata Package (033). Can be managed or unmanaged.
 */
export interface MetadataPackage extends JsonMap {
  Id:                       string;
  Name:                     string;
  NamespacePrefix:          string;
  MetadataPackageVersions:  MetadataPackageVersion[];
}

/**
 * Interface. Represents a Metadata Package Version (04t).
 */
export interface MetadataPackageVersion extends JsonMap {
  Id:                 string;
  Name:               string;
  MetadataPackageId:  string;
  MajorVersion:       number;
  MinorVersion:       number;
  PatchVersion:       number;
  BuildNumber:        number;
  ReleaseState:       string;
}

//
//
//
//
//─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
// Listr related interfaces and types.
//─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
//
//
//
//

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
export interface ListrContextFinalizeGit extends JsonMap {
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
export interface ListrContextPkgRetExCon extends JsonMap {
  packagesRetrieved:  boolean;
  sourceExtracted:    boolean;
  sourceConverted:    boolean;
}

/**
 * Interface. Represents the suite of information required to run a Listr Task Bundle.
 */
export interface ListrTaskBundle {
  /** Required. A fully instantiated Listr Object representing the tasks that the caller would like to run. */
  listrObject:            ListrObject;
  /** Required. The debug namespace that will be used by SfdxFalconDebug and SfdxFalconError objects. */
  dbgNsLocal:             string;
  /** Required. Status Message that will be added to the GeneratorStatus object if the Task Bundle completes successfully. */
  generatorStatusSuccess: StatusMessage;
  /** Required. Status Message that will be added to the GeneratorStatus object if the Task Bundle does not complete successfully. */
  generatorStatusFailure: StatusMessage;
  /** Required. Specifies whether an error will be thrown if any of the Tasks in the Task Bundle fail. */
  throwOnFailure:         boolean;
  /** Optional. A styled message that will be shown to the user BEFORE the Task Bundle is run. */
  preTaskMessage?:        StyledMessage;
  /** Optional. A styled message that will be shown to the user AFTER the Task Bundle is run. */
  postTaskMessage?:       StyledMessage;
}

/**
 * Type. Alias to an rxjs Observer<unknown> type.
 */
export type Observer = Observer<unknown>;

/**
 * Type. Alias to an rxjs Subscriber<unknown> type.
 */
export type Subscriber = Subscriber<unknown>;

//
//
//
//
//─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
// Yeoman/Inquirer/SfdxFalconInterview/SfdxFalconPrompt related interfaces and types.
//─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
//
//
//
//

export type InquirerChoice<U=unknown>   = import('inquirer/lib/objects/choice')<U>;
export type InquirerSeparator           = import('inquirer/lib/objects/separator');
export type InquirerChoices             = Array<InquirerChoice|InquirerSeparator>;
export type InquirerQuestion            = import('inquirer').Question;
export type InquirerQuestions           = import('inquirer').QuestionCollection;
export type InquirerAnswers             = import('inquirer').Answers;

/**
 * Represents a Yeoman/Inquirer choice object.
 */
export type  YeomanChoice = InquirerChoice;

/**
 * Type. Represents a "checkbox choice" in Yeoman/Inquirer.
 */
export type YeomanCheckboxChoice = InquirerChoice;

/**
 * Type. Represents the function signature for a "Disabled" function.
 */
export type YeomanChoiceDisabledFunction = (answers:unknown) => boolean|string; // tslint:disable-line: no-any

/**
 * Represents what an answers hash should look like during Yeoman/Inquirer interactions
 * where the user is being asked to proceed/retry/abort something.
 */
export interface ConfirmationAnswers extends JsonMap {
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
  questions:            Questions | QuestionsBuilder; // Required. Questions for the user.
  questionsArgs?:       unknown[];                    // Optional. Array of arguments to be passed to a QuestionsBuilder function.
  defaultAnswers:       T;                            // Required. Default answers to the Questions.
  confirmation?:        Questions | QuestionsBuilder; // Optional. Confirmation Questions.
  confirmationArgs?:    unknown[];                    // Optional. Array of arguments to be passed to a QuestionsBuilder function.
  invertConfirmation?:  boolean;                      // Optional. Treats
  display?:             AnswersDisplay<T>;            // ???
  context?:             object;                       // Optional. The scope of the caller who creates an SfdxFalconPrompt.
  data?:                object;                       // Optional. ???
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
  questionsArgs?:       unknown[];
  confirmation?:        Questions | QuestionsBuilder;
  confirmationArgs?:    unknown[];
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

/**
 * Interface. Represents the initialization requirements for Yeoman Generators that implement SfdxFalconYeomanGenerator.
 */
export interface GeneratorRequirements {
  git:              boolean;
  gitRemoteUri:     string;
  localFile:        string;
  localDirectory:   string;
  standardOrgs:     boolean;
  scratchOrgs:      boolean;
  devHubOrgs:       boolean;
  envHubOrgs:       boolean;
  managedPkgOrgs:   boolean;
  unmanagedPkgOrgs: boolean;
}

//
//
//
//
//─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
// Salesforce DX / JSForce related types.
//─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
//
//
//
//

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
  request:            import ('jsforce').RequestInfo;
  options?:           {any};
}

/**
 * Interface. Represents the unparsed response to a "raw" REST API request via a JSForce connection.
 */
export interface RawRestResponse extends JsonMap {
  statusCode:     number;
  statusMessage:  string;
  headers:        JsonMap;
  body:           string;
}

/**
 * Interface. Represents the request body required to close or abort a Bulk API 2.0 job.
 */
export interface Bulk2JobCloseAbortRequest extends JsonMap {
  /** The state to update the job to. Use "UploadComplete" to close a job, or "Aborted" to abort a job. */
  state:  'UploadComplete'|'Aborted';
}

/**
 * Interface. Represents the request body required to create a Bulk API 2.0 job.
 */
export interface Bulk2JobCreateRequest extends JsonMap {
  /** The column delimiter used for CSV job data. */
  columnDelimiter?:     'BACKQUOTE'|'CARET'|'COMMA'|'PIPE'|'SEMICOLON'|'TAB';
  /** The format of the data being processed. Only CSV is supported */
  contentType?:          'CSV';
  /** The external ID field in the object being updated. Only needed for upsert operations. Field values must also exist in CSV job data. */
  externalIdFieldName?: string;
  /** The line ending used for CSV job data. */
  lineEnding?:          'LF'|'CRLF';
  /** The object type for the data being processed. */
  object:               string;
  /** The processing operation for the job. Values include "insert", "delete", "update", and "upsert". */
  operation:            'insert'|'delete'|'update'|'upsert';
}

/**
 * Interface. Represents the response body returned by Salesforce after attempting to create a Bulk API 2.0 job.
 */
export interface Bulk2JobCreateResponse extends Bulk2JobCreateRequest {
  /** The API version that the job was created in. */
  apiVersion?:          string;
  /** How the request was processed. */
  concurrencyMode?:     string;
  /** The URL to use for Upload Job Data requests for this job. Only valid if the job is in Open state. */
  contentUrl?:          string;
  /** The ID of the user who created the job. */
  createdById?:         string;
  /** The date and time in the UTC time zone when the job was created. */
  createdDate?:         string;
  /** Unique ID for this job. */
  id?:                  string;
  /** The job’s type. Values include "BigObjectIngest" (BigObjects), "Classic" (Bulk API 1.0), or "V2Ingest" (Bulk API 2.0 job) */
  jobType?:             'BigObjectIngest'|'Classic'|'V2Ingest';
  /** The current state of processing for the job. */
  state?:               'Open'|'UploadComplete'|'InProgress'|'JobComplete'|'Failed'|'Aborted';
  /** Date and time in the UTC time zone when the job finished. */
  systemModstamp?:      string;
}

/**
 * Interface. Represents the response body returned by Salesforce when closing or aborting a specific Bulk API 2.0 job.
 */
export interface Bulk2JobCloseAbortResponse extends Bulk2JobCreateResponse {} // tslint:disable-line: no-empty-interface

/**
 * Interface. Represents the response body returned by Salesforce when requesting info about a specific Bulk API 2.0 job.
 */
export interface Bulk2JobInfoResponse extends Bulk2JobCloseAbortResponse {
  /** The number of milliseconds taken to process triggers and other processes related to the job data. This doesn't include the time used for processing asynchronous and batch Apex operations. If there are no triggers, the value is 0. */
  apexProcessingTime?:      number;
  /** The number of milliseconds taken to actively process the job and includes apexProcessingTime, but doesn't include the time the job waited in the queue to be processed or the time required for serialization and deserialization. */
  apiActiveProcessingTime?: number;
  /** The number of records that were not processed successfully in this job. */
  numberRecordsFailed?:     number;
  /** The number of records already processed. */
  numberRecordsProcessed?:  number;
  /** The number of times that Salesforce attempted to save the results of an operation. The repeated attempts are due to a problem, such as a lock contention. */
  retries?:                 number;
  /** The number of milliseconds taken to process the job. */
  totalProcessingTime?:     number;
}

/**
 * Interface. Represents a record that encountered an error while being processed by a Bulk API 2.0 job.
 * Contains all field data that was provided in the original job data upload request.
 */
export interface Bulk2FailedRecord extends JsonMap {
  /** Error code and message, if applicable. */
  sf__Error:    string;
  /** ID of the record that had an error during processing, if applicable. */
  sf__Id:       string;
  /** Field data for the row that was provided in the original job data upload request. */
  [key:string]: string;
}

/**
 * Type. Represents the collection of "Failed Results" data from a Bulk API 2.0 job.
 */
export type Bulk2FailedResults = Bulk2FailedRecord[];

/**
 * Interface. Represents a record that has been successfully processed by a Bulk API 2.0 job.
 * Contains all field data that was provided in the original job data upload request.
 */
export interface Bulk2SuccessfulRecord extends JsonMap {
  /** Indicates if the record was created. */
  sf__Created:  string;
  /** ID of the record that was successfully processed. */
  sf__Id:       string;
  /** Field data for the row that was provided in the original job data upload request. */
  [key:string]: string;
}

/**
 * Type. Represents the collection of "Successful Results" data from a Bulk API 2.0 job.
 */
export type Bulk2SuccessfulResults = Bulk2SuccessfulRecord[];

/**
 * Interface. Represents the overall status of a Bulk API 2.0 operation.
 */
export interface Bulk2OperationStatus extends JsonMap {
  currentJobStatus?:        Bulk2JobInfoResponse;
  dataSourcePath?:          string;
  dataSourceSize?:          number;
  dataSourceUploadStatus?:  Status;
  failedResults?:           Bulk2FailedResults;
  failedResultsPath?:       string;
  initialJobStatus?:        Bulk2JobCreateResponse;
  successfulResults?:       Bulk2SuccessfulResults;
  successfulResultsPath?:   string;
}

/**
 * Type. Represents a collection of either "Successful" or "Failure" Results data from a Bulk API 2.0 job.
 */
export type Bulk2Results = Bulk2SuccessfulResults | Bulk2FailedResults;

/**
 * Type. Alias to a Map with string keys and MetadataPackageVersion values.
 */
export type PackageVersionMap = Map<string, MetadataPackageVersion[]>;

/**
 * Type. Alias to the JSForce definition of QueryResult.
 */
export type QueryResult<T> = import('jsforce').QueryResult<T>;

/**
 * Interface. Represents the "nonScratchOrgs" (aka "standard orgs") data returned by the sfdx force:org:list command.
 */
export interface RawStandardOrgInfo {
  orgId?:                   string;     // Why?
  username?:                string;     // Why?
  alias?:                   string;     // Why?
  accessToken?:             string;     // Why?
  instanceUrl?:             string;     // Why?
  loginUrl?:                string;     // Why?
  clientId?:                string;     // Why?
  isDevHub?:                boolean;    // Why?
  isDefaultDevHubUsername?: boolean;    // Why?
  defaultMarker?:           string;     // Why?
  connectedStatus?:         string;     // Why?
  lastUsed?:                string;     // Why?
}

/**
 * Interface. Represents the "scratchOrgs" data returned by the sfdx force:org:list --all command.
 */
export interface RawScratchOrgInfo {
  orgId?:                   string;     // Why?
  username?:                string;     // Why?
  alias?:                   string;     // Why?
  accessToken?:             string;     // Why?
  instanceUrl?:             string;     // Why?
  loginUrl?:                string;     // Why?
  clientId?:                string;     // Why?
  createdOrgInstance?:      string;     // Why?
  created?:                 string;     // Wyy?
  devHubUsername?:          string;     // Why?
  connectedStatus?:         string;     // Why?
  lastUsed?:                string;     // Why?
  attributes?:              object;     // Why?
  orgName?:                 string;     // Why?
  status?:                  string;     // Why?
  createdBy?:               string;     // Why?
  createdDate?:             string;     // Why?
  expirationDate?:          string;     // Why?
  edition?:                 string;     // Why?
  signupUsername?:          string;     // Why?
  devHubOrgId?:             string;     // Why?
  isExpired?:               boolean;    // Why?
}

/**
 * Type. Alias for a Map with string keys holding StandardOrgInfo values.
 */
export type StandardOrgInfoMap = Map<string, StandardOrgInfo>;

/**
 * Type. Alias for a Map with string keys holding ScratchOrgInfo values.
 */
export type ScratchOrgInfoMap = Map<string, ScratchOrgInfo>;

/**
 * Interface. Represents the options that can be set when constructing a StandardOrgInfo object.
 */
export interface StandardOrgInfoOptions extends RawStandardOrgInfo {
  metadataPackageResults?:  QueryResult<MetadataPackage>;
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

//
//
//
//
//─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
// SObject related types.
//─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
//
//
//
//

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
