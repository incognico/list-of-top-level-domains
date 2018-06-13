#!/bin/sh
# Updates the tlds.csv file from IANA and re-generates the native format files
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
while getopts :?qhua-: arg; do { case $arg in
   q) QUIET_MODE=1;; 
   h|u|a) HELP_MODE=1;;
   -) LONG_OPTARG="${OPTARG#*=}"; case $OPTARG in
      quiet) QUIET_MODE=1;;
      force-php) FORCE_PHP=1;;
      skip-php) SKIP_PHP=1;;
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
    echo ""
    echo "Updates the tlds.csv file from IANA and re-generates the native format files."
    echo ""
    echo "(c) 2017-2018 Doug Bird, All Rights Reserved."
    echo "see README.md for licensing and other information"
    echo "https://github.com/katmore/tld-enum#readme"
    echo ""
fi

#
# apply help mode
#
if [ "$HELP_MODE" = "1" ]; then
   echo "usage:"
   echo "  $ME_NAME [-h] | [-q][--skip-php]"
   echo ""
   echo "options:"
   echo "  -h,--help: Print a help message and exit."
   echo "  -q,--quiet: Print less messages."
   echo "  --force-php: Creating the PHP format file is mandatory."
   echo "  --skip-php: Always skip creating the PHP format file."
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
      printf "generate $helper_label: started\n\n"
      "$HELPER_DIR/$helper_file" -q
      cmd_status=$?
      [ "$cmd_status" = "0" ] && printf "\ngenerate new $helper_label: success\n"
   fi
   if [ "$cmd_status" != "0" ]; then
      >&2 echo "$ME_NAME: (FATAL) helper for $helper_label failed ($helper_file exit status $cmd_status)"
      exit 1
   fi
   
}

#
# execute the helpers
#
helper generate-tlds-csv.js "new 'tlds.csv'"
helper generate-js-tld-enum.js "new JavaScript format files"
helper generate-json-tld-enum.js "new JSON format files"
if [ "$SKIP_PHP" != "1" ]; then 
   helper generate-php-tld-enum.php "new PHP format files"
else
   [ "$QUIET_MODE" = "0" ] && echo "$ME_NAME: (NOTICE) skipped PHP"
fi

echo "$ME_NAME: format updates were successful"














