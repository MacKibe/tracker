//
    //Get the reference for the body.
    let body = document.getElementsByTagName("body")[0];
    //
    //Create a table in which to populate.
    let tbl = document.createElement("table");
    //
    //Set table id.
    tbl.setAttribute("id", "table_");
    //
    //Create a tbody element.
    let tblBody = document.createElement("tbody");
    //
    //Loop through the table to table adding trs, tds and data.
    for (let i = 0; i < 100; i++) {
        //
        //Create a table row.
        let row = document.createElement("tr");
        //
        //Set an id on the tr.
        row.setAttribute("id", i+1);
        //
        //
        for (let j = 0; j < 4; j++) {
            //
            //Create a <td> element and a text node, make the text
            //node the contents of the <td>, and put the <td> at
            //the end of the table row.
            let cell = document.createElement("td");
            let cellText = document.createTextNode(sql);
            cell.appendChild(cellText);
            row.appendChild(cell);
        }
        //
        //Add the row to the end of the table body.
        tblBody.appendChild(row);
    }
    //
    //Put the <tbody> in the <table>.
    tbl.appendChild(tblBody);
    //
    //Appends <table> into <body>.
    body.appendChild(tbl);
    //
    //Set the border attribute of tbl to 2.
    tbl.setAttribute("border", "1");