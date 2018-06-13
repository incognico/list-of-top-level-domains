<?php
use TldEnum\TldType;

require __DIR__ . '/../vendor/autoload.php';

echo "There are " . count(TldType::TLD_TYPE) . " IANA TLDs\n";

echo "\n";

$tldCheck = "com";
echo "Is '$tldCheck' a real TLD?\n";

if (isset(TldType::TLD_TYPE[strtolower($tldCheck)])) {
   echo "yes\n";
   echo "type: ".TldType::TLD_TYPE[strtolower($tldCheck)]."\n";
} else {
   echo "no\n";
}

echo "\n";

$tldCheck = "somethingWeird";
echo "Is '$tldCheck' a real TLD?\n";

if (isset(TldType::TLD_TYPE[strtolower($tldCheck)])) {
   echo "yes\n";
   echo "type: ".TldType::TLD_TYPE[strtolower($tldCheck)]."\n";
} else {
   echo "no\n";
}

echo "\n";
