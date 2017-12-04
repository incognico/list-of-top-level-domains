#!/usr/bin/env php
<?php
(function() {
   
   echo "generates the 'TldEnum.php' class definition file from the 'tlds.csv' csv file";
   
   echo "---this script is currently a 'to-do' placeholder!---";
   
   $exit_message = "terminating... the development for the 'PHP' format generator has not yet been completed";
   
   if (\PHP_SAPI=='cli') {
      fwrite(\STDERR,$exit_message);
   } else {   
      echo $exit_message ;
   }
   exit(1);
})();