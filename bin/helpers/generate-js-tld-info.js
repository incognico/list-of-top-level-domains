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
const tmp = require('tmp');

//tmp.setGracefulCleanup();

const fileTldInfoJs = path.dirname(require.main.filename) + '/../../formats/js/tld-enum/info.js';
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
    console.log("   Generates new JavaScript format file 'info.js' from the 'tlds.csv' file");
    console.log("");
}

(async() => {

    const tldInfoStartTldInfo = 'module.exports = ';
    const tldInfoEndTldInfo = ';';

    const tmpDir = tmp.dirSync({ unsafeCleanup: true });

    const fileNewTldInfoJs = tmpDir.name + '/info.js';

    let existingMd5 = null;

    if (fs.existsSync(fileTldInfoJs)) {
        existingMd5 = md5File.sync(fileTldInfoJs);
        const pathinfoTlds = pathinfo(fileTldInfoJs);
        const fileBackupTlds = pathinfoTlds.dirname + pathinfoTlds.sep + pathinfoTlds.basename + '-' + existingMd5 + '-backup.js';
        if (!fs.existsSync(fileBackupTlds)) {
            fs.copySync(fileTldInfoJs, fileBackupTlds);
        }
    }

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

      process.stdout.write("generating new 'info.js' file...");

      fs.writeFileSync(fileNewTldInfoJs, tldInfoStartTldInfo);

      fs.appendFileSync(fileNewTldInfoJs, JSON.stringify(tldInfo, null, 2));

      fs.appendFileSync(fileNewTldInfoJs, tldInfoEndTldInfo);

      console.log("done");

      if (existingMd5) {
          const newMd5 = md5File.sync(fileNewTldInfoJs);
          if (newMd5 == existingMd5) {
              console.error(meName + ": (NOTICE) ignoring newly generated 'info.js' file that is identical to the existing file (md5: " + existingMd5 + ", path: " + fileTldInfoJs + ")");
              return;
          }
      }
      fs.copySync(fileNewTldInfoJs, fileTldInfoJs);

      console.log("saved new 'info.js' file");      
    });

})();