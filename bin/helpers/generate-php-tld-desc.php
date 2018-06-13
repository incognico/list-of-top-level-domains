#!/usr/bin/env php
<?php
new class() {
    const ME_NAME = 'generate-php-tld-desc.php';
    const TLDS_CSV_PATH = __DIR__ . '/../../tlds.csv';
    const TLD_DESC_PATH = __DIR__ . '/../../formats/php/TldEnum/TldDesc.php';
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
            echo "   Generates new PHP format file 'TldDesc.php' from the 'tlds.csv' file\n";
            echo "\n";
        }

        $fileTldsCsv = static::TLDS_CSV_PATH;

        if (!is_file($fileTldsCsv) || !is_readable($fileTldsCsv)) {
           static::_echo_error("(FATAL) not a readable path to 'tlds.csv': $fileTldsCsv",1);
        }
        
        $tldDescFile = static::TLD_DESC_PATH;
        $tldDescDir = pathinfo($tldDescFile,\PATHINFO_DIRNAME);
        if (file_exists($tldDescFile)) {
           if (!is_file($tldDescFile)) {
              static::_echo_error("(FATAL) existing path for 'TldDesc.php' was not a file as expected: $tldDescFile",1);
           }
           if (!is_writable($tldDescFile)) {
              static::_echo_error("(FATAL) existing path for 'TldDesc.php' is not writable: $tldDescFile",1);
           }
        } else {
           if (!file_exists($tldDescDir) || !is_dir($tldDescDir)) {
              static::_echo_error("(FATAL) path for 'TldDesc.php' directory does not exist as expected: $tldDescDir",1);
           }
           if (!is_writable($tldDescDir)) {
              static::_echo_error("(FATAL) path for 'TldDesc.php' directory is not writeable: $tldDescDir",1);
           }
        }
        
        $existingMd5 = null;
        if (file_exists($tldDescFile)) {
           $existingMd5 = md5_file($tldDescFile);
           $tldDescBasename = pathinfo($tldDescFile,\PATHINFO_FILENAME);
           $backupTldDescFile = $tldDescDir . \DIRECTORY_SEPARATOR . "$tldDescBasename-$existingMd5-backup.php";
           if (!file_exists($backupTldDescFile)) {
              if (!copy($tldDescFile,$backupTldDescFile)) {
                 static::_echo_error("(FATAL) failed to create backup for 'TldDesc.php' (source: $tldDescFile, dest: $backupTldDescFile)",1);
              }
           }
        }
        
        if (false === ($newTldDescFile = tempnam ( sys_get_temp_dir() , 'tld-enum-' ))) {
           static::_echo_error("(FATAL) unable to initialize new 'TldDesc.php' file",1);
        }
        
        register_shutdown_function(function() use($newTldDescFile) {
           if (is_file($newTldDescFile) && is_writable($newTldDescFile)) {
              unlink($newTldDescFile);
           }
        });
        
        $tldDesc = [];
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
              $domain = $row[0];
              $desc = $row[1];
              $tldDesc[$domain] = $desc;
              $i++;
           }
           fclose($handle);
           echo "done\n";
        }

        //echo "new TldDesc.php: $newTldDescFile\n";
        
        echo "generating new 'TldDesc.php' file...";

        if (false === file_put_contents($newTldDescFile,static::TLD_DESC_SOURCE_START_CLASS)) {
           static::_echo_error("(FATAL) failed to write to new 'TldDesc.php' file",1);
        }
        
        if (false === file_put_contents($newTldDescFile,static::TLD_DESC_SOURCE_START_TLD_DESC_CONST,\FILE_APPEND)) {
           static::_echo_error("(FATAL) failed to write to new 'TldDesc.php' file",1);
        }
        
        $tldDescExport = var_export($tldDesc, true);
        $tldDescExport = str_replace('array','',$tldDescExport);
        $tldDescExport = str_replace('(','[',$tldDescExport);
        $tldDescExport = str_replace(')',']',$tldDescExport);
        
        if (false === file_put_contents($newTldDescFile, $tldDescExport,\FILE_APPEND)) {
           static::_echo_error("(FATAL) failed to write to new 'TldDesc.php' file",1);
        }
        
        if (false === file_put_contents($newTldDescFile,static::TLD_DESC_SOURCE_END_TLD_DESC_CONST,\FILE_APPEND)) {
           static::_echo_error("(FATAL) failed to write to new 'TldDesc.php' file",1);
        }
        
        if (false === file_put_contents($newTldDescFile,static::TLD_DESC_SOURCE_END_CLASS,\FILE_APPEND)) {
           static::_echo_error("(FATAL) failed to write to new 'TldDesc.php' file",1);
        }
        
        echo "done\n";

        if ($existingMd5!==null) {
           $newTldDescMd5 = md5_file($newTldDescFile);
           if ($existingMd5 == $newTldDescMd5) {
              static::_echo_error("(NOTICE) ignoring newly generated 'TldDesc.php' file that is identical to the existing file (md5: $existingMd5, path: $tldDescFile)");
              return;
           }
           if (!unlink($tldDescFile)) {
              static::_echo_error("(FATAL) failed to remove stale 'TldDesc.php': $tldDescFile",1);
           }
        }
        
        if (!copy($newTldDescFile,$tldDescFile)) {
           static::_echo_error("(FATAL) failed to save new 'TldDesc.php': $tldDescFile",1);
        }
        
        echo "saved new 'TldDesc.php' file\n";
        
        
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
    
    const TLD_DESC_SOURCE_START_CLASS = <<<SOURCE
<?php
namespace TldEnum;

class TldDesc {

SOURCE;

    const TLD_DESC_SOURCE_START_TLD_DESC_CONST = <<<SOURCE
    const TLD_DESC =
SOURCE;
    
    const TLD_DESC_SOURCE_END_TLD_DESC_CONST = <<<SOURCE
;
    
SOURCE;
    
    const TLD_DESC_SOURCE_END_CLASS = <<<SOURCE

}
SOURCE;
};