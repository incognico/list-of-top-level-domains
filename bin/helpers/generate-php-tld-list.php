#!/usr/bin/env php
<?php
new class() {
    const ME_NAME = 'generate-php-tld-list.php';
    const TLDS_CSV_PATH = __DIR__ . '/../../tlds.csv';
    const TLD_ENUM_PATH = __DIR__ . '/../../formats/php/TldEnum/TldList.php';
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
            echo "   Generates new PHP format file 'TldList.php' from the 'tlds.csv' file\n";
            echo "\n";
        }

        $fileTldsCsv = static::TLDS_CSV_PATH;

        if (!is_file($fileTldsCsv) || !is_readable($fileTldsCsv)) {
           static::_echo_error("(FATAL) not a readable path to 'tlds.csv': $fileTldsCsv",1);
        }
        
        $tldEnumFile = static::TLD_ENUM_PATH;
        $tldEnumDir = pathinfo($tldEnumFile,\PATHINFO_DIRNAME);
        if (file_exists($tldEnumFile)) {
           if (!is_file($tldEnumFile)) {
              static::_echo_error("(FATAL) existing path for 'TldList.php' was not a file as expected: $tldEnumFile",1);
           }
           if (!is_writable($tldEnumFile)) {
              static::_echo_error("(FATAL) existing path for 'TldList.php' is not writable: $tldEnumFile",1);
           }
        } else {
           if (!file_exists($tldEnumDir) || !is_dir($tldEnumDir)) {
              static::_echo_error("(FATAL) path for 'TldList.php' directory does not exist as expected: $tldEnumDir",1);
           }
           if (!is_writable($tldEnumDir)) {
              static::_echo_error("(FATAL) path for 'TldList.php' directory is not writeable: $tldEnumDir",1);
           }
        }
        
        $existingMd5 = null;
        if (file_exists($tldEnumFile)) {
           $existingMd5 = md5_file($tldEnumFile);
           $tldEnumBasename = pathinfo($tldEnumFile,\PATHINFO_FILENAME);
           $backupTldEnumFile = $tldEnumDir . \DIRECTORY_SEPARATOR . "$tldEnumBasename-$existingMd5-backup.php";
           if (!file_exists($backupTldEnumFile)) {
              if (!copy($tldEnumFile,$backupTldEnumFile)) {
                 static::_echo_error("(FATAL) failed to create backup for 'TldList.php' (source: $tldEnumFile, dest: $backupTldEnumFile)",1);
              }
           }
        }
        
        if (false === ($newTldEnumFile = tempnam ( sys_get_temp_dir() , 'tld-enum-' ))) {
           static::_echo_error("(FATAL) unable to initialize new 'TldList.php' file",1);
        }
        
        register_shutdown_function(function() use($newTldEnumFile) {
           if (is_file($newTldEnumFile) && is_writable($newTldEnumFile)) {
              unlink($newTldEnumFile);
           }
        });
        
        $tldEnum = [];
        if (($handle = fopen($fileTldsCsv, "r")) === false) {
           static::_echo_error("(FATAL) unable to open 'tlds.csv' in read mode: $fileTldsCsv",1);
        } else {
           echo "reading 'tlds.csv'...";
           $i=0;
           while (($row = fgetcsv($handle, 1000, ",")) !== false) {
              if (!count($row)) {
                 static::_echo_error("(FATAL) invalid 'tlds.csv' row #$i: $fileTldsCsv",1);
              }
              //echo $row[0]."\n";
              $tldEnum []= $row[0];
              $i++;
           }
           fclose($handle);
           echo "done\n";
        }

        //echo "new TldList.php: $newTldEnumFile\n";
        
        echo "generating new 'TldList.php' file...";

        if (false === file_put_contents($newTldEnumFile,static::TLD_ENUM_SOURCE_START_CLASS)) {
           static::_echo_error("(FATAL) failed to write to new 'TldList.php' file",1);
        }
        
        if (false === file_put_contents($newTldEnumFile,static::TLD_ENUM_SOURCE_START_TLD_ENUM_CONST,\FILE_APPEND)) {
           static::_echo_error("(FATAL) failed to write to new 'TldList.php' file",1);
        }
        
        $tldEnumExport = var_export($tldEnum,true);
        $tldEnumExport = substr($tldEnumExport,strlen("array ("));
        $tldEnumExport = substr($tldEnumExport,0,-1);
        $tldEnumLine = [];
        $i=0;
        foreach(explode("\n",$tldEnumExport) as $line) {
           $filteredLine = preg_replace('/[0-9]+ => \'/', "'", $line);
           $tldEnumLine []= $filteredLine;
           $i++;
        }
        unset($line);
        
        if (false === file_put_contents($newTldEnumFile, " [".implode("\n",$tldEnumLine)."]",\FILE_APPEND)) {
           static::_echo_error("(FATAL) failed to write to new 'TldList.php' file",1);
        }
        
        if (false === file_put_contents($newTldEnumFile,static::TLD_ENUM_SOURCE_END_TLD_ENUM_CONST,\FILE_APPEND)) {
           static::_echo_error("(FATAL) failed to write to new 'TldList.php' file",1);
        }
        
        if (false === file_put_contents($newTldEnumFile,static::TLD_ENUM_SOURCE_END_CLASS,\FILE_APPEND)) {
           static::_echo_error("(FATAL) failed to write to new 'TldList.php' file",1);
        }
        
        echo "done\n";

        if ($existingMd5!==null) {
           $newTldEnumMd5 = md5_file($newTldEnumFile);
           if ($existingMd5 == $newTldEnumMd5) {
              static::_echo_error("(NOTICE) ignoring newly generated 'TldList.php' file that is identical to the existing file (md5: $existingMd5, path: $tldEnumFile)");
              return;
           }
           if (!unlink($tldEnumFile)) {
              static::_echo_error("(FATAL) failed to remove stale 'TldList.php': $tldEnumFile",1);
           }
        }
        
        if (!copy($newTldEnumFile,$tldEnumFile)) {
           static::_echo_error("(FATAL) failed to save new 'TldList.php': $tldEnumFile",1);
        }
        
        echo "saved new 'TldList.php' file\n";
        
        
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
    
    const TLD_ENUM_SOURCE_START_CLASS = <<<SOURCE
<?php
namespace TldEnum;

class TldList {

SOURCE;

    const TLD_ENUM_SOURCE_START_TLD_ENUM_CONST = <<<SOURCE
    const TLD_LIST =
SOURCE;
    
    const TLD_ENUM_SOURCE_END_TLD_ENUM_CONST = <<<SOURCE
;
    
SOURCE;
    
    const TLD_ENUM_SOURCE_END_CLASS = <<<SOURCE

}
SOURCE;
};