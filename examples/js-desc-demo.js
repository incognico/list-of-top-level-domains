const tldDesc = require('../formats/js/tld-enum/desc');

console.log("There are " + Object.keys(tldDesc).length + " IANA TLDs");

console.log("");

let tldCheck;

tldCheck = "com";
console.log("Is '" + tldCheck + "' a real TLD?");
if (typeof(tldDesc[tldCheck.toLowerCase()])!=='undefined') {
  console.log("yes");
  console.log("description: "+tldDesc[tldCheck.toLowerCase()]);
} else {
  console.log("no");
}

console.log("");

tldCheck = "somethingWeird";
console.log("Is '" + tldCheck + "' a real TLD?");
if (typeof(tldDesc[tldCheck.toLowerCase()])!=='undefined') {
  console.log("yes");
  console.log("description: "+tldDesc[tldCheck.toLowerCase()]);
} else {
  console.log("no");
}