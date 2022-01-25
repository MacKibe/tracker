<?php
//
//Include the library to enable crud and other operations.
include_once '../../../library/v/code/schema.php';
//
//System for tracking assignments for employees of an organization.
class tracker{
    //
    //
    public database $database;
    function __construct() {
        //
        //
        $this->database = new database("mutall_tracker");
    }
    //
    //Re-establish the links between the user and the application sub-systems.
    function relink_user(array /*<{ename, cname}>*/ $links): Bool{
        //
        try{
            //
            //1. Re-establish the links between the user table (in the mutall_user) and the
            //application replicas.
            //
            //Loop through the roles in applications' database and relink them 
            //with the mutall_user database.
            foreach($links as $link){
                //
                //1.1 Make the user column, in a role table, nullable.
                $sql_nullable = 
                    "alter table `$link->ename` modify column `$link->cname` int null";
                $this->database->query($sql_nullable);
                //
                //1.2 Nullify the user column.
                $sql_nullify = "update `$link->ename` set `$link->cname`=null";
                $this->database->query($sql_nullify);
                //
                //1.3 Re-establish the links.'
                $sql_relink = "alter table `$link->ename`
                           add foreign key ($link->cname)
                           references mutall_users.`$link->cname`($link->cname)";
                $this->database->query($sql_relink);
            }
            //
            //3. Return the results as successful.
            return true;
        }
        catch(Exception $ex){
            return false;
        }    
    } 
}