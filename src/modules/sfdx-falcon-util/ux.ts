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
// Import External Modules
import * as _ from 'lodash';

// Import Internal Modules
import {SfdxFalconDebug}  from  '../../modules/sfdx-falcon-debug';  // Why?

// Requires
//const debug           = require('debug')('ux-helper');              // Utility for debugging. set debug.enabled = true to turn on.
const stripAnsi       = require('strip-ansi');                      // Strips ANSI escape codes from strings.
const chalk           = require('chalk');                           // Utility for creating colorful console output.
const pad             = require('pad');                             // Provides consistent spacing when trying to align console output.

// Set the File Local Debug Namespace
const dbgNs     = 'UTILITY:ux:';
const clsDbgNs  = '';


// Interfaces
export interface SfdxFalconKeyValueTableDataRow {
  option:string;
  value:string;
}

export interface StatusMessage {
  title:    string;
  message:  string;
  type:     'error'|'info'|'success'|'warning'
}

export interface TableColumn {
  key: string
  label?: string | (() => string)
  format(value: string, row: string): string
  get(row: any[]): string
  width: number
}

export interface TableColumnKey {
  key: string
  label?: string | (() => string)
}

export interface TableOptions {
  columns: Partial<TableColumn>[]
  colSep: string
  after(row: any[], options: TableOptions): void
  printLine(row: any[]): void
  printRow(row: any[]): void
  printInverseRow(row: any[]): void
  printHeader(row: any[]): void
  headerAnsi: any
}


//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    printStatusMessages
 * @access      private
 * @version     1.0.0
 * @description ????
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
export function printStatusMessage(statusMessage:StatusMessage, padLength:number=0, separator:string=' : '):void {
  // Validate input
  if (typeof statusMessage.title !== 'string') {
    throw new TypeError('ERROR_INVALID_TYPE: String expected for statusMessage.title');
  }
  if (typeof statusMessage.message !== 'string') {
    throw new TypeError('ERROR_INVALID_TYPE: String expected for statusMessage.message');
  }
  if (typeof separator !== 'string') {
    throw new TypeError('ERROR_INVALID_TYPE: String expected for separator');
  }
  if (isNaN(padLength)) {
    padLength = 0;
  }
  // Print the Status Message
  switch (statusMessage.type) {
    case 'error':
      console.log(chalk`{bold.red ${pad(statusMessage.title, padLength)+separator}}{bold ${statusMessage.message}}`);
      break;
    case 'info':
      console.log(chalk`{bold ${pad(statusMessage.title, padLength)+separator}}${statusMessage.message}`);
      break;
    case 'success':
      console.log(chalk`{bold ${pad(statusMessage.title, padLength)+separator}}{green ${statusMessage.message}}`);
      break;
    case 'warning':
      console.log(chalk`{bold ${pad(statusMessage.title, padLength)+separator}}{yellow ${statusMessage.message}}`);
      break;
    default:
      throw new Error('ERROR_INVALID_MESSAGE_TYPE');
  }
}

//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    printStatusMessages
 * @access      private
 * @version     1.0.0
 * @description ????
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
export function printStatusMessages(statusMessages:Array<StatusMessage>, separator:string=' : '):void {
  // Validate input
  if (Array.isArray(statusMessages) === false) {
    throw new TypeError('ERROR_INVALID_TYPE: Array expected for statusMessages');
  }
  if (typeof separator !== 'string') {
    throw new TypeError('ERROR_INVALID_TYPE: String expected for separator');
  }
  
  // Calculate the length of the longest StatusMessage Title
  let longestTitle = 0;
  for (let statusMessage of statusMessages) {
    if (typeof statusMessage.title !== 'undefined') {
      longestTitle = Math.max(statusMessage.title.length, longestTitle);
    }
  }

  // Set the header text for the final status messages. Padding to length
  // of longest title, then adding separator length - 1 will only provide
  // ideal results if there is one blank space to the right of the specified
  // separator string.
  let statusHeader = pad('Final Status', longestTitle + separator.length - 1);

  // Print a header for the Status Messages
  console.log(chalk`{inverse ${statusHeader}}`);

  // Print all of the Satus Messages
  for (let statusMessage of statusMessages) {
    printStatusMessage(statusMessage, longestTitle, separator);
  }
}

//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    renderTable
 * @access      private
 * @version     1.0.0
 * @description Table rendering code borrowed from oclif's cli-ux module. Original code can be found
 *              at https://github.com/oclif/cli-ux/blob/master/src/styled/table.ts
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
function renderTable(data: any[], tableOptionsOverride: Partial<TableOptions> = {}) {

  const tableOptions: TableOptions = {
    // DEFINE default table tableOptions
    colSep: '  ',
    after: () => {},
    headerAnsi: _.identity,
    printLine: (s: any) => console.log(s),
    printRow(cells: any[]) {
      this.printLine((cells.join(this.colSep) as any).trimRight());
    },
    printInverseRow(cells: any[]) {
      for (var i=0; i < cells.length; i++) {
        process.stdout.write(chalk.inverse(cells[i]));
        if (i < cells.length -1) {
          process.stdout.write(this.colSep);
        }
      }
      process.stdout.write('\n');
    },
    printHeader(cells: any[]) {
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
      format: (value: any) => (value != null ? value.toString() : ''),
      width: 0,
      label() {
        return this.key!.toString();
      },
      get(row: any) {
        let value;
        let path: any = _.result(this, 'key');

        if (!path) {
          value = row;
        } else {
          value = _.get(row, path);
        }
        return (this.format as any)(value, row);
      },
      ...c,
    })),
    // ENDOF columns definition
  }

  SfdxFalconDebug.obj(`${dbgNs}renderTable:`, tableOptions, `${clsDbgNs}tableOptions: `);

  function calcWidth(cell: any) {
    let lines = stripAnsi(cell).split(/[\r\n]+/);
    let lineLengths = lines.map(_.property('length'));
    return Math.max.apply(Math, lineLengths);
  }

  function pad(string: string, length: number) {
    let visibleLength = stripAnsi(string).length;
    let diff = length - visibleLength;

    return string + ' '.repeat(Math.max(0, diff));
  }

  function render() {
    let columns: TableColumn[] = tableOptions.columns as any;

    if (typeof columns[0] === 'string') {
      columns = (columns as any).map((key: any) => ({key}));
    }

    for (let row of data) {
      row.height = 1;
      for (let col of columns) {
        let cell = col.get(row);
        col.width = Math.max((_.result(col, 'label') as string).length, col.width || 0, calcWidth(cell));
        row.height = Math.max(row.height || 0, cell.split(/[\r\n]+/).length);
      }
    }

    if (tableOptions.printHeader) {
      tableOptions.printHeader(
        columns.map(function (col) {
          let label = _.result(col, 'label') as string;
          return pad(label, col.width || label.length);
        }),
      );
    }

    function getNthLineOfCell(n: any, row: any, col: any) {
      // TODO memoize this
      let lines = col.get(row).split(/[\r\n]+/);
      return pad(lines[n] || '', col.width);
    }

    for (let row of data) {
      for (let i = 0; i < (row.height || 0); i++) {
        let cells = columns.map(_.partial(getNthLineOfCell, i, row));
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
 * @access      public
 * @version     1.0.0
 * @description Uses table creation code borrowed from the SFDX-Core UX library to make it easy to
 *              build "Key/Value" tables. These are marked by a single line header that uses an
 *              inverse font, a single space separator between cells, bold text for "Keys" and
 *              green text for "Values".
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
export class SfdxFalconKeyValueTable {

  //───────────────────────────────────────────────────────────────────────────┐
  // Define class member variables/types.
  //───────────────────────────────────────────────────────────────────────────┘
  private tableColumnKeys:   Array<TableColumnKey>;
  private tableOptions:      Partial<TableOptions>;

  //───────────────────────────────────────────────────────────────────────────────────────────────┐
  /**
   * @constructs  SfdxFalconKeyValueTable
   * @version     1.0.0
   * @param       {Array<TableColumnKey>} [tableColumnKeys] Optional.
   *              Allows override of Column key and label values.
   * @param       {Partial<TableOptions>} [tableOptions] Optional.
   *              Allows override of the Table Options that are used to initialize/render the table.
   * @param       {boolean}               [debugMode] Optional.
   *              Set to TRUE to enable debug output from inside SfdxFalconKeyValueTable.
   * @description Constructs an SfdxFalconKeyValueTable object.
   */
  //───────────────────────────────────────────────────────────────────────────────────────────────┘
  constructor(tableColumnKeys?: Array<TableColumnKey>, tableOptions?: Partial<TableOptions>, debugMode?:boolean) {

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
      printHeader(cells: any[]) {
        let headerCells = cells.map(_.ary(this.headerAnsi, 1));
        for (var i=0; i < headerCells.length; i++) {
          process.stdout.write(chalk.inverse(headerCells[i]));
          if (i < headerCells.length -1) {
            process.stdout.write(this.colSep);
          }
        }
        process.stdout.write('\n');  
      },
      printRow(cells: any[]) {
        process.stdout.write(chalk.bold(cells[0]));
        process.stdout.write(this.colSep);
        process.stdout.write(chalk.green(cells[1]));
        process.stdout.write('\n');          
      },
      // Allow overrides of table options from the caller.
      ...tableOptions,
      // Define the columns key here to make sure that OUR definition is the last one set.
      columns: this.tableColumnKeys,
    }
  }

  //───────────────────────────────────────────────────────────────────────────────────────────────┐
  /**
   * @function    render
   * @version     1.0.0
   * @param       {Array<SfdxFalconKeyValueTableDataRow>} keyValueTableData Array of table data
   *              row objects. Each row must provided data using the keys "option" and "value".
   * @description Renders an SFDX-Falcon themed Key/Value table with the header "OPTIONS"/"DEFAULT"
   */
  //───────────────────────────────────────────────────────────────────────────────────────────────┘
  public render(keyValueTableData:Array<SfdxFalconKeyValueTableDataRow>) {
    renderTable(
      keyValueTableData,
      this.tableOptions
    );
  }
}