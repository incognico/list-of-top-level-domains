# TLD Enumerations

Lists of every [ICANN TLD](https://www.icann.org/resources/pages/tlds-2012-02-25-en) in formats that can be natively compiled in various language targets.

The [canonical TLD list in CSV format](tlds.csv) used to generate the various formats in this project is a fork from [incognico/list-of-top-level-domains](https://github.com/incognico/list-of-top-level-domains) project.

## List Formats
 * **PHP**: [TldEnum.php](src/formats/php/TldEnum/TldEnum.php)
 
    A PHP source file providing a class with constant having an array value comprised of every ICANN TLD.
  
 * **JSON**: [tld-list.json](src/formats/json/tld-list.json)
 
    A JSON formatted array comprised of every ICANN TLD.
 
 * **CSV**: [tlds-name-only.csv](src/formats/csv/tlds-name-only.csv)
 
    A csv text file comprised of every ICANN TLD; the TLD name only, each separated by a newline character.

## Legal
The source code in this project is based on a fork of certain source code originally from the [incognico/list-of-top-level-domains](https://github.com/incognico/list-of-top-level-domains) project, as retrieved on 2017-12-04, which was published to the public domain.

### Copyright
TLD Enumerations - https://github.com/katmore/tld-enum

The following copyright notice applies to all resources in this project unless specifically noted otherwise:

Copyright (c) 2017 Doug Bird, All Rights Reserved.

The following resources of this project are published in the public domain:
 * [/tlds.csv](/tlds.csv)
 * [/formats/js/tld-enum.js](/formats/js/tld-enum.js)
 * [/formats/json/tld-list.json](/formats/json/tld-list.json)
 * [/formats/php/TldEnum/TldEnum.php](/formats/php/TldEnum/TldEnum.php)

### License
All resources in the 'TLD Enumerations' project are copyrighted free software unless specifically noted otherwise.

You may redistribute and modify it under either the terms and conditions of the
"The MIT License (MIT)"; or the terms and conditions of the "GPL v3 License".
See [LICENSE](/LICENSE) and [GPLv3](/GPLv3).

This licensing condition does not apply to any resources in the 'TLD Enumerations' project that are published in the public domain. These resources are listed in the **"Copyright"** section of this document.
