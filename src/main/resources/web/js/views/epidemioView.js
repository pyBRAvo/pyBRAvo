/**
 * Epidemio view code
 * 
 * @author : alban.gaignard@cnrs.fr
 */

var DemoEpidemioView = Backbone.View.extend({
    el: "#mainContainer", //Container div inside which we would be dynamically loading the templates
    initialize: function () {
        _.bindAll(this, "render");
        console.log('DemoEpidemio View Initialized');

        EventBus.on(EVT_LOADING, this.disableButton);
        EventBus.on(EVT_FINNISHED, this.enableButton);

    },
    render: function () {
        var that = this;
        //Fetching the template contents
        $.get('templates/demo-epidemio.html', function (data) {
            template = _.template(data, {});//Option to pass any dynamic values to template
            that.$el.html(template());//adding the template content to the main template.
            $("#selectYear").val(2007).trigger('change');
            initQueryAPI();
        }, 'html');
        return this;
    },
    events: {
        "click #btnQuery": "queryEvt",
        "change #selectYear": "selectYearEvt",
        "change #searchLabel": "searchLabelEvt",
        "change input[name=\"radioQueryType\"]": "queryTypeEvt"
    },
    queryEvt: function (e) {
        console.log("queryEvt");
//        var jsonResults = sparql($('#epidQueryTextArea').val());
        sparql($('#epidQueryTextArea').val());
    },
    disableButton: function () {
        console.log("disabling button");
        $('#btnQuery').attr("disabled", true);
        $('#btnQuery').html("Loading...");
    },
    enableButton: function () {
        console.log("enabling button");
        $('#btnQuery').attr("disabled", false);
        $('#btnQuery').html("Query");
    },
    selectYearEvt: function (e) {
        console.log("selectYearEvt");
        var y = $(e.currentTarget).val();
        var contextData = {year: y, label: $('#searchLabel').val()};
        var tpl = ($('#radioTableRes').prop("checked") ? epidemioQueries[1] : epidemioQueries[2]);
        var q = processHbTemplate(tpl, contextData);
        $('#epidQueryTextArea').val(q);
    },
    searchLabelEvt: function (e) {
        console.log("searchLabelEvt");
        var l = $(e.currentTarget).val();
        var contextData = {year: $('#selectYear').val(), label: l};
        var tpl = ($('#radioTableRes').prop("checked") ? epidemioQueries[1] : epidemioQueries[2]);
        var q = processHbTemplate(tpl, contextData);
        $('#epidQueryTextArea').val(q);
    },
    queryTypeEvt: function (e) {
        console.log("queryTypeEvt");
        var r = $(e.currentTarget).val();
        console.log(r);
        var contextData = {year: $('#selectYear').val(), label: $('#searchLabel').val()};
        var tpl = ($('#radioTableRes').prop("checked") ? epidemioQueries[1] : epidemioQueries[2]);
        var q = processHbTemplate(tpl, contextData);
        $('#epidQueryTextArea').val(q);
    }
});

var myDemoEpidemioView = new DemoEpidemioView();
