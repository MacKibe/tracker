//
//Import app from the outlook library.
import { assets,choices,subject } from '../../../outlook/v/code/outlook.js';
import {app} from "../../../outlook/v/code/app.js"
import config from './config.js';
import {theme} from "../../../outlook/v/code/theme.js";
//
//The school model that link teacher, pupils and parents
export default class chama extends app{
    //
    static current:chama;
    //Initialize the chama
    constructor(){
        super(
            //
            //Override the config
            new config()
        );  
        chama.current=this; 
    }
    //
    //Include this application based products
     get_Iproducts():assets.products{
            //
            //Create the app's default products
            const Iproduct = super.get_Iproducts();
            //The inbuilt solutions for the members.
            const solutions2: assets.solutions={
                //
                //The members can view other members in the same group
                member:{
                    title: "View Group",
                    id:"member",
                    listener:["crud",'group', ['review'],'+',"mutall_chama"]
                },
                //
                //Members can particuoate in events
                member_event:{
                    title: "Event participation",
                    id:"member_event",
                    listener:["crud",'member', ['review'],'+',"mutall_chama"]
                },
                //
                //Members can view the objectives
                member_objective:{
                    title: "View Group objectives",
                    id:"member_objective",
                    listener:["crud",'member', ['review'],'+',"mutall_chama"]
                },
                //
                //Members can view the messages from each group
                member_message:{
                    title: "Manage Messages",
                    id:"member_message",
                    listener:["crud",'member', ['review'],'+',"mutall_chama"]          
                },
            }
            //The inbuilt solutions for the  Officials.
            const solutions3: assets.solutions={
                //
                //The officials will manage the groups.
                official_groups:{
                    title: "Manage Groups",
                    id:"official_groups",
                    listener:["crud",'member', ['review'],'+',"mutall_chama"]          
                },
                //
                //The officials will manage the members.
                official_member:{
                    title: "Membership management",
                    id:"official_member",
                    listener:["crud",'member', ['review'],'+',"mutall_chama"]          
                },
                //
                //The officials will manage the office
                official_office:{
                    title: "Manage Office",
                    id:"official_office",
                    listener:["crud",'member', ['review'],'+',"mutall_chama"]          
                },
                //
                //The officials will manage the Events
                official_events:{
                    title: "Event Management",
                    id:"official_events",
                    listener:["crud",'member', ['review'],'+',"mutall_chama"]          
                },
                //
                //The officials will manage the members contributions
                official_contribution:{
                    title: "Manage Contribution",
                    id:"official_contribution",
                    listener:["crud",'member', ['review'],'+',"mutall_chama"]          
                },
                //
                //The officials will manage the AGM's
                official_agm:{
                    title: "Manage the AGM's",
                    id:"official_agm",
                    listener:["crud",'member', ['review'],'+',"mutall_chama"]          
                },
                //
                //The officials will set the groups objectives
                official_objective:{
                    title: "Manage group objectives",
                    id:"official_objective",
                    listener:["crud",'member', ['review'],'+',"mutall_chama"]          
                },
                //
                //The officials will design the group's messages.
                official_message:{
                    title: "Post group Messages",
                    id:"official_message",
                    listener:["crud",'member', ['review'],'+',"mutall_chama"]          
                },
                //
                //The officials will manage the event minutes.
                official_minutes:{
                    title: "Manage Minute Proceedings",
                    id:"official_minutes",
                    listener:["crud",'member', ['review'],'+',"mutall_chama"]          
                }
                    
            }
            //
            //The inbuilt functions for the groups
            const solutions4: assets.solutions={
                //
                //The group will view the group minutes
                group_message:{
                    title: "View Group Minutes",
                    id: "group_message",
                    listener:["crud",'minutes',['review'],'+',"mutall_chama"]
                },
                //
                //The group will view the events
                group_event:{
                    title: "Group Events",
                    id:"group_event",
                    listener:["crud",'member', ['review'],'+',"mutall_chama"]          
                },
                //
                // The group will view the agm's
                official_minutes:{
                    title: "Access AGM's",
                    id:"official_minutes",
                    listener:["crud",'member', ['review'],'+',"mutall_chama"]          
                },
                //
                //The group will view the Group objectives 
                group_objective:{
                    title: "Identify Group Ojectives",
                    id:"group_objective",
                    listener:["crud",'member', ['review'],'+',"mutall_chama"]          
                },
                //
                //The group will view the contribution
                group_member:{
                    title: "Group contribution",
                    id:"group_member",
                    listener:["crud",'member', ['review'],'+',"mutall_chama"]          
                }
            }
            //
            //These are the application specific products
            const solutions5: assets.solutions={
                group_view:{
                    title: "View Groups",
                    id:"group_view",
                    listener:["crud",'member', ['review'],'+',"mutall_chama"]
                },
                official_view:{
                    title: "View Officials",
                    id:"official_view",
                    listener:["crud",'member', ['review'],'+',"mutall_chama"]
                },
                fees_view:{
                    title: "Fees",
                    id:"fees_view",
                    listener:["crud",'member', ['review'],'+',"mutall_chama"]
                },
            }
            //
            //CRUD registration products
             const solutions1: assets.solutions={
            //
            //Join a group.
            join_group:{
                    title: "Join a group",
                    id:"join_group",
                    listener:["crud",'group', ['review'],'+',"mutall_chama"]
                },
            //If the user specific group is not selected:
            //
            //Initialize the group
            create_group:{
                    title: "Create a group",
                    id:"create_group",
                    listener:["crud",'group', ['review'],'+',"mutall_chama"]
                },
            //
            // Create the group officials
            create_official:{
                    title: "Add Group officials",
                    id:"create_official",
                    listener:["crud",'official', ['review'],'+',"mutall_chama"]
                },
            //
            //Insert the group members
            create_member:{
                    title: "Insert group members",
                    id:"create_member",
                    listener:["crud",'member', ['review'],'+',"mutall_chama"]
                },
            //
            //Set the group objectives
            create_objective:{
                    title: "Set group objective",
                    id:"create_objective",
                    listener:["crud",'objective', ['review'],'+',"mutall_chama"]
                },
            //
            //Allow the registrar to select the fees
            create_fees:{
                    title: "Choose Fees",
                    id:"create_fees",
                    listener:["crud",'fee', ['review'],'+',"mutall_chama"]
                },
             }
            //
            //Registering a new chama
              Iproduct['user']= {
                    id: "user", title: "Register New Chama",
                        solutions: solutions1
                    },
            //
            //group product definition
            Iproduct['group']= {
                    id: "group", title: "Manage Group products",
                        solutions: solutions2 
                    },
                //
                //These are Application defined products
                Iproduct['office'] = {
                        id:"office", title: "Chama Products",
                        solutions: solutions5,
                                   },
                //
                //These are the officials products
                Iproduct['official'] = {
                        id:"official",title: "Official products",
                        solutions: solutions3
                    },
                //
                //These are the member products
                Iproduct ['member'] = {
                        id:"member",title: "Member products",
                        solutions: solutions4
                    }
            //
            //Return the new colletion of products
            return Iproduct;
    }
    //
    //Edit any table in the system
    async edit_table(){
        //
        //1. Get all the tables from the system as key value pairs
            //
            //1.1 Get the application database
            const dbase = this.dbase!;
            //
            //1.2 Use the database to extract the entities
            const enames = Object.keys(dbase.entities);
            //
            //1.3 Map the entities to the required key value pairs
            const pairs = enames.map(ename=>({key:ename, value:ename}));
        //
        //2. Use the pairs to create a new choices POPUP that returns a selected
        //table
        const Choice = new choices<string>(this.config,pairs,"table");
        //
        //3. Open the POPUP to select a table.
        const selected = await Choice.administer();
        //
        //4. Test whether the selection was aborted or not
        if (selected === undefined)return;
        //
        //5. Use the table to run the CRUD services.
        const subject:subject = [selected[0], this.dbname];
        const verbs: Array<assets.verb> = ['create','review','update','delete'];
        this.crud(subject,verbs);
    }
    //
    //Adding the Business Selector
    group_selector(): void{
       //
       //1. List all available Chama
       //
       //2. Select one or more
       //
       //3. Update the Databases in both "user" and "application"
       //
       //4. Respect the business selector to all crud sql's
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
}
//
//Start the application after fully loading the current 
//window.
window.onload = async ()=>{
    app.current= new chama();
    await app.current.initialize();
    chama.current.populate_selector();
}