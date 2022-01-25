//
//Check the assignments that are due.
async function view_due_assignments(){
    //
    //The SQL statement to get data from the database.
    const sql = `select 
            todo.id, 
            todo.description, 
            developer.email, 
            datediff(now(), todo.start_date) as days_due
        from 
            todo
        inner join 
            developer
        on 
            developer.developer = todo.developer
        where
            datediff(now(), todo.start_date) >= 14`;
    //
    //Get the data from the database using mutall's library.
    const Ifuel = await server.exec('database', ['tracker'], 'get_sql_data', [sql]);
    //
    //
    console.log(Ifuel);
}
//
//Load text.
function x(){
    //
    //Open the window from which to get the data.
    const win_print = this.win.open('general.html');
}