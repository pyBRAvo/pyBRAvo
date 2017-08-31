/** 
 * Systemic view code
 *
 * @author : Marie Lefebvre
 */

var DemoSysbioView = Backbone.View.extend({
    el: "#mainContainer", //Container div inside which we would be dynamically loading the templates
    initialize: function () {
        _.bindAll(this, "render");
        console.log('DemoSysBio View Initialized');
        EventBus.on(EVT_LOADING, this.disableButton);
        EventBus.on(EVT_FINNISHED, this.enableButton);
    },
    render: function () {
        var that = this;
        
        //Fetching the template contents
        $.get('templates/demo-systemic-home.html', function (data) {
            template = _.template(data, {});//Option to pass any dynamic values to template
            that.$el.html(template());//adding the template content to the main template.
            
        }, 'html');
        return this;
    },
    events: {
        "click #btnSearchRegulatoryNetwork": "querySearchNetwork",
        "click #btnRegulatoryNetwork": "renderRegulatoryNetwork",
        "click #btnSignalingNetwork": "renderSignalingNetwork",
        "click #btnSearchSignalingNetwork": "querySearchSignalingNetwork",
        "click #btnBatchNetwork": "renderBatchNetwork",
        "click #btnRunBatchUp": "runBatchUp",
        "click #query-type": "queryType",
        "click #btnTFs": "queryTFs"
        
    },
    renderRegulatoryNetwork: function () {
        var that = this;
        //Fetching the template contents
        $.get('templates/demo-systemic-regulatory.html', function (data) {
            template = _.template(data, {});//Option to pass any dynamic values to template
            that.$el.html(template());//adding the template content to the main template.
            
        }, 'html');
        return this;
    },
    renderSignalingNetwork: function () {
        var that = this;
        //Fetching the template contents
        $.get('templates/demo-systemic-signaling.html', function (data) {
            template = _.template(data, {});//Option to pass any dynamic values to template
            that.$el.html(template());//adding the template content to the main template.
            
        }, 'html');
        return this;
    },
    renderBatchNetwork: function () {
        var that = this;
        //Fetching the template contents
        $.get('templates/demo-systemic-batch.html', function (data) {
            template = _.template(data, {});//Option to pass any dynamic values to template
            that.$el.html(template());//adding the template content to the main template.
            
        }, 'html');
        return this;
    },
    querySearchNetwork: function () {
        console.log("querySearchNetworkEvt");
        var queryType = $('input[name=query-type]:checked').val();
        // Initialize graphe visualization
        // !!! var cy is a global variable !!!
        if(typeof cy === 'undefined'){
            cy = initialCy();
        }else {
            console.log("reinitialize");
            cy = null;
            cy = initialCy();
        }
        //var cy = initialCy();
        var genesList = $('#inputGeneList').val().replace(/\s/g, '');
        if (genesList !== "") {
            /** 
             * Hide / display messages
             */
            document.getElementById("emptyQuery").style.display = 'none';
            document.getElementById("errorQuery").style.display = 'none';
            document.getElementById("noResult").style.display = 'none';
            document.getElementById("sendingQuery").style.display = 'block';
            document.getElementById("next-level-regulation").style.display = 'none';
            /**
             * Initialize checkbox content
             */
            var container = document.getElementById("input-next-regulation");
            while (container.hasChildNodes()){
                container.removeChild(container.firstChild);
            }
            // Make SPARQL initial query to PathwayCommons endpoint
            sparqlSysBio(genesList, queryType, cy);
            // Listen to event
            $( "#btnRunNextRegulation" ).click(function() {
                // Get gene list
                var regulatorList = updateList("regulation");
                if (regulatorList.length > 0){
                    // Make SPARQL queries to PathwayCommons endpoint
                    nextLevelRegulation(regulatorList, cy);
                }
            });
        }else{
            document.getElementById("emptyQuery").style.display = 'block';
            document.getElementById("errorQuery").style.display = 'none';
            document.getElementById("noResult").style.display = 'none';
        }
    },
    querySearchSignalingNetwork: function () {
        console.log("querySearchSignalingNetworkEvt");
        // Initialize graphe visualization
        // !!! var cy is a global variable !!!
        if(typeof cy === 'undefined'){
            cy = initialCy();
        }else {
            cy = null;
            cy = initialCy();
        }
        var genesList = $('#inputSignalingGeneList').val().replace(/\s/g, '');
        if (genesList !== "") {
            /** 
             * Hide / display messages
             */
            document.getElementById("emptyQuery").style.display = 'none';
            document.getElementById("errorQuery").style.display = 'none';
            document.getElementById("sendingQuery").style.display = 'block';
            document.getElementById("next-level-signaling").style.display = 'none';
            document.getElementById("noResult").style.display = 'none';
            /**
             * Initialize checkbox content
             */
            var container = document.getElementById("input-next-signaling");
            while (container.hasChildNodes()){
                container.removeChild(container.firstChild);
            }
            // Make SPARQL initial query to PathwayCommons endpoint
            //sparqlSignaling(genesList, cy);
            genesList = genesList.split(",");
            if (document.getElementById("btnTFs").value === 'true'){
                sparqlSignaling(genesList, cy);
            }else {
                nextLevelSignaling(genesList, cy, true);                
            }
            // Listen to event
            $( "#btnRunNextSignaling" ).click(function() {
                // Get gene list
                var regulatorList = updateList("signaling");
                if (regulatorList.length > 0){
                    // Make SPARQL queries to PathwayCommons endpoint
                    nextLevelSignaling(regulatorList, cy, false);
                }
            });
        }else{
            document.getElementById("emptyQuery").style.display = 'block';
            document.getElementById("errorQuery").style.display = 'none';
            document.getElementById("noResult").style.display = 'none';
        }
    },       
    /**
    * API to run batch command for upstream
    */
    runBatchUp: function() {
        var genesList = $('#geneList').val().replace(/\s/g, '');
        if (genesList !== "") {
            var queryType = $('input[name=input-type]:checked').val();
            upstreamJob(genesList, queryType);
        }
    },        
    /**
    * Listen to input type
    */
    queryType: function() {

        // When 'id' checked, return 'name'
        if ($('input[name=query-type]:checked').val() !== 'id'){
            $('#inputGeneList').val('ENSG00000158669,HGNC:4135,ENSG00000116133,ENSG00000084774');
        }else {
            $('#inputGeneList').val('AGPAT6,GALT,DHCR24,FTFD1,CAD');
        }
        
    },        
    /**
    * Listen to button 
    * Only TFs for first level of signaling
    */
    queryTFs: function() {

        if ( document.getElementById("btnTFs").className === "btn btn-success btn-sm" ) {
            document.getElementById("btnTFs").className = "btn btn-default btn-sm";
            document.getElementById("btnTFs").value = false;
        }else{
            document.getElementById("btnTFs").className = "btn btn-success btn-sm";
            document.getElementById("btnTFs").value = true;
        };
        
    }
});

var myDemoSysbioView = new DemoSysbioView();

function initialCy() {
    var initial = cytoscape({
        container: document.getElementById('cy'), // container to render in
        //boxSelectionEnabled: false,
        //autounselectify: true,
        style: [ // the stylesheet for the graph
            {
                selector: 'node',
                style: {
                    'background-color': '#898484', // grey
                    'width' : 12,
                    'height' : 12,
                    'label': 'data(id)'
                }
            },
            {
                selector: '$node > node', // parent - meta node
                css: {
                    'padding-top': '10px',
                    'padding-left': '10px',
                    'padding-bottom': '10px',
                    'padding-right': '10px',
                    'text-valign': 'top',
                    'text-halign': 'center',
                    'background-color': '#bbb',
                    'background-opacity': 0.3
                }
            },
            {
                selector: 'edge',
                style: {
                    'width': 2,
                    'line-color': '#ccc',
                    'mid-target-arrow-color': '#ccc',
                    'mid-target-arrow-shape': 'triangle',
                    'curve-style': 'bezier'
                }
            }
        ],
        layout: {
            name: 'cola',
            nodeSpacing: 5,
            avoidOverlap: true,
            maxSimulationTime: 4000,
            flow: { axis: 'y'},
            unconstrIter: 10,
            handleDisconnected: true
        }
    });
    return initial;
}