#!/usr/bin/env node

const meName = 'generate-js-tld-enum.js';

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

const fileTldListJs = path.dirname(require.main.filename) + '/../../formats/js/tld-enum.js';
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
    console.log("   Generates new javascript format files from the 'tlds.csv' file");
    console.log("");
}

(async() => {

    const tldEnumStartTldList = 'exports.tldList = ';
    const tldEnumEndTldList = ';';

    //const tmpDir = tmp.dirSync({ unsafeCleanup: true });
    const tmpDir = tmp.dirSync();

    const fileNewTldListJs = tmpDir.name + '/tld-enum.js';

    let existingMd5 = null;

    if (fs.existsSync(fileTldListJs)) {
        existingMd5 = await md5File(fileTldListJs);
        const pathinfoTlds = pathinfo(fileTldListJs);
        const fileBackupTlds = pathinfoTlds.dirname + pathinfoTlds.sep + pathinfoTlds.basename + '-' + existingMd5 + '-backup.js';
        if (!fs.existsSync(fileBackupTlds)) {
            fs.copySync(fileTldListJs, fileBackupTlds);
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

    process.stdout.write("generating new 'tld-enum.js' file...");

    fs.writeFileSync(fileNewTldListJs, tldEnumStartTldList);

    fs.appendFileSync(fileNewTldListJs, JSON.stringify(tldEnum, null, 2));

    fs.appendFileSync(fileNewTldListJs, tldEnumEndTldList);

    console.log("done");

    if (existingMd5) {
        const newMd5 = await md5File(fileNewTldListJs);
        if (newMd5 == existingMd5) {
            console.error(meName + ": (NOTICE) ignoring newly generated 'tld-enum.js' file that is identical to the existing file (md5: " + existingMd5 + ", path: " + fileTldListJs + ")");
            return;
        }
    }
    fs.copySync(fileNewTldListJs, fileTldListJs);

    console.log("saved new 'tld-enum.js' file");

})();