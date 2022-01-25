//
//Import app from the outlook library.
import { role } from "../../../outlook/v/code/outlook.js";
import {app} from "../../../outlook/v/code/app.js";
import * as crud from  '../../../outlook/v/code/crud.js';
//
//Possible user roles in Tracker 
type role_id = 'developer'|'staff'|'admin';
function fun():void{

}  
function a():void{

}
//
//The entities of the tracker system, as subjects of CRUD operations.
//They are readoff the data model: an opporunity to the creation of 
//this type
type ename = 
    'developer'|'participant'|'minute'|'official'|'todo'|
    'proceeding'|'presentation'|'meeting'|'agenda'|'decision'|
    'lesson'|'day'|'file'|'ledger'|"general"|"resource"|"asset"|"customization"|"execution"|"";  
//   
//The roles and services of Tracker
const roles: role.products<role_id, ename> = {
    staff: ['Manage Products', {
            resource:['Resources', '+', ['review', 'update'],"crud"],
            asset:['Assets', '+', ['review', 'update'],"crud"],
            customization:['Customization', '+', ['review', 'update'],"crud"],
            execution:['Execution', '+', ['review', 'update'],"crud"],
            general:['Load_text',fun,"load_text"]            
        }
    ],
    developer:['Fullstack developer', {
            developer:['View developers', '+', ['review'],"crud"],//Only the review operation is allowed on minutes
            todo:['View todo', '+', ['review'],"crud"],
            proceeding:['View Proceedings', '+', ['review'],"crud"],
            official:['View Officials', '+', ['review'],"crud"],
            participant:['View Partcipants', '+', ['review'],"crud"],
            file:['Load Text File', a, ['review'],"crud"],
            ledger:['View Current Ledger', '+', ['review'],"crud"]
        }
    ]
 }
//  
//Tracking assignmenets is an application which requires roles and a 
//subject for painting the content panel.
class tracker extends app<role_id, ename>{
    //
    //Initialize tracker with roles. Use partcipant as the content driver
    constructor(){
        super(
            //
            //Products
            roles, 
            //
            //Subject
            ['developer', 'mutall_tracker'],
            //
            //The id of this application; if not given, we use this 
            //constructors name
            "tracker", 
            //
            //The window applicatiins url; if  not provided, we use that of
            //the current window
            "",
            //
            //Image associatd witn this app 
            "", 
            //
            //The full trademark name of the application
            "Tracking Assignments",
            //
            //For advertis=ing purposes
            "Everything Matters"
            //
        );
    }
    //
    //Print the current document's innerHTML.
    print(){
        //
        //Get the table htm in print.html
        const table = crud.page.current.win.document.querySelector('table');
        //
        //Whilst inside the current document, get the table's innerHTML.
        const html = table!.innerHTML;
        //
        //Open the window in which to print the table.
        const win_print = this.win.open('print.html');
        //
        //Get the body of the newly opened window.
        const body = win_print!.document.querySelector('body');
        //
        //Then print the table in the body.
        body!.innerHTML = html;
    } 
    
 
}


//Start the tracker application after fully loading the current 
//window.
window.onload = async ()=>{
    const App = new tracker();
    await App.initialize();
}