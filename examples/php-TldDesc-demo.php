<?php
use TldEnum\TldDesc;

require __DIR__ . '/../vendor/autoload.php';

echo "There are " . count(TldDesc::TLD_DESC) . " IANA TLDs\n";

echo "\n";

$tldCheck = "com";
echo "Is '$tldCheck' a real TLD?\n";

if (isset(TldDesc::TLD_DESC[strtolower($tldCheck)])) {
   echo "yes\n";
   echo "description: ".TldDesc::TLD_DESC[strtolower($tldCheck)]."\n";
} else {
   echo "no\n";
}

echo "\n";

$tldCheck = "somethingWeird";
echo "Is '$tldCheck' a real TLD?\n";

if (isset(TldDesc::TLD_DESC[strtolower($tldCheck)])) {
   echo "yes\n";
   echo "description: ".TldDesc::TLD_DESC[strtolower($tldCheck)]."\n";
} else {
   echo "no\n";
}

echo "\n";
