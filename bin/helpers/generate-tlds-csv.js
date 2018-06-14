#!/usr/bin/env node

const meName = 'generate-tlds-csv.js';

process.on('unhandledRejection', error => {
    console.error(meName + ": (FATAL)", error);
    process.exit(1);
});

const request = require('async-request');
const cheerio = require('cheerio');
const countries = require('country-data').countries;
const country = require('countryjs');
const stringify = require('csv-stringify');
const parse = require('csv-parse');
const fs = require('fs-extra');
const path = require('path');
const md5File = require('md5-file');
const pathinfo = require('pathinfo');
const program = require('commander');
const tmp = require('tmp');

tmp.setGracefulCleanup();

const fileTldDescCsv = path.dirname(require.main.filename) + '/../../assets/tld-desc.csv';
const fileTldsCsv = path.dirname(require.main.filename) + '/../../tlds.csv';
const urlTldsAlpha = 'http://data.iana.org/TLD/tlds-alpha-by-domain.txt';
const urlDomainsDb = 'https://www.iana.org/domains/root/db';

program
    .option('-q, --quiet', 'Quiet Mode')
    .parse(process.argv);

if (!program.quiet) {
    console.log(meName);
    console.log("   (c) 2017 Doug Bird, All Rights Reserved.");
    console.log("   see README.md for licensing and other information");
    console.log("   https://github.com/katmore/tld-enum#readme");
    console.log("");
    console.log("   Generates the canonical 'tlds.csv' csv file by downloading resources from iana.org");
    console.log("");
}

(async() => {

    const tmpDir = tmp.dirSync({ unsafeCleanup: true });

    process.stdout.write("downloading '" + urlTldsAlpha + "'...");

    const responseTldsAlpha = await request(urlTldsAlpha);
    if (responseTldsAlpha.statusCode != 200) {
        console.log("error");
        console.error(meName + ": (FATAL) response status code " + responseTldsAlpha.statusCode + " from URL '" + urlTldsAlpha + "'");
        process.exit(1);
        return;
    }
    if (!responseTldsAlpha.body) {
        console.log("error");
        console.error(meName + ": (FATAL) empty response body " + responseTldsAlpha.statusCode + " from URL '" + urlTldsAlpha + "'");
        process.exit(1);
        return;
    }

    const fileTldsAlphaTxt = tmpDir.name + '/tlds-alpha-by-domain.txt';
    const fileNewTldsCsv = tmpDir.name + '/tlds.csv';

    fs.writeFileSync(fileTldsAlphaTxt, responseTldsAlpha.body, 'utf8');
    fs.writeFileSync(fileNewTldsCsv, '', 'utf8');

    console.log('success');

    process.stdout.write("downloading  '" + urlDomainsDb + "'...");
    const responseDomainsDb = await request(urlDomainsDb);
    if (responseDomainsDb.statusCode != 200) {
        console.log("error");
        console.error(meName + ": (FATAL) response status code " + responseDomainsDb.statusCode + " from URL '" + urlDomainsDb + "'");
        process.exit(1);
        return;
    }
    if (!responseDomainsDb.body) {
        console.log("error");
        console.error(meName + ": (FATAL) empty response body " + responseDomainsDb.statusCode + " from URL '" + urlDomainsDb + "'");
        process.exit(1);
        return;
    }
    const htmlDomainsDb = responseDomainsDb.body;
    var $ = cheerio.load(htmlDomainsDb);
    console.log('success');

    process.stdout.write("building country / TLD hashmap...");

    let tld2CountryName = {};
    let missingTld = [];

    countries.all.forEach((c) => {

        let tld = country.tld(c.alpha3, 'ISO3');
        if (!tld) {
            missingTld.push(c.alpha3);
            return;
        }
        tld2CountryName[tld] = c.name;
    });

    console.log('done');
    
    if (!program.quiet) {
       console.log(meName + ': NOTICE: the following "countries" did not have an assigned top level domain: ' + missingTld.join(', '));
    }

    process.stdout.write("building description / TLD hashmap...");
    let tld2Desc = {};
    let parser = parse({ delimiter: ',' });
    const csvPosMap = {
        domain: 0,
        description: 1,
    }
    parser.on('readable', function() {
        let tldData;
        while (tldData = parser.read()) {
            let tld = {
                domain: null,
                description: null,
            };
            let prop;
            for (prop in tld) {
                if (typeof(tldData[csvPosMap[prop]]) !== 'undefined') {
                    tld[prop] = tldData[csvPosMap[prop]];
                }
            }
            if (tld.domain && tld.description) {
                tld2Desc[tld.domain] = tld.description;
            }
        }
    });

    parser.write(fs.readFileSync(fileTldDescCsv));

    parser.end(function() {
      console.log("done");

      const tdPosMap = {
          domain: 0,
          type: 1,
          manager: 2,
      };

      let tldSet = [];

      process.stdout.write("parsing IANA data...");
      $('#tld-table').find('tr').each((i, element) => {
          let tld = {
              domain: null,
              type: null,
              manager: null,
          };
          let tldData = [];
          // console.log('i ' + i);
          // console.log(element);
          $(element).find("td").each((iTd, elementTd) => {
              // console.log('iTd...');
              // console.log(iTd);
              tldData.push($(elementTd).text());
          });

          for (var prop in tld) {
              if (typeof(tldData[tdPosMap[prop]]) !== 'undefined') {
                  tld[prop] = tldData[tdPosMap[prop]];
              }
          }

          if (!tld.domain) {
              return;
          }

          tld.domain = tld.domain.replace(/\s/g, '').replace(/\./g, '');

          tldSet.push(tld);

      });
      console.log('done');

      const stringifier = stringify({ delimiter: ',' });
      stringifier.on('readable', () => {
          let row;
          while (row = stringifier.read()) {
              fs.appendFileSync(fileNewTldsCsv, row, 'utf8')
          }
      });

      process.stdout.write("serializing new 'tlds.csv'...");
      for (var i = 0; i < tldSet.length; i++) {
          let tld = tldSet[i];
          let csvRow = [tld.domain];
          if ((tld.type == 'country-code') && (typeof(tld2CountryName[tld.domain]) !== 'undefined')) {
              csvRow.push(tld2CountryName[tld.domain]);
          } else {
              if (typeof(tld2Desc[tld.domain]) !== 'undefined') {
                  csvRow.push(tld2Desc[tld.domain]);
              } else {
                  csvRow.push(tld.manager);
              }
          }
          csvRow.push(tld.type);
          stringifier.write(csvRow);

      }
      stringifier.end();
      console.log('done');

      if (fs.existsSync(fileTldsCsv)) {
          const newMd5 = md5File.sync(fileNewTldsCsv);
          const csvMd5 = md5File.sync(fileTldsCsv);
          if (csvMd5 == newMd5) {
              console.error(meName + ": (NOTICE) ignoring newly generated 'tlds.csv' file that is identical to the existing file (md5: " + csvMd5 + ", path: " + fileTldsCsv + ")");
              return;
          }
          const pathinfoTldsCsv = pathinfo(fileTldsCsv);
          const fileBackupTldsCsv = pathinfoTldsCsv.dirname + pathinfoTldsCsv.sep + pathinfoTldsCsv.basename + '-' + csvMd5 + '-backup.csv';
          if (!fs.existsSync(fileBackupTldsCsv)) {
              fs.copySync(fileTldsCsv, fileBackupTldsCsv);
          }
      }

      process.stdout.write("saving new 'tlds.csv'...");
      fs.copySync(fileNewTldsCsv, fileTldsCsv);
      console.log('done');      
    });

})();