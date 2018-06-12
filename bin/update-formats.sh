#!/bin/sh
################################################################################
## "update-formats"
##     Updates the 'tlds.csv' file from iana.org and re-generates the native 
##     format files
################################################################################
################################################################################
################################################################################
################################################################################
################################################################################
################################################################################
################################################################################
################################################################################
################################################################################
################################################################################
## script localization
################################################################################
ME_NAME=$(basename $0)
ME_DIR="/$0"; ME_DIR=${ME_DIR%/*}; ME_DIR=${ME_DIR:-.}; ME_DIR=${ME_DIR#/}/; ME_DIR=$(cd "$ME_DIR"; pwd)
HELPER_DIR=$ME_DIR/helpers

################################################################################
## read options and flags
################################################################################
QUIET_MODE=0
HELP_MODE=0
OPTION_STATUS=0
while getopts :?qhua-: arg; do { case $arg in
   q) QUIET_MODE=1;; 
   h|u|a) HELP_MODE=1;;
   -) LONG_OPTARG="${OPTARG#*=}"; case $OPTARG in
      quiet) QUIET_MODE=1;;
      help|usage|about) HELP_MODE=1;;
      *) >&2 echo "$ME_NAME: unrecognized long option --$OPTARG"; OPTION_STATUS=2;;
   esac ;; 
   *) >&2 echo "$ME_NAME: unrecognized option -$OPTARG"; OPTION_STATUS=2;;
esac } done
shift $((OPTIND-1)) # remove parsed options and args from $@ list
[ "$OPTION_STATUS" != "0" ] && { >&2 echo "$ME_NAME: (FATAL) one or more invalid options"; exit $OPTION_STATUS; }
[ -z "$@" ] || { >&2 echo "$ME_NAME: (FATAL) one or more unrecognized positional arguments ($@)"; exit 2; }

################################################################################
## display welcome message
################################################################################
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

################################################################################
## apply help mode
################################################################################
if [ "$HELP_MODE" = "1" ]; then
   echo "usage:"
   echo "  $ME_NAME [-h] | [-q]"
   echo ""
   echo "options:"
   echo "  -h,--help: Print a help message and exit."
   echo "  -q,--quiet: Print less output."
   exit 0
fi

################################################################################
## enforce dependencies
################################################################################
DEPENDENCY_STATUS=0
depcheck() { dep_cmd=$1; dep_label=$2
   $dep_cmd > /dev/null 2>&1 || {
      >&2 echo "$ME_NAME: failed dependency check for '$dep_label', command is missing or inaccessible"
      DEPENDENCY_STATUS=1
} }
depcheck "node -v" "node"
depcheck "php -v" "php"
if [ "$DEPENDENCY_STATUS" != "0" ]; then
   >&2 echo "$ME_NAME: (FATAL) one or more dependency checks failed"
   exit 1
fi

################################################################################
## helper execution wrapper function
################################################################################
helper() { helper_cmd=$1; helper_label=$2
   printf "generate $helper_label: started\n\n"
   $HELPER_DIR/$helper_cmd -q || { cmd_status=$?
      >&2 echo "$ME_NAME: (FATAL) helper for $helper_label failed ($helper_cmd exit status $cmd_status)"
      exit $cmd_status
   }
   printf "\ngenerate new $helper_label: success\n"
}

################################################################################
## run the 'generate-tlds-csv.js' helper
################################################################################
helper generate-tlds-csv.js "new 'tlds.csv'"

################################################################################
## run the 'generate-php-tld-enum.php' helper
################################################################################
helper generate-php-tld-enum.php "new PHP format files"

################################################################################
## run the 'generate-js-tld-enum.js' helper
################################################################################
helper generate-js-tld-enum.js "new JavaScript format files"

################################################################################
## run the 'generate-json-tld-enum.js' helper
################################################################################
helper generate-json-tld-enum.js "new JSON format files"
