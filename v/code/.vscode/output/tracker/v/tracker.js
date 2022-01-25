import { app } from "../../outlook/v/code/app.js";
//The roles and services of Tracker
const roles = {
    developer: ['Fullstack developer', {
            developer: ['View developers', '+', ['review']],
            todo: ['View todo', '+', ['review']],
            proceeding: ['View Proceedings', '+', ['review']],
            official: ['View Officials', '+', ['review']],
            participant: ['View Partcipants', '+', ['review']]
        }
    ],
    staff: ['Non-programmng staff', {
            todo: ['Manage 1-2-1 Assignments', '-', []],
            participant: ['Manage Self Registration', '-', []],
            minute: ['Edit Minutes', '+', ['review', 'update']]
        }
    ]
};
//Tracking assignmenets is an application which requires roles and a 
//subject for painting the content panel.
class tracker extends app {
    //
    //Initialize tracker with roles. Use partcipant as the content driver
    constructor() {
        super(
        //
        //Products
        roles, 
        //
        //Subject
        ['developer', 'tracking'], 
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
}
//Start the traker application after fully loading the current 
//window.
window.onload = async () => {
    const Tk = new tracker();
    await Tk.initialize();
};
