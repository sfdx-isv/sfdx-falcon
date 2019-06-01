//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @file          modules/sfdx-falcon-util/csv.ts
 * @copyright     Vivek M. Chawla - 2019
 * @author        Vivek M. Chawla <@VivekMChawla>
 * @summary       CSV file helper utility library
 * @description   Exports functions that help work with CSV files.
 * @version       1.0.0
 * @license       MIT
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
// Import External Modules
import {JsonMap}          from  '@salesforce/ts-types';   // Any JSON-compatible object.
import * as csv           from  'csv-parser';             // Streaming CSV parser that aims for maximum speed as well as compatibility with the csv-spectrum CSV acid test suite.
import * as fs            from  'fs';                     // Node's FileStream module. Allows for read/write access to local files.

// Import Internal Modules
import {SfdxFalconDebug}  from  '../../modules/sfdx-falcon-debug';      // Class. Specialized debug provider for SFDX-Falcon code.
import {SfdxFalconError}  from  '../../modules/sfdx-falcon-error';      // Class. Specialized Error object. Wraps SfdxError.

// Set the File Local Debug Namespace
const dbgNs = 'UTILITY:csv:';


//─────────────────────────────────────────────────────────────────────────────────────────────────┐
/**
 * @function    parseFile
 * @param       {string}  csvFilePath Required. Path to a CSV file.
 * @param       {csv.Options} [opts]  Optional. CSV file parsing options.
 * @returns     {Promise<JsonMap[]>} Array of JSON Maps, one for each row of the CSV file.
 * @description Given the path to a valid CSV file, parses that file and returns an array of
 *              JSON Maps, one for each row of the CSV file.
 * @public @async
 */
//─────────────────────────────────────────────────────────────────────────────────────────────────┘
export async function parseFile(csvFilePath:string, opts:csv.Options={}):Promise<JsonMap[]> {

  // Debug incoming arguments
  SfdxFalconDebug.obj(`${dbgNs}parseFile:arguments:`, arguments);

  // Results will be an array of JSON Maps.
  const results = [] as JsonMap[];

  // Wrap the file system stream read in a promise.
  return new Promise((resolve, reject) => {
    fs.createReadStream(csvFilePath)
    .on('error', (error:Error) => {
      reject(new SfdxFalconError( `Unable to read '${csvFilePath}'.  ${error.message}`
                                , `FileStreamError`
                                , `${dbgNs}parseFile`
                                , error));
    })
    .pipe(csv(opts))
    .on('data', (data:JsonMap) => results.push(data))
    .on('end',  () => {
      SfdxFalconDebug.obj(`${dbgNs}parseFile:results:`, results, `results: `);
      resolve(results);
    })
    .on('error', (error:Error) => {
      reject(new SfdxFalconError( `Unable to parse '${csvFilePath}'.  ${error.message}`
                                , `CsvParsingError`
                                , `${dbgNs}parseFile`
                                , error));
    });
  });
}
