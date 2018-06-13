#!/usr/bin/env node

const meName = 'generate-json-tld-enum.js';

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

tmp.setGracefulCleanup();

const fileTldListJson = path.dirname(require.main.filename) + '/../../formats/json/tld-list.json';
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
    console.log("   Generates new JSON format file 'tld-list.json' from the 'tlds.csv' file");
    console.log("");
}

(async() => {

    const tmpDir = tmp.dirSync({ unsafeCleanup: true });

    const fileNewTldListJson = tmpDir.name + '/tld-list.json';

    let existingMd5 = null;

    if (fs.existsSync(fileTldListJson)) {
        existingMd5 = await md5File(fileTldListJson);
        const pathinfoTlds = pathinfo(fileTldListJson);
        const fileBackupTlds = pathinfoTlds.dirname + pathinfoTlds.sep + pathinfoTlds.basename + '-' + existingMd5 + '-backup.json';
        if (!fs.existsSync(fileBackupTlds)) {
            fs.copySync(fileTldListJson, fileBackupTlds);
        }
    }

    process.stdout.write("reading 'tlds.csv'...");

    let parser = parse({ delimiter: ',' });

    let tldEnum = [];

    parser.on('readable', function() {
        let i = 0;
        let row;
        while (row = parser.read()) {
            if (!row.length) {
                console.error(meName + ": (FATAL) invalid 'tlds.csv' row #" + i + ": " + fileTldsCsv);
                process.exit(1);
            }
            tldEnum.push(row[0]);
            i++;
        }
    });

    parser.write(fs.readFileSync(fileTldsCsv));

    parser.end();

    console.log("done");

    process.stdout.write("generating new 'tld-list.json' file...");

    fs.writeFileSync(fileNewTldListJson, JSON.stringify(tldEnum, null, 2));

    console.log("done");

    if (existingMd5) {
        const newMd5 = await md5File(fileNewTldListJson);
        if (newMd5 == existingMd5) {
            console.error(meName + ": (NOTICE) ignoring newly generated 'tld-list.json' file that is identical to the existing file (md5: " + existingMd5 + ", path: " + fileTldListJson + ")");
            return;
        }
    }
    fs.copySync(fileNewTldListJson, fileTldListJson);
    console.log("saved new 'tld-list.json' file");

})();