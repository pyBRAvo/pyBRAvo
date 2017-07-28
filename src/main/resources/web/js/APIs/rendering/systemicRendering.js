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
    var nodeCategory = {
        "protein": "http://www.biopax.org/release/biopax-level3.owl#Protein",
        "dna": "http://www.biopax.org/release/biopax-level3.owl#Dna",
        "rna": "http://www.biopax.org/release/biopax-level3.owl#Rna",
        "complex": "http://www.biopax.org/release/biopax-level3.owl#Complex",
        "molecule": "http://www.biopax.org/release/biopax-level3.owl#SmallMolecule"        
    };
    // Add class to edge of type ACTIVATION
    cy.filter(function(i, element){
        if( element.isEdge() && element.data("type") === 'ACTIVATION' ){
            element.addClass('class-activ');
        }
        if( element.isEdge() && element.data("type") === 'INHIBITION' ){
            element.addClass('class-inhib');
        }
        if( element.isEdge() && element.data("style") === 'controller' ){
            element.addClass('class-edge-controller');
        }
        if( element.isNode() && element.data("type") === 'controller' ){
            element.addClass('class-controller');
        } 
        if( element.isNode() && element.data("type") === 'random-node' ){
            element.addClass('class-random');
        } 
        if( element.isNode() ) {
            if ( element.data("category") === nodeCategory["protein"] ) {
                element.addClass('class-node-protein');
            }
            if ( element.data("category") === nodeCategory["dna"] ) {
                element.addClass('class-node-dna');
            }
            if ( element.data("category") === nodeCategory["rna"] ) {
                element.addClass('class-node-rna');
            }
            if ( element.data("category") === nodeCategory["complex"] ) {
                element.addClass('class-node-complex');
            }
            if ( element.data("category") === nodeCategory["molecule"] ) {
                element.addClass('class-node-molecule');
            }
        } 
    });
    cy.layout({
        name:'cola',
        nodeSpacing: 5,
        unconstrIter: 10
//        fit:true
    });
    // Color edge of type ACTIVATION
    cy.$('.class-activ').style({ 
        'mid-target-arrow-color' : '#3399ff', 
        'width': 2,
        'line-color' : '#3399ff' 
    });
    // Color edge of type INHIBITION
    cy.$('.class-inhib').style({ 
        'mid-target-arrow-color' : '#000000', 
        'mid-target-arrow-shape': 'tee',
        'width': 2,
        'line-color' : '#000000' 
    });
    // Color edge of type controller
    cy.$('.class-edge-controller').style({ 
        'style': 'curve-style',
        'mid-target-arrow-shape': 'none',
        'line-style': 'dashed'
    });
    // Style on input nodes
    for (var gene in genesList) {
        var re = new RegExp(genesList[gene], "i");
        // Add class to node of name as initial input
        cy.filter(function(i, element){
            if( element.isNode() && initial === true) {
                if ( element.data("id") === genesList[gene]) {
                    element.addClass('class-input');
                }
            }
            if(  element.isNode() && initial === false ){
                if ( element.data("id") === genesList[gene]) {
                    element.addClass('class-second-input');
                }
            }
        });
    }
    
    // Color node of type CONTROLLER
    cy.$('.class-controller').style({ 
        'background-color': '#8904B1', // violet
        'width':15,
        'height':15
    });
    // Color node of type INTER NODE
    cy.$('.class-random').style({ 
        'background-color': '#fff', // pink
        'border-color': '#3399ff',
        'border-width': 2,
        'shape': 'rectangle',
        'text-opacity': 0,
        'width':10,
        'height':10
    });
    
    // Color node with input name
    cy.$('.class-input').style({ 
        'background-color': 'red',
        'width':25,
        'height':25
    });
    cy.$('.class-second-input').style({ 
        'background-color': '#FFBF00', // yellow
        'width':20,
        'height':20
    });
    cy.$('.class-node-dna').style({
        'border-color': '#3366ff', // blue
        'border-width': 2
    });
    cy.$('.class-node-rna').style({
        'border-color': '#00b33c', // green
        'border-width': 2 
    });
    cy.$('.class-node-complex').style({
        'shape': 'hexagon'
    });
    cy.$('.class-node-molecule').style({
        'shape': 'diamond'
    });
    // On click remove node and redraw graph
    cy.nodes().on("click", function(e){
        var id = e.cyTarget.id();
        console.log(cy.getElementById(id));
//        cy.getElementById(id).orphans().remove();
//        cy.layout({
//            name:'cola', 
//            grabbable: true
//        });
    });
    // Tooltip
    cy.on('mouseover', 'node', function(event) {
        var node = event.cyTarget;
        node.qtip({
             content: function(){ return 'ID: ' + this.id() },
             show: {
                event: event.type,
                ready: true
             },
             hide: {
                event: 'mouseout unfocus'
             }
        }, event);
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
            var controllers = items[object]["http://www.biopax.org/release/biopax-level3.owl#controller"];
            for (i=0; i<controllers.length; i++) {
                var pair = {
                    controller: controllers[i]["value"].toUpperCase().replace(' GENE',''),
                    controlled: items[object]["http://www.biopax.org/release/biopax-level3.owl#controlled"][0]["value"].replace('Transcription of ','').toUpperCase()
                };
                if (containsObject(pair, uniqEdge) === false){
                    uniqEdge.push(pair);
                    cy.add({
                        nodes :[
                        {
                            // Controller/source name
                            data: {
                               'id': controllers[i]["value"].toUpperCase().replace(' GENE',''),
                               'category': items[object]["http://www.w3.org/1999/02/22-rdf-syntax-ns#participantType"][0]["value"], // complex, rna, dna...
                               'IDreac': name
                               //position: { x: i, y: 1+i }
                            }
                        },
                        {
                            // Controlled/target name
                            data: {
                               id: items[object]["http://www.biopax.org/release/biopax-level3.owl#controlled"][0]["value"].replace('Transcription of ','').toUpperCase()
                               //position: { x: 3, y: 3 }
                            }
                        }],                    
                        edges: [{
                            // Directed edge
                            data: {
                                id: name+i,
                                source: controllers[i]["value"].toUpperCase().replace(' GENE',''), //controller
                                target: items[object]["http://www.biopax.org/release/biopax-level3.owl#controlled"][0]["value"].replace('Transcription of ','').toUpperCase(), //controlled
                                type: items[object]["http://www.biopax.org/release/biopax-level3.owl#controlType"][0]["value"] || "type", // activation, inhibition
                            }   
                        }]
                    });
                }
            }
        }
    }
    uniqEdge.sort(function(a,b){
        return a.controller > b.controller;
    });
    return uniqEdge;
};

/**
 * Add content to graphe
 * @param {Cytoscape object} cy
 * @param {array} items
 * @returns {Array|graphContent.uniqEdge}
 */
function graphContentSignaling(cy, items) {
    var uniqEdge = []; // array of uniq edge
    var catalysers = []; // array of unique catalysers
    var catalyserId = guidGenerator();
    // For each genes of the query
    for (var object in items) {
        // Tranform JSON format to Cytoscape JSON format 
        var name = object.toString(); // URI of interaction
        if(typeof items[object]["http://www.biopax.org/release/biopax-level3.owl#left"] !== 'undefined') {
            var lefts = items[object]["http://www.biopax.org/release/biopax-level3.owl#left"];
            for (var i=0; i<lefts.length; i++) {
                var pair = {
                    controller: lefts[i]["value"].toUpperCase(),
                    controlled: items[object]["http://www.biopax.org/release/biopax-level3.owl#right"][0]["value"].toUpperCase()
                };
                if (containsObject(pair, uniqEdge) === false && pair["controller"] !== pair["controlled"]){
                    uniqEdge.push(pair);
                    if (typeof items[object]["http://www.biopax.org/release/biopax-level3.owl#controller"] !== 'undefined') {
                        for (var j=0; j < items[object]["http://www.biopax.org/release/biopax-level3.owl#controller"].length; j++) {
                            
                            if ($.inArray(items[object]["http://www.biopax.org/release/biopax-level3.owl#controller"][j]["value"].toUpperCase(), catalysers) === -1) {
                                catalyserId = guidGenerator();
                                catalysers.push(items[object]["http://www.biopax.org/release/biopax-level3.owl#controller"][j]["value"].toUpperCase());
                            }
                            var category = (typeof items[object]["http://www.biopax.org/release/biopax-level3.owl#participantType"][i] === 'undefined') ? items[object]["http://www.biopax.org/release/biopax-level3.owl#participantType"][0]["value"] : items[object]["http://www.biopax.org/release/biopax-level3.owl#participantType"][i]["value"];
                            cy.add({
                                nodes :[
                                {
                                    // Source name
                                    data: {
                                       'id': lefts[i]["value"].toUpperCase(),
                                       'category': category // complex, rna, dna...
                                       //position: { x: i, y: 1+i }
                                    }
                                },{
                                    // Controller name
                                    data: {
                                       'id': items[object]["http://www.biopax.org/release/biopax-level3.owl#controller"][j]["value"].toUpperCase(),
                                       'type': "controller"
                                       //position: { x: i, y: 1+i }
                                    }
                                },{
                                    // Inter node
                                    data: {
                                       'id': name,
                                       'type': "random-node"
                                       //position: { x: i, y: 1+i }
                                    }
                                },{
                                    // Target name
                                    data: {
                                       'id': items[object]["http://www.biopax.org/release/biopax-level3.owl#right"][0]["value"].toUpperCase()
                                       //position: { x: 3, y: 3 }
                                    }
                                }],                    
                                edges: [
                                {
                                    // source to inter node
                                    data: {
                                        id: name+"s",
                                        source: lefts[i]["value"].toUpperCase(), // source
                                        target: name, // arc
                                        type: items[object]["http://www.biopax.org/release/biopax-level3.owl#controlType"][0]["value"] || "type" // activation, inhibition
                                    }  
                                },{
                                    // inter node to target
                                    data: {
                                        id: name+"t",
                                        source: name, // inter node
                                        target: items[object]["http://www.biopax.org/release/biopax-level3.owl#right"][0]["value"].toUpperCase(), // target
                                        type: items[object]["http://www.biopax.org/release/biopax-level3.owl#controlType"][0]["value"] || "type" // activation, inhibition
                                    }  
                                },{
                                    // controller to inter node
                                    data: {
                                        id: catalyserId,
                                        source: items[object]["http://www.biopax.org/release/biopax-level3.owl#controller"][j]["value"].toUpperCase(), // controller
                                        target: name, // inter node
                                        style: "controller",
                                        type: items[object]["http://www.biopax.org/release/biopax-level3.owl#controlType"][0]["value"] || "type" // activation, inhibition
                                    }  
                                }]
                            });
                        }
                    } else {
                        // bp:participantType are not redondant : if 3 bp:left with same bp:participantType, only one bp:paticipantType in array
                        var category = (typeof items[object]["http://www.biopax.org/release/biopax-level3.owl#participantType"][i] === 'undefined') ? items[object]["http://www.biopax.org/release/biopax-level3.owl#participantType"][0]["value"] : items[object]["http://www.biopax.org/release/biopax-level3.owl#participantType"][i]["value"];
                        cy.add({
                            nodes :[
                            {
                                // Source name
                                data: {
                                   'id': items[object]["http://www.biopax.org/release/biopax-level3.owl#left"][i]["value"].toUpperCase(),
                                   'category': category
                                   //position: { x: i, y: 1+i }
                                }
                            },{
                                // Target name
                                data: {
                                   'id': items[object]["http://www.biopax.org/release/biopax-level3.owl#right"][0]["value"].toUpperCase()
                                   //position: { x: 3, y: 3 }
                                }
                            }],                    
                            edges: [
                            {
                                // left to right without controller
                                data: {
                                    id: guidGenerator(),
                                    source: items[object]["http://www.biopax.org/release/biopax-level3.owl#left"][i]["value"].toUpperCase(), // left
                                    target: items[object]["http://www.biopax.org/release/biopax-level3.owl#right"][0]["value"].toUpperCase() // right
                                }  
                            }]
                        });
                    }
                }
            }
        }
    }
    if(isEmpty(catalysers) === false){
        for (var catalyser in catalysers){
            uniqEdge.push({controller: catalysers[catalyser]});
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
        // Strange fix
        var fix = toUniq[i]["controller"].toString().startsWith("function");
        // Check if not redundant
        if( $.inArray(toUniq[i]["controller"], controller) === -1 && fix === false){
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
        if (list[i]["controller"].toUpperCase() === obj["controller"].toUpperCase() 
                && list[i]["controlled"].toUpperCase() === obj["controlled"].toUpperCase()) {
            return true;
        }
    }
    return false;
};

/**
 * Manage check gene in checkbox 
 * @param {string} classType 
 * @returns {Array|updateList.allVals}
 */
function updateList(classType) {
    var allVals = [];
    var className = '#input-next-'+classType+' :checked';
    $(className).each(function() {
        if( $(this).context["disabled"] == false){
            allVals.push($(this).val());
            $(this).attr('disabled', true);
        }
    });
    return allVals;
};

/**
 * Empty object
 * @param {type} myObject
 * @returns {Boolean}
 */
function isEmpty(myObject) {
    for(var key in myObject) {
        if (myObject.hasOwnProperty(key)) {
            return false;
        }
    }
    return true;
}

/**
 * 
 * @returns {String}
 */
function guidGenerator() {
    var S4 = function() {
       return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
    };
    return (S4()+S4()+"-"+S4()+"-"+S4()+"-"+S4()+"-"+S4()+S4()+S4());
}
