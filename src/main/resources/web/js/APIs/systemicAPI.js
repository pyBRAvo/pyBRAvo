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
            // Get valid JSON format
            items = JSON.parse(JSON.stringify(data));  
            // Set content of graph and get list of uniq regulators
            var toUniq = graphContent(cy, items) ;
            // Apply layout on loaded data
            graphLayout(cy, genesList, true);
            /**
             * Hide / show display
             */        
            document.getElementById("sendingQuery").style.display = 'none';
            document.getElementById("noResult").style.display = 'none';
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
                var CSV = [["source","target","\n"]];
                cy.edges().forEach(function( ele ){
                    CSV.push([ele["_private"]["data"]["source"], ele["_private"]["data"]["target"],"\n"]);
                });
                var a = document.getElementById('a');
                // var blob = new Blob([JSON.stringify(graphJson)], {'type':'application/json'});
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
    console.log("send", genesList);
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
            // Hide message
            document.getElementById("sendingQuery").style.display = 'none';
            // Get valid JSON format
            var items = JSON.parse(JSON.stringify(data));
            // Load new genes to graphe
            var toUniq = graphContent(cy,items); 
            // Apply layout
            graphLayout(cy, genesList);
            // Add item to checkbox
            checkboxContent(toUniq, "regulation");
            if ( isEmpty(items) === true ){
                document.getElementById("noResult").style.display = 'block';
                document.getElementById("next-level-regulation").style.display = 'none';
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
    genesList = genesList.split(",");
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
            graphLayout(cy, genesList, true);
            // Hide running query message        
            document.getElementById("sendingQuery").style.display = 'none';
            // Show legend
            document.getElementById("btn-collapse").style.display = 'block';
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
                var CSV = [["source","target","\n"]];
                cy.edges().forEach(function( ele ){
                    CSV.push([ele["_private"]["data"]["source"], ele["_private"]["data"]["target"],"\n"]);
                });
                var a = document.getElementById('a');
                // var blob = new Blob([JSON.stringify(graphJson)], {'type':'application/json'});
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
 * 
 */
function nextLevelSignaling(genesList, cy) {
    var endpointURL = rootURL + '/systemic/network';
    var genesJSON = JSON.stringify(genesList);
    // Show 'query on run' message
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
                success: function (data, textStatus, jqXHR) {
                    // Get valid JSON format
                    var itemsS = JSON.parse(JSON.stringify(data));
                    // Load new genes to graphe
                    var toUniq_regulation = graphContent(cy,itemsR); 
                    // Load new genes to graphe
                    var toUniq_signaling = graphContentSignaling(cy,itemsS);
                    // Apply layout
                    graphLayout(cy, genesList);
                    // Hide message
                    document.getElementById("sendingQuery").style.display = 'none';
                    // Add item to checkbox
                    checkboxContent(toUniq_regulation, "signaling");
                    // Add item to checkbox
                    checkboxContent(toUniq_signaling, "signaling");
                    // Event : check all checkbox
                    document.getElementById('toggle').addEventListener("click", function checklist() {
                        var checker = $('.toggle').is(':checked');
                        // When toggle click, check all
                        $('input:checkbox.next-signaling-checkbox').each(function() {
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
        },
        error: function (jqXHR, textStatus, errorThrown) {
            document.getElementById("errorQuery").style.display = 'block';
            document.getElementById("sendingQuery").style.display = 'none';
            infoError("SPARQL querying failure: " + errorThrown);
            console.log(jqXHR.responseText);
        }
    });
};