//
//This class is designed to customise the operating 
//environmennt for the various applications e.g the 
//running versions, file directories, passwords, e.t.c 
//i.e the environmental settings that change frequently
// based on the application.  
export default class config {
}
// 
//This is the general template for displaying the user report 
config.report = "/outlook/v/code/report.html";
//
//This is the complete path for the login template
config.login = "/outlook/v/code/login.html";
//
//The complete path of the welcome template 
config.welcome = "/outlook/v/code/welcome.html";
// 
//Your web app's Firebase configuration
config.firebase = {
    apiKey: "AIzaSyCkx1Y3vm5fksSAuUzuQpZqtNun1vYUzD8",
    authDomain: "outlook-a7498.firebaseapp.com",
    databaseURL: "https://outlook-a7498.firebaseio.com",
    projectId: "outlook-a7498",
    storageBucket: "outlook-a7498.appspot.com",
    messagingSenderId: "411177969089",
    appId: "1:411177969089:web:97f312e8ce557859077b40",
    measurementId: "G-QKSDP8M6ND"
};
//
//The database for managing users and application that are 
//running on this server 
config.login_db = "mutall_users";
//The crud's template
config.crud = "/outlook/v/code/crud.html";
//
//Application dbase.
config.app_db = "tracker";
// 
//This is the general template for collecting simple user data.
config.general = "/outlook/v/code/general.html";
