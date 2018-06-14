#!/usr/bin/env node

const meName = 'generate-json-tld-desc.json';

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

const fileTldDescJs = path.dirname(require.main.filename) + '/../../formats/json/tld-desc.json';
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
    console.log("   Generates new JSON format file 'tld-desc.json' from the 'tlds.csv' file");
    console.log("");
}

(async() => {

    const tmpDir = tmp.dirSync({ unsafeCleanup: true });

    const fileNewTldDescJson = tmpDir.name + '/tld-desc.json';

    let existingMd5 = null;

    if (fs.existsSync(fileTldDescJs)) {
        existingMd5 = md5File.sync(fileTldDescJs);
        const pathinfoTlds = pathinfo(fileTldDescJs);
        const fileBackupTlds = pathinfoTlds.dirname + pathinfoTlds.sep + pathinfoTlds.basename + '-' + existingMd5 + '-backup.js';
        if (!fs.existsSync(fileBackupTlds)) {
            fs.copySync(fileTldDescJs, fileBackupTlds);
        }
    }

    process.stdout.write("reading 'tlds.csv'...");

    let parser = parse({ delimiter: ',' });

    let tldDesc = {};
    let i = 0;
    parser.on('readable', function() {
        let row, domain, desc;
        while (row = parser.read()) {
            if (!row.length) {
                console.error(meName + ": (FATAL) invalid 'tlds.csv' row #" + i + " in '" + fileTldsCsv+"'");
                process.exit(1);
            }
            if (typeof row[1] === 'undefined') {
              console.error(meName + ": (FATAL) invalid 'tlds.csv', missing column 2 on row #" + i + " in '" + fileTldsCsv+"'");
              process.exit(1);
            }
            domain=row[0];
            desc=row[1];
            tldDesc[domain]=desc;
            i++;
        }
    });

    parser.write(fs.readFileSync(fileTldsCsv));

    parser.end(function() {
      console.log("done");

      process.stdout.write("generating new 'tld-desc.json' file...");

      fs.appendFileSync(fileNewTldDescJson, JSON.stringify(tldDesc, null, 2));

      console.log("done");

      if (existingMd5) {
          const newMd5 = md5File.sync(fileNewTldDescJson);
          if (newMd5 == existingMd5) {
              console.error(meName + ": (NOTICE) ignoring newly generated 'tld-desc.json' file that is identical to the existing file (md5: " + existingMd5 + ", path: " + fileTldDescJs + ")");
              return;
          }
      }
      fs.copySync(fileNewTldDescJson, fileTldDescJs);

      console.log("saved new 'tld-desc.json' file");      
    });

})();