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

// Import Internal Modules
import {SfdxFalconDebug}          from  '../sfdx-falcon-debug';     // Class. Specialized debug provider for SFDX-Falcon code.
import {SfdxFalconPrompt}         from  '../sfdx-falcon-prompt';    // Class. Wraps user prompting/interaction functionality provided by Inquirer.
import {SfdxFalconKeyValueTable}  from  '../sfdx-falcon-util/ux';   // Class. Uses table creation code borrowed from the SFDX-Core UX library to make it easy to build "Key/Value" tables.

// Import Falcon Types
import {AbortInterview}           from  '../sfdx-falcon-types';     // Type. Alias defining a function that checks whether an Interview should be aborted.
import {AnswersDisplay}           from  '../sfdx-falcon-types';     // Type. Defines a function that displays answers to a user.
import {ConfirmationAnswers}      from  '../sfdx-falcon-types';     // Interface. Represents what an answers hash should look like during Yeoman/Inquirer interactions where the user is being asked to proceed/retry/abort something.
import {InterviewGroupOptions}    from  '../sfdx-falcon-types';     // Interface. Represents the options that can be set by the InterviewGroup constructor.
import {InterviewOptions}         from  '../sfdx-falcon-types';     // Interface. Represents the options that can be set by the SfdxFalconPrompt constructor.
import {InterviewStatus}          from  '../sfdx-falcon-types';     // Interface. Represents a set of status indicators for an SfdxFalconInterview.
import {Questions}                from  '../sfdx-falcon-types';     // Type. Alias to the Questions type from the yeoman-generator module.
import {QuestionsBuilder}         from  '../sfdx-falcon-types';     // Type. Function type alias defining a function that returns Inquirer Questions.
import {ShowInterviewGroup}       from  '../sfdx-falcon-types';     // Type. Alias defining a function that checks whether an Interview Group should be shown.

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
  public  readonly  title:        string;
  public  readonly  abort:        AbortInterview;
  public            when:         ShowInterviewGroup;

  // Private members.
  private readonly falconPrompt:  SfdxFalconPrompt<T>;

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @constructs  InterviewGroup
   * @param       {SfdxFalconPrompt<T>} falconPrompt Required.
   * @param       {AbortInterview}  [abort] Optional.
   * @param       {ShowInterviewGroup}  [when] Optional.
   * @description Constructs an InterviewGroup object.
   * @public
   */
  //───────────────────────────────────────────────────────────────────────────┘
  constructor(falconPrompt:SfdxFalconPrompt<T>, abort?:AbortInterview, when?:ShowInterviewGroup, title?:string) {
    this.falconPrompt = falconPrompt;
    this.abort        = abort;
    this.when         = when;
    this.title        = title;
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      prompt
   * @returns     {Promise<T>}  Returns the results of inquirer.prompt()
   * @description Executes the Inquirer prompt() function that lives inside of
   *              this SfdxFalconPrompt object.
   * @public @async
   */
  //───────────────────────────────────────────────────────────────────────────┘
  public async prompt():Promise<T> {
    if (this.title) {
      console.log(this.title);
    }
    return this.falconPrompt.prompt();
  }
}

//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @class       SfdxFalconInterview
 * @summary     Provides a standard way of building a multi-group Interview to collect user input.
 * @description Uses Inquirer to prompt the user in the terminal using a flexible, multi-group set
 *              of prompts.  Each group can have it's own set of "abort" questions, and may be shown
 *              or hidden independently. The Interview ends with a final "proceed/restart/abort"
 *              question for the user.
 * @public
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
export class SfdxFalconInterview<T extends object> {

  // Public members
  public readonly   context:        object;                             // ???
  public readonly   sharedData:     object;                             // ???
  public readonly   defaultAnswers: T;                                  // ???
  public            status:         InterviewStatus;                    // ???
  public            userAnswers:    T;                                  // ???
  public            when:           ShowInterviewGroup;                 // ???

  // Private members
  private readonly  _interviewGroups:     Array<InterviewGroup<T>>;     // ???
  private readonly  _confirmation:        Questions | QuestionsBuilder; // ???
  private readonly  _confirmationHeader:  string;                       // ???
  private readonly  _display:             AnswersDisplay<T>;            // ???
  private readonly  _displayHeader:       string;                       // ???
  private readonly  _invertConfirmation:  boolean;                      // ???

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
    this._confirmation        = opts.confirmation;
    this._confirmationHeader  = opts.confirmationHeader || '';
    this._display             = opts.display;
    this._displayHeader       = opts.displayHeader || '';
    this._invertConfirmation  = opts.invertConfirmation || false;
    this.context              = opts.context || {} as object;
    this.sharedData           = opts.sharedData || {} as object;
    this.userAnswers          = {} as T;
    this._interviewGroups     = new Array<InterviewGroup<T>>();
    this.status               = {aborted: false, completed: false};
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

    // DEBUG
    SfdxFalconDebug.obj(`${dbgNs}createGroup:`, arguments, `arguments: `);

    // Create a new SFDX Falcon Prompt based on the incoming options.
    const falconPrompt = new SfdxFalconPrompt<T>({
      questions:          opts.questions,
      questionsArgs:      opts.questionsArgs,
      confirmation:       opts.confirmation,
      confirmationArgs:   opts.confirmationArgs,
      invertConfirmation: opts.invertConfirmation,
      defaultAnswers:     this.defaultAnswers,
      context:            this
    });

    // Create a new Interview Group using the Prompt we just created.
    const interviewGroup = new InterviewGroup<T>(falconPrompt, opts.abort, opts.when, opts.title);

    // DEBUG
    SfdxFalconDebug.obj(`${dbgNs}createGroup:`, interviewGroup, `interviewGroup: `);

    // Add the new Interview Group to the Interview Groups Array.
    this._interviewGroups.push(interviewGroup);
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

    // DEBUG - Don't typically need this level of detail, so keep commented out.
    //SfdxFalconDebug.obj(`${dbgNs}start:`, this.interviewGroups, `this.interviewGroups: `);

    // Iterate over each Interview Group
    for (const interviewGroup of this._interviewGroups) {

      // Determine if this Interview Group should be skipped.
      if (await this.skipInterviewGroup(interviewGroup)) {
        SfdxFalconDebug.msg(`${dbgNs}start:`, `Interview Group Skipped! `);
        continue;
      }

      // DEBUG
      SfdxFalconDebug.obj(`${dbgNs}start:userAnswers:`, this.userAnswers, `this.userAnswers (PRE-PROMPT): `);

      // Prompt the user with questions from the current Interview Group.
      const groupAnswers = await interviewGroup.prompt();

      // DEBUG
      SfdxFalconDebug.obj(`${dbgNs}start:groupAnswers:`, groupAnswers, `groupAnswers: `);
      
      // Blend the answers just provided with those from the Interview as a whole.
      this.userAnswers = {
      ...this.userAnswers as object,
      ...groupAnswers as object
      } as T;

      // DEBUG
      SfdxFalconDebug.obj(`${dbgNs}start:userAnswers:`, this.userAnswers, `this.userAnswers (POST-PROMPT): `);

      // Check if this group has an "abort" function. If so, check the abort conditions.
      if (typeof interviewGroup.abort === 'function') {
        const abort = interviewGroup.abort(groupAnswers, this.userAnswers);
        if (abort) {
          return this.abortInterview(abort as string);
        }
      }
    }

    // Return the FINAL (Default merged with User) answers to the caller.
    return await this.proceedRestartAbort();
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
    console.log(`\n${message}`);
    this.status.aborted   = true;
    this.status.completed = false;
    this.status.reason    = message;
    return this.finalAnswers;
  }

  //───────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      displayAnswers
   * @returns     {Promise<void>}
   * @description Uses the Display function (if present) to display the User
   *              Answers from the prompt to the user. If the Display function
   *              returns void, it means that it rendered output to the user.
   *              If it returns an Array, it means that we need to manually
   *              render the returned data in a FalconTable.
   * @private @async
   */
  //───────────────────────────────────────────────────────────────────────────┘
  private async displayAnswers():Promise<void> {

    // If there's a Display Function, use that to build/display the output.
    if (typeof this._display === 'function') {

      // The display function *might* render something on its own. If it does, it will return void.
      const displayResults = await this._display(this.userAnswers);

      // If the display function returned an Array, then we'll show it to the user with a Falcon Table.
      if (Array.isArray(displayResults)) {
        const falconTable = new SfdxFalconKeyValueTable();

        // If there's a Display Header, render it. Otherwise, add a line break.
        if (this._displayHeader) {
          console.log(this._displayHeader);
        }
        else {
          console.log('');
        }

        // Render the Falcon Table, and add a line break afterwards.
        falconTable.render(displayResults);
        console.log('');
      }
    }
  }

  //─────────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      proceedRestartAbort
   * @returns     {Promise{T}}
   * @description Propmts the user with a special "final" prompt that needs to
   *              return a Confirmation Answers (proceed, restart) structure.
   *              If the user indicates a desire to "proceed", this function will
   *              return the Final Answers. If they want to "restart", this
   *              function will recursively call this.start(). If they don't want
   *              to proceed and they don't want to restart, the interview will
   *              be aborted.
   * @private @async
   */
  //─────────────────────────────────────────────────────────────────────────────┘
  private async proceedRestartAbort():Promise<T> {

    // Debug
    SfdxFalconDebug.obj(`${dbgNs}proceedRestartAbort:`, this.finalAnswers, `this.finalAnswers: `);

    // PROCEED if this Interview does NOT have confirmation questions.
    if (typeof this._confirmation === 'undefined') {
      SfdxFalconDebug.msg(`${dbgNs}proceedRestartAbort:`, `No Confirmation Questions Found. PROCEED by default. `);
      return this.finalAnswers;
    }

    // If there is anything to display, displayAnswers() will take care of it.
    await this.displayAnswers();

    // If there is a Confirmation Header, show it here.
    if (this._confirmationHeader) {
      console.log(this._confirmationHeader);
    }

    // Create a Confirmation Answers structure to hold what we get back from the prompt.
    const confirmationDefaults = {
      proceed:  false,
      restart:  false
    } as ConfirmationAnswers;

    // Create a new SFDX Falcon Prompt based on the incoming options.
    const confirmationPrompt = new SfdxFalconPrompt<ConfirmationAnswers>({
      questions:          this._confirmation,
      defaultAnswers:     confirmationDefaults,
      context:            this
    });

    // Prompt the user for confirmation.
    const confirmationAnswers = await confirmationPrompt.prompt();

    // Process the Confirmation Answers and invert them if required.
    const invertConfirmation  = this._invertConfirmation ? 1 : 0;
    const proceed             = (invertConfirmation ^ (confirmationAnswers.proceed ? 1 : 0)) === 1 ? true : false;
    const restart             = (invertConfirmation ^ (confirmationAnswers.restart ? 1 : 0)) === 1 ? true : false;

    // ABORT
    if (proceed !== true && restart !== true) {
      SfdxFalconDebug.obj(`${dbgNs}proceedRestartAbort:`, {confirmationAnswers: confirmationAnswers, invertConfirmation: invertConfirmation, proceed: proceed, restart: restart}, `ABORT DETECTED. Relevant Variables: `);
      return this.abortInterview('Command Aborted');
    }

    // PROCEED
    if (proceed === true) {
      SfdxFalconDebug.obj(`${dbgNs}proceedRestartAbort:`, {confirmationAnswers: confirmationAnswers, invertConfirmation: invertConfirmation, proceed: proceed, restart: restart}, `PROCEED DETECTED. Relevant Variables: `);
      return this.finalAnswers;
    }

    // RESTART
    SfdxFalconDebug.obj(`${dbgNs}proceedRestartAbort:`, {confirmationAnswers: confirmationAnswers, invertConfirmation: invertConfirmation, proceed: proceed, restart: restart}, `RESTART DETECTED. Relevant Variables: `);
    console.log(''); // Place a line break before the restart.
    return this.start();
  }

  //─────────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      skipInterviewGroup
   * @param       {InterviewGroup<T>} interviewGroup  Required.
   * @returns     {Promise<boolean>}
   * @description Given an Interview Group, determines if that group should be
   *              skipped based on the result of the "when" member of the group.
   *              If the "when" member is a function, it's executed with the
   *              expectation of getting back a boolean. If it's a simple boolean,
   *              that value is returned. If there is no "when" member, the value
   *              returned defaults to FALSE, ensuring the group isn't skipped.
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
