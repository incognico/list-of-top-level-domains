<?php
use TldEnum\TldList;

require __DIR__ . '/../vendor/autoload.php';

echo "There are " . count(TldList::TLD_LIST) . " IANA TLDs\n";

$tldCheck = "com";
echo "Is '$tldCheck' a real TLD?\n";
if (in_array(strtolower($tldCheck), TldList::TLD_LIST)) {
    echo "  yes\n";
} else {
    echo "  no\n";
}

$tldCheck = "somethingWeird";
echo "Is '$tldCheck' a real TLD?\n";
if (in_array(strtolower($tldCheck), TldList::TLD_LIST)) {
    echo "  yes\n";
} else {
    echo "  no\n";
}