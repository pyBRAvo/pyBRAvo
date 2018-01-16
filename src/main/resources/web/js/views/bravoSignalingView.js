/** 
 * BRAvo View codes
 * For Signaling assembly
 *
 * @author : Marie Lefebvre
 */

var SignalingView = Backbone.View.extend({

    initialize: function () {

        this.render();
        console.log('Signaling View Initialized');
    },
    render: function () {
        var that = this;
        
        //Fetching the template contents
        $.get('templates/demo-systemic-signaling.html', function (data) {
            template = _.template(data, {});//Option to pass any dynamic values to template
            that.$el.html(template());//adding the template content to the main template.
            
        }, 'html');
        return this;
    },
    events: {
        "click #btnSearchSignalingNetwork": "querySearchSignalingNetwork",
        "click #btnTFs": "queryTFs"
        
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
            // Include transcriptional factors
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