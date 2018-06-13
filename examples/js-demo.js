const tldList = require('../formats/js/tld-enum/list');

console.log("There are " + tldList.length + " IANA TLDs");

let tldCheck;

tldCheck = "com";
console.log("Is '" + tldCheck + "' a real TLD?");
if (tldList.indexOf(tldCheck.toLowerCase()) != -1) {
    console.log("  yes");
} else {
    console.log("  no");
}

tldCheck = "somethingWeird";
console.log("Is '" + tldCheck + "' a real TLD?");
if (tldList.indexOf(tldCheck.toLowerCase()) != -1) {
    console.log("  yes");
} else {
    console.log("  no");
}