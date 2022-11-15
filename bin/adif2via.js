#!/usr/bin/env node

import {readFileSync, writeFile} from 'fs';
import yargs from 'yargs';
import {hideBin} from 'yargs/helpers'
import chalk from 'chalk';
import boxen from 'boxen';
import {AdifFormatter, AdifParser} from 'adif-parser-ts';
import dayjs from 'dayjs';
import {parse} from 'csv-parse/sync';
import path from 'path'
import sortPkg from 'fast-sort';

const {sort} = sortPkg;

const cliOptions = yargs(hideBin(process.argv))
    .usage("Usage: -f <file> -m <manager>")
    .version('1.1.0')
    .option('f', {
        alias: "file",
        describe: "Path to ADIF file ",
        type: "string",
        demandOption: true
    })
    .option('m', {
        alias: "manager",
        describe: "Path to CSV manager file from https://www.okdxf.eu/index.php/databaze-qsl-manazeru",
        type: "string",
        demandOption: true
    })
    .argv

const loadedMsg = chalk.white.bold(`Loaded ADIF file ${cliOptions.file}\nLoaded CSV manager file ${cliOptions.manager}`)

const boxenOptions = {
    padding: 1,
    margin: 1,
    borderStyle: "round",
    borderColor: "green",
    backgroundColor: "#0b0c0b"
};

console.log(boxen(loadedMsg, boxenOptions));

let start = new Date();

try {
    const managerDateFormat = 'YYYY-MM';

    let csvFileContent = readFileSync(cliOptions.manager, 'utf8');
    const header = `"call";"manager";"date"\n`;
    const managerRecordsUnsorted = parse(header + csvFileContent, {
        columns: true,
        trim: true,
        skip_empty_lines: true,
        delimiter: ';'
    });
    const managerRecords = sort(managerRecordsUnsorted).desc(r => dayjs(r.date, managerDateFormat));
    let adifFileContent = readFileSync(cliOptions.file, 'utf8');
    let adifContent = AdifParser.parseAdi(adifFileContent);
    let decoratedAdifRecords = [];
    let managerAdifRecords = [];
    let nonManagerAdifRecords = [];
    let qsoCount = adifContent.records.length;
    let managerCount = managerRecords.length;
    let qsoViaManagerCallsCount = 0;
    let inputFilePathDir = path.parse(cliOptions.file).dir === '' ? '' : path.parse(cliOptions.file).dir + '/';
    let inputFilePathFilename = path.parse(cliOptions.file).name;
    let outputFinishedFilePath = `${inputFilePathDir}finished_${inputFilePathFilename}.adi`;
    let outputManagerFilePath = `${inputFilePathDir}manager_${inputFilePathFilename}.adi`;
    let outputNonManagerFilePath = `${inputFilePathDir}non-manager_${inputFilePathFilename}.adi`;

    adifContent.records.forEach(qso => {
        // TODO: resolve QSL manager date logic
        let manager = managerRecords.find(m => m['call'].toUpperCase() === qso['call'].toUpperCase());
        if (manager !== undefined) {
            console.log(
                `${chalk.cyanBright.bold(qso['call'])} VIA ${chalk.yellow.bold(manager['manager'])} FROM ${chalk.greenBright.bold(manager['date'])}`
            );
            qso['qsl_via'] = (qso['qsl_via'] === undefined || qso['qsl_via'] === '') ? manager['manager'] : qso['qsl_via'];
            managerAdifRecords.push(qso);
            qsoViaManagerCallsCount++;
        } else {
            nonManagerAdifRecords.push(qso);
        }
        decoratedAdifRecords.push(qso);
    });

    writeFile(
        outputFinishedFilePath,
        AdifFormatter.formatAdi({header: adifContent.header, records: decoratedAdifRecords}),
        function (err) {
            if (err) {
                return console.log(err);
            }
        });

    writeFile(
        outputManagerFilePath,
        AdifFormatter.formatAdi({header: adifContent.header, records: managerAdifRecords}),
        function (err) {
            if (err) {
                return console.log(err);
            }
        });

    writeFile(
        outputNonManagerFilePath,
        AdifFormatter.formatAdi({header: adifContent.header, records: nonManagerAdifRecords}),
        function (err) {
            if (err) {
                return console.log(err);
            }
        });

    const qsoResult = chalk.green.bold(`Processed ${cliOptions.file} with ${qsoCount} QSO records`);
    const managerResult = chalk.cyanBright.bold(
        `Processed ${cliOptions.manager} with ${managerCount} managers\nFound ${qsoViaManagerCallsCount} VIA Calls`
    );
    const outputFiles = chalk.yellowBright.bold(
        `Output files:\n\n${outputFinishedFilePath}\n${outputManagerFilePath}\n${outputNonManagerFilePath}`
    );

    console.log(boxen(qsoResult, boxenOptions));
    console.log(boxen(managerResult, boxenOptions));
    console.log(boxen(outputFiles, boxenOptions));
    console.log('Execution time: %dms', new Date() - start);

} catch (err) {
    console.error(err)
}
