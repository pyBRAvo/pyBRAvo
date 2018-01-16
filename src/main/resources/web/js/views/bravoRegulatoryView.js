/** 
 * BRAvo view code
 * For regulatory assembly
 *
 * @author : Marie Lefebvre
 */

var RegulatoryView = Backbone.View.extend({

    initialize: function () {

        this.render();
        console.log('Regulatory View Initialized');
    },
    render: function () {
        var that = this;
        
        //Fetching the template contents
        $.get('templates/demo-systemic-regulatory.html', function (data) {
            template = _.template(data, {});//Option to pass any dynamic values to template
            that.$el.html(template());//adding the template content to the main template.
            
        }, 'html');
        return this;
    },
    events: {
        "click #btnSearchRegulatoryNetwork": "querySearchNetwork",
        "click #query-type": "queryType",
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
    /**
    * Listen to input type
    */
    queryType: function() {

        // When 'id' checked, return 'name'
        if ($('input[name=query-type]:checked').val() !== 'id'){
            $('#inputGeneList').val('137964,HGNC:4135,HGNC:2859,P27708');
        }else {
            $('#inputGeneList').val('AGPAT6,GALT,DHCR24,FTFD1,CAD');
        }
        
    }
});
