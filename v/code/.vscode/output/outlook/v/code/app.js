import * as server from "../../../library/v/code/server.js";
//
//Resolve the schema classes, viz.:database, columns, mutall e.t.c. 
import * as schema from "../../../library/v/code/schema.js";
// 
//Get the user configurations 
import config from "./config.js";
// 
// 
import * as outlook from "./outlook.js";
import * as crud from "./crud.js";
import * as theme from "./theme.js";
//import firebase from "firebase/app";
import * as login from "./login.js";
//
//The mechanism of linking services providers 
//to their various consumers.
//This app is the home page of the various mutall
//services also called the index.html of the chama,
//tracker, postek e.t.c 
export class app extends outlook.view {
    //
    //
    constructor(
    //
    //The roles available for a user of this application (as an array of class
    //objects, rather than a role interface) 
    //The roles a user can play in this application
    products, 
    //
    //The subject (entity) driving the content panel
    subject, 
    //
    //The id of this application; if not given, we use this 
    //constructors name
    id, 
    //
    //The window applicatiins url; if  not provided, we use that of
    //the current window
    url, 
    //
    //Image associatd witn this app 
    logo, 
    //
    //The full trademark name of the application
    name, 
    //
    //For advertis=ing purposes
    tagline) {
        //
        //If the url of an application is not defined, then use that of
        //the current window
        super(url);
        this.products = products;
        this.subject = subject;
        this.logo = logo;
        this.name = name;
        this.tagline = tagline;
        //
        //Collector for first level login data.
        this.collector = [];
        //
        this.dbname = config.app_db;
        //
        //If the id of an appliction is not given, then use name of application
        //class that extednds this ne.
        this.id = id === undefined ? this.constructor.name : id;
        //
        app.current = this;
        //
        //Set the page document.
        this.win = window;
        //
        //Test if there is a user that already exists in the local 
        //storage.
        const user_str = this.win.localStorage.getItem("user");
        //
        //If this user exist use the already existing user to login
        if (user_str !== null) {
            this.user = JSON.parse(user_str);
            this.login(this.user);
        }
    }
    //
    //The user must call this method on a new object; 
    async initialize() {
        //
        //Initialize the firebase library.
        //firebase.initializeApp(config.firebase);
        //
        //Open the application (thus setting cetain properties, e.g., win)
        this.open();
        //
        //Set the database property using the database name.
        await this.set_dbase();
        //
        //Set the application panels
        //
        //Set the services panel
        this.panels.set("services", new services(this));
        //
        //Set the theme panel
        this.panels.set("theme", new theme.theme(this.subject, "#content", this));
        //
        //Show the theme and the services panel
        await this.show_panels();
        // 
        //Show this application on the address bar and make ensure that
        //the initial window history state is not null.
        this.save_view('replaceState');
    }
    // 
    //Use the user model to deduce the available roles of 
    //this current application.
    get_roles() {
        // 
        //Get the current application's database 
        const dbase = this.dbase;
        // 
        // Convert the indexed entities into an array of keys
        const enames = Object.keys(dbase.entities);
        // 
        //Select from the entities only those that are linked 
        //to the user model
        const filtered_enames = enames.filter(ename => this.get_role_id(ename, dbase));
        // 
        //Map the role ids to their Iroles
        const roles = filtered_enames.map(id => {
            // 
            //The name of a role is the same as the title of the entity 
            const name = dbase.entities[id].title;
            // 
            //Compile and return the static role structure.
            return { id, name };
        });
        return roles;
    }
    //Return true/false depending on whether the named entity is linked to 
    //the user database or not 
    get_role_id(ename, dbase) {
        // 
        //Get the named entity 
        const entity = dbase.entities[ename];
        // 
        //Get the column names of this entity 
        const cnames = Object.keys(entity.columns);
        // 
        //Select only those columns that are used for linking 
        //this application's database to the mutall_user one.
        const f_cnames = cnames.filter(cname => {
            // 
            //Get the named column 
            const col = entity.columns[cname];
            // 
            //Test if this is a foreign key column pointing to the
            //mutall_user's database
            //
            const test = col instanceof schema.foreign
                && col.ref.db_name === "mutall_user"
                && col.ref.table_name === "user";
            // 
            //
            return test;
        });
        // 
        //Only those entities that have columns that pass the test are 
        //considered
        return f_cnames.length > 0;
    }
    //
    //Set the current database 
    async set_dbase() {
        //
        //Get the static database structure 
        const idbase = await server.exec("database", [this.dbname], "export_structure", []);
        //
        //Activate the static and set it to this app
        this.dbase = new schema.database(idbase);
    }
    //
    //Authenticate a new user that wants to access the 
    //services of this application. 
    //This the parameter user is usered when this method is called 
    //by the constructor is a user is found already existing in the local 
    //storage hence no loging in is required. 
    async login(User) {
        //
        //If no user exists at the local storage get the user through a login 
        //process.
        if (User === undefined) {
            //
            //1.Create and open the login page for the user to choose the login
            //provider.
            const Login = new login.page();
            //
            //2.Get the authenticated user from the login popup
            this.user = await Login.administer();
        }
        //
        //Continue only if the user id defined
        if (this.user === undefined)
            return;
        //
        //3.Use the server to check whether the user is registered with 
        //outlook or not
        //
        //Formulate the sql statement to do the job needed 
        //
        //Select from the user database all the subscription for the user 
        //whose email is the given one and the application_id is the given 
        //const roles:Array<role>=mutall.execute(select:Array<exp>,from:ename, where:exp)
        const sql = 
        //
        //1. Specify what we want using a "select" clause 
        "SELECT "
            //
            //...Specify the role id and its full name.
            + "role.id "
            //
            //2. Specify the "from" clause
            + "FROM "
            + "subscription "
            //
            //These are the joins that trace our route of intrest 
            + "inner join user ON subscription.user= user.user "
            + "inner join player ON subscription.player= player.player "
            + "inner join application ON player.application=application.application "
            + "inner join role on player.role = role.role "
            //
            //3. specify the condition that we want to apply i.e "where" clause
            + "WHERE "
            //
            //Specify the email condition 
            + `user.email='${this.user.email}' `
            //
            //Specify the application condition
            + `AND application.id='${app.current.id}'`;
        //
        //Get the role ids of this user from the server
        // 
        //Define the role_id variable.
        let role_ids;
        //
        //The server results is an array of objects
        const ids = await server.exec("database", ["mutall_users"], "get_sql_data", [sql]);
        // 
        //Extract the roleid component from the server result
        this.user.role_ids = ids.map(e => e.id);
        //
        //The user is a visitor if he has no previous roles 
        this.user.type = this.user.role_ids.length === 0 ? "visitor" : "regular";
        //
        //Register the User if he is a visitor. This effectively updates 
        //the roles property and changes the user to a regular 
        if (this.user.type === "visitor")
            await this.register();
        //
        //Welcome the user to the home page unconditionaly
        await this.welcome_user();
        //
        //Save the user in local storage to allow reaccess to this page 
        //without logging in.
        window.localStorage.setItem("user", JSON.stringify(this.user));
    }
    //
    //On successful login, welcome the definite user, i.e., regular or visitor 
    //and not anonymous,  to the homepage by painting the matching message.
    async welcome_user() {
        //
        //Paint the welcome message for a regular user.
        await this.paint_welcome("regular");
        //
        //Modify the appropriate tags
        //
        //Set user paragraph tags
        this.get_element("user_email").textContent = this.user.email;
        this.get_element("app_id").textContent = this.id;
        this.get_element("app_name").textContent = this.name;
        //
        //3.Set the user roles for this application
        const role_element = this.get_element("roles");
        //
        //Clear the current roles 
        role_element.innerHTML = "";
        //
        //Add all the user roles to the welcome panel. 
        this.user.role_ids.forEach(role_id => {
            //
            //Get the role title. Note the role_id as the datatype defind in 
            //the application parameters, rather than outlook.role.role_id
            const title = this.products[role_id][0];
            //
            //This is what the role fragment looks like.
            //<div id="role_tenant">Tenant</div>
            //
            //Build the fragment 
            const html = `<div id="role_${role_id}">${title}</div>`;
            const div = this.document.createElement("div");
            role_element.appendChild(div);
            div.outerHTML = html;
        });
        //
        //4.Activate services based on the roles played.
        this.user.role_ids.forEach(role_id => {
            //
            //Get the product's field set
            const fs = this.get_element(role_id);
            //
            //Get the product associated with this role
            const product = this.products[role_id];
            //
            //Get the solution identifiers of this product. The 2nd eelement 
            //of a produt tuple is the soution
            const enames = Object.keys(product[1]);
            //
            //For each solution, set the event listener and mark the
            //solution as active.
            enames.forEach(ename => {
                //
                //Get the solution; it must be defined
                const solution = product[1][ename];
                //
                //Get the solution element
                //
                //Activate all the solutions in this field set
                const solution_element = fs.querySelector(`.${ename}`);
                //
                //Set the event listener
                //
                //If this is a general service its event listener is already set 
                if (solution.includes("load_text")) {
                    const [_title, listener_, type_] = solution;
                    solution_element.onclick = listener_;
                }
                else {
                    const sol = solution;
                    //
                    //Get the solution's listener
                    const listener = this.get_crud_listener(ename, sol);
                    //
                    //Set the listener on the solution element   
                    solution_element.setAttribute("onclick", listener);
                }
                //
                //Mark it as active
                solution_element.classList.add('a');
            });
        });
    }
    // 
    //Returns the crud service listener as a string to allow us to save and restore
    //it using html.
    get_crud_listener(ename, solution) {
        //
        //Destructure the solution
        //NB the type parameter was recently added to identify the 
        //type of service
        const [_title, xor, verbs, _type, dbname] = solution;
        //
        //Compile the subject, i.e., [ename, dbname] of this service
        //
        //The default dbname is the one driving the current application
        const dbname2 = dbname === undefined ? app.current.dbname : dbname;
        //
        //The ename is the same as the id of this service.
        const subject = [ename, dbname2];
        //
        //convert the implied into explicit verbs 
        // 
        let Xverbs;
        //
        //Returns true if a verb1 is included in the list of availble
        //verbs
        const found = (verb1) => {
            return verbs.some(verb2 => verb1 === verb2);
        };
        //
        //Get the explicit verbs. Its either the current selected (+) verbs 
        //or the list of all verbs excluding(-) the selected ones
        Xverbs = xor === '+' ? verbs : outlook.role.all_verbs.filter(verb => !found(verb));
        // 
        //Compile and return the listener string 
        const subject_str = JSON.stringify(subject);
        const Xverbs_str = JSON.stringify(Xverbs);
        return `app.current.crud(${subject_str},${Xverbs_str})`;
    }
    //
    //This is the generalised crud listener.
    async crud(subject, Xverbs) {
        //
        //Create  crud page
        const baby = app.current.new_crud(app.current, subject, Xverbs);
        const results = await baby.administer();
        //
        //Use the results to update the application page 
        //if neccesary
    }
    //
    //Register the user and return the role ids for which the 
    //user has registered.
    async register() {
        //
        //Collect from the user the minimum registration requirement 
        //The minimum requirement are the roles
        //
        // 
        //Collect the user roles for this application from its 
        //products
        const inputs = Object.keys(this.products)
            .map(role_id => {
            const [value] = this.products[role_id];
            //
            //Compile and return a key valu pair
            return { key: role_id, value };
        });
        //
        //Open the popup page for roles
        const Role = new outlook.choices(inputs, "role_id");
        //
        //Get the user roles
        const role_ids = await Role.administer();
        //
        //Test if the user has aborted registration or not         
        if (role_ids === undefined)
            throw new schema.mutall_error("User has aborted the (level 1) registration");
        //
        //Save the user roles 
        this.user.role_ids = role_ids;
        //
        //1.Collect the data needed for a successful 'first level' registartion.
        //e.g., username, application name, user_roles, email.
        // The data has the following structure "[cname, ename, simple, alias]".
        const login_db_data = this.get_subscription_data();
        //
        //2. Write the data into the database and return an array of error messages.
        //User.export_data(login_db_data):Promise<Array<string>>;
        const result = await server.exec("record", [], "export", [login_db_data, "label"]);
        //
        //3.Verify that writing to db was successful
        //and report to the user and throw an exception.
        const { is_error, html } = this.get_report(result);
        // 
        //Show the report if the saving was not successfull 
        if (is_error) {
            const Report = new outlook.report(app.current, html);
            await Report.administer();
            // 
            //Abort the login process.
            throw new Error("Registration failed");
        }
        //
        // The registration was successful so, return the role ids  
        return role_ids;
    }
    // 
    //Report the  runtime or syntax errors
    get_report(imala) {
        // 
        // Define the structure of the report to be returned
        //  
        let html;
        //
        //Prepare to compile the error messages 
        let msgs = [];
        // 
        //The type of error message 
        let report_type;
        // 
        //Syntax errors occur if ...
        if (
        //... the class name matches syntax...
        imala.class_name === "syntax") {
            // 
            //Reporting syntax errors
            report_type = "syntax";
            //
            //Format the errors into a html
            msgs = imala.errors;
        }
        // 
        //Report runtime errors
        /// 
        //A runtime error exists if ... 
        if (
        // 
        //...the class name is tagged as syntax
        imala.class_name === "runtime"
            // 
            //... and there are indeed matching error messages 
            && (msgs = this.get_runtime_errors(imala.result)).length > 0) {
            // 
            //Reporting syntax errors 
            report_type = "runtime";
        }
        // 
        //Report the error messages if any. 
        if (report_type === undefined)
            return { is_error: false };
        // 
        //Compile the error message
        html =
            `<p> Error Type: ${report_type}</p>`
                + msgs
                    .map(msg => `<p>${msg}</p>`)
                    .join("<br/>");
        // 
        //Return the full report if report type is dfeiend
        return { is_error: report_type !== undefined, html };
    }
    // 
    //Test for runtime errors and return them if available
    get_runtime_errors(
    // 
    //The runtime results
    r_results) {
        // 
        //Error messages to be returned using a referenced variable
        let msgs;
        // 
        //Select the erroneous runtime results
        const rf_results = r_results.filter(ins => ins[0].type === "error");
        // 
        //Extract the messages from the erroneous runtime result and 
        //bind them to the input variable
        msgs = rf_results.map(res => res[0].value);
        // 
        //Runtime errors exist if there are atleast one error
        return msgs;
    }
    //
    // Return the data needed for a successful 'first level' registartion, 
    // i.e., the data required for the current visitor to be recognized as a 
    // subscriber of the current application.
    get_subscription_data() {
        //
        // Prepare an array for holding the registration data.
        const reg = this.collector = [];
        //
        //Collect the user and appication data
        this.collector.push(['mutall_users', 'application', [], 'id', [this.id]]);
        //
        if (this.user.email === (undefined || null)) {
            throw new schema.mutall_error("You cannot login using without an email");
        }
        this.collector.push(['mutall_users', 'user', [], 'email', [this.user.email]]);
        //
        //Collect as much subcription data as there are roles
        //subscribed by this the use.
        this.user.role_ids.forEach((myrole, i) => {
            //
            //Collect all available pointers to the user to enable us link to 
            //the application's specific database.
            this.collector.push([app.current.dbname, myrole, [i], 'email', [this.user.email]]);
            //
            //Indicate that we need -to  save a subscription record
            this.collector.push(['mutall_users', "subscription", [i], 'is_valid', [true]]);
            //
            //Indicate that we need to save a player 
            this.collector.push(['mutall_users', 'player', [i], 'is_valid', [true]]);
            //
            //COllect the user roles in this application
            this.collector.push(['mutall_users', 'role', [i], 'id', [myrole]]);
        });
        //
        // Return the completer required array.
        return reg;
    }
    // 
    //This method is defined here but will gravitate to its proper 
    //home in future 
    new_crud(mother, subject, Xverbs) {
        return new crud.page(mother, subject, Xverbs);
    }
    //
    //Paint the welcome message for users on the home page.
    async paint_welcome(usertype) {
        /**
         * If the usertype is visitor invite the user to login
         */
        if (usertype === "visitor") {
            this.welcome_visitor();
            return;
        }
        //Regular user
        //
        //
        //Get the template's url. 
        const url = config['welcome'];
        //
        //Create the template using the url. A template is a page used
        //for caniblaising, i.e., it is not intended for viewing 
        const Template = new outlook.template(url);
        //
        //Open the template (AND WAIT FOR THE WINDOW TO LOAD LOAD)
        const win = await Template.open();
        //
        //Carnibalise the welcome template
        //
        //Paint the application homepage with the welcome message.
        Template.copy(usertype, [this, 'welcome']);
        //
        //Close the tenplate (view)
        win.close();
    }
    // 
    //Welcoming the visitor means inviting him to login and 
    //diactivating all the services that could have been active
    welcome_visitor() {
        //
        //Invite the user to login 
        this.get_element("welcome").innerHTML =
            ` Please <button onclick="app.current.login()">login</button> to access 
                various services`;
        // 
        //Diactivate any active service 
        Array.from(this.document.querySelectorAll(".a"))
            .forEach(el => {
            el.classList.remove("a");
            el.removeAttribute("onclick");
        });
    }
    //
    //Log the user out of this application.
    async logout() {
        //
        //Use firebase to close its logout system
        //await firebase.auth().signOut();
        // 
        // 
        //Celar the entore local storage for this (debugging) version
        this.win.localStorage.clear();
        //Remove the user from the local storege
        //this.win.localStorage.removeItem("user");
        //
        //Restore default home page by replacing the regular
        //user's welcome message with the visitor's.
        this.paint_welcome("visitor");
    }
}
//
//The welcome panel of an app
export class services extends outlook.panel {
    //
    constructor(base) {
        super("#services", base);
        this.base = base;
    }
    //Use the products to complete the painting of the services panel
    async continue_paint() {
        //
        //Get the services panel element where we`ll do the painting.
        const panel = this.get_element("services");
        //
        //Step through the static products to paint each one
        //of them.
        for (const role_id in this.base.products) {
            //
            //Get a destructured product
            const [title, solutions] = this.base.products[role_id];
            //
            //Paint the product and return to a field set 
            const fs = this.paint_products(panel, role_id, title);
            //
            //Step through the solutions to paint each one of them
            for (const ename in solutions) {
                //
                const solution = solutions[ename];
                //
                //Ignore the undefined solutions
                if (solution === undefined)
                    continue;
                // 
                //Paint the solution
                this.paint_solution(fs, ename, solution);
            }
        }
    }
    //
    //Paint the products and return to a field set.
    paint_products(
    // 
    //The panel element where to paint the products 
    panel, 
    //
    //The id of the product
    id, 
    //
    //The name of the product 
    name) {
        //
        //1. Create a fieldset Element.
        const fs = document.createElement("fieldset");
        //
        //Set the id to be the same as that of the role
        fs.id = id;
        //
        //2. Set the fieldset's legend
        //
        //Create the legend
        const legend = document.createElement("legend");
        //
        //Set its content to the title of the role
        legend.textContent = name;
        //
        //Link the legend to the fieldset.
        fs.appendChild(legend);
        //
        //Add the field set to the panel to complete the painting
        panel.appendChild(fs);
        // 
        //Return the fieldset Element.
        return fs;
    }
    // 
    // 
    //Paint the solution
    paint_solution(
    // 
    //The fieldset tag where we paint this solution. 
    fs, 
    // 
    //The id of the solution.
    ename, 
    // 
    //The static solution tupple.
    solution) {
        //
        if (solution === undefined)
            return;
        // 
        // Destructure the solution to get the title; its the first component of 
        // the solution tuple
        const [title] = solution;
        //
        //1. Convert the service into a (hidden by default) html element.
        const innertext = `<div `
            //
            //A solution withn a product is identified by the soultion id, 
            //i.e., ename.
            + `class='${ename}' 
          >
              ${title}
          </div>`;
        //
        //Create the DOM service element.
        const element = document.createElement("div");
        //
        //fill it with the inner html.
        element.innerHTML = innertext;
        //
        //2. Attach the element to the fieldset.
        fs.appendChild(element);
    }
}
