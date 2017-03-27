/** 
 * Systemic API code
 *
 * @author : Marie Lefebvre
 */

/**
 * Initial API to get initial regulatory graphe
 * @param {array} genesList
 * @param {Cytoscape object} cy
 */
function sparqlSysBio(genesList, cy) {
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
            // Listen to dbclick on graph to fit on network
            document.getElementById('cy').addEventListener("dblclick", function resetGraph() {
                cy.fit();
            });
            document.getElementById('toggle').addEventListener("click", function checklist() {
                var checker = $('.toggle').is(':checked');
                $('input:checkbox.next-regulation-checkbox').each(function() {
                    console.log('toto');
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
            checkboxContent(toUniq);
            // Event : check all checkbox
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
    endpointURL = rootURL + '/systemic/network-signaling';
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
            document.getElementById("next-level-signaling").style.display = 'block';
            checkboxContent(toUniq);
            // Listen to dbclick on graph to fit on network
            document.getElementById('cy').addEventListener("dblclick", function resetGraph() {
                cy.fit();
            });
            document.getElementById('toggle').addEventListener("click", function checklist() {
                var checker = $('.toggle').is(':checked');
                $('input:checkbox.next-signaling-checkbox').each(function() {
                    console.log('toto');
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
    endpointURL = rootURL + '/systemic/network-signaling';
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
            // Hide message
            document.getElementById("sendingQuery").style.display = 'none';
            // Get valid JSON format
            var items = JSON.parse(JSON.stringify(data));
            // Load new genes to graphe
            var toUniq = graphContent(cy,items); 
            // Apply layout
            graphLayout(cy, genesList);
            // Add item to checkbox
            checkboxContent(toUniq);
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
};