//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @file          modules/sfdx-falcon-interview/index.ts
 * @copyright     Vivek M. Chawla - 2019
 * @author        Vivek M. Chawla <@VivekMChawla>
 * @summary       Exports SfdxFalconInterview which provides complex interactions via the console.
 * @description   Helps developers quickly build complex Inquirer based interviews as a collection
 *                of SfdxFalconPrompt objects. Can export interviews to external consumers (like
 *                Yeoman), or directly run Inquirer-based interactions.
 * @version       1.0.0
 * @license       MIT
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
// Import External Modules
//import {JsonMap}    from  '@salesforce/ts-types';

// Import Internal Modules
import {SfdxFalconDebug}      from  '../sfdx-falcon-debug';     // Class. Specialized debug provider for SFDX-Falcon code.
import {SfdxFalconPrompt}     from  '../sfdx-falcon-prompt';    // ???
//import {SfdxFalconError}      from  '../sfdx-falcon-error';     // Class. Extends SfdxError to provide specialized error structures for SFDX-Falcon modules.
//import {ConfirmationAnswers}  from  '../sfdx-falcon-types';     // Interface. Represents what an answers hash should look like during Yeoman/Inquirer interactions where the user is being asked to proceed/retry/abort something.
//import {PromptEngine}         from  '../sfdx-falcon-types';     // Type. Funcion type alias defining a Yeoman or Inquirer prompt() function.
import {AbortInterview}         from  '../sfdx-falcon-types';     // Type. Alias defining a function that checks whether an Interview should be aborted.
import {InterviewGroupOptions}  from  '../sfdx-falcon-types';     // Interface. Represents a group of prompts within a particular interview.
import {InterviewOptions}       from  '../sfdx-falcon-types';     // Interface. Represents the options that can be set by the SfdxFalconPrompt constructor.
import {InterviewStatus}        from  '../sfdx-falcon-types';     // Interface. Represents a set of status indicators for an SfdxFalconInterview.
import {ShowInterviewGroup}     from  '../sfdx-falcon-types';     // Type. Alias defining a function that checks whether an Interview Group should be shown.

//import {SfdxFalconTableData}      from  '../sfdx-falcon-util/ux';         // Interface. Represents and array of SfdxFalconKeyValueTableDataRow objects.


// Requires
//const inquirer = require('inquirer'); // A collection of common interactive command line user interfaces.

// Set the File Local Debug Namespace
const dbgNs = 'MODULE:sfdx-falcon-interview:';


//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @class       InterviewGroup
 * @summary     Represents the combination of an SFDX-Falcon Prompt with an "abort check" function.
 * @description Objects created from this class are able to be run through an Interview, one at a
 *              time, and have their "abort check" function executed once the user indicates they
 *              are ready to proceed.  This way, if the user provided data that is invalid, the 
 *              entire interview can be aborted.
 * @public
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
export class InterviewGroup<T extends object> {

  // Public members.
  public  readonly  abort:        AbortInterview;
  public            when:         ShowInterviewGroup;

  // Private members.
  private readonly falconPrompt:  SfdxFalconPrompt<T>;

  // Constructor
  constructor(falconPrompt:SfdxFalconPrompt<T>, abort?:AbortInterview, when?:ShowInterviewGroup) {
    this.falconPrompt = falconPrompt;
    this.abort        = abort;
    this.when         = when;
  }

  // Public methods.
  public async prompt():Promise<T> {
    return this.falconPrompt.prompt();
  }
}

//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @class       SfdxFalconInterview
 * @summary     ???
 * @description ???
 * @public
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
export class SfdxFalconInterview<T extends object> {

  // Public members
  public readonly   context:        object;               // ???
  public readonly   sharedData:     object;               // ???
  public readonly   defaultAnswers: T;                    // ???
  public            status:         InterviewStatus;      // ???
  public            userAnswers:    T;                    // ???
  public            when:           ShowInterviewGroup;   // ???

  // Private members
  private readonly  interviewGroups: Array<InterviewGroup<T>>;     // ???
  private           finalGroup:      InterviewGroup<T>;          // ???

  // Public Accessors
  public get finalAnswers():T {
    return {
      ...this.defaultAnswers as object,
      ...this.userAnswers as object
    } as T;
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @constructs  SfdxFalconInterview
   * @param       {InterviewOptions<T>} opts Required. Options that define the
   *              default answers, Prompt Engine, and special "context" object
   *              for the entire inteview. These values will be carried on to
   *              each SfdxFalconPrompt group contained in this Interview.
   * @description Constructs an SfdxFalconInterview object.
   * @public
   */
  //───────────────────────────────────────────────────────────────────────────┘
  constructor(opts:InterviewOptions<T>) {
    this.defaultAnswers       = opts.defaultAnswers as T;
    this.context              = opts.context || {} as object;
    this.sharedData           = opts.sharedData || {} as object;
    this.userAnswers          = {} as T;
    this.interviewGroups      = new Array<InterviewGroup<T>>();
    this.status               = {aborted: false, completed: false};
  }

  //─────────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      createFinalGroup
   * @param       {InterviewGroupOptions} opts  Required.
   * @returns     {void}
   * @description Given valid Interview Group Options, creates an SFDX-Falcon
   *              Prompt and saves it as a special FINAL group to show the user
   *              at the end of the Interview. The intent is to provide a way for
   *              the user to restart the ENTIRE interview process if they want.
   * @public
   */
  //─────────────────────────────────────────────────────────────────────────────┘
  public createFinalGroup(opts:InterviewGroupOptions<T>):void {

    // Debug
    SfdxFalconDebug.obj(`${dbgNs}createFinalGroup:`, arguments, `arguments: `);

    // Create a new SFDX Falcon Prompt based on the incoming options.
    const finalPrompt = new SfdxFalconPrompt<T>({
      questions:          opts.questions,
      confirmation:       opts.confirmation,
      invertConfirmation: opts.invertConfirmation,
      display:            opts.display,
      defaultAnswers:     this.defaultAnswers,
      context:            this
    });

    // Create an Interview Group for the Final Prompt
    this.finalGroup = new InterviewGroup<T>(finalPrompt, opts.abort);

    // Debug
    SfdxFalconDebug.obj(`${dbgNs}createFinalGroup:`, this.finalGroup, `this.finalGroup: `);
  }

  //─────────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      createGroup
   * @param       {InterviewGroupOptions} opts  Required.
   * @returns     {void}
   * @description Given valid Interview Group Options, creates an SFDX-Falcon
   *              Prompt and then combines it with an "abort" function (if
   *              provided) in order to create an Interview Group.  The Interview
   *              Group is then added to the Interview Groups collection.
   * @public
   */
  //─────────────────────────────────────────────────────────────────────────────┘
  public createGroup(opts:InterviewGroupOptions<T>):void {

    // Debug
    SfdxFalconDebug.obj(`${dbgNs}createGroup:`, arguments, `arguments: `);

    // Create a new SFDX Falcon Prompt based on the incoming options.
    const falconPrompt = new SfdxFalconPrompt<T>({
      questions:          opts.questions,
      confirmation:       opts.confirmation,
      invertConfirmation: opts.invertConfirmation,
      defaultAnswers:     this.defaultAnswers,
      context:            this
    });

    // Create a new Interview Group using the Prompt we just created.
    const interviewGroup = new InterviewGroup<T>(falconPrompt, opts.abort, opts.when);

    // Debug
    SfdxFalconDebug.obj(`${dbgNs}createGroup:`, interviewGroup, `interviewGroup: `);

    // Add the new Interview Group to the Interview Groups Array.
    this.interviewGroups.push(interviewGroup);

  }

  //─────────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      start
   * @returns     {Promise<T>}  Returns the answers provided by the user.
   * @description Starts the interview. Once started, the Interview will only stop
   *              once completed, aborted by the user, or an Error is thrown.
   * @public @async
   */
  //─────────────────────────────────────────────────────────────────────────────┘
  public async start():Promise<T> {

    // Debug
    //SfdxFalconDebug.obj(`${dbgNs}start:`, this.interviewGroups, `this.interviewGroups: `);

    // Iterate over each Interview Group
    for (const interviewGroup of this.interviewGroups) {

      // Determine if this Interview Group should be skipped.
      if (await this.skipInterviewGroup(interviewGroup)) {
        SfdxFalconDebug.msg(`${dbgNs}start:`, `Interview Group Skipped! `);
        continue;
      }

      // Debug
      SfdxFalconDebug.obj(`${dbgNs}start:`, this.userAnswers, `this.userAnswers: `);

      // Prompt the user with questions from the current Interview Group.
      const groupAnswers = await interviewGroup.prompt();
      
      // Blend the answers just provided with those from the Interview as a whole.
      this.userAnswers = {
      ...this.userAnswers as object,
      ...groupAnswers as object
      } as T;
      
      // Check if this group has an "abort" function. If so, check the abort conditions.
      if (typeof interviewGroup.abort === 'function') {
        const abort = interviewGroup.abort(groupAnswers, this.userAnswers);
        if (abort) {
          return this.abortInterview(abort as string);
        }
      }
    }

    // Debug
    SfdxFalconDebug.obj(`${dbgNs}start:`, this.finalAnswers, `this.finalAnswers: `);

    // Return the FINAL (Default merged with User) answers to the caller.
    return this.finalAnswers;

  }

  //─────────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      abortInterview
   * @param       {string}
   * @returns     {T} Returns the Final Answers for this interview.
   * @description Marks the status of this Interview as "Aborted" and "Incomplete",
   *              then returns the interview's "Final Answers" to the caller.
   * @private
   */
  //─────────────────────────────────────────────────────────────────────────────┘
  private abortInterview(message:string):T {
    console.log(message);
    this.status.aborted   = true;
    this.status.completed = false;
    this.status.reason    = message;
    return this.finalAnswers;
  }

  //─────────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      skipInterviewGroup
   * @param       {InterviewGroup}  interviewGroup  Required.
   * @returns     {Promise<boolean>}
   * @description ???
   * @private @async
   */
  //─────────────────────────────────────────────────────────────────────────────┘
  private async skipInterviewGroup(interviewGroup:InterviewGroup<T>):Promise<boolean> {

    // If the "when" member is already a boolean, just return the INVERSE value.
    if (typeof interviewGroup.when === 'boolean') {
      return !interviewGroup.when;
    }

    // If the "when" is a function, execute it and return the INVERSE value.
    if (typeof interviewGroup.when === 'function') {
      return !interviewGroup.when(this.userAnswers);
    }

    // If the "when" member wasn't a boolean OR a function, just return FALSE.
    // This means that, by default, any Interview Group with an undefined "when"
    // will always run.
    return false;
  }
}
