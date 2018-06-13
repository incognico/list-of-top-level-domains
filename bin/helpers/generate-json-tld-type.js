#!/usr/bin/env node

const meName = 'generate-js-tld-type.json';

process.on('unhandledRejection', error => {
    console.error(meName + ": (FATAL)", error);
    process.exit(1);
});

const countries = require('country-data').countries;
const country = require('countryjs');
const parse = require('csv-parse');
const fs = require('fs-extra');
const path = require('path');
const md5File = require('md5-file/promise');
const pathinfo = require('pathinfo');
const program = require('commander');
const tmp = require('tmp');

//tmp.setGracefulCleanup();

const fileTldTypeJs = path.dirname(require.main.filename) + '/../../formats/json/tld-type.json';
const fileTldsCsv = path.dirname(require.main.filename) + '/../../tlds.csv';

program
    .option('-q, --quiet', 'Quiet Mode')
    .parse(process.argv);

if (!program.quiet) {
    console.log(meName);
    console.log("   (c) 2017 Doug Bird, All Rights Reserved.");
    console.log("   see README.md for licensing and other information");
    console.log("   https://github.com/katmore/tld-enum#readme");
    console.log("");
    console.log("   Generates new JSON format file 'tld-type.json' from the 'tlds.csv' file");
    console.log("");
}

(async() => {

    const tmpDir = tmp.dirSync({ unsafeCleanup: true });

    const fileNewTldTypeJson = tmpDir.name + '/tld-type.json';

    let existingMd5 = null;

    if (fs.existsSync(fileTldTypeJs)) {
        existingMd5 = await md5File(fileTldTypeJs);
        const pathinfoTlds = pathinfo(fileTldTypeJs);
        const fileBackupTlds = pathinfoTlds.dirname + pathinfoTlds.sep + pathinfoTlds.basename + '-' + existingMd5 + '-backup.js';
        if (!fs.existsSync(fileBackupTlds)) {
            fs.copySync(fileTldTypeJs, fileBackupTlds);
        }
    }

    process.stdout.write("reading 'tlds.csv'...");

    let parser = parse({ delimiter: ',' });

    let tldType = {};

    parser.on('readable', function() {
        let i = 0;
        let row, domain, type;
        while (row = parser.read()) {
            if (!row.length) {
                console.error(meName + ": (FATAL) invalid 'tlds.csv' row #" + i + " in '" + fileTldsCsv+"'");
                process.exit(1);
            }
            if (typeof row[2] === 'undefined') {
              console.error(meName + ": (FATAL) invalid 'tlds.csv', missing column 3 on row #" + i + " in '" + fileTldsCsv+"'");
              process.exit(1);
            }
            domain=row[0];
            type=row[2];
            tldType[domain]=type;
            i++;
        }
    });

    parser.write(fs.readFileSync(fileTldsCsv));

    parser.end();

    console.log("done");

    process.stdout.write("generating new 'tld-type.json' file...");

    fs.appendFileSync(fileNewTldTypeJson, JSON.stringify(tldType, null, 2));

    console.log("done");

    if (existingMd5) {
        const newMd5 = await md5File(fileNewTldTypeJson);
        if (newMd5 == existingMd5) {
            console.error(meName + ": (NOTICE) ignoring newly generated 'tld-type.json' file that is identical to the existing file (md5: " + existingMd5 + ", path: " + fileTldTypeJs + ")");
            return;
        }
    }
    fs.copySync(fileNewTldTypeJson, fileTldTypeJs);

    console.log("saved new 'tld-type.json' file");

})();