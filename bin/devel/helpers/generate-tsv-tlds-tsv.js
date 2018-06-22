#!/usr/bin/env node

const meName = 'generate-js-tld-info.js';

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
const stringify = require('csv-stringify');
const tmp = require('tmp');

//tmp.setGracefulCleanup();

const fileTldsTsv = path.dirname(require.main.filename) + '/../../../formats/tsv/tlds.tsv';
const fileTldsCsv = path.dirname(require.main.filename) + '/../../../tlds.csv';

program
    .option('-q, --quiet', 'Quiet Mode')
    .parse(process.argv);

if (!program.quiet) {
    console.log(meName);
    console.log("   (c) 2017 Doug Bird, All Rights Reserved.");
    console.log("   see README.md for licensing and other information");
    console.log("   https://github.com/katmore/tld-enum#readme");
    console.log("");
    console.log("   Generates new Tab-Separated-Value format file 'tlds.tsv' from the 'tlds.csv' file");
    console.log("");
}

(async() => {

    const tldInfoStartTldInfo = 'module.exports = ';
    const tldInfoEndTldInfo = ';';

    const tmpDir = tmp.dirSync({ unsafeCleanup: true });

    const fileNewTldsTsv = tmpDir.name + '/tlds.tsv';

    let existingMd5 = null;

    process.stdout.write("reading 'tlds.csv'...");

    let parser = parse({ delimiter: ',' });

    let tldInfo = [];
    let i = 0;
    parser.on('readable', function() {
        let row, domain, desc, type;
        while (row = parser.read()) {
            if (!row.length) {
                console.error(meName + ": (FATAL) invalid 'tlds.csv' row #" + i + " in '" + fileTldsCsv+"'");
                process.exit(1);
            }
            if (typeof row[1] === 'undefined') {
              console.error(meName + ": (FATAL) invalid 'tlds.csv', missing column 2 on row #" + i + " in '" + fileTldsCsv+"'");
              process.exit(1);
            }
            if (typeof row[2] === 'undefined') {
              console.error(meName + ": (FATAL) invalid 'tlds.csv', missing column 3 on row #" + i + " in '" + fileTldsCsv+"'");
              process.exit(1);
            }
            domain=row[0];
            desc=row[1];
            type=row[2];
            tldInfo.push({
               'domain' : domain,
               'description' : desc,
               'type' : type,
            });
            i++;
        }
    });

    parser.write(fs.readFileSync(fileTldsCsv));

    parser.end(function() {
      console.log("done");

      const stringifier = stringify({ delimiter: "\t" });
      stringifier.on('readable', () => {
          let row;
          while (row = stringifier.read()) {
              fs.appendFileSync(fileNewTldsTsv, row, 'utf8')
          }
      });

      process.stdout.write("generating new 'tlds.tsv'...");
      for (var i = 0; i < tldInfo.length; i++) {
          let tld = tldInfo[i];
          let csvRow = [tld.domain];
          csvRow.push(tld.description);
          csvRow.push(tld.type);
          stringifier.write(csvRow);

      }
      stringifier.end();
      console.log('done');

      if (fs.existsSync(fileTldsTsv)) {
          const newMd5 = md5File.sync(fileNewTldsTsv);
          const tsvMd5 = md5File.sync(fileTldsTsv);
          if (tsvMd5 == newMd5) {
              console.error(meName + ": (NOTICE) ignoring newly generated 'tlds.tsv' file that is identical to the existing file (md5: " + tsvMd5 + ", path: " + fileTldsTsv + ")");
              return;
          }
          const pathinfoTldsTsv = pathinfo(fileTldsTsv);
          const fileBackupTldsTsv = pathinfoTldsTsv.dirname + pathinfoTldsTsv.sep + pathinfoTldsTsv.basename + '-' + tsvMd5 + '-backup.csv';
          if (!fs.existsSync(fileBackupTldsTsv)) {
              fs.copySync(fileTldsTsv, fileBackupTldsTsv);
          }
      }

      process.stdout.write("saving new 'tlds.csv'...");
      fs.copySync(fileNewTldsTsv, fileTldsTsv);
      console.log('done');      
    });
      

})();