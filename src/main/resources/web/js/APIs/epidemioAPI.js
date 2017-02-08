/**
 * Epidemio API code
 * 
 * @author : alban.gaignard@cnrs.fr
 */

/**
 * 
 * @param {string} sparqlQuery
 */
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
};

/**
 * Http call to reset the remote knowledge graph
 */
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
};