//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @file          modules/sfdx-falcon-util/ux.ts
 * @copyright     Vivek M. Chawla - 2018
 * @author        Vivek M. Chawla <@VivekMChawla>
 * @summary       Console UX utility helper library
 * @description   Exports classes that provide various console.log() based UX / display functions.
 * @version       1.0.0
 * @license       MIT
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
// Import External Libraries, Modules, and Types
import  chalk                 from  'chalk';                    // Helps write colored text to the console.
import  * as _                from 'lodash';                    // Useful collection of utility functions.
import  pad                   = require('pad');                 // Provides consistent spacing when trying to align console output.

// Import Internal Libraries
import  * as typeValidator    from  '../sfdx-falcon-validators/type-validator'; // Library of SFDX Helper functions specific to SFDX-Falcon.

// Import Internal Modules
import  {SfdxFalconDebug}     from  '../sfdx-falcon-debug';     // Class. Specialized debug provider for SFDX-Falcon code.
import  {SfdxFalconError}     from  '../sfdx-falcon-error';     // Class. Extends SfdxError to provide specialized error structures for SFDX-Falcon modules.

// Import Internal Types
import  {StatusMessage}       from  '../sfdx-falcon-types';     // Interface. Represents a "state aware" message. Contains a title, a message, and a type.
import  {StatusMessageType}   from  '../sfdx-falcon-types';     // Enum. Represents the various types/states of a Status Message.
import  {StyledMessage}       from  '../sfdx-falcon-types';     // Interface. Allows for specification of a message string and chalk-specific styling information.

// Requires
const stripAnsi = require('strip-ansi');                        // Strips ANSI escape codes from strings.

// Set the File Local Debug Namespace
const dbgNs = 'UTILITY:ux:';
SfdxFalconDebug.msg(`${dbgNs}`, `Debugging initialized for ${dbgNs}`);


//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @interface   SfdxFalconKeyValueTableDataRow
 * @description Represents a single row of data for use in an SFDX-Falon Table.
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
export interface SfdxFalconKeyValueTableDataRow {
  option:   string;
  value:    string;
  height?:  number;
}

//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @type        SfdxFalconTableData
 * @description Represents an array of SfdxFalconKeyValueTableDataRow object literals.
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
export type SfdxFalconTableData = SfdxFalconKeyValueTableDataRow[];

//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @interface   StatusMessage
 * @description Represents a Status Message that may eventually be displayed using a Falcon Table.
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
export interface StatusMessageOLD {
  title:    string;
  message:  string;
  type:     'error'|'info'|'success'|'warning';
}

//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @interface   TableColumn
 * @description Represents the settings for a column of data in a Falcon Table.
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
export interface TableColumn {
  key:            string;
  label?:         string | (() => string);
  width:          number;
  format(value:string, row:string):string;
  get(row:any[]):string;                        // tslint:disable-line: no-any
}

//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @interface   TableColumnKey
 * @description Represents the Key that identifies a column in a Falcon Table.
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
export interface TableColumnKey {
  key:    string;
  label?: string | (() => string);
}

//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @interface   TableOptions
 * @description Represents the options that can be set when constructing a Falcon Table.
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
export interface TableOptions {
  columns:    Partial<TableColumn>[];           // tslint:disable-line: array-type
  colSep:     string;
  headerAnsi: any;                              // tslint:disable-line: no-any
  after(row:SfdxFalconKeyValueTableDataRow, options:TableOptions):void;
  printLine(row:any[]):void;                    // tslint:disable-line: no-any
  printRow(row:any[]):void;                     // tslint:disable-line: no-any
  printInverseRow(row:any[]):void;              // tslint:disable-line: no-any
  printHeader(row:any[]):void;                  // tslint:disable-line: no-any
}


//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    printStatusMessages
 * @param       {StatusMessage} statusMessages  Required. The status message to be printed to console.
 * @param       {number}  [padLength] Optional. The minimum character distance between the start of
 *              the message label and the separator character.
 * @param       {string}  [separator] Optional. Separates the Status Message title and message.
 * @returns     {void}
 * @description Given a single status message, outputs that message to the console using specialized
 *              formatting depending on the type of status message provided. Has the ability to
 *              ensure that multiple status messages printed back-to-back will have identical
 *              positioning of the separator as long as a value is provided for padLength.
 * @public
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
export function printStatusMessage(statusMessage:StatusMessage, padLength:number=0, separator:string=' : '):void {

  // Validate input
  typeValidator.throwOnNullInvalidString(statusMessage.title,   `${dbgNs}printStatusMessage`, `statusMessage.title`);
  typeValidator.throwOnNullInvalidString(statusMessage.message, `${dbgNs}printStatusMessage`, `statusMessage.message`);
  typeValidator.throwOnNullInvalidString(statusMessage.type,    `${dbgNs}printStatusMessage`, `statusMessage.type`);
  typeValidator.throwOnNullInvalidString(separator,             `${dbgNs}printStatusMessage`, `separator`);

  // Make sure we move forward with Pad Length as an actual number.
  if (isNaN(padLength)) {
    padLength = 0;
  }

  // Print the Status Message
  switch (statusMessage.type) {
    case StatusMessageType.ERROR:
      console.log(chalk`{bold.red ${pad(statusMessage.title, padLength)+separator}}{bold ${statusMessage.message}}`);
      break;
    case StatusMessageType.FATAL:
      console.log(chalk`{bold.red ${pad(statusMessage.title, padLength)+separator}}{bold ${statusMessage.message}}`);
      break;
    case StatusMessageType.INFO:
      console.log(chalk`{bold ${pad(statusMessage.title, padLength)+separator}}${statusMessage.message}`);
      break;
    case StatusMessageType.SUCCESS:
      console.log(chalk`{bold ${pad(statusMessage.title, padLength)+separator}}{green ${statusMessage.message}}`);
      break;
    case StatusMessageType.WARNING:
      console.log(chalk`{bold ${pad(statusMessage.title, padLength)+separator}}{yellow ${statusMessage.message}}`);
      break;
    default:
      throw new SfdxFalconError( `Invalid setting for statusMessage.type: '${statusMessage.type}'`
                               , `InvalidMessageType`
                               , `${dbgNs}printStatusMessage`);
  }
}

//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    printStatusMessages
 * @param       {StatusMessage[]} statusMessages  Required. Status messages to be printed to console.
 * @param       {number}  [padLength] Optional. The minimum character distance between the start of
 *              the message label and the separator character.
 * @param       {string}  [separator] Optional. Separates the Status Message title and message.
 * @returns     {void}
 * @description Given an array of Status Message objects, prints a formatted Falcon Table to the
 *              console with color-coded text for each message, depending on message status.
 * @public
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
export function printStatusMessages(statusMessages:StatusMessage[], separator:string=' : '):void {
  // Validate input
  if (Array.isArray(statusMessages) === false) {
    throw new SfdxFalconError( `Expected array for statusMessages but got '${typeof statusMessages}'`
                             , `TypeError`
                             , `${dbgNs}printStatusMessages`);
  }
  if (typeof separator !== 'string') {
    throw new SfdxFalconError( `Expected string for separator but got '${typeof separator}'`
                             , `TypeError`
                             , `${dbgNs}printStatusMessages`);
  }
  
  // Calculate the length of the longest StatusMessage Title
  let longestTitle = 0;
  for (const statusMessage of statusMessages) {
    if (typeof statusMessage.title !== 'undefined') {
      longestTitle = Math.max(statusMessage.title.length, longestTitle);
    }
  }

  // Set the header text for the final status messages. Padding to length
  // of longest title, then adding separator length - 1 will only provide
  // ideal results if there is one blank space to the right of the specified
  // separator string.
  const statusHeader = pad('Final Status', longestTitle + separator.length - 1);

  // Print a header for the Status Messages
  console.log(chalk`{inverse ${statusHeader}}`);

  // Print all of the Satus Messages
  for (const statusMessage of statusMessages) {
    printStatusMessage(statusMessage, longestTitle, separator);
  }
}

//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    printStyledMessage
 * @param       {StyledMessage} styledMessage Required. The styled message to be printed to console.
 * @returns     {void}
 * @description Given a single StyledMessage object, outputs that message to the console using the
 *              styling information provided inside the object.
 * @public
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
export function printStyledMessage(styledMessage:StyledMessage):void {

  // If the incoming Styled Message is undefined, don't do anything.
  if (typeof styledMessage === 'undefined') {
    return;
  }

  // Validate incoming arguments.
  typeValidator.throwOnEmptyNullInvalidObject (styledMessage,         `${dbgNs}printStyledMessage`, `styledMessage`);
  typeValidator.throwOnNullInvalidString      (styledMessage.message, `${dbgNs}printStyledMessage`, `styledMessage.message`);
  typeValidator.throwOnNullInvalidString      (styledMessage.styling, `${dbgNs}printStyledMessage`, `styledMessage.styling`);

  // If styling info was provided, use it. Otherwise just log an unadorned message to the console.
  if (styledMessage.styling) {
    console.log(chalk`{${styledMessage.styling} ${styledMessage.message}}`);
  }
  else {
    console.log(styledMessage.message);
  }
}

//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    renderTable
 * @param       {SfdxFalconKeyValueTableDataRow[]}  data  Required.
 * @param       {Partial<TableOptions>} [tableOptionsOverride]  Optional.
 * @returns     {void}
 * @description Table rendering code borrowed from oclif's cli-ux module. Original code can be found
 *              at https://github.com/oclif/cli-ux/blob/master/src/styled/table.ts
 * @private
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
function renderTable(data:SfdxFalconKeyValueTableDataRow[], tableOptionsOverride:Partial<TableOptions> = {}):void {

  const tableOptions:TableOptions = {
    // DEFINE default table tableOptions
    colSep: '  ',
    after: () => {},
    headerAnsi: _.identity,
    printLine: (s:any) => console.log(s),                             // tslint:disable-line: no-any
    printRow: function(cells:any[]) {                                 // tslint:disable-line: no-any
      this.printLine((cells.join(this.colSep) as any).trimRight());   // tslint:disable-line: no-any
    },
    printInverseRow: function(cells:any[]) {                          // tslint:disable-line: no-any
      for (let i=0; i < cells.length; i++) {
        process.stdout.write(chalk.inverse(cells[i]));
        if (i < cells.length -1) {
          process.stdout.write(this.colSep);
        }
      }
      process.stdout.write('\n');
    },
    printHeader: function(cells:any[]) {                              // tslint:disable-line: no-any
      this.printRow(cells.map(_.ary(this.headerAnsi, 1)));
      this.printRow(cells.map(hdr => hdr.replace(/./g, '─')));
    },

    // MERGE default table options with the ones provided by the caller.
    // This MUST be placed here (between default table options and column definitions).
    // Place it BEFORE the defaults, and the defaults always "win" the merge caused
    // by the spread (...) operator.  Place it AFTER the columns definition and
    // you overwrite the definition of critical functions (eg. format & get), meaning that
    // the caller MUST provide an array of FULLY fleshed out TableColumns
    ...tableOptionsOverride,

    // BEGIN columns definition. This must be the LAST element of the TableOptions definition
    columns: (tableOptionsOverride.columns || []).map(c => ({
      format: (value:any) => {                                        // tslint:disable-line: no-any
        return value != null ? value.toString() : '';
      },
      width: 0,
      label: function() {
        return this.key!.toString();
      },
      get: function(row:any) {                                        // tslint:disable-line: no-any
        let value:any;                                                // tslint:disable-line: no-any
        const path:any = _.result(this, 'key');                       // tslint:disable-line: no-any

        if (!path) {
          value = row;
        } else {
          value = _.get(row, path);
        }
        return (this.format as any)(value, row);                      // tslint:disable-line: no-any
      },
      ...c
    }))
    // ENDOF columns definition
  };

  SfdxFalconDebug.obj(`${dbgNs}renderTable:`, tableOptions, `tableOptions: `);

  function calcWidth(cell:any) {                                      // tslint:disable-line: no-any
    const lines = stripAnsi(cell).split(/[\r\n]+/);
    const lineLengths = lines.map(_.property('length'));
    return Math.max.apply(Math, lineLengths);
  }

  function pad(string:string, length:number) {                        // tslint:disable-line: no-shadowed-variable
    const visibleLength = stripAnsi(string).length;
    const diff = length - visibleLength;
    return string + ' '.repeat(Math.max(0, diff));
  }

  function render() {
    let columns:TableColumn[] = tableOptions.columns as any;          // tslint:disable-line: no-any

    if (typeof columns[0] === 'string') {
      columns = (columns as any).map((key:any) => ({key: key}));      // tslint:disable-line: no-any
    }

    for (const row of data) {
      row.height = 1;
      for (const col of columns) {
        const cell = col.get(row as any);                             // tslint:disable-line: no-any
        col.width = Math.max((_.result(col, 'label') as string).length, col.width || 0, calcWidth(cell));
        row.height = Math.max(row.height || 0, cell.split(/[\r\n]+/).length);
      }
    }

    if (tableOptions.printHeader) {
      tableOptions.printHeader(
        columns.map(col => {
          const label = _.result(col, 'label') as string;
          return pad(label, col.width || label.length);
        })
      );
    }

    function getNthLineOfCell(n:any, row:any, col:any) {           // tslint:disable-line: no-any
      const lines = col.get(row).split(/[\r\n]+/);
      return pad(lines[n] || '', col.width);
    }

    for (const row of data) {
      for (let i = 0; i < (row.height || 0); i++) {
        const cells = columns.map(_.partial(getNthLineOfCell, i, row));
        tableOptions.printRow(cells);
      }
      tableOptions.after(row, tableOptions);
    }
  }

  render();
}

//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @class       SfdxFalconKeyValueTable
 * @description Uses table creation code borrowed from the SFDX-Core UX library to make it easy to
 *              build "Key/Value" tables. These are marked by a single line header that uses an
 *              inverse font, a single space separator between cells, bold text for "Keys" and
 *              green text for "Values".
 * @public
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
export class SfdxFalconKeyValueTable {

  //───────────────────────────────────────────────────────────────────────────┐
  // Define class member variables/types.
  //───────────────────────────────────────────────────────────────────────────┘
  private tableColumnKeys:   TableColumnKey[];
  private tableOptions:      Partial<TableOptions>;

  //───────────────────────────────────────────────────────────────────────────────────────────────┐
  /**
   * @constructs  SfdxFalconKeyValueTable
   * @param       {TableColumnKey[]} [tableColumnKeys] Optional. Overrides Column keys/labels.
   * @param       {Partial<TableOptions>} [tableOptions] Optional. Allows override of the Table
   *              Options that are used to initialize/render the table.
   * @param       {boolean} [debugMode] Optional. Set to TRUE to enable debug output from inside
   *              SfdxFalconKeyValueTable.
   * @description Constructs an SfdxFalconKeyValueTable object.
   * @public
   */
  //───────────────────────────────────────────────────────────────────────────────────────────────┘
  constructor(tableColumnKeys?:TableColumnKey[], tableOptions?:Partial<TableOptions>, debugMode?:boolean) {

    // Define the table columns. Use defaults if not properly specified by caller.
    if (typeof tableColumnKeys === 'undefined' || tableColumnKeys.length !== 2) {
      // By default, the keys should be "option" and "value".
      this.tableColumnKeys = [
        {
          key: 'option',
          label: 'OPTIONS'
        },
        {
          key: 'value',
          label: 'VALUES'
        }
      ];
    }

    // Define table options. Use the spread operator to add any overrides
    // specified by the caller.  Note that the overrides of printHeader
    // and printRow are what makes this a "Key/Value" table.
    this.tableOptions = {
      colSep: ' ',
      printHeader: function(cells:any[]) {                            // tslint:disable-line: no-any
        const headerCells = cells.map(_.ary(this.headerAnsi, 1));
        for (let i=0; i < headerCells.length; i++) {
          process.stdout.write(chalk.inverse(headerCells[i]));
          if (i < headerCells.length -1) {
            process.stdout.write(this.colSep);
          }
        }
        process.stdout.write('\n');
      },
      printRow: function(cells:any[]) {                               // tslint:disable-line: no-any
        process.stdout.write(chalk.bold(cells[0]));
        process.stdout.write(this.colSep);
        process.stdout.write(chalk.green(cells[1]));
        process.stdout.write('\n');
      },
      // Allow overrides of table options from the caller.
      ...tableOptions,
      // Define the columns key here to make sure that OUR definition is the last one set.
      columns: this.tableColumnKeys
    };
  }

  //───────────────────────────────────────────────────────────────────────────────────────────────┐
  /**
   * @method      render
   * @param       {SfdxFalconKeyValueTableDataRow[]} keyValueTableData Array of table data
   *              row objects. Each row must provided data using the keys "option" and "value".
   * @returns     {void}
   * @description Renders an SFDX-Falcon themed Key/Value table with the header "OPTIONS"/"DEFAULT"
   * @public
   */
  //───────────────────────────────────────────────────────────────────────────────────────────────┘
  public render(keyValueTableData:SfdxFalconKeyValueTableDataRow[]):void {
    renderTable(
      keyValueTableData,
      this.tableOptions
    );
  }
}
