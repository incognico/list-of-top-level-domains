const tldType = require('../formats/js/tld-enum/type');

console.log("There are " + Object.keys(tldType).length + " IANA TLDs");

console.log("");

let tldCheck;

tldCheck = "com";
console.log("Is '" + tldCheck + "' a real TLD?");
if (typeof(tldType[tldCheck.toLowerCase()])!=='undefined') {
  console.log("yes");
  console.log("type: "+tldType[tldCheck.toLowerCase()]);
} else {
  console.log("no");
}

console.log("");

tldCheck = "somethingWeird";
console.log("Is '" + tldCheck + "' a real TLD?");
if (typeof(tldType[tldCheck.toLowerCase()])!=='undefined') {
  console.log("yes");
  console.log("type: "+tldType[tldCheck.toLowerCase()]);
} else {
  console.log("no");
}