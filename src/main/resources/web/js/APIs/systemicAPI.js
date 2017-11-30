/** 
 * Systemic API code
 *
 * @author : Marie Lefebvre
 */

/**
 * Initial API to get initial regulatory graphe
 * @param {array} genesList
 * @param {string} queryType 
 * @param {Cytoscape object} cy
 */
function sparqlSysBio(genesList, queryType, cy) {
    var endpointURL = rootURL + '/systemic/network';
    genesList = genesList.split(",");
    var genesJSON = JSON.stringify(genesList);
    document.getElementById("noResult").style.display = 'none';
    
    $.ajax({
        type: 'GET',
        headers: {
            Accept: "application/json"
        },
        url: endpointURL,
        data: 'genes=' + genesJSON + '&type=' + queryType,
        dataType: "json",
        crossDomain: true,
        success: function (data, textStatus, jqXHR) {
            /**
             * Hide display
             */        
            document.getElementById("sendingQuery").style.display = 'none';
            document.getElementById("noResult").style.display = 'none';
            // Get valid JSON format
            var items = JSON.parse(JSON.stringify(data));  
            // Set content of graph and get list of uniq regulators
            var toUniq = graphContent(cy, items) ;
            // Apply layout on loaded data
            graphLayout(cy, genesList, true);
            /**
             * Show display
             */        
            document.getElementById("graphe-legend").style.display = 'block';
            document.getElementById("next-level-regulation").style.display = 'block';
            // Update checkbox content
            checkboxContent(toUniq, "regulation");
            // Listen to dbclick on graph to fit on network
            document.getElementById('cy').addEventListener("dblclick", function resetGraph() {
                cy.fit();
            });
            if ( isEmpty(items) === true ){
                document.getElementById("noResult").style.display = 'block';
                document.getElementById("next-level-regulation").style.display = 'none';
            }
            // Listen to checkbox option 'All'
            document.getElementById('toggle').addEventListener("click", function checklist() {
                var checker = $('.toggle').is(':checked');
                $('input:checkbox.next-regulation-checkbox').each(function() {
                    $(this).prop('checked',checker);
                });
            }); 
            document.getElementById('btn-download').addEventListener("click", function exportGraph() {
                // var graphJson = cy.json();
                var CSV = [["source","target","controlType","\n"]];
                cy.edges().forEach(function( ele ){
                    CSV.push([ele["_private"]["data"]["source"], ele["_private"]["data"]["target"],ele["_private"]["data"]["type"],"\n"]);
                });
                var a = document.getElementById('a');
                // var blob = new Blob([JSON.stringify(graphJson)], {'type':'application/json'});
                var blob = new Blob(CSV, {'type':'text/csv'});
                a.href = window.URL.createObjectURL(blob);
                a.download = 'graph.csv';
                a.click();
            }); 
            return cy;
        },
        error: function (jqXHR, textStatus, errorThrown) {
            document.getElementById("errorQuery").style.display = 'block';
            document.getElementById("sendingQuery").style.display = 'none';
            infoError("SPARQL querying failure: " + errorThrown);
            console.log(jqXHR.responseText);
        }
    });
}

/**
 * API to add regulation 
 * @param {array} genesList
 * @param {Cytoscape object} cy
 * 
 */
function nextLevelRegulation(genesList, cy) {
    endpointURL = rootURL + '/systemic/network';
    var genesJSON = JSON.stringify(genesList);
    // Show 'query on run' message
    document.getElementById("noResult").style.display = 'none';
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
            // Hide message
            document.getElementById("sendingQuery").style.display = 'none';
            // Get valid JSON format
            var enrichItems = JSON.parse(JSON.stringify(data));
            // Load new genes to graphe
            var toUniq = graphContent(cy,enrichItems); 
            // Apply layout
            graphLayout(cy, genesList);
            // Add item to checkbox
            checkboxContent(toUniq, "regulation");
            if ( isEmpty(enrichItems) === true ){
                document.getElementById("noResult").style.display = 'block';
            }
            // Listen to checkbox option 'All'
            document.getElementById('toggle').addEventListener("click", function checklist() {
                var checker = $('.toggle').is(':checked');
                // When toggle click, check all
                $('input:checkbox.next-regulation-checkbox').each(function() {
                    $(this).prop('checked',checker);
                });
            });
        },
        error: function (jqXHR, textStatus, errorThrown) {
            document.getElementById("errorQuery").style.display = 'block';
            document.getElementById("sendingQuery").style.display = 'none';
            infoError("SPARQL querying failure: " + errorThrown);
            console.log(jqXHR.responseText);
        }
    });
};

/**
 * Initial API to get initial signaling graphe
 * @param {array} genesList
 * @param {Cytoscape object} cy
 */
function sparqlSignaling(genesList, cy) {
    var endpointURL = rootURL + '/systemic/network';
    var genesJSON = JSON.stringify(genesList);
    document.getElementById("noResult").style.display = 'none';
    
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
            /**
             * Hide display
             */        
            document.getElementById("sendingQuery").style.display = 'none';
            document.getElementById("noResult").style.display = 'none';
            // Get valid JSON format
            items = JSON.parse(JSON.stringify(data));            
            // Set content of graph and get list of uniq regulators
            var toUniq = graphContent(cy, items) ;
            // Apply layout on loaded data
            graphLayout(cy, genesList, true);
            /**
             * Show display
             */ 
            document.getElementById("graphe-legend").style.display = 'block';
            document.getElementById("next-level-signaling").style.display = 'block';
            checkboxContent(toUniq, "signaling");
            // Listen to dbclick on graph to fit on network
            document.getElementById('cy').addEventListener("dblclick", function resetGraph() {
                cy.fit();
            });
            document.getElementById("next-level-signaling").style.display = 'block';
            if ( isEmpty(items) === true ){
                document.getElementById("noResult").style.display = 'block';
                document.getElementById("next-level-signaling").style.display = 'none';
            }
            // Listen to checkbox option 'All'
            document.getElementById('toggle').addEventListener("click", function checklist() {
                var checker = $('.toggle').is(':checked');
                $('input:checkbox.next-signaling-checkbox').each(function() {
                    $(this).prop('checked',checker);
                });
            }); 
            document.getElementById('btn-download').addEventListener("click", function exportGraph() {
                // var graphJson = cy.json();
                var CSV = [["source","target","source is","\n"]];
                cy.edges().forEach(function( ele ){
                    var source = cy.getElementById(ele["_private"]["data"]["source"]);
                    var controller = (typeof source.data("type") === 'undefined') ? "": source.data("type");
                    if (controller === "random-node"){controller = "";}
                    CSV.push([ele["_private"]["data"]["source"], ele["_private"]["data"]["target"],controller,"\n"]);
                });
                var a = document.getElementById('a');
                var blob = new Blob(CSV, {'type':'text/csv'});
                a.href = window.URL.createObjectURL(blob);
                a.download = 'graph.csv';
                a.click();
            }); 
        },
        error: function (jqXHR, textStatus, errorThrown) {
            document.getElementById("errorQuery").style.display = 'block';
            document.getElementById("sendingQuery").style.display = 'none';
            infoError("SPARQL query failure: " + errorThrown);
            console.log(jqXHR.responseText);
        }
    });
}

/**
 * API to add signalization 
 * @param {array} genesList
 * @param {Cytoscape object} cy
 * @param {boolean} firststep 
 * 
 */
function nextLevelSignaling(genesList, cy, firststep) {
    var endpointURL = rootURL + '/systemic/network';
    var genesJSON = JSON.stringify(genesList);
    // Show 'query on run' message
    document.getElementById("noResult").style.display = 'none';
    document.getElementById("sendingQuery").style.display = 'block';
    // Request on regulation part
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
            var itemsR = JSON.parse(JSON.stringify(data));
            endpointURL = rootURL + '/systemic/network-signaling';
            // Request on signaling part
            $.ajax({
                type: 'GET',
                headers: {
                    Accept: "application/json"
                },
                url: endpointURL,
                data: 'genes=' + genesJSON,
                dataType: "json",
                crossDomain: true,
                success: function (datas, textStatus, jqXHR) {
                    /**
                    * Hide display
                    */        
                    document.getElementById("sendingQuery").style.display = 'none';
                    document.getElementById("noResult").style.display = 'none';
                    // Get valid JSON format
                    var itemsS = JSON.parse(JSON.stringify(datas));
                    // Load new genes to graphe
                    var toUniq_regulation = graphContent(cy,itemsR); 
                    // Load new genes to graphe
                    var toUniq_signaling = graphContentSignaling(cy,itemsS);
                    // Apply layout
                    graphLayout(cy, genesList, firststep);
                    /**
                    * Show display
                    */
                    document.getElementById("graphe-legend").style.display = 'block';
                    // Add item to checkbox
                    checkboxContent(toUniq_regulation, "signaling");
                    // Add item to checkbox
                    checkboxContent(toUniq_signaling, "signaling");
                    document.getElementById("next-level-signaling").style.display = 'block';
                    if ( isEmpty(itemsS) === true ){
                        document.getElementById("noResult").style.display = 'block';
                    }
                    // Event : check all checkbox
                    document.getElementById('toggle').addEventListener("click", function checklist() {
                        var checker = $('.toggle').is(':checked');
                        // When toggle click, check all
                        $('input:checkbox.next-signaling-checkbox').each(function() {
                            $(this).prop('checked',checker);
                        });
                    });
                    
                    document.getElementById('btn-download').addEventListener("click", function exportGraph() {
                        // var graphJson = cy.json();
                        var CSV = [["source","target","source is","\n"]];
                        cy.edges().forEach(function( ele ){
                            var source = cy.getElementById(ele["_private"]["data"]["source"]);
                            var controller = (typeof source.data("type") === 'undefined') ? "": source.data("type");
                            if (controller === "random-node"){controller = "";}
                            CSV.push([ele["_private"]["data"]["source"], ele["_private"]["data"]["target"],controller,"\n"]);
                        });
                        var a = document.getElementById('a');
                        var blob = new Blob(CSV, {'type':'text/csv'});
                        a.href = window.URL.createObjectURL(blob);
                        a.download = 'graph.csv';
                        a.click();
                    }); 
                },
                error: function (jqXHR, textStatus, errorThrown) {
                    document.getElementById("errorQuery").style.display = 'block';
                    document.getElementById("sendingQuery").style.display = 'none';
                    infoError("SPARQL querying failure: " + errorThrown);
                    console.log(jqXHR.responseText);
                }
            });
        },
        error: function (jqXHR, textStatus, errorThrown) {
            document.getElementById("errorQuery").style.display = 'block';
            document.getElementById("sendingQuery").style.display = 'none';
            infoError("SPARQL querying failure: " + errorThrown);
            console.log(jqXHR.responseText);
        }
    });
};

/**
 * API Run batch algo
 * @param {array} genesList
 * @param {string} queryType
 * 
 */
function upstreamJob(genesList, queryType) {
    checkCytoscape();
    
    var endpointURL = rootURL + '/automatic/upstream';
    // display info
    document.getElementById("auto-sendingQuery").style.display = 'block';
    document.getElementById("auto-noResult").style.display = 'none';
    document.getElementById("panel-download-success").style.display = 'none';
    $("#btnRunBatchUp").text('Running ...');
    $("#btnRunBatchUp").attr("disabled", true);
    // gene list format
    genesList = genesList.split(",");
    var genesJSON = JSON.stringify(genesList);
    // Request on automatic assembly
    $.ajax({
        type: 'POST',
        contentType: 'application/json',
        url: endpointURL,
        data: 'genes=' + genesJSON + '&type=' + queryType,
        crossDomain: true,
        success: function (results, textStatus, jqXHR) {
            var featuresAsJson = JSON.parse(results["json"]);
            document.getElementById("auto-sendingQuery").style.display = 'none';
            if ( isEmpty(featuresAsJson) === true ){
                document.getElementById("auto-noResult").style.display = 'block';
            }else{
                document.getElementById('panel-download-success').style.display = 'block';
                document.getElementById('btn-download-json').addEventListener("click", function exportAsJSON() {
                    var c = document.getElementById('c');
                    var blob = new Blob([results["json"]], {'type': 'application/json'});
                    c.href = window.URL.createObjectURL(blob);
                    c.download = 'graph.json';
//                     b.click();
                });
                document.getElementById('btn-download-rdf').addEventListener("click", function exportAsRDF() {
                    var b = document.getElementById('b');
                    var blob = new Blob([results["rdf"]], {'type':'xml/rdf'});
                    b.href = window.URL.createObjectURL(blob);
                    b.download = 'graph.rdf';
//                    b.click();
                });
                document.getElementById('btn-cytoscape').addEventListener("click", function exportToCytoscape() {
                    var cyJSON = getCytoscapeJSON(featuresAsJson) ;
                    var networkSUID = sendToCytoscape(cyJSON);
                });
            }
            $("#btnRunBatchUp").text('Run');
            $("#btnRunBatchUp").prop("disabled", false);
        },
        error: function (jqXHR, textStatus, errorThrown) {
            document.getElementById("auto-errorQuery").style.display = 'block';
            document.getElementById("auto-sendingQuery").style.display = 'none';
            infoError(" Failure: " + errorThrown);
            console.log(jqXHR.responseText);
            $("#btnRunBatchUp").text('Run');
            $("#btnRunBatchUp").prop("disabled", false);
        }
    });
};
/**
 * Checks if Cytoscape is running, i.e. answering to HTTP GET requests. 
 * If so, the corresponding export button is activated. 
 */
function checkCytoscape() {
    var endpointURL = 'http://localhost:1234/v1';
    $.ajax({
        type: 'GET',
        contentType: 'application/json',
        url: endpointURL,
        crossDomain: true,
        success: function (results, textStatus, jqXHR) {
            console.log("Cytoscape up");
            $("#btn-cytoscape").attr("disabled", false);
        },
        error: function (jqXHR, textStatus, errorThrown) {
            console.log("Cytoscape down");
            $("#btn-cytoscape").attr("disabled", true);
        }
    });
}

/**
 * Send a network to Cytoscape. 
 * @param {JSON} jsonData, the Cytoscape JSON data to be imported into Cytoscape. 
 * @returns {int} the id of the created Cytoscape network, -1 when failed. 
 */
function sendToCytoscape(jsonData) {
    console.log("sending graph to cytoscape");
    var endpointURL = 'http://localhost:1234/v1/networks';
    $.ajax({
        type: 'POST',
        contentType: 'application/json',
        url: endpointURL,
        datatype: 'json',
        data:JSON.stringify(jsonData),
        crossDomain: true,
        success: function (results, textStatus, jqXHR) {
            console.log(results);
            var networkSUID = results["networkSUID"];
            setCytoscapeLayoutAndStyle(networkSUID);
            return networkSUID;
        },
        error: function (jqXHR, textStatus, errorThrown) {
            console.error("Cytoscape data import failed with ");
            console.error(jsonData);
            return -1;
        }
    });
}

/**
 * Set the layout and style of a Cytoscape network
 * @param {int} uid the id of the cytoscape network
 */
function setCytoscapeLayoutAndStyle(uid) {
    var styleURL = 'http://localhost:1234/v1/apply/styles/Directed/'+uid;
    var layoutURL = 'http://localhost:1234/v1/apply/layouts/force-directed-cl/'+uid;
    
    $.ajax({
        type: 'GET',
        contentType: 'application/json',
        url: layoutURL,
        crossDomain: true,
        success: function (results, textStatus, jqXHR) {
            console.log("cytoscape layout");
        },
        error: function (jqXHR, textStatus, errorThrown) {
            console.error("Error while setting the cytoscape layout");
        }
    });
    
    $.ajax({
        type: 'GET',
        contentType: 'application/json',
        url: styleURL,
        crossDomain: true,
        success: function (results, textStatus, jqXHR) {
            console.log("cytoscape style");
        },
        error: function (jqXHR, textStatus, errorThrown) {
            console.error("Error while setting the cytoscape style");
        }
    });
}

/**
 * Transforms an RDF representation of a regulation graph into a Cytoscape JSON representation
 * @param {JSON} inputData the input JSON
 * @returns {getCytoscapeJSON.outputGraph} the transformed JSON data to be sent to Cytoscape
 */
function getCytoscapeJSON(inputData) {
    
    var outputGraph = {
        elements: {
            nodes: [],
            edges: []
        }};

    var uniqEdge = [];
//    var items = JSON.parse(inputData);
    var items = inputData;

    for (var object in items) {
        // Tranform JSON format to Cytoscape JSON format
        var name = object.toString(); // URI of interaction
        //console.log(name)
        // Check if it is a TemplateReactionRegulation
        if (items[object]["http://www.w3.org/1999/02/22-rdf-syntax-ns#type"][0]["value"] === 'http://www.biopax.org/release/biopax-level3.owl#TemplateReactionRegulation') {
            // PC id of controllers of the reaction
            var controllerIds = items[object]["http://www.biopax.org/release/biopax-level3.owl#controller"];
            // PC id of controlled of the reaction
            var controlledId = items[object]["http://www.biopax.org/release/biopax-level3.owl#controlled"][0]["value"];
            for (var i = 0; i < controllerIds.length; i++) {
                // Get information of the controller and controlled
                var controllerId = items[object]["http://www.biopax.org/release/biopax-level3.owl#controller"][i]["value"];
                var controllerName = items[controllerId]["http://www.biopax.org/release/biopax-level3.owl#displayName"][0]["value"];
                var controlledName = items[controlledId]["http://www.biopax.org/release/biopax-level3.owl#displayName"][0]["value"];
                var pair = {
                    controller: controllerName.toUpperCase().replace(' GENE', ''),
                    controlled: controlledName.replace('Transcription of ', '').toUpperCase()
                };
                if (containsObject(pair, uniqEdge) === false) {
                    uniqEdge.push(pair);
                    outputGraph["elements"]["nodes"].push(
                        // Controller/source name
                        {data: {
                            //id: controllerName.toUpperCase().replace(' GENE',''),
                            id: controllerName,
                            category: items[controllerId]["http://www.w3.org/1999/02/22-rdf-syntax-ns#type"][0]["value"], // complex, rna, dna...
                            IDreac: name,
                            provenance: items[controllerId]["http://www.biopax.org/release/biopax-level3.owl#dataSource"][0]["value"]
                            //position: { x: i, y: 1+i }
                        }});
                    outputGraph["elements"]["nodes"].push(
                        // Controlled/target name
                        {data: {
                            //id: controlledName.replace('Transcription of ','').toUpperCase(),
                            id: controlledName,
                            category: items[controlledId]["http://www.w3.org/1999/02/22-rdf-syntax-ns#type"][0]["value"],
                            IDreac: name,
                            provenance: items[object]["http://www.biopax.org/release/biopax-level3.owl#dataSource"][0]["value"]
                            //position: { x: 3, y: 3 }
                        }});
                        outputGraph["elements"]["edges"].push(
                        // Directed edge
                        {data: {
                            id: name,
                            //source: controllerName.toUpperCase().replace(' GENE',''), //controller
                            source: controllerName, //controller
                            //target: controlledName.replace('Transcription of ','').toUpperCase(), // controlled
                            target: controlledName, // controlled
                            type: items[object]["http://www.biopax.org/release/biopax-level3.owl#controlType"][0]["value"] || "type" // activation, inhibition
                        }});
                }
            }
        }
    }
    return outputGraph;
}