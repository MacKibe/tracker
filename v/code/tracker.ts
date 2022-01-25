//
//Import app from the outlook library.
import { assets } from '../../../outlook/v/code/outlook.js';
import {app} from "../../../outlook/v/code/app.js";
import config from './config.js';
import {theme} from "../../../outlook/v/code/theme.js";
//
//Import server
import * as server from '../../../library/v/code/server.js'; 
//
//Import schema.
import * as schema from '../../../library/v/code/schema.js';  
//
//
type uproducts = Array<{id:string,title:string,solutions:Array<assets.solution>}>;
//
//A column on the application database that is linked to a corresponding one
//on the user database. Sometimes this link is broken and needs to be
//re-established.
type replica = {ename: string, cname:string};
//
//System for tracking assignments for employees of an organization.
export default class tracker extends app{
    //
    //
    static current:tracker;
    //
    //Initialize tracker.
    constructor(){
        super(
            // 
            //Overide the config . 
            new config()
        );
        //
        tracker.current = this;   
    }
    // 
    //Convert the uproducts to the correct format of iproduct by expanding 
    //the already existing iproducts.
    activate_Iproducts(src: uproducts, dest: assets.products): assets.products{
        // 
        //Loop through the uproducts appending them to iproduct
        src.forEach(uprod => {
            //
            //Begin with an empty collection of the solutions
            const sols: assets.solutions = {};
            // 
            //Populate the solution.
            uprod.solutions.forEach(sol => sols[sol.id] = sol);
            // 
            //Add this user product
            dest[uprod.id] = { id: uprod.id, title: uprod.title, solutions: sols}
        });
        // 
        //Return the expanded products 
        return dest;
    }
    //
    //Include this application based products.
    get_Iproducts() {
        //
        //Create the app's default products.
        const Iproduct = super.get_Iproducts();
        //
        //Compile this application specific product.
        // 
        //The inbuilt solutions that are the crud solutions for the assets
        //resources and the roles           
        const solutions: Array<assets.solution> = [
            {
                title: "Manage todos",
                id: "crud_todo",
                listener: ["crud", 'todo', ['review'], '+', "mutall_tracker"]
            },
            {
                title: "View developers",
                id: "crud_developer",
                listener: ["crud", 'developer', ['review'], '+', "mutall_tracker"]
            },
            {
                title: "View due assignments",
                id: "view_due_assignments",
                listener: ['string', "tracker.current.view_due_assignments()"]
            },
            {
                title: "Relink user",
                id: "relink_user",
                listener: ["event", () => this.relink_user()]
            },
            {
                title: "Console stuff",
                id: "console_stuff",
                listener: ["event", () => this.console_stuff()]
            }
        ];    
        //
        //Compile user products.
        const Uproduct: uproducts = [{
            //
            //
            id: "general_solution", title: "General Solution",
            solutions: solutions
        }];
        //
        //Return the new collection of products.
        return this.activate_Iproducts(Uproduct, Iproduct);
    }
    //
    //
    console_stuff(){
        //
        const dbase = this.id;
        console.log(dbase);
    }
    /*
    //
    //View assignments that are past their due days
    view_due_assignments(){
        //
        //1. The SQL statement to get data from the database.
        const sql = `select 
                        todo.id, 
                        todo.description, 
                        developer.email, 
                        datediff(now(), todo.start_date) as days_due
                    from 
                        todo
                    inner join developer on developer.developer = todo.developer
                    where
                        datediff(now(), todo.start_date) >= 14`;
        //
        //2. Create a new sql form using the sql.
        
        //
        //3. Administer the form.
        
    }
    */
    //
    //
    async relink_user(): Promise<void>{
        //
        //0. Yield/get all the replicas (i.e., entities, in the application, that have 
        //a matching table in the user database) that have a broken link.
        const links = this.collect_broken_replicas();
        //
        //Continue only if there are broken links.
        if (links.length === 0){
            alert("The links are well linked");
            return;
        }
        //
        //Call the server to establish the links.
        const ok: boolean = 
            await server.exec("tracker", [], "relink_user", [links]);
        //
        //If not ok, alert the user the process has failed.
        if(!ok){alert("Process failed");}
        else{alert('Replicas relinked successfully');}
    }
    //
    //Yield both roles and business replicas that are broken.
    private collect_broken_replicas(): Array<replica>{
        //
        //Start with an empty array.
        let result: Array<replica> = [];
        //
        //Get the role replicas.
        const role = this.dbase!.get_roles();
        //
        //Collect the role replicas.
        const replicas: Array<replica>  = 
            role.map(role=>{return{ename: role.key, cname: "user"}});
        //
        //Collect the business replicas.
        const ename: string = this.get_business_ename();
        //
        //Merge the role and business replicas.
        replicas.push({ename, cname: "business"});
        //
        //For each, merge ...
        for(let replica of replicas){
            //
            //Get the application entity.
            const entity = this.dbase!.entities[replica.ename];
            //
            //Get the application column.
            const column = entity.columns[replica.cname];
            //
            //Test if the user column is an attribute and yield it.
            if (column instanceof schema.attribute) result.push();
        };
        //
        return result;
    }
    //
    //Retrieve the entity that represents the business in this application.
    private get_business_ename(): string{
        //
        //Get all entities in the database.
        const entities = Object.values(this.dbase!.entities);
        //
        //Select only the entities that have a business column.
        const businesses = entities.filter(entity=>{
            //
            //Get all columns of this entity.
            const cnames = Object.keys(entity.columns);
            //
            //Test if one of the columns is business.
            return cnames.includes("business");
        });
        //
        //Get the length of the businesses found.
        const count = businesses.length;
        //
        //If there's no entity linked to the business, 
        //then this model is incomplete.
        if (count === 0) 
            throw new schema.mutall_error("Business table missing; incomplete model");
        //
        //If there's more than one table with a business link then bring this to
        //the user's attention.
        if (count > 1) 
            throw new schema.mutall_error(`We don't expect more than one business.
            Found ${JSON.stringify(businesses)}`);
        //
        //Return the only entity linked to business.
        return businesses[0].name;
    }
    //
    //1. Populate the selector with table names from current database
    populate_selector():void{
        //
        //1.Get the current database: It must EXIST by THIS TIME
        const dbase = this.dbase;
        if (dbase === undefined) throw new Error("No current db found");
        //
        //2.Get the subject selector
        const selector = <HTMLSelectElement> this.get_element("selection");
        //
        //3.Loop through all the entities of the database
        //using a for in statement
        for (const ename in dbase.entities){
            //
            //3.1 Create a selector option
            const option = this.document.createElement('option');
            //
            //  Add the name that is returned when you select
            option.value = ename;
            //
            //3.2 Populate the option
            option.textContent=ename;
            // 
            //3.3 Add the option to the subject selector
            selector.appendChild(option);
        }
    }
    //
    //2. Change the subject of this application
    async change_subject(selector:HTMLSelectElement): Promise<void>{
       //
       //2.1 Formulate a subject
       // Get the dbname
        const dbname = this.config.app_db
        //
        //Get the selected entity
        const ename = selector.value;
        //
        //Compile the new subject
        const subject : [string,string]=[ename, dbname];
        //
        //Get the theme panel
        const Theme : theme = <theme>this.panels.get("theme");
        //
        //Change the theme's subject
        Theme.subject = subject;
        //
        //Clear the existing content in the table
        this.document.querySelector('thead')!.innerHTML = '';
        this.document.querySelector('tbody')!.innerHTML = '';
        //
        //2.2 Repaint the theme panel
        Theme.view.top = 0;
        Theme.view.bottom = 0;
        await Theme.continue_paint();
    }
    //
    //
    async initialize(): Promise<void>{
        //
        //
        await super.initialize();
        //
        //
        this.populate_selector();
    }
}
//
//Start the application after fully loading the current 
//window.
window.onload = async ()=>{
    app.current= new tracker();
    await tracker.current.initialize();
}