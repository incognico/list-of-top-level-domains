const tldInfo = require('../formats/js/tld-enum').info;

console.log("There are " + Object.keys(tldInfo).length + " IANA TLDs");

console.log("");

let tldCheck, foundTld;

tldCheck = "com";
console.log("Is '" + tldCheck + "' a real TLD?");

foundTld = tldInfo.find(function(e) {
  return e.domain==tldCheck.toLowerCase();
});

if (typeof(foundTld)!=='undefined') {
  console.log("yes");
  console.log(JSON.stringify(foundTld, null, 2));
} else {
  console.log("no");
}

console.log("");

tldCheck = "somethingWeird";
console.log("Is '" + tldCheck + "' a real TLD?");

foundTld = tldInfo.find(function(e) {
  return e.domain==tldCheck.toLowerCase();
});

if (typeof(foundTld)!=='undefined') {
  console.log("yes");
  console.log(JSON.stringify(foundTld, null, 2));
} else {
  console.log("no");
}