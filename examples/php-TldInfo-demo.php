<?php
use TldEnum\TldInfo;

require __DIR__ . '/../vendor/autoload.php';

echo "There are " . count(TldInfo::TLD_INFO) . " IANA TLDs\n";

echo "\n";

$tldCheck = "com";
echo "Is '$tldCheck' a real TLD?\n";

$foundTld = false;
foreach(TldInfo::TLD_INFO as $tldInfoElem) {
   
   $tldInfoItem = TldInfo::toInfoItem($tldInfoElem);
   
   if ($tldInfoItem->domain === strtolower($tldCheck)) {
      echo "yes\n";
      print_r($tldInfoItem);
      $foundTld = true;
      break 1;
   }
   
}
unset($tldInfoElem);

if (!$foundTld) {
   echo "no\n";
}

echo "\n";

$tldCheck = "somethingWeird";
echo "Is '$tldCheck' a real TLD?\n";

$foundTld = false;
foreach(TldInfo::TLD_INFO as $tldInfoElem) {
   
   $tldInfoItem = TldInfo::toInfoItem($tldInfoElem);
   
   if ($tldInfoItem->domain === strtolower($tldCheck)) {
      echo "yes\n";
      print_r($tldInfoItem);
      $foundTld = true;
      break 1;
   }
   
}
unset($tldInfoElem);

if (!$foundTld) {
   echo "no\n";
}
