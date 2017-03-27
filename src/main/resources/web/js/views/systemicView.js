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
        "click #btnSearchSignalingNetwork": "querySearchSignalingNetwork"
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
    querySearchNetwork: function () {
        console.log("querySearchNetworkEvt");
        // Initialize graphe visualization
        var cy = cytoscape({
            container: document.getElementById('cy'), // container to render in
            boxSelectionEnabled: false,
            autounselectify: true,
            style: [ // the stylesheet for the graph
                {
                    selector: 'node',
                    style: {
                        'background-color': '#666',
                        'width' : 15,
                        'height' : 15,
                        //'font-size' : 10,
                        'label': 'data(id)'
                    }
                },
                {
                    selector: 'edge',
                    style: {
                        'width': 2,
                        'line-color': '#ccc',
                        'target-arrow-color': '#ccc',
                        'target-arrow-shape': 'triangle',
                        'curve-style': 'bezier'
                        //'label': 'data(type)'
                    }
                }
            ],
            zoom: 1,
            layout: {
                name: 'cola',
                directed: true,
                fit: true,
                padding: 50
            }
        });
        var genesList = $('#inputGeneList').val().replace(/\s/g, '');
        if (genesList !== "") {
            // Hide old message
            document.getElementById("emptyQuery").style.display = 'none';
            document.getElementById("errorQuery").style.display = 'none';
            // Display message
            document.getElementById("sendingQuery").style.display = 'block';
            // Make SPARQL initial query to PathwayCommons endpoint
            sparqlSysBio(genesList, cy);
            // Listen to event
            $( "#btnRunNextRegulation" ).click(function() {
                // Get gene list
                var regulatorList = updateList();
                if (regulatorList.length > 0){
                    // Make SPARQL queries to PathwayCommons endpoint
                    nextLevelRegulation(regulatorList, cy);
                }
            });
        }else{
            document.getElementById("emptyQuery").style.display = 'block';
            document.getElementById("errorQuery").style.display = 'none';
        }
    },
    querySearchSignalingNetwork: function () {
        console.log("querySearchSignalingNetworkEvt");
        // Initialize graphe visualization
        var cy = cytoscape({
            container: document.getElementById('cy'), // container to render in
            boxSelectionEnabled: false,
            autounselectify: true,
            style: [ // the stylesheet for the graph
                {
                    selector: 'node',
                    style: {
                        'background-color': '#666',
                        'width' : 12,
                        'height' : 12,
                        'label': 'data(id)'
                    }
                },
                {
                    selector: 'edge',
                    style: {
                        'width': 2,
                        'line-color': '#ccc',
                        'target-arrow-color': '#ccc',
                        'target-arrow-shape': 'triangle',
                        'curve-style': 'bezier'
                        //'label': 'data(type)'
                    }
                }
            ],
            zoom: 1,
            layout: {
                name: 'cola',
                directed: true,
                fit: true,
                padding: 50
            }
        });
        var genesList = $('#inputSignalingGeneList').val().replace(/\s/g, '');
        if (genesList !== "") {
            // Hide old message
            document.getElementById("emptyQuery").style.display = 'none';
            document.getElementById("errorQuery").style.display = 'none';
            // Display message
            document.getElementById("sendingQuery").style.display = 'block';
            // Make SPARQL initial query to PathwayCommons endpoint
            sparqlSignaling(genesList, cy);
            // Listen to event
            $( "#btnRunNextSignaling" ).click(function() {
                // Get gene list
                var regulatorList = updateList();
                if (regulatorList.length > 0){
                    // Make SPARQL queries to PathwayCommons endpoint
                    nextLevelSignaling(regulatorList, cy);
                }
            });
        }else{
            document.getElementById("emptyQuery").style.display = 'block';
            document.getElementById("errorQuery").style.display = 'none';
        }
    }
});

var myDemoSysbioView = new DemoSysbioView();