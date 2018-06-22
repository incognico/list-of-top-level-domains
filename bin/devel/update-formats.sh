#!/bin/sh
# Updates the tlds.csv file using IANA data and re-generates the format files
# 
# @author D. Bird <retran@gmail.com>
#

#
# script localization
#
ME_NAME=$(basename $0)
ME_DIR="/$0"; ME_DIR=${ME_DIR%/*}; ME_DIR=${ME_DIR:-.}; ME_DIR=${ME_DIR#/}/; ME_DIR=$(cd "$ME_DIR"; pwd)
HELPER_DIR=$ME_DIR/helpers

#
# parse options
#
OPTION_STATUS=0
QUIET_MODE=0
HELP_MODE=0
FORCE_PHP=0
SKIP_PHP=0
SKIP_CSV=0
while getopts :?qhua-: arg; do { case $arg in
   q) QUIET_MODE=1;; 
   h|u|a) HELP_MODE=1;;
   -) LONG_OPTARG="${OPTARG#*=}"; case $OPTARG in
      quiet) QUIET_MODE=1;;
      force-php) FORCE_PHP=1;;
      skip-php) SKIP_PHP=1;;
      skip-csv) SKIP_CSV=1;;
      help|usage|about) HELP_MODE=1;;
      *) >&2 echo "$ME_NAME: unrecognized long option --$OPTARG"; OPTION_STATUS=2;;
   esac ;; 
   *) >&2 echo "$ME_NAME: unrecognized option -$OPTARG"; OPTION_STATUS=2;;
esac } done
shift $((OPTIND-1)) # remove parsed options and args from $@ list
[ "$OPTION_STATUS" != "0" ] && { >&2 echo "$ME_NAME: (FATAL) one or more invalid options"; exit $OPTION_STATUS; }
[ -z "$@" ] || { >&2 echo "$ME_NAME: (FATAL) one or more unrecognized positional arguments ($@)"; exit 2; }

#
# --skip-php --force-php sanity check 
#
if ( [ "$FORCE_PHP" = "1" ] && [ "$SKIP_PHP" = "1" ] ); then
   >&2 echo "$ME_NAME: --skip-php cannot be used with --force-php"
   exit 2
fi

#
# display welcome message
#
if ( [ "$QUIET_MODE" != "1" ] || [ "$HELP_MODE" = "1" ] ); then
    echo "TLD update utility"
    echo "(c) 2017-2018 Doug Bird, All Rights Reserved."
    echo "https://github.com/katmore/tld-enum#readme"
fi

#
# apply help mode
#
if [ "$HELP_MODE" = "1" ]; then
   echo ""
   echo "Updates the tlds.csv file using IANA data and re-generates the format files."
   echo ""
   echo "usage:"
   echo "  $ME_NAME [-h]|[-q][format file options...]"
   echo ""
   echo "-h,--help: Print a help message and exit."
   echo "-q,--quiet: Print only critical messages."
   echo ""
   echo "format file options:"
   echo "  --force-php: Creating the PHP format files is mandatory."
   echo "  --skip-php: Always skip creating the PHP format files."
   echo "  --skip-csv: Use existing tlds.csv and do not download new data from IANA."
   exit 0
fi

#
# enforce dependencies
#
DEPENDENCY_STATUS=0
node -v > /dev/null 2>&1 || {
   >&2 echo "$ME_NAME: failed dependency check for 'node', command is missing or inaccessible"
   DEPENDENCY_STATUS=1
}
if [ "$SKIP_PHP" != "1" ]; then
   php -v > /dev/null 2>&1 || {
      if [ "$FORCE_PHP" = "1" ]; then
         >&2 echo "$ME_NAME: failed dependency check for 'php', command is missing or inaccessible"
         DEPENDENCY_STATUS=1
      else
         SKIP_PHP=1
         >&2 echo "$ME_NAME: (NOTICE) skipping PHP format generation, 'php' command is missing or inaccessible"
      fi
   }
fi
if [ "$DEPENDENCY_STATUS" != "0" ]; then
   >&2 echo "$ME_NAME: (FATAL) one or more required dependency checks failed"
   exit 1
fi

#
# helper execution wrapper function
#
helper() { helper_file=$1; helper_label=$2
   
   if [ "$QUIET_MODE" = "1" ]; then
      cmd_output=$("$HELPER_DIR/$helper_file" 2>&1)
      cmd_status=$?
      [ "$cmd_status" != "0" ] && [ -n "$cmd_output" ] && >&2 printf "$cmd_output\n"
   else
      printf "generate new $helper_label format file: started\n"
      "$HELPER_DIR/$helper_file" -q
      cmd_status=$?
      [ "$cmd_status" = "0" ] && printf "generate new $helper_label format file: success\n"
   fi
   if [ "$cmd_status" != "0" ]; then
      >&2 echo "$ME_NAME: (FATAL) helper for $helper_label failed ($helper_file exit status $cmd_status)"
      exit 1
   fi
   
}

#
# execute CSV helper
#
if [ "$SKIP_CSV" != "1" ]; then
   helper generate-tlds-csv.js "CSV 'tlds.csv'"
else
   [ "$QUIET_MODE" = "0" ] && printf "$ME_NAME: (NOTICE) skipped downloading IANA data and skipped generating new CSV\n"
fi

#
# execute TSV helper
#
helper generate-tsv-tlds-tsv.js "Tab-Separated-Values 'tlds.tsv'"

#
# execute JavaScript helpers
#
helper generate-js-tld-desc.js "JavaScript 'desc.js'"
helper generate-js-tld-info.js "JavaScript 'info.js'"
helper generate-js-tld-list.js "JavaScript 'list.js'"
helper generate-js-tld-type.js "JavaScript 'type.js'"

#
# execute JSON helpers
#
helper generate-json-tld-desc.js "JSON 'tld-desc.json'"
helper generate-json-tld-info.js "JSON 'tld-info.json'"
helper generate-json-tld-list.js "JSON 'tld-list.json'"
helper generate-json-tld-type.js "JSON 'tld-type.json'"

#
# execute PHP helpers
#
if [ "$SKIP_PHP" != "1" ]; then 
   helper generate-php-tld-desc.php "PHP 'TldDesc.php'"
   helper generate-php-tld-info.php "PHP 'TldInfo.php'"
   helper generate-php-tld-list.php "PHP 'TldList.php'"
   helper generate-php-tld-type.php "PHP 'TldType.php'"
else
   [ "$QUIET_MODE" = "0" ] && printf "$ME_NAME: (NOTICE) skipped generating PHP format files\n"
fi

#
# success
#
if [ "$QUIET_MODE" = "0" ]; then 
  printf "format file updates were successful\n"
fi















