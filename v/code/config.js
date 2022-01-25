// 
//Resolve the outlook config so as to extend it. s 
import outlook_config from '../../../outlook/v/code/config.js';
// 
//Export the extended config local to the rentize.
export default class config extends outlook_config {
    constructor() {
        super();
        // 
        //Overide the application database.
        this.app_db = "mutall_tracker";
        //
        //Subject
        this.subject = ['developer', 'mutall_tracker'];
        //
        //The id of this application; if not given, we use this 
        //constructors name
        this.id = "Tracker";
        //
        //The window application's url; if  not provided, we use that of
        //the current window
        this.url = "";
        //
        //Image associated with this app 
        this.image = "";
        //
        //The full trademark name of the application
        this.trade = "Tracking Company Assignments";
        //
        //For advertising purposes
        this.tagname = "";
        // 
        //This is the general template for collecting simple user data.
        this.general = "/outlook/v/code/general.html";
        // 
        //The maximum number of records that can be retrieved from 
        //the server using one single fetch. Its value is used to modify 
        //the editor sql by  adding a limit clause 
        this.limit = 40;
    }
}
