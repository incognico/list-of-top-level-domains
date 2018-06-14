#!/usr/bin/env php
<?php
new class() {
    const ME_NAME = 'generate-php-tld-info.php';
    const TLDS_CSV_PATH = __DIR__ . '/../../tlds.csv';
    const TLD_INFO_PATH = __DIR__ . '/../../formats/php/TldEnum/TldInfo.php';
    private static $_quietMode = false;
    public function __construct() {
        $opt = getopt ( "q",['quiet']);
        if (isset($opt['q']) || isset($opt['quiet'])) {
            static::$_quietMode = true;
        }
        
        if (!static::$_quietMode) {
            echo static::ME_NAME."\n";
            echo "   (c) 2017 Doug Bird, All Rights Reserved.\n";
            echo "   see README.md for licensing and other information\n";
            echo "   https://github.com/katmore/tld-enum#readme\n";
            echo "\n";
            echo "   Generates new PHP format file 'TldInfo.php' from the 'tlds.csv' file\n";
            echo "\n";
        }

        $fileTldsCsv = static::TLDS_CSV_PATH;

        if (!is_file($fileTldsCsv) || !is_readable($fileTldsCsv)) {
           static::_echo_error("(FATAL) not a readable path to 'tlds.csv': $fileTldsCsv",1);
        }
        
        $tldInfoFile = static::TLD_INFO_PATH;
        $tldInfoDir = pathinfo($tldInfoFile,\PATHINFO_DIRNAME);
        if (file_exists($tldInfoFile)) {
           if (!is_file($tldInfoFile)) {
              static::_echo_error("(FATAL) existing path for 'TldInfo.php' was not a file as expected: $tldInfoFile",1);
           }
           if (!is_writable($tldInfoFile)) {
              static::_echo_error("(FATAL) existing path for 'TldInfo.php' is not writable: $tldInfoFile",1);
           }
        } else {
           if (!file_exists($tldInfoDir) || !is_dir($tldInfoDir)) {
              static::_echo_error("(FATAL) path for 'TldInfo.php' directory does not exist as expected: $tldInfoDir",1);
           }
           if (!is_writable($tldInfoDir)) {
              static::_echo_error("(FATAL) path for 'TldInfo.php' directory is not writeable: $tldInfoDir",1);
           }
        }
        
        $existingMd5 = null;
        if (file_exists($tldInfoFile)) {
           $existingMd5 = md5_file($tldInfoFile);
           $tldInfoBasename = pathinfo($tldInfoFile,\PATHINFO_FILENAME);
           $backupTldInfoFile = $tldInfoDir . \DIRECTORY_SEPARATOR . "$tldInfoBasename-$existingMd5-backup.php";
           if (!file_exists($backupTldInfoFile)) {
              if (!copy($tldInfoFile,$backupTldInfoFile)) {
                 static::_echo_error("(FATAL) failed to create backup for 'TldInfo.php' (source: $tldInfoFile, dest: $backupTldInfoFile)",1);
              }
           }
        }
        
        if (false === ($newTldInfoFile = tempnam ( sys_get_temp_dir() , 'tld-enum-' ))) {
           static::_echo_error("(FATAL) unable to initialize new 'TldInfo.php' file",1);
        }
        
        register_shutdown_function(function() use($newTldInfoFile) 
        {
           if (is_file($newTldInfoFile) && is_writable($newTldInfoFile)) {
              unlink($newTldInfoFile);
           }
        });
        
        echo "generating new 'TldInfo.php' file...";
        
        if (false === file_put_contents($newTldInfoFile,static::TLD_INFO_SOURCE_START_CLASS)) {
           static::_echo_error("(FATAL) failed to write to new 'TldInfo.php' file",1);
        }
        
        if (false === file_put_contents($newTldInfoFile,static::TLD_INFO_SOURCE_START_TLD_INFO_CONST,\FILE_APPEND)) {
           static::_echo_error("(FATAL) failed to write to new 'TldInfo.php' file",1);
        }
        
        if (($handle = fopen($fileTldsCsv, "r")) === false) {
           static::_echo_error("(FATAL) unable to open 'tlds.csv' in read mode: $fileTldsCsv",1);
        } else {
           echo "reading 'tlds.csv'...";
           $i=0;
           while (($row = fgetcsv($handle, 1000, ",")) !== false) {
              if (!count($row)) {
                 static::_echo_error("(FATAL) invalid 'tlds.csv' row #$i: $fileTldsCsv",1);
              }
              if (!isset($row[1])) {
                 static::_echo_error("(FATAL) invalid 'tlds.csv', missing column 2 on row #$i: $fileTldsCsv",1);
              }
              if (!isset($row[2])) {
                 static::_echo_error("(FATAL) invalid 'tlds.csv', missing column 3 on row #$i: $fileTldsCsv",1);
              }
              $domain = $row[0];
              $desc = $row[1];
              $type = $row[2];
              $tldInfoElem = [
                 'domain'=>$domain,
                 'description'=>$desc,
                 'type'=>$type,
              ];
              
              $tldInfoElem = var_export($tldInfoElem, true);
              $tldInfoElem = substr($tldInfoElem,strlen("array ("));
              $tldInfoElem = substr($tldInfoElem,0,-1);
              $tldInfoElem = ' ['.$tldInfoElem.']';
              
              if ($i!=0) {
                 $tldInfoElem = ",\n$tldInfoElem";
              }
              
              if (false === file_put_contents($newTldInfoFile, $tldInfoElem,\FILE_APPEND)) {
                 static::_echo_error("(FATAL) failed to write to new 'TldInfo.php' file",1);
              }
              
              $i++;
           }
           fclose($handle);
           echo "done\n";
        }

        //echo "new TldInfo.php: $newTldInfoFile\n";
        
        if (false === file_put_contents($newTldInfoFile,static::TLD_INFO_SOURCE_END_TLD_INFO_CONST,\FILE_APPEND)) {
           static::_echo_error("(FATAL) failed to write to new 'TldInfo.php' file",1);
        }
        
        if (false === file_put_contents($newTldInfoFile,static::TLD_INFO_SOURCE_END_CLASS,\FILE_APPEND)) {
           static::_echo_error("(FATAL) failed to write to new 'TldInfo.php' file",1);
        }
        
        echo "done\n";

        if ($existingMd5!==null) {
           $newTldInfoMd5 = md5_file($newTldInfoFile);
           if ($existingMd5 == $newTldInfoMd5) {
              static::_echo_error("(NOTICE) ignoring newly generated 'TldInfo.php' file that is identical to the existing file (md5: $existingMd5, path: $tldInfoFile)");
              return;
           }
           if (!unlink($tldInfoFile)) {
              static::_echo_error("(FATAL) failed to remove stale 'TldInfo.php': $tldInfoFile",1);
           }
        }
        
        if (!copy($newTldInfoFile,$tldInfoFile)) {
           static::_echo_error("(FATAL) failed to save new 'TldInfo.php': $tldInfoFile",1);
        }
        
        echo "saved new 'TldInfo.php' file\n";
        
        
    }

    private static function _echo_error(string $str, int $fatal_exit_status=null) : void {
        if (substr($str,0,1)!=="\n") {
            $str .= "\n";
        }
        $str = static::ME_NAME . ": ".$str;
        if (\PHP_SAPI=='cli') {
            fwrite(\STDERR,$str);
        } else {   
            echo $str ;
        }
        if (is_int($fatal_exit_status)) {
           exit($fatal_exit_status);
        }
    }
    
    const TLD_INFO_SOURCE_START_CLASS = <<<SOURCE
<?php
namespace TldEnum;

class TldInfo {

SOURCE;

    const TLD_INFO_SOURCE_START_TLD_INFO_CONST = <<<SOURCE
    const TLD_INFO = [
SOURCE;
    
    const TLD_INFO_SOURCE_END_TLD_INFO_CONST = <<<SOURCE
];
    
SOURCE;
    
    const TLD_INFO_SOURCE_END_CLASS = <<<SOURCE

    /**
     * converts a TLD_INFO element into a TldInfoItem object
     * 
     * @param array \$info element from \\TldEnum\\TldInfo::TLD_INFO
     * 
     * @return \\TldEnum\\TldInfoItem
     */
    public static function toInfoItem(array \$info) : TldInfoItem {
       \$infoItem = new TldInfoItem;
       foreach(\$infoItem as \$prop=>&\$val) {
          if (isset(\$info[\$prop])) {
             \$val = \$info[\$prop];
          }
       }
       unset(\$prop);
       unset(\$val);
       return \$infoItem;
    }

}
SOURCE;
};