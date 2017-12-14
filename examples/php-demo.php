<?php
use TldEnum\TldEnum;

//require __DIR__ . '/vendor/autoload.php';
require __DIR__ . '/../vendor/autoload.php';

echo "There are " . count(TldEnum::TLD_ENUM) . " IANA TLDs\n";

$tldCheck = "com";
echo "Is '$tldCheck' a real TLD?\n";
if (in_array($tldCheck, TldEnum::TLD_ENUM)) {
    echo "  yes\n";
} else {
    echo "  no\n";
}

$tldCheck = "somethingWeird";
echo "Is '$tldCheck' a real TLD?\n";
if (in_array($tldCheck, TldEnum::TLD_ENUM)) {
    echo "  yes\n";
} else {
    echo "  no\n";
}