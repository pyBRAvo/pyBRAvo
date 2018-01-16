/** 
 * BRAvo view code
 * For batch assembly
 *
 * @author : Marie Lefebvre
 */

var BatchView = Backbone.View.extend({

    initialize: function () {

        this.render();
        console.log('Batch View Initialized');
    },
    render: function () {
        var that = this;
        
        //Fetching the template contents
        $.get('templates/demo-systemic-batch.html', function (data) {
            template = _.template(data, {});//Option to pass any dynamic values to template
            that.$el.html(template());//adding the template content to the main template.
            
        }, 'html');
        return this;
    },
    events: {
        "click #btnRunBatchUp": "runBatchUp"
        
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
    }
});
