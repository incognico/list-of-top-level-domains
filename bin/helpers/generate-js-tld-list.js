#!/usr/bin/env node

const meName = 'generate-js-tld-list.js';

process.on('unhandledRejection', error => {
    console.error(meName + ": (FATAL)", error);
    process.exit(1);
});

const countries = require('country-data').countries;
const country = require('countryjs');
const parse = require('csv-parse');
const fs = require('fs-extra');
const path = require('path');
const md5File = require('md5-file');
const pathinfo = require('pathinfo');
const program = require('commander');
const tmp = require('tmp');

const fileTldListJs = path.dirname(require.main.filename) + '/../../formats/js/tld-enum/list.js';
const fileTldsCsv = path.dirname(require.main.filename) + '/../../tlds.csv';

program
    .option('-q, --quiet', 'Quiet Mode')
    .parse(process.argv);

if (!program.quiet) {
    console.log(meName);
    console.log("   (c) 2017 Doug Bird, All Rights Reserved.");
    console.log("   see README.md for licensing and other information");
    console.log("   https://github.com/katmore/tld-list#readme");
    console.log("");
    console.log("   Generates new JavaScript format file 'list.js' from the 'tlds.csv' file");
    console.log("");
}

(async() => {

    const tldEnumStartTldList = 'module.exports = ';
    const tldEnumEndTldList = ';';

    const tmpDir = tmp.dirSync({ unsafeCleanup: true });

    const fileNewTldListJs = tmpDir.name + '/list.js';

    let existingMd5 = null;

    if (fs.existsSync(fileTldListJs)) {
        existingMd5 = md5File.sync(fileTldListJs);
        const pathinfoTlds = pathinfo(fileTldListJs);
        const fileBackupTlds = pathinfoTlds.dirname + pathinfoTlds.sep + pathinfoTlds.basename + '-' + existingMd5 + '-backup.js';
        if (!fs.existsSync(fileBackupTlds)) {
            fs.copySync(fileTldListJs, fileBackupTlds);
        }
    }

    process.stdout.write("reading 'tlds.csv'...");

    let parser = parse({ delimiter: ',' });

    let tldEnum = [];
    let i = 0;
    parser.on('readable', function() {
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

    parser.end(function() {
      console.log("done");

      process.stdout.write("generating new 'list.js' file...");

      fs.writeFileSync(fileNewTldListJs, tldEnumStartTldList);

      fs.appendFileSync(fileNewTldListJs, JSON.stringify(tldEnum, null, 2));

      fs.appendFileSync(fileNewTldListJs, tldEnumEndTldList);

      console.log("done");

      if (existingMd5) {
          const newMd5 = md5File.sync(fileNewTldListJs);
          if (newMd5 == existingMd5) {
              console.error(meName + ": (NOTICE) ignoring newly generated 'list.js' file that is identical to the existing file (md5: " + existingMd5 + ", path: " + fileTldListJs + ")");
              return;
          }
      }
      fs.copySync(fileNewTldListJs, fileTldListJs);

      console.log("saved new 'list.js' file");      
    });

})();