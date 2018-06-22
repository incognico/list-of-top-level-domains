#!/usr/bin/env node

const meName = 'generate-js-tld-type.js';

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

//tmp.setGracefulCleanup();

const fileTldTypeJs = path.dirname(require.main.filename) + '/../../../formats/js/tld-enum/type.js';
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
    console.log("   Generates new JavaScript format file 'type.js' from the 'tlds.csv' file");
    console.log("");
}

(async() => {

    const tldTypeStartTldType = 'module.exports = ';
    const tldTypeEndTldType = ';';

    const tmpDir = tmp.dirSync({ unsafeCleanup: true });

    const fileNewTldTypeJs = tmpDir.name + '/type.js';

    let existingMd5 = null;

    if (fs.existsSync(fileTldTypeJs)) {
        existingMd5 = md5File.sync(fileTldTypeJs);
        const pathinfoTlds = pathinfo(fileTldTypeJs);
        const fileBackupTlds = pathinfoTlds.dirname + pathinfoTlds.sep + pathinfoTlds.basename + '-' + existingMd5 + '-backup.js';
        if (!fs.existsSync(fileBackupTlds)) {
            fs.copySync(fileTldTypeJs, fileBackupTlds);
        }
    }

    process.stdout.write("reading 'tlds.csv'...");

    let parser = parse({ delimiter: ',' });

    let tldType = {};
    let i = 0;
    parser.on('readable', function() {
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

    parser.end(function() {
      console.log("done");

      process.stdout.write("generating new 'type.js' file...");

      fs.writeFileSync(fileNewTldTypeJs, tldTypeStartTldType);

      fs.appendFileSync(fileNewTldTypeJs, JSON.stringify(tldType, null, 2));

      fs.appendFileSync(fileNewTldTypeJs, tldTypeEndTldType);

      console.log("done");

      if (existingMd5) {
          const newMd5 = md5File.sync(fileNewTldTypeJs);
          if (newMd5 == existingMd5) {
              console.error(meName + ": (NOTICE) ignoring newly generated 'type.js' file that is identical to the existing file (md5: " + existingMd5 + ", path: " + fileTldTypeJs + ")");
              return;
          }
      }
      fs.copySync(fileNewTldTypeJs, fileTldTypeJs);

      console.log("saved new 'type.js' file");      
    });

})();