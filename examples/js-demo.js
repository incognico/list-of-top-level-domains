//const tldEnum = require('tld-enum');
const tldEnum = require('../formats/js/tld-enum');

console.log("There are " + tldEnum.tldList.length + " IANA TLDs");

let tldCheck;

tldCheck = "com";
console.log("Is '" + tldCheck + "' a real TLD?");
if (tldEnum.tldList.indexOf(tldCheck) != -1) {
    console.log("  yes");
} else {
    console.log("  no");
}

tldCheck = "somethingWeird";
console.log("Is '" + tldCheck + "' a real TLD?");
if (tldEnum.tldList.indexOf(tldCheck) != -1) {
    console.log("  yes");
} else {
    console.log("  no");
}