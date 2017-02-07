var DemoProvView = Backbone.View.extend({
    el: "#mainContainer", //Container div inside which we would be dynamically loading the templates
    initialize: function () {
        _.bindAll(this, "render");
        console.log('Prov demo view initialized');

        EventBus.on(EVT_PROV_WORKING, this.disableButton);
        EventBus.on(EVT_PROV_DONE, this.enableButton);
    },
    render: function () {
        var that = this;
        //Fetching the template contents
        $.get('templates/demo-prov.html', function (data) {
            template = _.template(data, {});//Option to pass any dynamic values to template
            that.$el.html(template());//adding the template content to the main template.
        }, 'html');

        this.displayProvUsage();

        return this;
    },
    events: {
        "click #btnGalaxyHist": "listHistEvt",
        "click .myBtnRDFProv": "genProvEvt",
        "click .myBtnD3Prov": "visProvEvt"
    },
    displayProvUsage: function () {
        console.log("Retrieving PROV demo usage statistics.");

        $.ajax({
            url: rootURL + "/provenance/usage",
            type: "GET",
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            dataType: "json",
            success: function (data) {
                $(function () {
                    // console.log(data);
                    var obj = JSON.parse(data);
                    Highcharts.chart('usageChart', obj);
                });
            },
            error: function (jqXHR, textStatus, errorThrown) {
                console.log(jqXHR);
                console.log(errorThrown);
                console.log("Error while retrieving PROV demo usage statistics");
            }
        });
    },
    disableButton: function () {
        $('.myBtnD3Prov').attr("disabled", true);
        $('.myBtnRDFProv').attr("disabled", true);
    },
    enableButton: function () {
        $('.myBtnD3Prov').attr("disabled", false);
        $('.myBtnRDFProv').attr("disabled", false);
    },
    listHistEvt: function (e) {
        console.log("listHistEvt") ;
        var credentials = {instanceUrl: $('#inputGalaxyUrl').val(), apiKey: $('#inputKey').val()} ;
        //console.log(credentials) ;
        listGalaxyHistories(credentials) ;
    },
    genProvEvt: function (e) {
        EventBus.trigger(EVT_PROV_WORKING);
        var id = $(e.currentTarget).attr("gHistoryId") ;
        var name = $(e.currentTarget).closest('tr').children('td').eq(0).text() ;
        console.log("CLICKED "+id+ " | " +name) ;
        var credentials = {instanceUrl: $('#inputGalaxyUrl').val(), apiKey: $('#inputKey').val()} ;
        getProvTriples(credentials, id, name) ;

    },
    visProvEvt: function (e) {
        EventBus.trigger(EVT_PROV_WORKING);
        var id = $(e.currentTarget).attr("gHistoryId") ;
        var name = $(e.currentTarget).closest('tr').children('td').eq(0).text() ;
        console.log("CLICKED "+id+ " | " +name) ;
        var credentials = {instanceUrl: $('#inputGalaxyUrl').val(), apiKey: $('#inputKey').val()} ;
        getProvVis(credentials, id, name) ;
    }
});

var myDemoProvView = new DemoProvView();
