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

function sparql(sparqlQuery) {
    console.log("sending query");
    $('#btnQuery').attr("disabled", true);
    $('#btnQuery').html("Querying ...");

//    var trimedQuery = $.trim(sparqlQuery);
//    var isConstruct = trimedQuery.toLowerCase().lastIndexOf("construct",0) === 0;
//    var isDescribe = trimedQuery.toLowerCase().lastIndexOf("describe",0) === 0;
//    var isSelect = trimedQuery.toLowerCase().lastIndexOf("select",0) === 0;
//    var isInsert = trimedQuery.toLowerCase().lastIndexOf("insert",0) === 0;

    var isConstruct = (sparqlQuery.toLowerCase().indexOf("construct") >= 0) || (sparqlQuery.toLowerCase().indexOf("describe") >= 0);
    //var isConstruct = (sparqlQuery.toLowerCase().indexOf("construct") >= 0);
    var isUpdate = (sparqlQuery.toLowerCase().indexOf("insert") >= 0) || (sparqlQuery.toLowerCase().indexOf("delete") >= 0);


    if (isConstruct) {
        endpointURL = rootURL + '/query/d3';
    } else {
        endpointURL = rootURL + '/query/sparql';
    }
//    console.log('sparql ' + sparqlQuery + ' to ' + endpointURL);

    $.ajax({
        type: 'GET',
        headers: {
            Accept: "application/json"
        },
        url: endpointURL,
        data: {'query': sparqlQuery},
        //dataType: "application/sparql-results+json",
        dataType: "json",
        crossDomain: true,
        success: function (data, textStatus, jqXHR) {
//            console.log(data);
            $('#parRDFGraph svg').remove();
            if (!isConstruct) {
                var keyNb = Object.keys(data.results.bindings[0]).length;
                // If the answer is not empty
                if (keyNb > 0) {
                    renderList(data);
                    displayMap(data);
                } else {
                    $('#tbRes thead tr').remove();
                    $('#tbRes tbody tr').remove();
                    $('#map').remove();
                }
            } else {
                $('#tbRes thead tr').remove();
                $('#tbRes tbody tr').remove();
                $('#map').remove();
                renderD3(data, "#parRDFGraph");
            }

            $('#btnQuery').attr("disabled", false);
            $("#btnQuery").html("Query");
        },
        error: function (jqXHR, textStatus, errorThrown) {
            $('#tbRes thead tr').remove();
            $('#tbRes tbody tr').remove();
            $('#map').remove();

            infoError("SPARQL querying failure: " + errorThrown);
//            console.log(errorThrown);
            console.log(jqXHR.responseText);
            $('#btnQuery').attr("disabled", false);
            $('#btnQuery').html("Query");
        }
    });
}

// http call to reset the remote knowledge graph
function initQueryAPI() {
    console.log('Initializing the Query API');

    EventBus.trigger(EVT_LOADING);

    $.ajax({
        type: 'GET',
        url: rootURL + '/query/init',
        dataType: "text",
        success: function (data, textStatus, jqXHR) {
            EventBus.trigger(EVT_FINNISHED);
        },
        error: function (jqXHR, textStatus, errorThrown) {
            infoError('Query API init error: ' + textStatus);
            console.log(errorThrown);
            EventBus.trigger(EVT_FINNISHED);
        }
    });
}

// Given a JSON data specifying the value associated to a tag, returns the 
// processed template with (Handlebars.js)
function processHbTemplate(hbTemplate, contextData) {
    var theTemplate = Handlebars.compile(hbTemplate);
    var theCompiledHtml = theTemplate(contextData);
    return theCompiledHtml;
}