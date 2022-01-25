//
//Resolve the mutall error class
import { mutall_error } from "./schema.js";
//
//Simplifies the windows equivalent fetch method with the following 
//behaviour.
//If the fetch was successful, we return the result; otherwise the fetch 
//fails with an exception.
//partcular static methods are specifed static:true....
//It returns the same as result as the method  in php 
export async function exec(
//
//The class of the php class to execute.
class_name, 
//
cargs, 
//
method_name, 
//
margs) {
    //
    //Prepare to collect the data to send to the server
    const formdata = new FormData();
    //
    //Add to the form, the class to create objets on the server
    formdata.append('class', class_name);
    //
    //Add the class constructor arguments
    formdata.append('cargs', JSON.stringify(cargs));
    //
    //Add the method to execute on the class
    formdata.append('method', method_name);
    //
    //Add the method parameters 
    formdata.append('margs', JSON.stringify(margs));
    //
    //Prepare  to fetch using a post
    const init = {
        method: 'post',
        body: formdata
    };
    //
    //Fetch and wait for the response, using the (shared) export file
    const response = await fetch('/library/v/code/export.php', init);
    //
    //Get the text from the response. This can never fail
    const text = await response.text();
    //
    //The output is expected to be a json string that has the following 
    //pattern: {ok:boolean, result:any, html:string}. If ok, the 
    //result is that of executing the requested php method; otherise it
    //is an error message. htm is any buffered warnings.
    let output;
    //
    //The json might fail (for some reason)
    try {
        //Try to convert the text into json
        output = JSON.parse(text);
    }
    //
    //Invalid json;this must be a structural error that needs special attention
    catch (ex) {
        // 
        //Compile a usefull error message
        const msg = `Error trapping failed???. <br/> Message: "${ex.message}".<br/>Text = "${text}"`;
        //
        throw new mutall_error(msg);
    }
    //
    //The json is valid.
    // 
    //Test if the requested method ran successfully 
    if (output.ok)
        return output.result;
    //
    //The method failed. Report the method specific errors. The result
    //must be an error message string
    const msg = output.result;
    // 
    //Report the error. 
    throw new mutall_error(msg);
}
//
//
//Post the given file to the server at the given folder.
export async function post_file(file, path) {
    //
    //1. Create a form data object
    const formData = new FormData();
    //
    //2. Append the file to the form data object
    //
    //Attach the folder name where the file will go
    formData.append('path', path);
    //
    //Attach the actual file to the form data 
    formData.append("file", file);
    //     
    //4. Prepare a fetch initialization file using the form data
    const init = {
        method: 'POST',
        body: formData
    };
    //
    //5. Use the initialization object to send the file to the server
    const response = await fetch('/library/v/code/export.php?post_file=true', init);
    //
    //await for the output which has the following structure
    //{ok, result, html}
    //ok
    const output = await response.json();
    //
    return output;
}
//
//Fetching static methods
export async function ifetch(
//
//The class of the php object to use.
class_name, 
//
//The static method name to execute on the class. 
method_name, 
//
//The method parameters
margs) {
    //
    //Prepare to collect the data to send to the server
    const formdata = new FormData();
    //
    //Add to the form, the class name to create objets on the server
    formdata.append('class', class_name);
    //
    //Add the method to execute on the class
    formdata.append('method', method_name);
    //
    //Add the method parameters 
    formdata.append('margs', JSON.stringify(margs));
    //
    //Prepare  to fetch using a post
    const init = {
        method: 'post',
        body: formdata
    };
    //
    //Fetch and wait for the response, using the (shared) export file
    const response = await fetch('/library/v/code/export.php?is_static=true', init);
    //
    //Get the text from the response. This can never fail
    const text = await response.text();
    //
    //The output is expected to be a json string that has the follwing 
    //pattern: {ok, result, html} where result, if ok, is the data of 
    //available choices. The json might fail
    try {
        //Try to convert the text into json
        const output = JSON.parse(text);
        //
        //Destructure the output to get the desired result
        const { result } = output;
        // 
        return result;
    }
    //
    //Invalid json;this must be an error
    catch (ex) {
        throw new mutall_error(ex.message);
    }
}
