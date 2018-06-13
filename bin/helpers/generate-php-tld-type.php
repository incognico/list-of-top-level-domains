#!/usr/bin/env php
<?php
new class() {
    const ME_NAME = 'generate-php-tld-enum.php';
    const TLDS_CSV_PATH = __DIR__ . '/../../tlds.csv';
    const TLD_TYPE_PATH = __DIR__ . '/../../formats/php/TldEnum/TldType.php';
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
            echo "   Generates new PHP format files from the 'tlds.csv' file\n";
            echo "\n";
        }

        $fileTldsCsv = static::TLDS_CSV_PATH;

        if (!is_file($fileTldsCsv) || !is_readable($fileTldsCsv)) {
           static::_echo_error("(FATAL) not a readable path to 'tlds.csv': $fileTldsCsv",1);
        }
        
        $tldTypeFile = static::TLD_TYPE_PATH;
        $tldTypeDir = pathinfo($tldTypeFile,\PATHINFO_DIRNAME);
        if (file_exists($tldTypeFile)) {
           if (!is_file($tldTypeFile)) {
              static::_echo_error("(FATAL) existing path for 'TldType.php' was not a file as expected: $tldTypeFile",1);
           }
           if (!is_writable($tldTypeFile)) {
              static::_echo_error("(FATAL) existing path for 'TldType.php' is not writable: $tldTypeFile",1);
           }
        } else {
           if (!file_exists($tldTypeDir) || !is_dir($tldTypeDir)) {
              static::_echo_error("(FATAL) path for 'TldType.php' directory does not exist as expected: $tldTypeDir",1);
           }
           if (!is_writable($tldTypeDir)) {
              static::_echo_error("(FATAL) path for 'TldType.php' directory is not writeable: $tldTypeDir",1);
           }
        }
        
        $existingMd5 = null;
        if (file_exists($tldTypeFile)) {
           $existingMd5 = md5_file($tldTypeFile);
           $tldTypeBasename = pathinfo($tldTypeFile,\PATHINFO_FILENAME);
           $backupTldTypeFile = $tldTypeDir . \DIRECTORY_SEPARATOR . "$tldTypeBasename-$existingMd5-backup.php";
           if (!file_exists($backupTldTypeFile)) {
              if (!copy($tldTypeFile,$backupTldTypeFile)) {
                 static::_echo_error("(FATAL) failed to create backup for 'TldType.php' (source: $tldTypeFile, dest: $backupTldTypeFile)",1);
              }
           }
        }
        
        if (false === ($newTldTypeFile = tempnam ( sys_get_temp_dir() , 'tld-enum-' ))) {
           static::_echo_error("(FATAL) unable to initialize new 'TldType.php' file",1);
        }
        
        register_shutdown_function(function() use($newTldTypeFile) {
           if (is_file($newTldTypeFile) && is_writable($newTldTypeFile)) {
              unlink($newTldTypeFile);
           }
        });
        
        $tldType = [];
        if (($handle = fopen($fileTldsCsv, "r")) === false) {
           static::_echo_error("(FATAL) unable to open 'tlds.csv' in read mode: $fileTldsCsv",1);
        } else {
           echo "reading 'tlds.csv'...";
           $i=0;
           while (($row = fgetcsv($handle, 1000, ",")) !== false) {
              if (!count($row)) {
                 static::_echo_error("(FATAL) invalid 'tlds.csv' row #$i: $fileTldsCsv",1);
              }
              if (!isset($row[2])) {
                 static::_echo_error("(FATAL) invalid 'tlds.csv', missing column 3 on row #$i: $fileTldsCsv",1);
              }
              $domain = $row[0];
              $type = $row[2];
              $tldType[$domain] = $type;
              $i++;
           }
           fclose($handle);
           echo "done\n";
        }

        //echo "new TldType.php: $newTldTypeFile\n";
        
        echo "generating new 'TldType.php' file...";

        if (false === file_put_contents($newTldTypeFile,static::TLD_TYPE_SOURCE_START_CLASS)) {
           static::_echo_error("(FATAL) failed to write to new 'TldType.php' file",1);
        }
        
        if (false === file_put_contents($newTldTypeFile,static::TLD_TYPE_SOURCE_START_TLD_TYPE_CONST,\FILE_APPEND)) {
           static::_echo_error("(FATAL) failed to write to new 'TldType.php' file",1);
        }
        
        $tldTypeExport = var_export($tldType, true);
        $tldTypeExport = str_replace('array','',$tldTypeExport);
        $tldTypeExport = str_replace('(','[',$tldTypeExport);
        $tldTypeExport = str_replace(')',']',$tldTypeExport);
        
        if (false === file_put_contents($newTldTypeFile, $tldTypeExport,\FILE_APPEND)) {
           static::_echo_error("(FATAL) failed to write to new 'TldType.php' file",1);
        }
        
        if (false === file_put_contents($newTldTypeFile,static::TLD_TYPE_SOURCE_END_TLD_TYPE_CONST,\FILE_APPEND)) {
           static::_echo_error("(FATAL) failed to write to new 'TldType.php' file",1);
        }
        
        if (false === file_put_contents($newTldTypeFile,static::TLD_TYPE_SOURCE_END_CLASS,\FILE_APPEND)) {
           static::_echo_error("(FATAL) failed to write to new 'TldType.php' file",1);
        }
        
        echo "done\n";

        if ($existingMd5!==null) {
           $newTldTypeMd5 = md5_file($newTldTypeFile);
           if ($existingMd5 == $newTldTypeMd5) {
              static::_echo_error("(NOTICE) ignoring newly generated 'TldType.php' file that is identical to the existing file (md5: $existingMd5, path: $tldTypeFile)");
              return;
           }
           if (!unlink($tldTypeFile)) {
              static::_echo_error("(FATAL) failed to remove stale 'TldType.php': $tldTypeFile",1);
           }
        }
        
        if (!copy($newTldTypeFile,$tldTypeFile)) {
           static::_echo_error("(FATAL) failed to save new 'TldType.php': $tldTypeFile",1);
        }
        
        echo "saved new 'TldType.php' file\n";
        
        
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
    
    const TLD_TYPE_SOURCE_START_CLASS = <<<SOURCE
<?php
namespace TldEnum;

class TldType {

SOURCE;

    const TLD_TYPE_SOURCE_START_TLD_TYPE_CONST = <<<SOURCE
    const TLD_TYPE =
SOURCE;
    
    const TLD_TYPE_SOURCE_END_TLD_TYPE_CONST = <<<SOURCE
;
    
SOURCE;
    
    const TLD_TYPE_SOURCE_END_CLASS = <<<SOURCE

}
SOURCE;
};