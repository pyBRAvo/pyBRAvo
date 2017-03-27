/** 
 * Rendering on template Systemic
 *
 * @author : Marie Lefebvre
 */

/**
 * Define and custome graphe layout
 * @param {Cytoscape object} cy
 * @param {array} genesList
 */
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
    displayQttInfo(cy);
};

/**
 * Add content to graphe
 * @param {Cytoscape object} cy
 * @param {array} items
 * @returns {Array|graphContent.uniqEdge}
 */
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

/**
 * Add content to checkbox
 * @param {array of object} toUniq
 */
function checkboxContent(toUniq){
    var container = document.getElementById("input-next-regulation");
    var checklist = [];
    // Add existing gene list in checkbox to the new gene list
    $(("#input-next-regulation")).find('input').each(function(){
        if ($(this).attr('value') !== 'All') {
            toUniq.push({"controller" : $(this).attr('value')});
            if ($(this).is(':checked')) {
                checklist.push($(this).attr('value'));
            }
        }
    });
    
    // Sort gene list
    toUniq.sort(function(a,b){
        return a.controller > b.controller;
    });
    // Add 'All' selection
    toUniq.unshift({"controller" : "All"});
    // Remove checkbox content
    while (container.hasChildNodes()){
        container.removeChild(container.firstChild);
    }
    var i;
    var controller = [];
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
            checkbox.className = "next-regulation-checkbox";
            checkbox.value = toUniq[i]["controller"];
            // Recheck  
            if ($.inArray(toUniq[i]["controller"], checklist) !== -1) {
                checkbox.checked = true;
                checkbox.disabled = true;
            }
            if (toUniq[i]["controller"] === 'All') {
                checkbox.className = "toggle";
                checkbox.id = "toggle";
            }
            container.appendChild(label);
            label.appendChild(checkbox);
            label.appendChild(document.createTextNode(" "+toUniq[i]["controller"]));
            label.style.display = 'block';
        }
    }
};

/**
 * 
 * @param {Cytoscape object} cy
 */
function displayQttInfo(cy){
    var nbNodes = cy.nodes().size();
    var nbEdges = cy.edges().size();
    document.getElementById("total-info-nodes").innerHTML = nbNodes+" nodes";
    document.getElementById("total-info-edges").innerHTML = nbEdges+" edges";
    document.getElementById("btn-download").style.display = "block";
};

/**
 * Check if object exist in array
 * @param {object} obj : object to search in array
 * @param {array} list : array to check presence of object
 */
function containsObject(obj, list) {
    var i;
    for (i = 0; i < list.length; i++) {
        if (list[i]["controller"] === obj["controller"] && list[i]["controlled"] === obj["controlled"]) {
            return true;
        }
    }
    return false;
};

/**
 * 
 * @returns {Array|updateList.allVals}
 */
function updateList() {
    var allVals = [];
    $('#input-next-regulation :checked').each(function() {
        allVals.push($(this).val());
        $(this).attr('disabled', true);
    });
    return allVals;
};
