// 
//Get the server methods 
import * as server from '../../../library/v/code/server.js';
// 
//Resolve the outlook quize
import * as outlook from '../../../outlook/v/code/outlook.js';
//
//Load some json text to the current database 
export function load_text():void {
    //
    //open the window for the load data.
    const win = window.open()!;  
    //
    //When the button has been clicked fire the event listener.
    win.document.querySelector("#go")!.addEventListener('click', () => {
        //
        //get the value of the selected filetype
        //Ensure that this input type is a label, tabular or javex.
        const file_type = (<HTMLInputElement>document.querySelector("selector")!).value;
        //
        //get the value of the input of type file and its value
        const file =(<HTMLInputElement>document.querySelector('#file')).files![0];
        // 
        //Post this file to the server
        server.post_file(file, path);
        // 
        //Save the data in to the database.
        const Imala=server.exec('record',[],'load_text',[path,file_type])
        // 
        //Report the outcome of the save
        alert(Imala);
    });
}