/** 
 * Rendering on template Systemic
 *
 * @author : Marie Lefebvre
 */

/**
 * Define and custome graphe layout
 * @param {Cytoscape object} cy
 * @param {array} genesList
 * @param {boolean} initial
 */
function graphLayout(cy, genesList, initial=false) {
    cy.layout({
        name:'cola', 
        fit:true
    });                      
    // Add class to edge of type ACTIVATION
    cy.filter(function(i, element){
        if( element.isEdge() && element.data("type") === 'ACTIVATION' ){
            element.addClass('classActiv');
        }
        var entityType = {
            'complex': "http://www.biopax.org/release/biopax-level3.owl#ComplexAssembly",
            'biochemical-reaction': "http://www.biopax.org/release/biopax-level3.owl#BiochemicalReaction",
            'degradation': "http://www.biopax.org/release/biopax-level3.owl#Degradation",
            'catalysis': "http://www.biopax.org/release/biopax-level3.owl#Catalysis"
        };
        if( element.isEdge() ) {
            if ( element.data("entity") === entityType["complex"] ){
                element.addClass('class-complex');
            }else if( element.data("entity") === entityType["biochemical-reaction"] ){
                element.addClass('class-biochemical');
            }else if (element.data("entity") === entityType["degradation"]){
                element.addClass('class-degradation');
            }
        }
    });
    // Color edge of type ACTIVATION
    cy.$('.classActiv').style({ 
        'mid-target-arrow-color' : '#3399ff', 
        'width': 2,
        'line-color' : '#3399ff' 
    });
    // Color edge of type COMPLEXE
    cy.$('.class-complex').style({ 
        'mid-target-arrow-color' : '#5FB404', 
        'width': 2,
        'line-color' : '#5FB404' 
    });
    // Color edge of type BIOCHEMICAL REACTION
    cy.$('.class-biochemical').style({ 
        'mid-target-arrow-color' : '#ff8080', 
        'width': 2,
        'line-color' : '#ff8080' 
    });
    // Style on input nodes
    for (var gene in genesList) {
        var re = new RegExp(genesList[gene], "gi");
        var reComplex = new RegExp("(.)*:(.)*$", "gi");
        // Add class to node of name as initial input
        cy.filter(function(i, element){
            if( element.isNode() && initial === true) {
                if ( element.data("id").match(re)) {
                    element.addClass('class-input');
                }
            }
            if(  element.isNode() && initial === false ){
                if ( element.data("id").match(re)) {
                    element.addClass('class-second-input');
                }
            }
            if(  element.isNode() && initial === false ){
                if ( element.data("id").match(reComplex)) {
                    element.addClass('class-second-input-complex');
                }
            }
        });
    }
    // Color node with input name
    cy.$('.class-input').style({ 
        'background-color': 'red',
        'width':25,
        'height':25
    });
    cy.$('.class-second-input').style({ 
        'background-color': '#FFBF00',
        'width':20,
        'height':20
    });
    cy.$('.class-second-input-complex').style({ 
        'background-color': '#FFBF00',
        'border-color': '#00264d',
        'border-style': 'solid',
        'border-width': 2,
        'width':20,
        'height':20,
        'shape': 'hexagon'
    });
    // On click remove node and redraw graph
    cy.nodes().on("click", function(e){
        var id = e.cyTarget.id();
        console.log(cy.getElementById(id).orphans().nodes());
        cy.getElementById(id).orphans().remove();
        cy.layout({name:'cola', grabbable: true});
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
                controlled: items[object]["http://www.biopax.org/release/biopax-level3.owl#controlled"][0]["value"].replace('Transcription of ','')
            };
            // Test pair already ont the graph
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
                            type: items[object]["http://www.biopax.org/release/biopax-level3.owl#controlType"][0]["value"] || "type",
                            entity: items[object]["http://www.w3.org/1999/02/22-rdf-syntax-ns#type"][0]["value"]
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
 * @param {string} className 
 */
function checkboxContent(toUniq, className){
    var container = document.getElementById("input-next-"+className);
    var checklist = [];
    var inputClass = "#input-next-"+className;
    var checkboxClass = "next-"+className+"-checkbox";
    /** 
     * Add existing gene list in checkbox to the new gene list
     */
    $((inputClass)).find('input').each(function(){
        if ($(this).attr('value') !== 'All') {
            toUniq.push({"controller" : $(this).attr('value')});
            if ($(this).is(':checked')) {
                checklist.push($(this).attr('value'));
            }
        }
    });
    
    /** 
     * Sort gene list
     */
    toUniq.sort(function(a,b){
        return a.controller > b.controller;
    });
    // Add 'All' option
    toUniq.unshift({"controller" : "All"});
    /** 
     * Remove checkbox content
     */
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
            label.id = "next-"+className+"-label";
            // Checkbox content
            var checkbox = document.createElement('input');
            checkbox.type = "checkbox";
            checkbox.name = checkboxClass;
            checkbox.className = checkboxClass;
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
 * @param {string} classType 
 * @returns {Array|updateList.allVals}
 */
function updateList(classType) {
    var allVals = [];
    var className = '#input-next-'+classType+' :checked';
    $(className).each(function() {
        allVals.push($(this).val());
        $(this).attr('disabled', true);
    });
    return allVals;
};
