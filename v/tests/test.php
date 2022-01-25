<?php
//
//
include_once '../../../library/v/code/schema.php';
//
//
$database = new database("mutall_tracker");
//
//
$todo = $database->entities["todo"];
//
//
$tag = $todo->columns["tag"];
//
var_dump($tag);