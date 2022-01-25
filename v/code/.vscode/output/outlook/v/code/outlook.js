//
//Resolve the schema classes, viz.:database, columns, mutall e.t.c. 
import * as schema from "../../../library/v/code/schema.js";
//
//
import config from "./config.js";
//This is what the users will see generally. It is the root of 
//all  outlook pages. Application is a view. A page, which extends 
//a view is used for data collection. A view is not. A view may
//be carnibalised to feed another view; such view are called templates
export class view {
    //
    constructor(
    //
    //The address  of the page. Some popup pages don`t have 
    //a url that`s why it`s optional.
    url) {
        this.url = url;
        //
        //For debugging
        this.id = 'view';
        //
        //The children nodes of the root document element of this view
        //o support restoring of this page in response to the on pop state event.
        this.child_nodes = [];
        // 
        //Initialize the named panels
        this.panels = new Map();
        // 
        //Register this view identified by the last entry in the lookup table for views.
        // 
        //The view's key is the count of the number of keys in the lookup.
        this.key = view.lookup.size;
        view.lookup.set(this.key, this);
    }
    // 
    //These are getter and setter to access the protected win variable  
    get win() { return this.win__; }
    set win(win) { this.win__ = win; }
    //
    //The document of a view is that of its the window
    get document() {
        return this.win.document;
    }
    //Restore the children nodes of this view.  
    restore_view(key) {
        //
        //For debugging purposes....
        console.log(`restore, ${this.id}, ${this.key}`);
        //
        //Get the view of the given key
        const View = view.lookup.get(key);
        //
        //It's an error if the view has not been cached
        if (View === undefined)
            throw new schema.mutall_error(`This key ${key}
             has no matching view`);
        //
        //Get the root document element. 
        const root = View.document.documentElement;
        //
        //Clean the root before restoring it -- just in case the view
        //is attached to an old window;
        Array.from(root.childNodes).forEach(node => root.removeChild(node));
        //
        //Attach every child node of this view to the root document
        this.child_nodes.forEach(node => root.appendChild(node));
        // 
        //Restore the current view, so that click listeners of this view
        //that rely that static property can work. In general this does noting;
        //in particular this sets property crud.page.current to this view
        this.restore_current();
    }
    //
    // 
    //Restore the current view, so that click listeners of this view
    //that rely that statuic variable can work. In general this does noting;
    //in particular this sets property c.page.current to this view
    restore_current() { }
    //
    //Save the children of th rot document element of this view to the local
    //propety using the 'how' method
    save_view(how) {
        //
        //For debugging
        console.log(`save, ${how}, ${this.id}, ${this.key}`);
        //
        //Get the root document element
        const root = this.document.documentElement;
        //
        //Save the child nodes
        this.child_nodes = Array.from(root.childNodes);
        // 
        //Set the onpop state listener to support the push or replace
        //state action that follows. Note that this handler is et just before 
        //the the action that it is designed to serve
        this.win.onpopstate = (evt) => this.onpopstate(evt);
        //
        //Push or replace the state
        this.win.history[how](this.key, "", 
        //
        //Show the view's id, identification key and current history 
        //lenghth (for debugging purposes)
        `?id=${this.id}&key=${this.key}&len=${this.win.history.length}`);
    }
    //
    //Returns the values of the currently selected inputs 
    //from a list of named ones 
    get_choices(name) {
        //
        //Collect the named radio/checked inputs
        const radios = Array.from(this.document.querySelectorAll(`[name="${name}"]`));
        //
        //Filter the checked inputs and return their values buttons 
        return radios.filter(r => r.checked)
            .map(r => r.value);
    }
    //Update the the window's title, so that the correct key can show in 
    //the browser (for onpopstate bebugging purpos)
    set_title() {
        //
        //Get the (old) title element; the page must have one
        const title = this.document.querySelector('title');
        if (title == null)
            throw new schema.mutall_error(`No title found for page ${this.url}`);
        //
        //Add the key component
        title.textContent = `${this.id}/${this.key}`;
    }
    //
    //Return the identified element 
    get_element(id) {
        //
        //Get the identified element from the current browser context.
        const element = this.document.querySelector(`#${id}`);
        //
        //Check the element for a null value
        if (element === null) {
            const msg = `The element identified by #${id} not found`;
            alert(msg);
            throw new Error(msg);
        }
        return element;
    }
    //Open a window, by default, reurns the current window and sets the
    //title
    async open() {
        //
        this.win = window;
        //
        //Set the accurate application title
        this.set_title();
        //
        return this.win;
    }
    //
    //Handle the on pop state listener by saving the current state and 
    //restoring the view matching the event's history state
    onpopstate(evt) {
        // 
        //Ignore all state that has no components to restore. Typically
        //this is the initial statae placed automatically on the history 
        //stack when this application loaded initially. NB:We have made provisions
        //that the initial state will be replaced with the that of the 
        //applicaton, so, it's an error to get the null state
        if (evt.state === null)
            throw new schema.mutall_error('Null state is not expected');
        // 
        //Get the saved view's key
        const key = evt.state;
        // 
        //Use the key to get the view being restored. 
        const new_view = view.lookup.get(key);
        //
        //It is an error if the key has no matching view.
        if (new_view === undefined)
            throw new schema.mutall_error(`This key 
            ${key} has no view`);
        // 
        //Restore the components of the new view
        new_view.restore_view(key);
    }
    // 
    //The default way a quize shows its content is 
    //by looping through allm its panels and painting 
    //them. pages without panels can override this method 
    //to paint their content.
    async show_panels() {
        //
        //Paint the panels on top of the template, if they are  set
        if (this.panels !== undefined)
            //
            //The for loop is used so that the panels can throw 
            //exception and stop when this happens  
            for (const panel of this.panels.values()) {
                await panel.paint();
            }
    }
}
// 
//Lookup storage for all views created by this application.
view.lookup = new Map();
//
//A panel is a targeted setction of a view. It can be painted 
//independently
export class panel extends view {
    //
    constructor(
    //
    //The CSS to describe the targeted element on the base page
    css, 
    //
    //The base view on that is the home of the panel
    base) {
        //The ur is that of the base
        super(base.url);
        this.css = css;
        this.base = base;
    }
    //
    //Start painting the panel
    async paint() {
        //
        //Get the targeted element. It must be only one
        const targets = Array.from(this.document.querySelectorAll(this.css));
        //
        //There must be a target    
        if (targets.length == 0)
            throw new schema.mutall_error(`No target found with CSS ${this.css}`);
        //
        //Multiple targets is a sign of sn error
        if (targets.length > 1)
            throw new schema.mutall_error(`Multiple targets found with CSS ${this.css}`);
        //
        //The target must be a html element
        if (!(targets[0] instanceof HTMLElement))
            throw new schema.mutall_error(`
        The element targeted by CSS ${this.css} must be an html element`);
        //
        //Set teh html element and continue painting the panel
        this.target = targets[0];
        //
        //Continue to pain the tger    
        await this.continue_paint();
    }
    //
    //The window of a panel is the same as that of its base view, 
    //so a panel does not need to be opened
    get win() {
        return this.base.win;
    }
}
//
//A page extends a view in that it is used for obtaining 
//data from a user. Baby and popup pages are extendsions of a view
export class quiz extends view {
    //
    constructor(url) { super(url); }
    //
    //Get the document of this window using a getter
    get document() {
        return this.win.document;
    }
    //
    //This is the process which makes the page visible waits for 
    //user to respond and returns the expected response, if not aborted. 
    async show() {
        // 
        //Initialize the win property by opening a window 
        this.win = await this.open();
        // 
        //Paint the various panels of this page.In the default 
        //way of looping over the panels of this page. A page 
        //without the panels can overide this method with 
        //its own.
        await this.show_panels();
        //
        //Wait for the user to ok or cacel this quiz
        let result = await new Promise(resolve => {
            //
            //Collect the result on clicking the Ok/go button.
            const okay = this.get_element("go");
            okay.onclick = async () => {
                //
                //Check the user unputs for error. If there
                //any, do not continue the process
                if (!this.check())
                    return;
                //
                //Grt the primary key and its  friendly name 
                resolve(await this.get_result());
            };
            // 
            //Discard the result on Cancel.
            const cancel = this.get_element("cancel");
            cancel.onclick = async () => {
                let r;
                resolve(r);
            };
        });
        //
        //Wait for the user to inintiate the flow back to the base page
        await this.close_quiz();
        //
        //Return the promised result.
        return result;
    }
}
//The baby clas models pages that share the same windo as their mother.
//In contrast a popup does not
export class baby extends quiz {
    //
    constructor(mother, url) {
        super(url);
        this.mother = mother;
    }
    //The window of the mother is that same as that of the bay
    get win() {
        return this.mother.win;
    }
    //
    //
    set win(w) { this.mother.win = w; }
    //
    //Administering a crud page is managing all the operations from 
    //the  moment a page gets vsisble to when a result is retrned
    async administer() {
        //
        //Get the baby template
        const Template = new template(this.url);
        //
        //On the template
        const win = await Template.open();
        //
        //Replace the entire current documet with that of the template
        this.document.documentElement.innerHTML = win.document.documentElement.innerHTML;
        //
        //Close the baby template
        win.close();
        //
        //Ensure the pag'e title is set correctly
        this.set_title();
        //
        //Save this initial version of this baby view
        this.save_view("pushState");
        //
        //Make the logical page visible.
        const result = await this.show();
        // 
        return result;
    }
    //
    //The opening of a baby returns the same window as that of the mother
    async open() {
        //
        //Return the window of the mother (not the temporary one)
        this.win = this.mother.win;
        //
        //Update the the window's title, so that the correct key can show in 
        //the browser (for onpopstate debugging purpos)
        this.set_title();
        //
        return this.win;
    }
    //Close a baby page by invoking the back button; in contrast a popup does 
    //it by executing the window close method.
    async close_quiz() {
        // 
        //Wait for the mother window to be restored.
        return await new Promise(resolve => {
            // 
            //Wire the event listener before evoking the on pop state usng
            //the history back button.
            this.win.onpopstate = (evt) => {
                //
                //Restore the on pop state event
                this.onpopstate(evt);
                //
                //Stop the waiting
                resolve();
            };
            //
            //Use the back button to evoke the on pop state
            this.win.history.back();
        });
    }
}
//A template is a popup window used for canibalising to feed another window.
//The way you open it is smilar to  popup. Its flagship method is the copy
export class template extends view {
    constructor(url) {
        super(url);
    }
    //Open a window, by default, reurns the current window and sets the
    //title
    async open() {
        //
        //Open the page to let the server interprete the html 
        //page for us. The window is temporary 
        const win = window.open(this.url);
        //
        //Wait for the page to load 
        await new Promise(resolve => win.onload = resolve);
        //
        //Retrieve the root html of the new documet
        this.win = win;
        //
        return this.win;
    }
    //
    //Transfer the html content from this view to the specified
    //destination and return a html element from the destination view. 
    copy(src, dest) {
        //
        //Destructure the destination specification
        const [Page, dest_id] = dest;
        //
        //1 Get the destination element.
        const dest_element = Page.get_element(dest_id);
        //
        //2 Get the source element.
        const src_element = this.get_element(src);
        //
        //3. Transfer the html from the source to the destination. 
        dest_element.innerHTML = src_element.innerHTML;
        //
        //Return the destination painter for chaining
        return dest_element;
    }
}
//This class represents the view|popu page that the user sees
export class popup extends quiz {
    //
    constructor(url, 
    // 
    //The popoup window size and location specification.
    specs) {
        super(url);
        this.specs = specs;
    }
    //
    //Open a pop window returns a brand new window with specified dimensions.
    async open() {
        //
        //Use the window size and location specification if available.
        const specs = this.specs === undefined ? this.get_specs() : this.specs;
        //
        //Open the page to let the server interprete the html 
        //page for us.  
        const win = window.open(this.url, "", specs);
        //
        //A window becomes forms complete when you wait for it to
        //load
        const complete_win = await new Promise(resolve => win.onload = () => resolve(win));
        //
        this.win = complete_win;
        //
        //Update the the window's title, so that the correct key can show in 
        //the browser (for onpopstate bebugging purpos)
        this.set_title();
        //
        //Return the complete window
        return complete_win;
    }
    //
    //Get the specifications that can center the page as a modal popup
    //Overide this method if you want different layout
    get_specs() {
        //
        //Specify the pop up window dimensions.
        //width
        const w = 500;
        //height
        const h = 500;
        //
        //Specify the pop up window position
        const left = screen.width / 2 - w / 2;
        const top = screen.height / 2 - h / 2;
        //
        //Compile the window specifictaions
        return `width=${w}, height=${h}, top=${top}, left=${left}`;
    }
    //
    //Displays the page waits for the user to interact with it 
    //and return a response. Note that this process does not 
    //make eny referemces to a mother because it has none
    async administer() {
        //
        //Make the logical page visible and wait for the user to
        //succesfully capture some data or abort the process.
        //If aborted the result is undefined.
        const result = await this.show();
        // 
        return result;
    }
    //
    //Close this popup window 
    async close_quiz() {
        // 
        //Wait for the window to unload
        return await new Promise(resolve => {
            // 
            //Add the event listener BEFORE CLOSING THIS WINDOW
            this.win.onbeforeunload = () => resolve();
            // 
            //Close the  popup window.
            this.win.close();
        });
    }
}
//
//
//Namespace for handling the roles a user plays in an application
export var role;
(function (role) {
    //Verbs for crud operations
    role.all_verbs = ['create', 'review', 'update', 'delete'];
})(role || (role = {}));
//
//This is a generalised popup for making selections from multiple choices  
//The choices are provided as a list of key/value pairs and the output is 
//a list keys.  
export class choices extends popup {
    //
    constructor(
    // 
    //The key value pairs that are to be painted as checkboxes
    //when we show the panels. 
    inputs, 
    // 
    //This is a short code that is used
    //as an identifier for this general popuo
    id, 
    // 
    //The popoup window size and location specification.
    specs, 
    // 
    //The css that retrieves the element on this page where 
    //the content of this page is to be painted. If this css 
    //is not set the content will be painted at the body by default 
    css) {
        super(config.general, specs);
        this.inputs = inputs;
        this.id = id;
        this.specs = specs;
        this.css = css;
    }
    //
    //Check that the user has selected  at least one of the choices
    check() {
        //
        //Extract the marked/checked choices from the input checkboxes
        const result = this.get_choices(this.id);
        //
        //Cast this result into the desired output
        this.output = result;
        //
        //The ouput is ok if the choices are not empty.
        const ok = this.output.length > 0;
        if (!ok) {
            alert(`Please select at least one ${this.id}`);
            return false;
        }
        //
        return true;
    }
    //
    //Retrive the choices that the user has filled from the form
    async get_result() {
        return this.output;
    }
    //
    //Overide the show panels method by painting the css referenced element or 
    //body of this window with the inputs that were used to create this page 
    async show_panels() {
        //
        //Get the element where this page should paint its content, 
        //this is at the css referenced element if given or the body.
        const panel = this.css !== undefined
            ? this.document.querySelector(this.css)
            : this.document.querySelector("#content");
        //
        //Attach the choices as the children of the panel
        this.inputs.forEach(option => {
            //
            //Destructure the choice item 
            const { key, value } = option;
            //
            const html = `
                <label>
                 <input type= "checkbox" value= '${key}' name="${this.id}" >: 
                 ${value}
                </label>`;
            //
            //Attach the label to the pannel 
            const label = this.document.createElement("temp");
            panel.appendChild(label);
            label.outerHTML = html;
        });
    }
}
// 
//This is a view displayed as a baby but not used for collecting data 
//It is used in the same way that we use an alert and utilises the general
//html.
export class report extends baby {
    // 
    //
    constructor(
    // 
    //This popup parent page.
    mother, 
    // 
    //The html to report.
    html) {
        // 
        //The general html is a simple page designed to support advertising as 
        //the user interacts with this application.
        super(mother, config.general);
        this.html = html;
    }
    // 
    //Reporting does not require checks and has no results to return because 
    // it is not used for data entry.
    check() { return true; }
    async get_result() { }
    // 
    //Display the report 
    async show_panels() {
        // 
        //Get the access to the content panel and attach the html
        const content = this.get_element('content');
        // 
        //Show the html in the content panel. 
        content.innerHTML = this.html;
        //
        //Hide the go button from the general html since it is not useful in the 
        //the reporting
        this.get_element("go").hidden = true;
    }
}
export class content extends panel {
    constructor(html, base) {
        super("body", base);
        this.html = html;
    }
    async continue_paint() {
        // 
        //Get the target element 
        this.target.innerHTML = this.html;
    }
}
//Represents a person/individual that is providing
//or consuming a services we are developing. 
export class user {
    //
    //The minimum requirement for authentication is a username and 
    //password
    constructor(email) {
        //
        this.email = email;
    }
    //A user is a visitor if the email is not defined
    //otherwise his a regular user.
    is_visitor() {
        if (this.email === undefined)
            return true;
        else
            return false;
    }
}
