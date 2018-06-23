#!/bin/sh
#
# Provides information on IANA top-level domains
#
# For usage, execute with the "--help" option
#
# @author D. Bird <retran@gmail.com>
#

#
# script localization
#
ME_NAME=$(basename $0)
ME_DIR="/$0"; ME_DIR=${ME_DIR%/*}; ME_DIR=${ME_DIR:-.}; ME_DIR=${ME_DIR#/}/; ME_DIR=$(cd "$ME_DIR"; pwd)
ME_SHORTNAME='tldinfo'

#
# number of seconds before warning about TLD database needing an update
#   2592000 seconds = 30 days
#
CHECKED_TIME_TTL=2592000

#
# data root dir
#
SYS_DATA_ROOT=/usr/share/$ME_SHORTNAME
USER_DATA_ROOT=~/.$ME_SHORTNAME
SYS_INSTALL_PATH=/usr/bin/$ME_SHORTNAME

#
# parse options
#
OPTION_STATUS=0
HELP_MODE=0
FORCE_PHP=0
SKIP_PHP=0
SKIP_CSV=0
UPDATE_MODE=0
SHOW_DESC=0
SHOW_TYPE=0
STARTS_WITH=0
INSTALL_MODE=0
while getopts :?qhuaV-: arg; do { case $arg in
   h|u|a|V) HELP_MODE=1;;
   -) LONG_OPTARG="${OPTARG#*=}"; case $OPTARG in
      help|usage|about|version) HELP_MODE=1;;
      update) UPDATE_MODE=1;;
      show-description) SHOW_DESC=1;;
      show-type) SHOW_TYPE=1;;
      starts-with) STARTS_WITH=1;;
      install) INSTALL_MODE=1;;
      *) >&2 echo "$ME_NAME: unrecognized long option --$OPTARG"; OPTION_STATUS=2;;
   esac ;; 
   *) >&2 echo "$ME_NAME: unrecognized option -$OPTARG"; OPTION_STATUS=2;;
esac } done
shift $((OPTIND-1)) # remove parsed options and args from $@ list
[ "$OPTION_STATUS" != "0" ] && { >&2 echo "$ME_NAME: (FATAL) one or more invalid options"; exit $OPTION_STATUS; }
[ "$UPDATE_MODE" != 1 ] && [ -n "$1" ] && { SEARCH=$1; shift; }
[ -z "$@" ] || { >&2 echo "$ME_NAME: (FATAL) one or more unrecognized positional arguments ($@)"; exit 2; }
[ "$STARTS_WITH" = 1 ] && [ -z "$SEARCH" ] && { >&2 echo "$ME_NAME: (FATAL) must specify <SEARCH> argument when using --starts-with option"; exit 2; }

#
# apply help mode
#
if [ "$HELP_MODE" = "1" ]; then
   echo "tldinfo"
   echo "(c) 2017-2018 Doug Bird, All Rights Reserved."
   echo "https://github.com/katmore/tld-enum#readme"   
   echo ""
   echo "Prints IANA top-level domains."
   echo ""
   echo "usage:"
   echo "  $ME_NAME [-h][--update]|[display options...][[--starts-with] <SEARCH>]"
   echo ""
   echo "-h,--help: Print a help message and exit."
   echo "--update: Update TLD database as needed and exit."
   echo "--install: Install a global 'tldinfo' binary and exit."
   echo ""
   echo "display options:"
   echo "--show-description: Always print domain description."
   echo "--show-type: Always print domain type."
   echo ""
   echo "<SEARCH>:"
   echo "  Optionally, only print matching domain(s)."
   echo "  --starts-with: Match domain(s) starting with <SEARCH>."
   echo ""
   echo "Exit Codes:"
   echo "   0 : Success"
   echo "   1 : General Error"
   echo "   3 : Internal Error"
   echo "  20 : No match found for <SEARCH>"
   exit 0
fi

#
# dependency checks
#
USE_CURL=0; USE_WGET=0; FOUND_HTTP_CLIENT=0
curl -V > /dev/null 2>&1 && {
   USE_CURL=1; FOUND_HTTP_CLIENT=1
} || {
wget -V > /dev/null 2>&1 && {
   USE_WGET=1; FOUND_HTTP_CLIENT=1
} }


# 
# Prints the url an http request ultimately redirects to.
# Usage:
#   print_http_redirect <url>
# Arguments:
#   <url>
#     The request url
#     (Required)
#
print_http_redirect() { url=$1
   if [ "$FOUND_HTTP_CLIENT" != 1 ]; then
      >&2 echo "$ME_NAME: (failed dependency check) http client binary is not available ('curl' or 'wget')"
      exit 1
   fi
   [ -n "$url" ] || {
      >&2 echo "$ME_NAME: (internal error) missing 'url' argument to 'print_http_redirect'"
      exit 3
   }
   if [ "$USE_CURL" = 1 ]; then
      hout=$(curl -Ls -o /dev/null -w %{url_effective} $url) || {
         >&2 echo "$ME_NAME: (fatal error) 'curl (...print_http_redirect)' failed with exit status $?"
         exit 1
      }
      [ -n "$hout" ] || {
         >&2 echo "$ME_NAME: (fatal error) empty URL result from 'curl (...print_http_redirect)'"
         exit 1
      }
   fi
   if [ "$USE_WGET" = 1 ]; then
      hout=$(wget $url --server-response -O /dev/null 2>&1 | awk '(NR==1){SRC=$3;} /^  Location: /{DEST=$2} END{ print SRC, DEST}' | awk '{print $2}') || {
         >&2 echo "$ME_NAME: (fatal error) 'wget (...print_http_redirect)' failed with exit status $?"
         exit 1
      }
      [ -n "$hout" ] || {
         >&2 echo "$ME_NAME: (fatal error) empty URL result from 'wget (...print_http_redirect)'"
         exit 1
      }
   fi
   echo $hout
}

#
# Saves the response body of an http request to a file.
# Usage:
#   http_download <url> <path>
# Arguments:
#   <url>
#     The request url
#     (Required)
#   <path>
#     Path to save the response body to
#     (Required)
#
http_download() { url=$1; path=$2
   if [ "$FOUND_HTTP_CLIENT" != 1 ]; then
      >&2 echo "$ME_NAME: (failed dependency check) http client binary is not available ('curl' or 'wget')"
      exit 1
   fi
   [ -n "$url" ] || {
      >&2 echo "$ME_NAME: (internal error) missing 'url' argument to 'http_download'"
      exit 3
   }
   [ -n "$path" ] || {
      >&2 echo "$ME_NAME: (internal error) missing 'path' argument to 'http_download'"
      exit 3
   }
   if [ "$USE_CURL" = 1 ]; then
      curl -sS $url > $path || {
         >&2 echo "$ME_NAME: (fatal error) 'curl (...http_download)' failed with exit status $?"
         exit 1
      }
   fi
   if [ "$USE_WGET" = 1 ]; then
      wget -O $path $url || {
         >&2 echo "$ME_NAME: (fatal error) 'wget (...http_download)' failed with exit status $?"
         exit 1
      }
   fi
   return 0
}

#
# cleanup temp files
#
LATEST_TLDS_TEMP=
cleanup_temp_files() {
   if ( [ -n "$LATEST_TLDS_TEMP" ] && [ -f "$LATEST_TLDS_TEMP" ] ); then
      rm $LATEST_TLDS_TEMP
   fi
}
trap cleanup_temp_files EXIT

#
# Prepares data file
# Usage:
#   init_data_file <file-basename>
# Arguments:
#   <file-basename>
#     Basename of data file; for example. "release"
#    (Required)
#
init_data_file() { file_basename=$1;
   
   [ -n "$file_basename" ] || {
      >&2 echo "$ME_NAME: (internal error) missing 'file_basename' argument to 'init_data_file'"
      exit 3
   }
   if ( [ -d "$USER_DATA_ROOT" ] && [ "$INSTALL_MODE" != 1 ] ); then
      path=$USER_DATA_ROOT/$file_basename
      perm=660
   else
      path=$SYS_DATA_ROOT/$file_basename
      perm=444
   fi
   
   if [ -f "$path" ]; then
      touch $path 2>/dev/null || {
         chmod $perm $path || {
            >&2 echo "$ME_NAME: (fatal error) failed to initialize data file permission on '$path', do you need sudo?"
            exit 1
         }
         touch $path || {
            >&2 echo "$ME_NAME: (fatal error) failed to initialize data file '$path', do you need sudo?"
            exit 1
         }
         return 0
      }
      chmod $perm $path || {
         >&2 echo "$ME_NAME: (fatal error) failed to initialize data file permission on '$path', do you need sudo?"
         exit 1
      }
   else
      touch $path || {
         >&2 echo "$ME_NAME: (fatal error) failed to initialize data file '$path', do you need sudo?"
         exit 1
      }
      chmod $perm $path || {
         >&2 echo "$ME_NAME: (fatal error) failed to initialize data file permission on '$path', do you need sudo?"
         exit 1
      }
   fi

}

#
# Prepares the data root directory
# Usage:
#   init_data_root
# Arguments: 
#   (none)
#
init_data_root() {
   if ( [ -d "$USER_DATA_ROOT" ] && [ "$INSTALL_MODE" != 1 ] ); then
      root_path=$USER_DATA_ROOT
      perm=770
   else
      root_path=$SYS_DATA_ROOT
      perm=775
   fi
   if [ -d "$root_path" ]; then
      if [ ! -w "$root_path" ]; then
         >&2 echo "$ME_NAME: (fatal error) missing write permission on data root '$root_path', do you need sudo?"
         exit 1
      fi
   else
      data_root_parent=$(dirname $root_path)
      if [ ! -w "$(dirname $data_root_parent)" ]; then
         >&2 echo "$ME_NAME: (fatal error) missing write permission on data root parent directory '$data_root_parent', do you need sudo?"
         exit 1
      fi
   fi
   mkdir -p $root_path || {
      >&2 echo "$ME_NAME: (fatal error) failed to create data root '$root_path', do you need sudo?"
      exit 1
   }
   chmod $perm $root_path || {
      >&2 echo "$ME_NAME: (fatal error) failed set permissions on data root '$root_path', do you need sudo?"
      exit 1
   }
   init_data_file "checked-time"
   init_data_file "release"
}

#
# Prints the contents of a data file.
# Usage:
#   print_data_file_contents <file-basename>
# Arguments:
#   <file-basename>
#     Basename of data file; for example. "release"
#    (Required)
#
print_data_file_contents() { file_basename=$1
   [ -n "$file_basename" ] || {
      >&2 echo "$ME_NAME: (internal error) missing 'file_basename' argument to 'print_data_file_contents'"
      exit 3
   }
   if ( [ -d "$USER_DATA_ROOT" ] && [ "$INSTALL_MODE" != 1 ] ); then
      path=$USER_DATA_ROOT/$file_basename
   else
      path=$SYS_DATA_ROOT/$file_basename
   fi
   if [ -f "$path" ]; then
      cat $path || {
         >&2 echo "$ME_NAME: (fatal error) failed to read contents of data file '$path'; do you need sudo?"
         exit 1
      }
   fi
}

#
# Print the path to a data file.
# Usage:
#   print_data_file_path <file-basename> <contents>
# Arguments:
#   <file-basename>
#     Basename of data file; for example. "release"
#    (Required)
#
print_data_file_path() { file_basename=$1
   [ -n "$file_basename" ] || {
      >&2 echo "$ME_NAME: (internal error) missing 'file_basename' argument to 'write_data_file'"
      exit 3
   }
   if ( [ -d "$USER_DATA_ROOT" ] && [ "$INSTALL_MODE" != 1 ] ); then
      path=$USER_DATA_ROOT/$file_basename
   else
      path=$SYS_DATA_ROOT/$file_basename
   fi
   echo $path
}

#
# wheather to download TLDS database from CDN
#
INITIAL_TLDS_DOWNLOAD=0

#
# install mode
#
if [ "$INSTALL_MODE" = 1 ]; then
   ME_PATH=$ME_DIR/$ME_NAME
   if [ ! -f "$ME_PATH" ]; then
      >&2 echo "$ME_NAME: (fatal error) unable to determine installation source file"
      exit 1
   fi
   if [ ! -w $(dirname $SYS_INSTALL_PATH) ]; then
      >&2 echo "$ME_NAME: (fatal error) missing write permission to install path parent dir, do you need sudo?"
      exit 1
   fi
   cp -f $ME_PATH $SYS_INSTALL_PATH || {
      >&2 echo "$ME_NAME: (fatal error) failed to copy script to install path"
      exit 1
   }
   init_data_root
   INITIAL_TLDS_DOWNLOAD=1
fi

#
# prepare tld database
#
TLDS_PATH=$(print_data_file_path tlds.tsv)
PROJECT_TLDS_PATH=$ME_DIR/formats/tsv/tlds.tsv
if ( [ "$INSTALL_MODE" = 0 ] && [ ! -f "$TLDS_PATH" ] ); then
   if ( [ ! -d "$SYS_DATA_ROOT" ] && [ ! -d "$USER_DATA_ROOT" ] ); then
      mkdir -p $USER_DATA_ROOT || {
         >&2 echo "$ME_NAME: (fatal error) failed to prepare user data dir"
         exit 1
      }
   fi
   init_data_root
   TLDS_PATH=$(print_data_file_path tlds.tsv)
   if [ -f "$PROJECT_TLDS_PATH" ]; then
      cp "$PROJECT_TLDS_PATH" "$TLDS_PATH" || {
         >&2 echo "$ME_NAME: (fatal error) failed to copy 'tlds.tsv' to user data dir '$TLDS_PATH'"
         exit 1
      }
      date +%s > $(print_data_file_path checked-time)
   else 
      INITIAL_TLDS_DOWNLOAD=1
   fi
fi

#
# determine wheather to check for update
#
CHECK_UPDATE=0
LAST_CHECKED_TIME=$(print_data_file_contents checked-time)
if [ -n "$LAST_CHECKED_TIME" ]; then
   echo $LAST_CHECKED_TIME | grep -q "^[0-9]*$" && {
      TIME_SINCE_LAST_CHECK=$(($(date +%s)-$LAST_CHECKED_TIME))
      if [ "$TIME_SINCE_LAST_CHECK" -gt "$CHECKED_TIME_TTL" ]; then 
         CHECK_UPDATE=1
      fi
   }
fi

#
# check for updates and optionally apply update mode
#
if ( [ "$INITIAL_TLDS_DOWNLOAD" = 1 ] || [ "$UPDATE_MODE" = 1 ] || [ "$CHECK_UPDATE" = 1 ] ); then
   
   CURRENT_RELEASE=$(print_data_file_contents release)
   
   #
   # tld-enum repo
   #
   GITHUB_REPO=katmore/tld-enum
   
   #
   # Github and Rawgit base URIs
   #
   RAWGIT_URI=https://cdn.rawgit.com
   GITHUB_URI=https://github.com
   
   #
   # latest tld-enum release
   #
   LATEST_URL="$GITHUB_URI/$GITHUB_REPO/releases/latest"
   
   #
   # permanent Rawgit CDN URL to latest 'tlds.tsv' 
   #
   LATEST_RELEASE=$(basename $(print_http_redirect $LATEST_URL))
   #https://cdn.rawgit.com/katmore/tld-enum/cf601629/formats/tsv/tlds.tsv
   LATEST_TLDS_TSV_URL="$RAWGIT_URI/$GITHUB_REPO/$LATEST_RELEASE/formats/tsv/tlds.tsv"
   
   if ( [ "$INITIAL_TLDS_DOWNLOAD" = 1 ] || [ "$UPDATE_MODE" = 1 ] ); then
      
      #
      # if new release, download and update
      #
      if ( [ "$INITIAL_TLDS_DOWNLOAD" = 1 ] || [ "$CURRENT_RELEASE" != "$LATEST_RELEASE" ] ); then
         if ( [ -d "$USER_DATA_ROOT" ] && [ "$INSTALL_MODE" != 1 ] ); then
            perm=660
         else
            perm=444
         fi
         #
         # prepare data root dir
         #
         init_data_root
         
         #
         # download 'tlds.tsv' from Rawgit to temp file
         #
         LATEST_TLDS_TEMP=$(mktemp)
         http_download "$LATEST_TLDS_TSV_URL" "$LATEST_TLDS_TEMP"
         
         #
         # copy to path
         #
         mv $LATEST_TLDS_TEMP $TLDS_PATH
         echo "$LATEST_RELEASE" > $(print_data_file_path release)
         date +%s > $(print_data_file_path checked-time)
         chmod $perm $(print_data_file_path release)
         chmod $perm $(print_data_file_path checked-time)
         chmod $perm $TLDS_PATH
         echo "updated tlds.tsv to $LATEST_RELEASE"
      else
         echo "tlds.tsv is already up-to-date ($CURRENT_RELEASE)"
      fi
      if [ "$UPDATE_MODE" = 1 ]; then
         exit 0
      fi
   else
      if [ "$CURRENT_RELEASE" != "$LATEST_RELEASE" ]; then
         >&2 echo "$ME_NAME: (current version '$CURRENT_RELEASE') a new release of 'tlds.tsv' is available (see '$ME_NAME --update'): $LATEST_RELEASE"
      fi
   fi
   
fi

#
# exit if install mode
#
if [ "$INSTALL_MODE" = 1 ]; then
   echo "install '$(basename $SYS_INSTALL_PATH)' success"
   exit 0
fi

#
# show description and type if domain <SEARCH> singleton
#
if ( [ -n "$SEARCH" ] && [ "$STARTS_WITH" = 0 ] ); then
   SHOW_DESC=1; SHOW_TYPE=1
fi
if [ "$STARTS_WITH" = 1 ]; then
   MATCH_COUNT=0
fi

#
# configre IFS with {tab} delimiter
#
IFS_OLD=$IFS
IFS=$(printf "\t")

#
# read tlds.tsv database
#
while read domain desc type; do
   #
   # apply <SEARCH> arg
   #
   if [ -n "$SEARCH" ]; then
      if [ "$STARTS_WITH" = 0 ]; then
         #
         # match <SEARCH> singleton 
         #
         if [ "$domain" != "$SEARCH" ]; then
            continue
         fi
      else
         #
         # match --starts-with <SEARCH> 
         #
         case $domain in
            $SEARCH*) MATCH_COUNT=$((MATCH_COUNT+1));;
            *) continue;;
         esac
      fi
   fi
   #
   # concatenate TLD info for display
   #
   line=
   if ( [ -z "$SEARCH" ] || [ "$STARTS_WITH" = 1 ] ); then
      line=$domain
   fi
   [ "$SHOW_DESC" = 1 ] && {
      [ -n "$line" ] && line="$line "
      line="$line$desc"
   }
   [ "$SHOW_TYPE" = 1 ] && {
      [ -n "$line" ] && line="$line "
      line="$line$type"
   }
   printf "$line\n"
   #
   # exit on matched <SEARCH> singleton 
   #
   if ( [ -n "$SEARCH" ] && [ "$STARTS_WITH" = 0 ] ); then
      exit 0
   fi
done < $TLDS_PATH

#
# set IFS to default delimiter
#
IFS=$IFS_OLD

#
# display summary for results of --starts-with <SEARCH> 
#
if ( [ -n "$SEARCH" ] && ( [ "$STARTS_WITH" = 0 ] || [ "$MATCH_COUNT" = 0 ] ) ); then
   [ "$STARTS_WITH" = 0 ] && >&2 echo "domain '$SEARCH' not found"
   [ "$MATCH_COUNT" = 0 ] && >&2 echo "no domains starting with '$SEARCH' found"
   exit 20
fi
if [ "$STARTS_WITH" = 1 ]; then
   >&2 echo ""
   if [ "$MATCH_COUNT" = "1" ]; then
      >&2 echo "found 1 matching domain"
   else
      >&2 echo "found $MATCH_COUNT matching domains"
   fi
fi


exit 0



