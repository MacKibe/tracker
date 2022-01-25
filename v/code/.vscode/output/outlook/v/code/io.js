//
//Resolve the schema classes, viz.:database, columns, mutall e.t.c. 
import * as schema from "../../../library/v/code/schema.js";
import * as crud from "./crud.js";
// 
//Resolve the tree methods needed for browser
import * as tree from "./tree.js";
// 
//Resolve the server functionality
import * as server from "../../../library/v/code/server.js";
//
/*
 * Sample from stack overflow f how to get Typescript typoes from
 * array of strings
    export const AVAILABLE_STUFF = <const> ['something', 'else'];
    export type Stuff = typeof AVAILABLE_STUFF[number];
 */
//Types of io bases on the input element
const input_types = ["date", "text", "number", "file", "image", "email"];
//
//Other Non-input types
const other_types = ["read_only", "checkbox", "primary", "foreign",
    "textarea", "url", "select"];
//
//Creating an io from the given anchor and column
export function create_io(
// 
//The parent of the input/output elements of this io. 
anchor, 
// 
//The column associated with this io. 
col) {
    //
    //Read only collumns will tagged as such.
    if (col.read_only !== undefined && col.read_only)
        return new readonly(anchor);
    //
    //Characterize the foreign and primary key columns
    if (col instanceof schema.primary)
        return new primary(anchor);
    if (col instanceof schema.foreign)
        return new foreign(anchor);
    //
    //Characterize the attributes
    //
    //A column is a checkbox if...
    if (
    //
    //... its name prefixed by 'is_'....
    col.name.startsWith('is_')
        // 
        //...or its datatype is a tinyint 
        || col.data_type === "tinyint")
        return new checkbox(anchor);
    //
    //If the field length is 1 character, then assume it is a checkbox
    if (col.length === 1)
        return new checkbox(anchor);
    //
    //If the length is more than 100 characters, then assume it is a textarea
    if (col.length > 100)
        return new textarea(anchor);
    //
    //If the column name is 'description', then its a text area
    if (col.name === 'description')
        new textarea(anchor);
    //
    //Time datatypes will be returned as date.
    if (["timestamp", "date", "time"]
        .find(dtype => dtype === col.data_type))
        return new input("date", anchor);
    //
    //The datatypes bearing the following names should be presented as images
    // 
    //Images and files are assumed  to be already saved on the 
    //remote serve.
    if (["logo", "picture", "profile", "image"]
        .find(cname => cname === col.name))
        return new file(anchor, "image");
    //
    if (col.name === ("filename" || "file"))
        return new file(anchor, "file");
    //
    //URL
    //A column is a url if...
    if (
    // 
    //... its name matches one of the following ...
    ["website", "url", "webpage"].find(cname => cname === col.name)
        // 
        //...or it's taged as url using the comment.
        || col.url !== undefined)
        return new url(anchor);
    //
    //SELECT 
    //The io type is select if the select propety is set at the column level
    //(in the column's comment). 
    //Select requires column to access the multiple choices.
    if (col.select !== undefined)
        return new select(anchor, col);
    //
    //String datatypes will be returned as normal text, otherwise as numbers.
    if (["varchar", "text"]
        .find(dtype => dtype === col.data_type))
        return new input("text", anchor);
    if (["float", "double", "int", "decimal", "serial", "bit", "mediumInt", "real"]
        .find(dtype => dtype === col.data_type))
        return new input("number", anchor);
    // 
    //The default io type is read only 
    return new readonly(anchor);
}
//
//Modeling the io for ofloading related methods from theme page  
export class io {
    //
    constructor(
    //
    //The parent eelement of this io, e.g., the td of a tabular layout.
    anchor) {
        this.anchor = anchor;
        // 
        //Set the ouput span element
        this.output = this.create_element(anchor, "span", { className: "normal" });
    }
    // 
    //Returns the document to which the anchor is attached;
    get document() {
        return this.anchor.ownerDocument;
    }
    // 
    //A helper function for creating and showing labeled inputs element.
    show_label(
    // 
    //The header text of the label 
    text, 
    //
    //Child elements of the label
    ...elements) {
        // 
        //Create the label and attach it to the anchor.
        const Label = this.document.createElement("label");
        this.anchor.appendChild(Label);
        // 
        //Create a text node if necessary and attach it to the label.
        const header = text instanceof HTMLElement
            ? text : this.document.createTextNode(text);
        Label.appendChild(header);
        // 
        //Attach the labeled elements 
        elements.forEach(element => Label.appendChild(element));
        //
        return Label;
    }
    //
    //Setting and geting io values relies on the input's value 
    get value() {
        return this.input_value;
    }
    set value(v) {
        this.input_value = v;
        this.update_outputs();
    }
    // 
    //Show this io's elements in the desired order 
    show() { }
    //
    //Create a new element from  the given tagname and attributes 
    //we assume that the element has no children in this version.
    create_element(
    //
    //The parent of the element to be created
    anchor, 
    //
    //The elements tag name
    tagname, 
    //
    //The attributes of the element
    attributes) {
        //
        //Greate the element holder based on the td's owner documet
        const element = anchor.ownerDocument.createElement(tagname);
        //
        //Attach this element to the anchor 
        anchor.appendChild(element);
        //
        //Loop through all the keys to add the atributes
        for (let key in attributes) {
            const value = attributes[key];
            // 
            // JSX does not allow class as a valid name
            if (key === "className") {
                // 
                //Take care of mutiple class values
                const classes = value.split(" ");
                classes.forEach(c => element.classList.add(c));
            }
            else if (key === "textContent") {
                element.textContent = value;
            }
            else if (key.startsWith("on") && typeof attributes[key] === "function") {
                element.addEventListener(key.substring(2), value);
            }
            else {
                // <input disable />      { disable: true }
                if (typeof value === "boolean" && value) {
                    element.setAttribute(key, "");
                }
                else {
                    //
                    // <input type="text" />  { type: "text"}
                    element.setAttribute(key, value);
                }
            }
        }
        return element;
    }
    //Restore the html properties of this io. 
    restore() {
        //
        //Restore every dom property on this io
        for (let name in this) {
            //
            //Get the old element
            const old_element = this[name];
            //
            //Skip non-hmtl properties
            if (!(old_element instanceof HTMLElement))
                continue;
            //
            //Get the id associated with the named property
            const id = old_element.getAttribute('data-id');
            //
            //All the elements partipating in an io must be identfied
            if (id === undefined || id === null)
                throw new schema.mutall_error(`This property ${name} points to an unidentified element`);
            //
            //Retrieve new element from the current document that matches
            //the old version. NB: The Any type for the elment, to allow us 
            //re-asign this element in step .....2 below
            const new_element = this.document.querySelector(`[data-id='${id}']`);
            //
            //The identified element must exist
            if (new_element === null)
                throw new schema.mutall_error(`No element found with data-id ${id}`);
            //
            //Update the named property on this panel........2
            this[name] = new_element;
        }
    }
}
//
//Default image sizes (in pixels) as they are being displayed
// on a crud page 
io.default_height = 25;
io.default_width = 50;
// 
//This io class models a single choice selector
export class select extends io {
    // 
    constructor(anchor, 
    // 
    //The source of our selector choices 
    col) {
        super(anchor);
        this.col = col;
        // 
        //Set the input select element 
        this.input = this.create_element(anchor, "select", {
            className: "edit",
            onchange: (evt) => crud.page.mark_as_edited(evt)
        });
        // 
        //Add the choices to the selector 
        col.select.forEach(([key, value]) => {
            this.create_element(this.input, "option", {
                value: key, textContent: value
            });
        });
    }
    ///
    //The value of a select io is the value of the selected option 
    get input_value() { return this.input.value; }
    set input_value(i) {
        this.input.namedItem(String(i)).selected = true;
    }
    // 
    //The displayed output of a select is the text content 
    //of the selected option
    update_outputs() {
        // 
        //Get the selected option.
        const option = this.input[this.input.selectedIndex];
        // 
        //Transfer it's textcontent to the output 
        this.output.textContent = option.textContent;
    }
}
// 
//This io class models an anchor tag.
export class url extends io {
    // 
    // 
    constructor(anchor) {
        // 
        super(anchor);
        // 
        //
        this.output = this.create_element(anchor, `a`, { className: "normal" });
        // 
        //Create a the url label 
        const url_label = this.create_element(anchor, `label`, { className: "edit", textContent: "Url Address: " });
        // 
        //Attach the url input tag to the label
        this.href = this.create_element(url_label, `input`, {
            type: "url",
            onchange: (evt) => crud.page.mark_as_edited(evt)
        });
        // 
        //Create a text label
        const text_label = this.create_element(anchor, `label`, {
            className: "edit", textContent: "Url Text: "
        });
        // 
        //Add this text tag to the the label
        this.text = this.create_element(text_label, `input`, {
            type: "text",
            //
            //Add a listener to to mark this text element as edited.
            onchange: (evt) => crud.page.mark_as_edited(evt)
        });
    }
    // 
    //Setting the value as a url involves a parsing the value if it 
    //is not a null and initializing the url and text inputs.
    set input_value(i) {
        //
        //Convert the value  to a js object which has the following 
        //format '["address", "text"]'(taking care of a null value)
        const [address, text] = i === null
            ? [null, null]
            // 
            //The value of a url must be of type string otherwise 
            //there is a mixup datatype
            : JSON.parse(i);
        //
        //Set the inputs 
        this.href.value = address;
        this.text.value = text;
    }
    // 
    //Updating the url involves transfering values from the
    //input tags to the anchor tags.
    update_outputs() {
        this.output.href = this.href.value;
        this.output.textContent = this.text.value;
    }
    // 
    //The value of a url is a string of url/text tupple
    get input_value() {
        // 
        //Return a null if the address is empty...
        const rtn = this.href.value === "" ? null
            //
            //... otherwise return  url/text values as a stringified
            //tupple.
            : JSON.stringify([this.href.value, this.text.value]);
        return rtn;
    }
}
//
//Read only class represents an io that is designed not  
//to be edited by the user directly, e.g., KIMOTHO'S 
//real estate, time_stamps, etc.
export class readonly extends io {
    // 
    constructor(anchor) {
        super(anchor);
        // 
        //Read only cells will be specialy formated 
        this.output = this.create_element(anchor, `span`, { className: "read_only" });
    }
    // 
    //
    get input_value() { return this.output.textContent; }
    set input_value(i) { this.output.textContent = i; }
    // 
    //The read only values do not change.
    update_outputs() { }
}
//The forein key io class
export class foreign extends io {
    //
    constructor(anchor) {
        super(anchor);
        //
        //Show the friendly name. Note, the friendly class is needed
        //to allow us to associate this element withi the button property
        this.friendly = this.create_element(anchor, `span`, { className: "normal friendly" });
        //
        //Select a foreign key.
        //Note the class name button to allow us rstore this spcfic button
        //later
        this.button = this.create_element(anchor, `input`, {
            type: "button", className: "edit button",
            onchange: (evt) => crud.page.mark_as_edited(evt)
        });
        //
        //For editing purposes, lets be as precise as 
        //we can; its the foreign key field we want.
        //Stop bubbling up to prevent the tr from being re-selected.
        this.button.setAttribute("onclick", "crud.page.current.edit_fk(this)");
    }
    /*
    //Restoring a foreign bey io is about ensuring that its friendly
    //and button properties matches the given td
    public restore(){
        //
        //Consider re-writing each element resore as a paremetrized
        //method to avoild repeating self. e.g.,
        //io.couple<x,y>(classname:x, element:y, td)
        //
        //Identify the element to restore using the matching class
        //name
        const classname = 'friendly';
        //
        //Retrieve from td the element with te named class ame
        const element = td.querySelector(`.${classname}`);
        //
        //The friendly must be a span tag
        if (element instanceof HTMLSpanElement){
            //
            //Update teh namd property on this page
            this[classname] = element;
        }else{
            throw new schema.mutall_error(`The ${classname} must be a '${typeof this[classname]}' tag`)
        }
        //
        //Restore the button using the matching class name
        const button = td.querySelector('.button');
        //
        //The friendly must be a teh same type as this view's button
        if (button instanceof HTMLInputElement){
            this.button = button;
        }else{
            throw new schema.mutall_error('The foreign key button must be a span tag');
        }
    }*/
    //
    //Setting and getting input values
    get input_value() { return this.button.getAttribute("pk"); }
    set input_value(i) {
        //
        //Destructure the foreign key value if it is a string. 
        if (typeof i === "string") {
            const [pk, friend] = JSON.parse(i);
            // 
            //Verify that the primary key is defined
            if (pk === undefined || friend === undefined) {
                throw new schema.mutall_error(`THe foreign key value '${i}' is not correctly formatted`);
            }
            // 
            //Set the button's
            this.button.value = friend;
            this.button.setAttribute("pk", pk);
        }
    }
    //
    //Transfer the primary key and its friend from the input button to tthe
    //friendly span tag
    update_outputs() {
        const pk = this.button.getAttribute("pk");
        const friend = this.button.value;
        // 
        //The friendly name is valid only when there is a primary key.
        this.friendly.textContent = pk === null ? "" : `${pk}-${friend}`;
    }
}
//The class of ios based on the simple input tag. 
export class input extends io {
    //
    constructor(
    //
    //The type of the inpute, e.g., text, number, date, etc.
    input_type, 
    //
    //The anchor of this element, e.g., td for tabulular layout
    anchor, 
    //
    //The value of the if available during construction
    value) {
        //
        //The 'element input type' of an 'input io' is the same as that
        //of the input tag
        super(anchor);
        this.input_type = input_type;
        //
        //Compile the input tag
        this.input = this.create_element(anchor, "input", {
            type: input_type,
            className: "edit",
            onchange: (evt) => crud.page.mark_as_edited(evt)
        });
    }
    //
    //Setting and getting input values
    get input_value() { return this.input.value; }
    set input_value(v) {
        this.input.value = v === null ? "" : String(v);
    }
    //
    //Updating of input based io is by default, simply copying the data from
    //the an input value tag to a span tag
    update_outputs() {
        this.output.textContent = this.input.value;
    }
}
// 
//This io models for capturing local/remote file paths 
export class file extends input {
    // 
    constructor(anchor, 
    // 
    //What does the file represent a name or an image
    type) {
        // 
        super(type, anchor);
        this.type = type;
        // 
        //Select the remote or local storage to browse for a file/image
        this.source_selector = this.create_element(anchor, `select`, {
            className: "edit",
            //Show either the remote server or the local client as the 
            //source of the image. 
            onchange: (evt) => this.toggle_source(evt)
        });
        // 
        //Add the select options 
        this.create_element(this.source_selector, "option", { value: "remote", textContent: "Browse remote" });
        this.create_element(this.source_selector, "option", { value: "local", textContent: "Browse local" });
        //
        // 
        //This is a local file or image selector. 
        this.file_selector = this.create_element(anchor, `input`, {
            type: type,
            className: "edit local",
            value: "Click to select a file to upload"
        });
        // 
        //The home for the click listerner that allows us to browse the server 
        //remotely 
        this.explore = this.create_element(anchor, `input`, {
            className: "edit local",
            type: "button",
            value: "Browse server folder",
            //
            //Paparazzi, please save the folder/files path structure here after 
            //you are done 
            onclick: async (evt) => await this.browse(evt, String(this.value))
        });
        //
        //Upload this file after checking that the user has all the inputs.
        //i.e., the file name and its remote path.
        this.upload = this.create_element(anchor, `input`, {
            className: "edit local",
            type: "button",
            value: "Upload",
            onclick: async (evt) => await this.upload_file(evt)
        });
        //
        //The tag for holding the image source if the type is an image.
        if (type === "image") {
            this.image = this.create_element(anchor, `img`, {
                height: io.default_height,
                width: io.default_width
            });
        }
    }
    // 
    //Overide the show method to allow us to rearrange the input output 
    //elements of a file;
    show() {
        // 
        //Show the output elements which i.e the filename and image
        this.anchor.appendChild(this.output);
        if (this.image !== undefined)
            this.anchor.appendChild(this.image);
        // 
        //Show the source selector
        this.show_label("Select source: ", this.source_selector);
        // 
        //Show the file selector
        //<Label>select image/file<input type="file"></label>
        this.show_label("Select file: ", this.file_selector);
        // 
        //Show the file/folder input and the server browser button
        // '
        //Create the header for that label
        this.input_header = this.document.createElement("span");
        this.show_label(this.input_header, this.input, this.explore);
        //
        //Reattach the upload button to force it to the last position
        this.anchor.appendChild(this.upload);
    }
    //
    //This is an event listener that paints the current page 
    //to allow the user to select an image/file
    //from either the remote server or the local client 
    toggle_source(_evt) {
        //
        //Get the selected option
        const selected = this.source_selector.value;
        //
        //Hide all the children of this io's anchor.
        Array.from(this.anchor.children).forEach(child => {
            if (child instanceof HTMLElement)
                child.hidden = true;
        });
        /// 
        //Unhide the selected  element
        Array.from(this.anchor.querySelectorAll(`.${selected}`))
            .forEach(child => {
            if (child instanceof HTMLElement)
                child.hidden = false;
        });
        // 
        //Update the input header label to either a file or folder depending on the selected 
        //source.
        this.input_header.textContent = `Select ${selected === "remote" ? "file" : "folder"} `;
    }
    //
    //This is a listener for initiating the browsing of files/folders
    // on the remote server 
    async browse(
    //
    //This is the element within the td from which this method was evoked.
    //It is important for tracing the cell where to write back the resulting
    //file/folder
    evt, 
    //
    //Displaying the initial look of the browser
    initial) {
        //
        //It tells us whether the initial path is a file or a folder.
        //This is important for controlling the browser behaviour(quality control).
        const target = this.source_selector.value === "local"
            ? "folder" : "file";
        //
        //Assuming we have set up a tree structure in php 
        //
        //THe constructor arguments of a node 
        //
        //Get the static node data ($Inode) from the server 
        const Inode = await server.ifetch("node", "export", [initial, target]);
        //
        //The url is the reference to the paparazzi project.
        const url = "browser.php";
        // 
        //Create and show the browser to retrieve the selected path
        const path = await (new tree.browser(target, url, Inode, initial))
            .administer();
        //
        //Only update the td if the selection was successful
        if (path == undefined)
            return;
        //
        //Store the $target into the appropriate input tag guided by the 
        //given button
        this.input.value = path;
        // 
        //Update the image tag.
        if (this.type === "image")
            this.image.src = path;
        //
        //Mark the parent td  as edited 
        crud.page.mark_as_edited(this.input);
    }
    //
    //This is a button`s onclick that sends the selected file to the server
    //at the given folder destination, using the server.post method
    async upload_file(evt) {
        //
        //Test if all inputs are available, i.e., the file and its server path
        //
        //Get the file to post from the edit window
        //Get the only selected file
        const file = this.file_selector.files[0];
        //
        //Ensure that the file is selected
        if (file === undefined)
            throw new crud.crud_error('Please select a file');
        //
        //Get the sever folder
        const folder = this.input.value;
        //
        //Post the file to the server
        const { ok, result, html } = await server.post_file(file, folder);
        //
        //Flag the td inwhich the button is located as edited.
        if (ok) {
            crud.page.mark_as_edited(this.input);
            // 
            //Update the input tag 
            //
            //The full path of a local selection is the entered folder 
            //plus the image/file name
            this.input.value += "/" + file.name;
        }
        //
        //Report any errors plus any buffered messages. 
        else
            throw new crud.crud_error(html + result);
    }
    // 
    //Overide the setting of the input vakue so as to extend the 
    //changing of the image source.
    set input_value(i) {
        super.value = i;
        if (this.type === "image") {
            //
            //Set the image to the defalt when it is null
            this.image.src = i === null
                ? "/pictures/default.jpeg"
                : String(i);
        }
    }
}
// 
//This is class text area is an extension of a simple input that allows
//us to capture large amount of text. 
export class textarea extends input {
    //
    constructor(anchor) {
        super("text", anchor);
        //
        //
        this.textarea = this.create_element(anchor, `textarea`, {
            hidden: true,
            onblur: (evt) => this.update_textarea_input(evt)
        });
        // 
        //Add the click event listener that  
        this.input.onclick = (evt) => this.edit_textarea(evt);
    }
    //
    //This is an onblur event listener of the textarea,
    //that updates the editted value to that of the input. 
    //In order to trigger the input`s onchange.
    update_textarea_input(evt) {
        // 
        //Get the element that triggeres the event 
        const textarea = evt.target;
        //
        //Transfer the textarea content to the input value 
        //
        //Ignore the transfer if there are no changes.
        if (textarea.textContent === null
            || this.input.value === textarea.textContent)
            return;
        //
        //Commit the changes.
        this.input.value = textarea.textContent;
        //
        //mark the cell as edited
        crud.page.mark_as_edited(this.input);
        // 
        //Hide the textarea and show the input tag
        textarea.hidden = true;
        this.input.hidden = false;
    }
    //
    //This an onclick event listener of the input element that activates 
    //the textarea, for the user to start editting
    edit_textarea(_evt) {
        //
        //Transfer the input value to the textarea text content 
        this.textarea.textContent = this.input.value;
        //
        //Hide the input 
        this.input.hidden = true;
        //
        //Unhide the text area 
        this.textarea.hidden = false;
    }
}
//
//The checkbox io is charecterised by 3 checkboxes. One for output, 2 for inputs
export class checkbox extends io {
    //
    constructor(anchor) {
        super(anchor);
        //
        //The nomal mode for this io is the same as the edit.
        //The difference is that the output element is disabled
        this.output = this.create_element(anchor, `input`, {
            type: "checkbox",
            disabled: true,
            className: "normal"
        });
        // 
        //THis checkbox is used for differentiating null from boolean 
        //values
        this.input = this.create_element(anchor, `input`, {
            type: "checkbox",
            //
            //This checkbox is used for recording non-null values
            className: "edit value",
            //    
            //Mark the parent td as edited if the nput checkbox is cliked on
            onclick: (evt) => crud.page.mark_as_edited(evt)
        });
        const label = this.create_element(anchor, "label", { textContent: "NUll?: ", className: "edit" });
        //
        //Seting the io taking care of the  null data entry 
        this.nullify = this.create_element(label, "input", {
            type: "checkbox", className: "nullable",
            //
            //Hide the input checkbox if the nullify  is checked and mark
            //the parent td as edited
            onclick: (evt) => this.input.hidden = this.nullify.checked,
            onchange: (evt) => crud.page.mark_as_edited(evt)
        });
    }
    // 
    //The check boxes have no particula
    show() { }
    //
    //The value of a check box is the checked status of the input.
    get input_value() {
        return this.input.checked ? 1 : 0;
    }
    //
    //The value of a checkbox is a boolean or null.
    set input_value(i) {
        if (i === null) {
            this.nullify.checked = true;
        }
        else {
            this.nullify.checked = false;
            this.input.checked = i == 1;
        }
    }
    //
    //Update outputs from inputs.
    update_outputs() {
        //If nullify is on...
        if (this.nullify.checked) {
            //
            //...then hide the outut...
            this.output.hidden = true;
        }
        else {
            //
            //...otherwise show the ouput with the same check status
            // as the input
            this.output.hidden = false;
            this.output.checked = this.input.checked;
        }
    }
}
//The primary key io
export class primary extends io {
    //
    constructor(anchor) {
        super(anchor);
        //
        //The primary key doubles up as a multi selector
        this.multi_selector = this.create_element(anchor, "input", { type: 'checkbox', className: "multi_select" });
        //
        //Tag where to reporting  runtime errors that arise from a saving the record
        // (with this primary key to the server)
        this.errors = this.create_element(anchor, `span`, 
        //
        //This is to distinguish this span for errors. as well as hiddinging 
        //it initially.
        { className: "errors", hidden: true });
        //
        //This will is activates to let the user see the error message.
        this.see_error_btn = this.create_element(anchor, `button`, {
            //
            //Helps us to know which button it is
            className: "error_btn error",
            hidden: true,
            onclick: (evt) => this.see_error(evt)
        });
        //
        //Mark the span where we shall place the primary key
        this.output.classList.add("pk");
        //
        //Ensure that the primary key is visible whether in normal 
        //or edit mode
        this.output.classList.remove("normal");
    }
    //
    //This is a error button event listener for toggling the user
    //error message after writing data to the database.
    see_error(evt) {
        //
        //Toggle the class to hide and unhide the error message.
        this.errors.hidden = !this.errors.hidden;
        //
        //Change the text content of the button to either 
        //see error or close error.
        evt.target.textContent =
            this.errors.hidden ? "see error" : "close error";
    }
    //
    //The value of the primary key autonumber is the content of the output tag
    get input_value() {
        // 
        //An empty primary key will be passed as a null
        const value = this.output.textContent === ""
            ? null
            : this.output.textContent;
        return value;
    }
    //
    //Set the input value of a primary key given the basic string value.
    set input_value(i) {
        //
        //Destructure the primary key value if it is a string. 
        if (typeof i === "string") {
            // 
            //The input must be a string of this shape, [10,"friendlyname"].
            const [pk, friend] = JSON.parse(i);
            // 
            //Verify that both the primary key and the friendlly components are defined.
            if (pk === undefined || friend === undefined) {
                throw new schema.mutall_error(`THe foreign key value '${i}' is not correctly formatted`);
            }
            //
            //Save the friendly component as an attribute
            this.output.setAttribute('friend', friend);
            //
            //Show the pk in the output content.
            this.output.textContent = pk;
        }
    }
    //
    //Update outputs from inputs does nothing because the input
    //is the same as the output.
    update_outputs() { }
}
