# TLD Enumerations

Lists of every [IANA TLD](http://data.iana.org/TLD/tlds-alpha-by-domain.txt) in formats that can be natively compiled in various language targets.

A [canonical list of TLDs in CSV format](/tlds.csv) was used to generate the native formats.

## Usage
The lists can be conveniently used in PHP or Node projects including this package.

### Node
 * use npm to add the `tld-enum` package to your project
   ```sh
   $ npm install tld-enum --save
   ```
   
 * add the module to your source
 
   ```js
   const tldEnum = require('tld-enum');
   ```
   
 * access the list by using the `tldEnum.tldList` array
 
   ```js
   const tldEnum = require('tld-enum');
   tldEnum.tldList; //an array with every IANA TLD
   ```
   
   The following example...
   ```js
   const tldEnum = require('tld-enum');

   console.log("There are " + tldEnum.tldList.length + " IANA TLDs");

   let tldCheck;

   tldCheck = "com";
   console.log("Is '" + tldCheck + "' a real TLD?");
   if (tldEnum.tldList.indexOf(tldCheck.toLowerCase()) != -1) {
       console.log("  yes");
   } else {
       console.log("  no");
   }

   tldCheck = "somethingWeird";
   console.log("Is '" + tldCheck + "' a real TLD?");
   if (tldEnum.tldList.indexOf(tldCheck.toLowerCase()) != -1) {
       console.log("  yes");
   } else {
       console.log("  no");
   }
   ```
   
   Should produce the following output...
   ```txt
   There are 1573 IANA TLDs
   Is 'com' a real TLD?
      yes
   Is 'somethingWeird' a real TLD?
      no
   ```

### PHP
 * use composer to add the `katmore/tld-enum` package to your project
   ```sh
   $ composer require katmore/tld-enum
   ```
   
 * access the list by using the `\TldEnum\TldEnum::TLD_ENUM` class constant array
 
   ```php
   <?php
   require_once __DIR__ . '/vendor/autoload.php';
   \TldEnum\TldEnum::TLD_ENUM; //an array with every IANA TLD
   ```
 
   The following example...
   ```php
   <?php
   use TldEnum\TldEnum;

   require __DIR__ . '/vendor/autoload.php';

   echo "There are " . count(TldEnum::TLD_ENUM) . " IANA TLDs\n";

   $tldCheck = "com";
   echo "Is '$tldCheck' a real TLD?\n";
   if (in_array(strtolower($tldCheck), TldEnum::TLD_ENUM)) {
       echo "  yes\n";
   } else {
       echo "  no\n";
   }

   $tldCheck = "somethingWeird";
   echo "Is '$tldCheck' a real TLD?\n";
   if (in_array(strtolower($tldCheck), TldEnum::TLD_ENUM)) {
       echo "  yes\n";
   } else {
       echo "  no\n";
   }
   ```
   
   Should produce the following output...
   ```txt
   There are 1573 IANA TLDs
   Is 'com' a real TLD?
      yes
   Is 'somethingWeird' a real TLD?
      no
   ```

## Examples
 * [php-demo.php](/examples/php-demo.php)
 * [js-demo.js](/examples/js-demo.js)

## List Formats
 * **PHP**: [TldEnum.php](/formats/php/TldEnum/TldEnum.php)
 
    A PHP source file providing a class with a constant having an array value comprised of every IANA TLD.
  
 * **JSON**: [tld-list.json](/formats/json/tld-list.json)
 
    A JSON formatted array comprised of every IANA TLD.
 
 * **JavaScript**: [tld-enum.js](/formats/js/tld-enum.js)
 
    An export module with a constant having an array value comprised of every IANA TLD.
    
## Updating the TLD lists
  * [bin/update-formats](/bin/update-formats)
  
    ```sh
    $ bin/update-formats
    ```
    
    This should be all you need to update all the list formats using the latest data from IANA.
    
    It uses multiple "helper" scripts to generate the full set of native format lists.
    
    The individual "helper" scripts do not need to be directly executed when [update-formats](/bin/update-formats)
    runs successfully.

## Legal
The source code in this project is based on a fork of certain source code originally from the [incognico/list-of-top-level-domains](https://github.com/incognico/list-of-top-level-domains) project, as retrieved on 2017-12-04, which was published to the public domain.

### Copyright
TLD Enumerations - https://github.com/katmore/tld-enum

The following copyright notice applies to all resources in this project unless specifically noted otherwise:

Copyright (c) 2017-2018 Doug Bird. All Rights Reserved.

### Public Domain Resources
The following resources of this project are hereby released into the public domain:
 * [tlds.csv](/tlds.csv)
 * [formats/js/tld-enum.js](/formats/js/tld-list.js)
 * [formats/json/tld-list.json](/formats/json/tld-list.json)
 * [formats/php/TldEnum/TldEnum.php](/formats/php/TldEnum/TldEnum.php)
 * [assets/tld-desc.csv](/assets/tld-desc.csv)

### License
All resources in the 'TLD Enumerations' project are copyrighted free software unless specifically noted otherwise.

You may redistribute and modify it under either the terms and conditions of the
"The MIT License (MIT)"; or the terms and conditions of the "GPL v3 License".
See [LICENSE](/LICENSE) and [GPLv3](/GPLv3).

These licensing conditions do not apply to any resources that have been released into the public domain; which are listed in the [**"Public Domain Resources"**](/README.md#public-domain-resources) section of the 'TLD Enumerations' project's [README](/README.md) document.
