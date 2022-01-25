<?php
//
//Include the library to enable crud and other operations.
include_once '../../../library/v/code/schema.php';
//
//Create a new database instance.
$database = new database('mutall_tracker');
//
//Query to get data assignments that are due and by how many days they are due.
//$sql_due_days = "select 
//                    todo.id, 
//                    todo.description, 
//                    developer.email, 
//                    datediff(now(), todo.start_date) as days_due
//                from 
//                    todo
//                    inner join developer on developer.developer = todo.developer
//                ";
//
//Get data from database.
//$result_due_days = $database->get_sql_data($sql_due_days);
//
//
//foreach ($result_due_days as $value) {
//    //
//    //
//    echo '<br>';
//    //
//    //
//    print_r($value);
//}
//
//Re-establish the links between the user and the application sub-systems.
function relink_user(){
    //
    //Query to get the table names with 
    $sql_roles = $database->get_entities();
    //
    //
    foreach ($sql_roles as $value) {
        //
        //Make the foreign key column (user) in a role table nullable.
        $sql_nullable = "alter table ${value}
                         modify column ${value}.user int null";
        //
        //Send the query to the database.
        $result_nullable = $database->query($sql_nullable);
        //
        //Nullify the user column 
        $sql_nullify = "update ${value} set user=null";
        //
        //Send the query to the database.
        $result_nullify = $database->query($sql_nullify);
        //
        //Establish a link between a role and users table.
        $sql_fk = "alter table ${value}
                   add foreign key (user)
                   references mutall_users.user(user)";
        //
        //Send the query to the database.
        $result_fk = $database->query($sql_fk);
    }
}