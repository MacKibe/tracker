import * as outlook from "./outlook.js";
//
//Allows methods on this page to talk to the server
import * as server from "../../../library/v/code/server.js";
//
//Resolve the schema classes, viz.:database, columns, mutall e.t.c. 
import * as schema from "../../../library/v/code/schema.js";
//
import * as io from "./io.js";
//
//These are pages based on a particular subject as its theme 
export class theme extends outlook.panel {
    //
    constructor(
    //
    //The database and entity name that is displayed in this 
    //theme panel.
    subject, 
    // 
    //The css for retrieving the html element where to display 
    //the theme's subject record.
    css, 
    // 
    //The view page that is the home of this panel 
    base, 
    // 
    //An optional selection of the first record 
    selection) {
        super(css, base);
        this.subject = subject;
        this.css = css;
        this.base = base;
        this.selection = selection;
        //
        //The offset of the records that are visible in the page 
        //both top and bottom i.e within scrolling without loading 
        //more data in the purple part of our boundary diagram
        this.view = { top: 0, bottom: 0 };
        // 
        //This is the limit number of records that can be retrieved and 
        //constrained by the extreme boundery the blue part of the 
        //blue region of our map
        this.joint = { top: 0, bottom: 0 };
        //
        //This is the offset that indicates the last retrievable record 
        //i.e., the green part of our scroll diagram. The upper boundary
        //is deliberately set to the limit to forrce a paint of the first
        //page
        this.extreme = { top: 0, bottom: theme.limit };
    }
    //Paint the content panel with editable records of the subject
    async continue_paint() {
        //
        //Get the editor description.
        const metadata = await server.exec(
        //
        //The editor class is an sql object that was originaly designed 
        //to return rich content for driving the crud page.
        "editor", 
        //
        //Constructor args of an editor class are ename and dbname 
        //packed into a subject array in that order.
        this.subject, 
        //
        //Method called to retrieve editor metadata on the editor class.
        "describe", 
        //
        //There are no method parameters
        []);
        //
        //Destructure the metadata
        const [idbase, col_names, sql, max_record] = metadata;
        //
        //Set the metadata properties
        this.sql = sql;
        this.col_names = col_names;
        this.max_records = parseInt(max_record);
        //
        //Activate the static php database.
        this.dbase = new schema.database(idbase);
        //
        //Initialize the crud style for managing the hide/show feature 
        //of columns
        this.initialize_styles(col_names);
        //
        //Assuming that we are in a document where the table header 
        //is already available...
        const thead = this.document.querySelector("thead");
        //
        //Show the header
        this.show_header(thead);
        //
        //Retrieve and display $limit number of rows of data starting from the 
        //given offset/request.
        let pk;
        if (this.selection !== undefined)
            pk = this.selection.pk;
        await this.goto(pk);
        //
        //Select the matching row and scroll it into view.
        this.select_nth_row(pk);
    }
    //
    //Initialize the crud style for managing the hide/show feature 
    //of columns
    initialize_styles(col_names) {
        //
        //Get the columns style sheet
        const sheet = this.get_element("columns").sheet;
        //
        //loop through all the columns and set the styling for each column
        col_names.forEach((_col, index) => {
            //
            //Change  the index to a 1-based
            const index1 = index + 1;
            //
            //Create the rule for supporting styling of a header and its matching
            //fields the same way.
            //e.g When hiding th:nth-child(2), td:nth-child(2){ display:none}
            const rule = `th:nth-child(${index1}), td:nth-child(${index1}){}`;
            //
            //Insert the rule to the style sheet.
            sheet.insertRule(rule);
        });
    }
    //
    //Construct the header row and append it to the thead.
    show_header(thead) {
        //
        //Header should look like this
        //The primary key column will also serve as the multi line selector
        //<tr>
        //  <th id="todo" onclick="select_column(this)">Todo</th>
        //        ...
        //</tr>
        //Construct the th and attach it to the thead.
        const tr = document.createElement("tr");
        thead.appendChild(tr);
        //
        //2. Loop through each to create the header columns matching the example
        this.col_names.forEach(col_name => {
            //
            //Create a dummy th
            const th = document.createElement("th");
            //
            //Create text for the th
            const text = `<th 
                    id="${col_name}" 
                    onclick="select_column(this)"
                >${col_name}</th>`;
            //
            //Add the header columns to thead row.
            tr.appendChild(th);
            //
            th.outerHTML = text;
        });
    }
    //
    //Load the table rows and adjust the  boundaries depending
    //on the outcome type.
    async execute_outcome(outcome, request) {
        //
        switch (outcome.type) {
            //
            //The request is within view so no loading
            //and no view boundary adjustment.
            case "nothing":
                break;
            //
            //We need to adjust the relevant view 
            //boundary to the given value          
            case "adjust":
                //
                //This must be an 
                const adjust = outcome;
                //
                //Load the body from the offset and in the outcome direction.
                await this.load_body(adjust.start_from, adjust.dir);
                //
                //Now adjust the view direction to the outcome value.
                this.view[adjust.dir] = adjust.adjusted_view;
                break;
            case "fresh":
                //
                //Cast the outcome to a fresh view
                const fresh = outcome;
                //
                //Clear the page
                this.get_element("tbody").innerHTML = "";
                //
                //Load the new page starting from the view top, 
                //in the forward direction.
                await this.load_body(fresh.view_top, "bottom");
                //
                //Reset the boundaries.
                this.view.top = fresh.view_top;
                this.view.bottom = fresh.view_bottom;
                break;
            case "out_of_range":
                throw new schema.mutall_error(`Request ${request} is out of range
                    ${this.extreme.top} - ${this.extreme.bottom}`);
                break;
            default:
                throw new schema.mutall_error(`The outcome of type 
                       ${outcome.type} is not known`);
        }
    }
    //
    //Populate our table body with new rows 
    //starting from the given offset and direction.
    async load_body(offset /*:int*/, dir /*:mytop | bottom*/) {
        //
        //Range-GUARD:Ensure that offset is outside of the view for loading to be valid.
        if (this.within_view(offset))
            throw new schema.mutall_error(`The requested offset ${offset} 
                is already in view 
                ${this.view.top} -- ${this.view.bottom}, 
                so a new load is not valid.`);
        //
        //Calculate a constrained limit to prevent negative offsets.
        //
        //Get the height from extreme[top] to view[top] boundaries.
        const h = Math.abs(this.view[dir] - this.extreme[dir]);
        //
        //Use h to constrain the limit
        const constrained_limit = h < theme.limit ? h : theme.limit;
        //
        //Query the database 
        const result = await this.query(offset, constrained_limit);
        //
        //   
        //Display the results on the table`s body.
        //
        //Get the tbody for appending records 
        const tbody = document.querySelector("tbody");
        //
        //Loop through the results loading each tr 
        //based on the dir
        result.forEach((fuel, i) => {
            //
            //The index where this tr should  be inserted 
            //into the tbody
            const index = dir === "top"
                //
                //Counting from the top
                ? i
                //
                //Counting from the bottom
                : this.view.bottom - this.view.top + i;
            //
            //Insert row.
            const tr = tbody.insertRow(index);
            this.load_tr_element(tr, fuel);
        });
        //
        //Target the element being scrolled.
        const el = document.querySelector("#content");
        el.addEventListener("scroll", () => this.myscroll());
    }
    //
    //This is a scroll event listener that models our scrolling,
    //given the scroll height the offset height
    //It retrieves other records depending on the scroll direction.
    myscroll() {
        //
        //Get the body element of our table
        const tbody = document.querySelector("tbody");
        //
        //This gets the difference between the tbody scrollHeight 
        //and the tbody offset height 
        const scrollTop = Math.round(tbody.scrollTop);
        //
        //This is the sum of offset height plus the scroll top
        //(offset height is the clientheight plus the borders and margins)
        const scrollHeight = tbody.scrollHeight;
        const clientHeight = tbody.clientHeight;
        if (scrollTop === 0) {
            this.retrieve_records("top");
        }
        else if (scrollTop + clientHeight >= scrollHeight) {
            this.retrieve_records("bottom");
        }
    }
    //
    //these are the review methods
    //
    //This is an an event listener that retrieves limit records from 
    //the server depending on the given direction.i.e., records in 
    //the blue area of our scroll map.
    async retrieve_records(dir) {
        //
        //Set the offset value depending on the direction of scrolling.
        let offset;
        //
        //If the direction is away from the top view boundary, 
        //the offset becomes joint 
        if (dir === "top") {
            //
            //The offset is the joint top boundary if we are scrolling upwards.
            offset = this.get_joint("top");
        }
        //
        else {
            //
            //The offset is the bottom view boundary if we are scrolling downwards.
            offset = this.view.bottom;
        }
        //
        //Retrieve and display $limit rows of data starting from the 
        //given offset/request subject to the available data.
        await this.goto(offset);
    }
    //
    //Test if offset is within joint boundaries
    within_joint(request) {
        //
        //We are within the joint boundaries if...
        const condition = 
        //
        //.. offset is between the top and 
        //bottom joint boundaries.
        request >= this.get_joint("top")
            && request < this.get_joint("bottom");
        return condition;
    }
    // 
    //Test if offset is within extremes and return true otherwise false.
    within_extreme(request) {
        //
        //extreme top condition should always 
        //be set otherwise you get a runtime error.
        //if extreme top is undefined throw an error.
        return request >= this.extreme.top
            && request < this.extreme.bottom;
    }
    //
    //Test if offset is within view boundaries
    within_view(req) {
        //
        //We are within  view if...
        return true //true is for appeasing the IDE.
            //
            //...the top view is set...
            && this.view.top !== null
            //
            //...and the offset is between the top 
            //and bottom view boundaries.
            && req >= this.view.top
            && req < this.view.bottom;
    }
    //
    //Return the joint boundary given the direction The top joint boundary
    // is a maximum of limit records from the top view boundary. The 
    // bottom joint boundary is a maiximum of limit records from the 
    // view[bottom]. see the scroll map 
    // http://206.189.207.206/pictures/outlook/scroll_2020_10_10.ppt
    get_joint(dir /*top|bottom*/) {
        //
        //
        let raw_boundary = 
        //
        //The referenced view boundary
        this.view[dir]
            //
            //The maximum range
            + theme.limit
                //
                //Accounts for the direction 
                * (dir === "top" ? -1 : +1);
        //
        //Return a constrained boundary
        return this.within_extreme(raw_boundary)
            ? raw_boundary : this.extreme[dir];
    }
    //
    //
    //Fetch the real data from the database as an array of table rows.
    async query(offset, limit) {
        // 
        //The entity name that drives this query comes from the subject of this 
        //application
        const ename = `\`${this.subject[0]}\``;
        //
        //Complete the sql using the offset and the limit.
        const complete_sql = 
        //
        //Main sql
        this.sql
            //
            //Sort by ascending primary key 
            + ` ORDER BY  ${ename}.${ename}  Asc`
            //
            //Paginate results.
            + ` LIMIT ${limit} OFFSET ${offset}`;
        //
        //Use the sql to query the database and get results as array of row objects.
        return await server.exec("database", 
        //
        //dbase class constructor arguments
        [this.subject[1]], 
        //
        "get_sql_data", 
        //
        //The sql stmt to run
        [complete_sql]);
    }
    //
    //Convert the row object obtained from the server to a tr element.
    load_tr_element(
    //
    //THe table row to load data. 
    tr, 
    //
    //The data to load to the tr.
    row) {
        //
        //Convert the row object into key-value pairs where the
        //key is the column name. Take care of those cases where row 
        //is undefined.
        const pairs = row === undefined
            ? this.col_names.map(cname => [cname, null])
            : Object.entries(row);
        //
        //Enrich the tr with the id, pk and the friend attributes
        // 
        //Get the string value of the primary key i.e., 1st column
        const value_str = pairs[0][1];
        // 
        //Prepare to collect the primary key and the friendly components
        //value
        let pk, friend;
        // 
        //Take care when the string value is null
        if (value_str !== null) {
            // 
            //Destructure the string value
            [pk, friend] = JSON.parse(value_str);
            //
            //Make the pk a valid id by preffixing it with letter r
            tr.id = `r${pk}`;
        }
        // 
        //Use empty value strings for pk and friend when there is no value
        else {
            pk = "";
            friend = "";
        }
        //
        //Append the id and the primary key attributes to the tr
        tr.setAttribute("pk", pk);
        tr.setAttribute("friend", friend);
        tr.onclick = () => theme.select(tr);
        //
        //Loop through all the pairs outputting each one
        //of them as a td. 
        pairs.forEach(([key, value]) => {
            //
            //Create a td and append it to the row.
            const td = document.createElement("td");
            tr.appendChild(td);
            //
            //Set the click event listener of the td
            td.onclick = () => theme.select(td);
            //
            //Set the column name to be associated with this td
            td.setAttribute('data-cname', key);
            //
            //Set the td's "value"
            //
            //Get the td's io
            const Io = this.get_io(td);
            //
            //Set the io's value
            Io.value = value;
        });
    }
    //
    //Return the io structure associated with the given td
    get_io(td) {
        // 
        //Get the position of this td 
        const rowIndex = td.parentElement.rowIndex;
        const cellIndex = td.cellIndex;
        //
        //Destructure the subject to get the entity name; its the 
        //first component. 
        const [ename] = this.subject;
        // 
        //Get the column name that matches this td. 
        const col_name = this.col_names[cellIndex];
        //
        //Get the actual column from the underlying database.
        const col = this.dbase.entities[ename].columns[col_name];
        //
        //Create and return the io for this column.
        const Io = io.create_io(td, col);
        // 
        //Save the io to aid in data retrieval.
        //NB: Remember to stringify the position
        theme.ios.set(String([this.key, rowIndex, cellIndex]), Io);
        // 
        return Io;
    }
    //
    //Select the row whose primary key is the given one.
    //and makes sure that it is in the view 
    select_nth_row(pk) {
        // 
        //Row selection is valid only when the pk is set
        if (pk === undefined)
            return;
        //
        //1. Get the row identified by the primary key. 
        const tr = document.querySelector(`#r${pk}`);
        //
        //Ensure that a row with this pk exists
        if (tr === null) {
            alert(`No tr found with row id ${pk}`);
            return;
        }
        //
        //2. Select the row.
        theme.select(tr);
        //
        //3.Bring the selected row to the center of the view.
        tr.scrollIntoView({ block: "center", inline: "center" });
    }
    //
    //Ensure that the given tag is the only selected one 
    //of the same type
    static select(tag) {
        //
        //Get the tagname 
        const tagname = tag.tagName;
        //
        //1. Declassifying all the elements classified with 
        //this tagname.
        const all = document.querySelectorAll(`.${tagname}`);
        Array.from(all).forEach(element => element.classList.remove(tagname));
        //
        //3.Classify this element 
        tag.classList.add(tagname);
    }
    //
    //
    //Retrieve and display $limit rows of data starting from the 
    //given offset/request subject to the available data.
    async goto(request) {
        //
        //Get the requested record offset.
        //
        let goto;
        if (request === undefined && (goto = document.querySelector('#goto')) !== null) {
            //
            //
            //Get the offset from the user from the user
            //
            //Get the goto input element
            const value = goto.value;
            //
            //Get the users request as an integer
            request = parseInt(value);
        }
        else {
            //
            //Set it to 0
            request = 0;
        }
        //
        //Verify that the request is above the top extreme boundary.
        if (request < this.extreme.top)
            throw new schema.mutall_error(`Goto: A request ${request}
             must be positive`);
        //
        //Determine what kind of scroll is required for the current situation. 
        const outcome /*:"nothing"|"adjust"|"fresh"*/ = this.get_outcome(request);
        //
        //Load the table rows and use the scrolling outcome to update the 
        //boundaries
        await this.execute_outcome(outcome, request);
    }
    //
    //Determine which scrolling outcome we need depending on the requested offset.
    get_outcome(request) {
        //
        //NOTHING: If the request is within view, do 
        //nothing.i.e., no loading of new rows or adjusting 
        //current view boundaries.
        if (this.within_view(request))
            return { type: "nothing" };
        //
        //ADJUST: If request is within the joint boundaries, 
        //load a fresh copy and adjust either the top or bottom
        //boundaries depending on the request direction.
        if (this.within_joint(request)) {
            //
            //The direction is top if the 
            //request is above the top boundary.
            const dir = request < this.view.top
                ? "top" : "bottom";
            //
            //The top or bottom boundaries 
            //should be adjusted to this value.
            const adjusted_view = this.get_joint(dir);
            //
            //Adjust the top boundary
            const start_from = dir === "top"
                ? this.get_joint(dir) : this.view[dir];
            //
            //Return the view boundary adjustment outcome.
            return { type: "adjust", dir, start_from, adjusted_view };
        }
        //
        //FRESH: If the request is within extremes, 
        //load a fresh outcome, i.e., clear current tbody, 
        //load new rows and adjust the views.
        if (this.within_extreme(request)) {
            //
            //Constrain  the request to the extreme top.
            const view_top = request < this.extreme.top
                ? this.extreme.top : request;
            //
            //The bottom is always $limit number of rows
            //from the top, on a fresh page.
            const y = view_top + theme.limit;
            //
            //Constrain the bottom to the extreme bottom. 
            const view_bottom = y > this.extreme.bottom
                ? this.extreme.bottom : y;
            return { type: "fresh", view_top, view_bottom };
        }
        //
        //OUT OF RANGE: The request is out of range.
        return { type: "out_of_range", request };
    }
    //
    //Restore the ios asociated with the tds on the theme panel. This is
    //necessary bceuase the old ios are no londer assocuate with the current
    //document wgos documetElement has changed.
    restore_ios() {
        //
        //Collect all the tds on this page as an array
        const tds = Array.from(this.document.querySelectorAll('td'));
        //
        //For each td, restore its io.
        tds.forEach(td => {
            //
            //Cast the td to table cell element
            const td_element = td;
            //
            //Get the td's row and column positions
            const rowIndex = td_element.parentElement.rowIndex;
            const cellIndex = td_element.cellIndex;
            //
            //Compile the io's key key that matches this td
            const key = String([this.key, rowIndex, cellIndex]);
            //
            //Use the static io list to get the io that matches this td
            const io = theme.ios.get(key);
            //
            //Its an error if the io is not found
            if (io === undefined)
                throw new schema.mutall_error(`io wth key ${key} is not found`);
            //
            //Each io has its own way of restoring itself to ensure that
            //its properties are coupld to teh given td element
            io.restore();
        });
    }
}
// 
//Saves io instances that created this theme table saved as a map 
//indexed by their position in a thematic oanel
theme.ios = new Map();
/**
 * The scrolling variables
 */
// 
//The maximum number of records that can be retrieved from 
//the server using one single fetch. Its value is used to modify 
//the editor sql by  adding a limit clause 
theme.limit = 40;
