/*
 * Check if object exist in array
 * @obj object to search in array
 * @list array to check presence of object
 */
function containsObject(obj, list) {
    var i;
    for (i = 0; i < list.length; i++) {
        if (list[i]["controller"] === obj["controller"] && list[i]["controlled"] === obj["controlled"]) {
            return true;
        }
    }
    return false;
}

function sparqlSysBio(genesList, cy) {
    console.log("Sending query");
    endpointURL = rootURL + '/systemic/network';
    genesList = genesList.split(",");
    console.log(genesList);
    var genesJSON = JSON.stringify(genesList);
    
    $.ajax({
        type: 'GET',
        headers: {
            Accept: "application/json"
        },
        url: endpointURL,
        data: 'genes=' + genesJSON,
        dataType: "json",
        crossDomain: true,
        success: function (data, textStatus, jqXHR) {
            // Get valid JSON format
            items = JSON.parse(JSON.stringify(data));            
            // Set content of graph and get list of uniq regulators
            var toUniq = graphContent(cy, items) ;
            // Apply layout on loaded data
            graphLayout(cy, genesList);
            // Hide running query message        
            document.getElementById("sendingQuery").style.display = 'none';
            // Show legend
            document.getElementById("graphe-legend").style.display = 'block';
            document.getElementById("next-level-regulation").style.display = 'block';
            checkboxContent(toUniq);
            document.getElementById('cy').addEventListener("dblclick", function resetGraph() {
                cy.fit();
            });          
        },
        error: function (jqXHR, textStatus, errorThrown) {
            document.getElementById("errorQuery").style.display = 'block';
            document.getElementById("sendingQuery").style.display = 'none';
            infoError("SPARQL querying failure: " + errorThrown);
            console.log(jqXHR.responseText);
        }
    });
}

function graphLayout(cy, genesList) {
    cy.layout({name:'cola', fit:true, nodeSpacing: 5, maxSimulationTime: 2000});                      
    // Add class to edge of type ACTIVATION
    cy.filter(function(i, element){
        if( element.isEdge() && element.data("type") === 'ACTIVATION' ){
            element.addClass('classActiv');
        }
    });
    // Color edge of type ACTIVATION
    cy.$('.classActiv').style({ 
        'target-arrow-color' : '#3399ff', 
        'width': 3,
        'line-color' : '#3399ff' 
    });
    // Style on input node
    for (var gene in genesList) {
        var re = new RegExp(genesList[gene], "gi");
        // Add class to node of name as input
        cy.filter(function(i, element){
            if( element.isNode() ) {
                if ( element.data("id").match(re)) {
                    element.addClass('classInput');
                }
            }
        });
    }
    // Color node with input name
    cy.$('.classInput').style({ 
        'background-color': 'red',
        'width':30,
        'height':30
    });
    // On click remove node and redraw graph
    cy.nodes().on("click", function(e){
        var id = e.cyTarget.id();
        cy.getElementById(id).remove();
        cy.layout({name:'cola'});
    });
};

function graphContent(cy, items) {
    var uniqEdge = []; // array of uniq edge
    // For each genes of the query
    for (var object in items) {
        // Tranform JSON format to Cytoscape JSON format 
        var name = object.toString(); // URI of interaction
        if(typeof items[object]["http://www.biopax.org/release/biopax-level3.owl#controller"] !== 'undefined') {
            var pair = {
                controller: items[object]["http://www.biopax.org/release/biopax-level3.owl#controller"][0]["value"],
                controlled: items[object]["http://www.biopax.org/release/biopax-level3.owl#controlled"][0]["value"]
            };

            if (containsObject(pair, uniqEdge) === false){
                uniqEdge.push(pair);
                cy.add([
                    {
                        // Controller/source name
                        data: {
                           id: items[object]["http://www.biopax.org/release/biopax-level3.owl#controller"][0]["value"]
                           //position: { x: i, y: 1+i }
                        }
                    },
                    {
                        // Controlled/target name
                        data: {
                           id: items[object]["http://www.biopax.org/release/biopax-level3.owl#controlled"][0]["value"].replace('Transcription of ','')
                           //position: { x: 3, y: 3 }
                        }
                    },                    
                    {
                        // Directed edge
                        data: {
                            id: name,
                            source: items[object]["http://www.biopax.org/release/biopax-level3.owl#controller"][0]["value"], //controller
                            target: items[object]["http://www.biopax.org/release/biopax-level3.owl#controlled"][0]["value"].replace('Transcription of ',''), //controlled
                            type: items[object]["http://www.biopax.org/release/biopax-level3.owl#displayName"][0]["value"]
                        }   
                    }
                ]);
            }
        }
    }
    uniqEdge.sort(function(a,b){
        return a.controller > b.controller;
    });
    return uniqEdge;
};

/*
 * Add checkbox
 * @toUniq : Array of object controller and controlled
 */
function checkboxContent(toUniq){
    var i;
    var controller = [];
    var container = document.getElementById("input-next-regulation");
    // Add list of new gene in panel for next run
    for (i=0; i< toUniq.length; i++) {
        if( $.inArray(toUniq[i]["controller"], controller) === -1){
            controller.push(toUniq[i]["controller"]);
            // Label of checkbox
            var label = document.createElement('label');
            label.id = "next-regulation-label";
            // Checkbox content
            var checkbox = document.createElement('input');
            checkbox.type = "checkbox";
            checkbox.name = "next-regulation-checkbox";
            checkbox.value = toUniq[i]["controller"];                
            container.appendChild(label);
            label.appendChild(checkbox);
            label.appendChild(document.createTextNode(" "+toUniq[i]["controller"]));
            label.style.display = 'block';
        }
    }
};

function updateList() {
    var allVals = [];
    $('#input-next-regulation :checked').each(function() {
        allVals.push($(this).val());
        $(this).attr('disabled', true);
    });
    return allVals;
}

function nextLevelRegulation(genesList, cy) {
    endpointURL = rootURL + '/systemic/network';
    var genesJSON = JSON.stringify(genesList);
    // Show 'query on run' message
    document.getElementById("sendingQuery").style.display = 'block';
    
    $.ajax({
        type: 'GET',
        headers: {
            Accept: "application/json"
        },
        url: endpointURL,
        data: 'genes=' + genesJSON,
        dataType: "json",
        crossDomain: true,
        success: function (data, textStatus, jqXHR) {
            document.getElementById("sendingQuery").style.display = 'none';
            // Get valid JSON format
            var items = JSON.parse(JSON.stringify(data));
            // Load new genes to graphe
            var toUniq = graphContent(cy,items); 
            // Apply layout
            graphLayout(cy, genesList);
            // Add item to checkbox
            checkboxContent(toUniq);
        },
        error: function (jqXHR, textStatus, errorThrown) {
            document.getElementById("errorQuery").style.display = 'block';
            document.getElementById("sendingQuery").style.display = 'none';
            infoError("SPARQL querying failure: " + errorThrown);
            console.log(jqXHR.responseText);
        }
    });
}