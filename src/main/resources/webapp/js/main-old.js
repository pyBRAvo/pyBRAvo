/** 
 * Controler code for the SyMeTRIC Data API web application
 *
 * author : alban.gaignard@cnrs.fr
 */



////////////////////////////////////////////
// Web app util functions
////////////////////////////////////////////

// TODO to be part of a Util.js file
// Useful functions for array handling
Array.prototype.contains = function(a) {
    return this.indexOf(a) != -1
};
Array.prototype.remove = function(a) {
    if (this.contains(a)) {
        return this.splice(this.indexOf(a), 1)
    }
};

$.support.cors = true;

function alertTimeout(wait) {
    setTimeout(function() {
        $('#footer').children('.alert:last-child').remove();
    }, wait);
}

function infoWarning(message) {
    var html = "<div class=\"alert alert alert-dismissable\"><button type=\"button\" class=\"close\" data-dismiss=\"alert\">&times;</button><strong>Warning!</strong> " + message + "</div>";
    $('#footer').prepend(html);
    alertTimeout(5000);
}
function infoSuccess(message) {
    var html = "<div class=\"alert alert-success alert-dismissable\"><button type=\"button\" class=\"close\" data-dismiss=\"alert\">&times;</button><strong>Success!</strong> " + message + "</div>";
    $('#footer').prepend(html);
    alertTimeout(5000);
}
function infoError(message) {
    var html = "<div class=\"alert alert-danger alert-dismissable\"><button type=\"button\" class=\"close\" data-dismiss=\"alert\">&times;</button><strong>Error!</strong> " + message + "</div>";
    $('#footer').prepend(html);
    alertTimeout(5000);
}

// Utility functions
function htmlEncode(value) {
    //create a in-memory div, set it's inner text(which jQuery automatically encodes)
    //then grab the encoded contents back out.  The div never exists on the page.
    return $('<div/>').text(value).html();
}

function htmlDecode(value) {
    return $('<div/>').html(value).text();
}




////////////////////////////////////////////
// Events handling
////////////////////////////////////////////

$('#myTabs a').click(function (e) {
  e.preventDefault()
  $(this).tab('show')
})


$('#btnStartUploads').click(function() {
    $('#btnStartUploads').button('loading');
});

$('#btnReset').click(function() {
    reset();
});

$('#btnLoad').click(function() {
    load($('#txtLoad').val());
});

$('#btnQuery').click(function() {
    var jsonResults = sparql($('#epidQueryTextArea').val());
});

$('input[name="inlineRadioOptions"]').on('change', function(e) {
    // var path = $('#Data_Select option:selected').html();
    var r = $(this).val();
    var contextData = { year : $('#selectYear').val(), label : $('#searchLabel').val()};
    var tpl = ( $('#radioTableRes').prop("checked") ? epidemioQueries[0] : epidemioQueries[1] );
    var q = processHbTemplate(tpl,contextData);
    $('#epidQueryTextArea').val(q);
});

$('#selectYear').on('change', function(e) {
    var y = $(this).val();
    var contextData = { year : y, label : $('#searchLabel').val()};
    var tpl = ( $('#radioTableRes').prop("checked") ? epidemioQueries[0] : epidemioQueries[1] );
    var q = processHbTemplate(tpl,contextData);
    $('#epidQueryTextArea').val(q);
});

$('#searchLabel').on('change', function(e) {
    var l = $(this).val();
    var contextData = { year : $('#selectYear').val(), label : l};
    var tpl = ( $('#radioTableRes').prop("checked") ? epidemioQueries[0] : epidemioQueries[1] );
    var q = processHbTemplate(tpl,contextData);
    $('#epidQueryTextArea').val(q);
});


$('#btnQueryFed').click(function() {
    sparqlFed($('#sparqlFedTextArea').val());
});

$('#btnDataSource').click(function() {
    addDataSource($('#txtDataSource').val());
});

$('#VOIDSparql_Select').on('change', function(e) {
    var query = statVOID[$(this).val()];
    //console.log(query);
    $('#sparqlTextArea').val(query);
});

$('#checkTPGrouping').on('change', function(e) {
    resetDQP();
    if ($('#checkTPGrouping').prop('checked')) {
        $('#txtSlice').attr("disabled", false);
    } else {
        $('#txtSlice').attr("disabled", true);
    }
});

$('#txtSlice').on('change', function(e) {
    resetDQP();
});

$('#FedSparql_Select').on('change', function(e) {
    var query = fedQueries[$(this).val()];
    //console.log(query);
    $('#sparqlFedTextArea').val(query);
});

$('#DataSource_Select').on('change', function(e) {
    var endpoint = $('#DataSource_Select option:selected').html();
    $('#txtDataSource').val(endpoint);
});

$('#Data_Select').on('change', function(e) {
    // var path = $('#Data_Select option:selected').html();
    var path = remoteFilePaths[$(this).val()];
    $('#txtLoad').val(path);
});

$('#tbDataSources').on("click", "#testBtn", function(e) {
    var row = $(this).closest("tr");
    var endpoint = row.children(":first").html(); // table row ID 
    testEndpoint(endpoint, row.index());
});

$('#tbDataSources').on("click", "#delBtn", function(e) {
    var endpointUrl = $(this).closest("tr").children(":first").html(); // table row ID 
    validDataSources.remove(endpointUrl);
    console.log(validDataSources);
    $(this).parent().parent().remove();
    resetDQP();
});

////////////////////////////////////////////
// Web app initialization
////////////////////////////////////////////

// The root URL for the RESTful services
var rootURL = "http://" + window.location.host;
console.log("Connecting to the SyMeTRIC Data API " + rootURL);


// init GUI components
$('#selectYear').val(2007).change();
initQueryAPI();

//$('#sparqlFedTextArea').val(fedQueries[0]);
//$('#txtSlice').attr("disabled", true);

// reset the connected data sources so that when the page is reloaded, the gui is synchronized with the server. 
// resetDQP();


////////////////////////////////
// Communication with the API
////////////////////////////////

// http call to reset the remote knowledge graph
function initQueryAPI() {
    console.log('Initializing the Query API');
    
    $('#btnQuery').attr("disabled", true);
    $("#btnQuery").html("Loading...");
    
    $.ajax({
        type: 'GET',
        url: rootURL + '/query/init',
        dataType: "text",
        success: function(data, textStatus, jqXHR) {
            //infoSuccess('Query API init done');
            $('#btnQuery').attr("disabled", false);
            $("#btnQuery").html("Query");
        },
        error: function(jqXHR, textStatus, errorThrown) {
            infoError('Query API init error: ' + textStatus);
            console.log(errorThrown);
            $('#btnQuery').attr("disabled", false);
            $("#btnQuery").html("Query");
        }
    });
}

// http call to reset the configuration of the federation engine
function resetDQP() {
    console.log('Reset KGRAM-DQP');
    $.ajax({
        type: 'POST',
        url: rootURL + '/dqp/reset',
        dataType: "text",
        success: function(data, textStatus, jqXHR) {
            //infoSuccess('KGRAM-DQP data sources reset.');
            console.log('KGRAM-DQP data sources reset. ' + data);

            configureDQP();
        },
        error: function(jqXHR, textStatus, errorThrown) {
            //infoError('Can\'t reset KGRAM-DQP: ' + textStatus);
            console.log(errorThrown);
        }
    });
}

function configureDQP() {
    console.log("Configuring DQP with " + validDataSources);
    $.each(validDataSources, function(index, item) {
        //jsonDataSources+='{\"endpointUrl\" : \"'+item+'\"},';
        $.ajax({
            type: 'POST',
            url: rootURL + '/dqp/configureDatasources',
            //headers: { 
            //'Accept': 'application/json',
            //	'Content-Type': 'application/json' 
            //},
            data: {'endpointUrl': item},
            //data: jsonDataSources,
            dataType: "text",
            success: function(data, textStatus, jqXHR) {
                console.log(data);
            },
            error: function(jqXHR, textStatus, errorThrown) {
                infoError('Corese/KGRAM error: ' + textStatus);
                console.log(errorThrown);
            }
        });
    });
//	infoSuccess('Configured KGRAM-DQP with '+validDataSources+' endpoints.');
}

function load() {
    $('#btnLoad').attr("disabled", true);
    $("#btnLoad").html("Loading ...");
    console.log('Loading ' + $('#txtLoad').val() + ' to ' + rootURL + ' / ' + $('#graphLoad').val());
    $.ajax({
        type: 'POST',
        url: rootURL + '/sparql/load',
        data: {'remote_path': $('#txtLoad').val(), 'source': $('#graphLoad').val()},
        dataType: "text",
        success: function(data, textStatus, jqXHR) {
            console.log(data);
            infoSuccess("Loading done.");
            $('#btnLoad').attr("disabled", false);
            $("#btnLoad").html("Load");
        },
        error: function(jqXHR, textStatus, errorThrown) {
            infoError('Corese/KGRAM error: ' + textStatus);
            console.log(errorThrown);
            console.log(jqXHR);
            $('#btnLoad').attr("disabled", false);
            $("#btnLoad").html("Load");
        }
    });
}

function sparql(sparqlQuery) {
    $('#btnQuery').attr("disabled", true);
    $("#btnQuery").html("Querying ...");

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
            $("#btnQuery").html("Query");
        }
    });
}


function sparqlFed(sparqlQuery) {
    $('#btnQueryFed').attr("disabled", true);
    $("#btnQueryFed").html("Querying ...");
    $('#tbAdvanced tbody').html("");
    $('#tbResFed thead').html("");
    $('#tbResFed tbody').html("");
    $('#parProvGraph svg').remove();

    console.log('Federated sparql querying ' + sparqlQuery);
    fedURL = '';
    if ($('#checkProv').prop('checked')) {
        fedURL = rootURL + '/dqp/sparqlprov';
    } else {
        fedURL = rootURL + '/dqp/sparql';
    }

    if ($('#checkAdvanced').prop('checked')) {
        pollCost();
    } else {
        $('#parAdvanced').html("");
    }

    var boolTPgrouping = $('#checkTPGrouping').prop('checked');
    if (boolTPgrouping) {
        console.log("Triple pattern grouping enabled");
    } else {
        console.log("Triple pattern grouping disabled");
    }


    $.ajax({
        type: 'GET',
        headers: {
            Accept: "application/sparql-results+json"
        },
        // url: rootURL + '/dqp/sparql',
        url: fedURL,
        data: {'query': sparqlQuery, 'tpgrouping': boolTPgrouping, 'slicing': $('#txtSlice').val()},
        //dataType: "application/sparql-results+json",
        dataType: "json",
        crossDomain: true,
        success: function(data, textStatus, jqXHR) {
//                        console.log(data)
            if ($('#checkProv').prop('checked')) {
                renderListFed(data.mappings);
                renderD3(data, "#parProvGraph");
            } else {
                renderListFed(data);
            }

            $('#btnQueryFed').attr("disabled", false);
            $("#btnQueryFed").html("Query");
        },
        error: function(jqXHR, textStatus, errorThrown) {
            infoError("SPARQL querying failure: " + textStatus);
            $('#tbResFed thead tr').remove();
            $('#tbResFed tbody tr').remove();
            $('#parProvGraph svg').remove();

            console.log(errorThrown);
            console.log(jqXHR.responseText);
            $('#btnQueryFed').attr("disabled", false);
            $("#btnQueryFed").html("Query");
        }
    });
}

function pollCost() {
    $.ajax({
        url: rootURL + '/dqp/getCost',
        type: 'GET',
        dataType: 'json',
        success: function(data) {
            // depending on the data, either call setTimeout or simply don't
//            renderCostOneTab(data);
            renderCostMultiTab(data);
            if ($('#btnQueryFed').is(":disabled")) {
                setTimeout(pollCost, 500);
            }
        },
        error: function(jqXHR, textStatus, errorThrown) {
            console.log(textStatus);
            console.log(jqXHR.responseText);
            console.log(errorThrown);
            infoError(rootURL + '/dqp/getCost' + " does not monitor DQP cost");
        }
    });
}


function addDataSource(endpointURL) {
    if (!validDataSources.contains(endpointURL)) {
        $('#tbDataSources tbody').append("<tr> \n\
                    <td>" + endpointURL + "</td>\n\
                    <td align=right >\n\
                        <button id=\"testBtn\" class=\"btn btn-xs btn-success\" type=button>Test</button> \n\
                        <button id=\"delBtn\" class=\"btn btn-xs btn-danger\" type=button>Delete</button></td> \n\
                    </tr>");
        testEndpoint(endpointURL, $('#tbDataSources tbody tr:last').index());
    }
}

function testEndpoint(endpointURL, rowIndex) {
    console.log("Testing " + endpointURL + " endpoint !");
    $.ajax({
        type: 'POST',
        url: rootURL + '/dqp/testDatasources',
        data: {'endpointUrl': endpointURL},
        dataType: 'json',
        success: function(data, textStatus, jqXHR) {
            console.log(data);
            if (data.test === true) {
                console.log(endpointURL + " responds to SPARQL queries");

                //update the icon of the data source
                $('#tbDataSources tbody tr:eq(' + rowIndex + ') td:eq(1)').html('<button id=\"testBtn\" class=\"btn btn-xs btn-success\" type=button>Test</button> \n\
                            <button id=\"delBtn\" class=\"btn btn-xs btn-danger\" type=button>Delete</button>\n\
                            <i class=\"glyphicon glyphicon-ok\"></i>');
                //update the internal list of data sources
                if (!validDataSources.contains(endpointURL)) {
                    validDataSources.push(endpointURL);
                }
                resetDQP();
            } else {
                console.log(endpointURL + " does NOT respond to SPARQL queries");
            }
        },
        error: function(jqXHR, textStatus, errorThrown) {
            console.log(jqXHR);
            console.log(errorThrown);
            infoError(endpointURL + " does not responds to SPARQL queries");
            //update the icon of the data source
            //$('#tbDataSources tbody tr:eq('+rowIndex+')').append('<td><i class=\"icon-warning-sign\"></i></td>');
            $('#tbDataSources tbody tr:eq(' + rowIndex + ') td:eq(1)').html('<button id=\"testBtn\" class=\"btn btn-xs btn-success\" type=button>Test</button> \n\
                            <button id=\"delBtn\" class=\"btn btn-xs btn-danger\" type=button>Delete</button>\n\
                            <i class=\"glyphicon glyphicon-warning-sign\"></i></td>');
        }
    });
}









////////////////////////////////
// HTML rendering
////////////////////////////////

function renderList(data) {

    // JAX-RS serializes an empty list as null, and a 'collection of one' as an object (not an 'array of one')
    var listVal = data.results.bindings == null ? [] : (data.results.bindings instanceof Array ? data.results.bindings : [data.results.bindings]);
    var listVar = data.head.vars == null ? [] : (data.head.vars instanceof Array ? data.head.vars : [data.head.vars]);

    $('#tbRes thead tr').remove();
    $('#tbRes tbody tr').remove();

    if (data.results.bindings.length > 0) {
        //Rendering the headers
        var tableHeader = '<tr>';
        $.each(listVar, function(index, item) {
            tableHeader = tableHeader + '<th>?' + item + '</th>';
        });
        tableHeader = tableHeader + '</tr>';
        $('#tbRes thead').html(tableHeader);

        //Rendering the values
        $.each(listVal, function(index, item) {
            var row = "<tr>";

            for (var i = 0; i < listVar.length; i++) {
                var v = listVar[i];
                if (item.hasOwnProperty(v)) {
                    row = row + "<td>" + htmlEncode(item[v].value) + "</td>";
                } else {
                    row = row + "<td></td>";
                }
            }

            row = row + "</tr>";
//                $('#tbRes tbody').prepend(row);
            $('#tbRes tbody').append(row);
        });
    }
}

function renderCostMultiTab(data) {
    $('#parAdvanced').html("");

    var table = "<table id=\"tbAdvanced\" class=\"table table-striped\"> \n <tbody>  ";

    var totalQReq = data.totalQueryReq;
    var totalQRes = data.totalQueryRes;
    var totalSrcReq = data.totalSourceReq;
    var totalSrcRes = data.totalSourceRes;

    var listQCost = data.queryCost;
    // number of requests per subqueries


    table = table + "<caption><strong>Requests per subquery</strong></caption> \n";
    $.each(listQCost, function(index, item) {
        console.log(listQCost[index].query);
        console.log(listQCost[index].nbReq);
        console.log(listQCost[index].nbRes);
        var query = listQCost[index].query;
        var v = Math.round(100 * (listQCost[index].nbReq) / totalQReq);
        var p = '<div class="progress"> \n\
                <div class="progress-bar mypopover" role="progressbar" aria-valuenow="' + v + '" aria-valuemin="0" aria-valuemax="' + 100 + '" style="width: ' + v + '%;"> \n\
               <span>' + v + '% of total requests</span> \n\
               </div> \n\
                </div>';
        table = table + "<tr> \n\
                    <td>" + htmlEncode(query) + "</td>\n\
                    <td align=left >\n\
                    " + p + "\n\
                </td></tr> \n";
        //$('#parAdvanced').append(p);
        //console.log(query+' : '+v+'% of total requests');
    });
    table = table + "</tbody></table>";
    $('#parAdvanced').append(table);
    $('#parAdvanced').append("<br>");

    table = "<table id=\"tbAdvanced\" class=\"table table-striped\"> \n <tbody>  ";
    // number of results per subqueries
    table = table + "<caption><strong>Results per subquery</strong></caption> \n";
    $.each(listQCost, function(index, item) {
        //console.log(listQCost[index].query);
        //console.log(listQCost[index].nbReq);
        //console.log(listQCost[index].nbRes);
        var query = listQCost[index].query;
        var v = Math.round(100 * (listQCost[index].nbRes) / totalQRes);
        var p = '<div class="progress"> \n\
                <div class="progress-bar progress-bar-success" role="progressbar" aria-valuenow="' + v + '" aria-valuemin="0" aria-valuemax="' + 100 + '" style="width: ' + v + '%;"> \n\
                <span>' + v + '% of total results</span> \n\
                </div> \n\
            </div>';
        table = table + "<tr> \n\
                    <td>" + htmlEncode(query) + "</td>\n\
                    <td align=left >\n\
                    " + p + "\n\
                </td></tr> \n";
        //$('#parAdvanced').append(p);
        //console.log(query+' : '+v+'% of total results');
    });
    table = table + "</tbody></table>";
    $('#parAdvanced').append(table);
    $('#parAdvanced').append("<br>");
    // $('#parAdvanced').append("<br>");



    var listSrcCost = data.sourceCost;
    table = "<table id=\"tbAdvanced\" class=\"table table-striped\"> \n <tbody>  ";
    // number of requests per source
    table = table + "<caption><strong>Requests per source</strong></caption> \n";
    $.each(listSrcCost, function(index, item) {
        //console.log(listQCost[index].query);
        //console.log(listQCost[index].nbReq);
        //console.log(listQCost[index].nbRes);
        var source = listSrcCost[index].source;
        var v = Math.round(100 * (listSrcCost[index].nbReq) / totalSrcReq);
        var p = '<div class="progress"> \n\
                <div class="progress-bar" role="progressbar" aria-valuenow="' + v + '" aria-valuemin="0" aria-valuemax="' + 100 + '" style="width: ' + v + '%;"> \n\
               <span>' + v + '% of total requests</span> \n\
               </div> \n\
            </div>';
        table = table + "<tr> \n\
                    <td>" + htmlEncode(source) + "</td>\n\
                    <td align=left >\n\
                    " + p + "\n\
                </td></tr> \n";
        //$('#parAdvanced').append(p);
        //console.log(source+' : '+v+'% of total requests');
    });
    table = table + "</tbody></table>";
    $('#parAdvanced').append(table);
    $('#parAdvanced').append("<br>");

    // number of results per source
    table = "<table id=\"tbAdvanced\" class=\"table table-striped\"> \n <tbody>  ";
    table = table + "<caption><strong>Results per source</strong></caption> \n";
    $.each(listSrcCost, function(index, item) {
        //console.log(listQCost[index].query);
        //console.log(listQCost[index].nbReq);
        //console.log(listQCost[index].nbRes);
        var source = listSrcCost[index].source;
        var v = Math.round(100 * (listSrcCost[index].nbRes) / totalSrcRes);
        var p = '<div class="progress"> \n\
                <div class="progress-bar progress-bar-success" role="progressbar" aria-valuenow="' + v + '" aria-valuemin="0" aria-valuemax="' + 100 + '" style="width: ' + v + '%;"> \n\
                <span>' + v + '% of total results</span> \n\
                </div> \n\
            </div>';
        table = table + "<tr> \n\
                    <td>" + htmlEncode(source) + "</td>\n\
                    <td align=left >\n\
                    " + p + "\n\
                </td></tr> \n";
        //$('#parAdvanced').append(p);
        //console.log(source+' : '+v+'% of total results');
    });
    table = table + "</tbody></table>";
    $('#parAdvanced').append(table);
    $('#parAdvanced').append("<br>");
//    $('#tbAdvanced').append(table);
}

function renderD3(data, htmlCompId) {
    var d3Data = data.d3;
    var mappings = data.mappings;
    var sMaps = JSON.stringify(mappings);

    var width = $(htmlCompId).parent().width();
//        var height = $("svg").parent().height();
    var height = 400;
    var color = d3.scale.category20();

    var force = d3.layout.force()
            .charge(-200)
            .linkDistance(50)
//        .friction(.8)
            .size([width, height]);

    var svg = d3.select(htmlCompId).append("svg")
//    	.attr("width", width)
//    	.attr("height", height)
            .attr("viewBox", "0 0 600 400")
            .attr("width", "100%")
            .attr("height", 400)
            .attr("preserveAspectRatio", "xMidYMid")
            .style("background-color", "#F4F2F5");

    force.nodes(d3Data.nodes).links(d3Data.edges).start();

    var link = svg.selectAll(".link")
            .data(d3Data.edges)
            .enter().append("path")
            .attr("d", "M0,-5L10,0L0,5")
            // .enter().append("line")
            .attr("class", "link")
            .style("stroke-width", function(d) {
                if (d.label.indexOf("prov#") !== -1) {
                    return 4;
                }
                return 4;
            })
            .on("mouseout", function(d, i) {
                d3.select(this).style("stroke", " #a0a0a0");
            })
            .on("mouseover", function(d, i) {
                d3.select(this).style("stroke", " #000000");
            });

    link.append("title")
            .text(function(d) {
                return d.label;
            });


    var node_drag = d3.behavior.drag()
            .on("dragstart", dragstart)
            .on("drag", dragmove)
            .on("dragend", dragend);

    function dragstart(d, i) {
        force.stop() // stops the force auto positioning before you start dragging
    }

    function dragmove(d, i) {
        d.px += d3.event.dx;
        d.py += d3.event.dy;
        d.x += d3.event.dx;
        d.y += d3.event.dy;
        tick(); // this is the key to make it work together with updating both px,py,x,y on d !
    }

    function dragend(d, i) {
        d.fixed = true; // of course set the node to fixed so the force doesn't include the node in its auto positioning stuff
        tick();
        force.resume();
    }

    var node = svg.selectAll("g.node")
            .data(d3Data.nodes)
            .enter().append("g")
            .attr("class", "node")
            // .call(force.drag);
            .call(node_drag);

    node.append("title")
            .text(function(d) {
                return d.name;
            });

    node.append("circle")
            .attr("class", "node")
            .attr("r", function(d) {
                if (d.group === 0) {
                    return 6;
                }
                return 12;
            })
            .on("dblclick", function(d) {
                d.fixed = false;
            })
            .on("mouseover", fade(.1)).on("mouseout", fade(1))
            .style("stroke", function(d) {
                return color(d.group);
            })
            .style("stroke-width", 5)
            .style("stroke-width", function(d) {
                if (sMaps.indexOf(d.name) !== -1) {
                    return 8;
                }
                return 3;
            })
            // 	.style("stroke-dasharray",function(d) {
            // if (sMaps.indexOf(d.name) !== -1) {
            //   		return "5,5";
            // }
            // 		return "none";
            // 	})
            // .style("fill", "white")
            .style("fill", function(d) {
                return color(d.group);
            });
    // .on("mouseout", function(d, i) {
    //  	d3.select(this).style("fill", "white");
    // })
    // .on("mouseover", function(d, i) {
    //  	d3.select(this).style("fill", function(d) { return color(d.group); });
    // }) ;

    node.append("svg:text")
            .attr("text-anchor", "middle")
            // .attr("fill","white")
            .style("pointer-events", "none")
            .attr("font-size", "18px")
            .attr("font-weight", "200")
            .text(function(d) {
                var vName = "\"" + d.name.substring(2, d.name.length);
//                console.log(vName);
                if (((sMaps.indexOf(vName) !== -1) || (sMaps.indexOf(d.name) !== -1)) && (d.group !== 0)) {
                    return d.name;
                }
            });


    var linkedByIndex = {};
    d3Data.edges.forEach(function(d) {
        linkedByIndex[d.source.index + "," + d.target.index] = 1;
    });

    function isConnected(a, b) {
        return linkedByIndex[a.index + "," + b.index] || linkedByIndex[b.index + "," + a.index] || a.index === b.index;
    }

    force.on("tick", tick);

    function tick() {
        link.attr("x1", function(d) {
            return d.source.x;
        })
                .attr("y1", function(d) {
                    return d.source.y;
                })
                .attr("x2", function(d) {
                    return d.target.x;
                })
                .attr("y2", function(d) {
                    return d.target.y;
                });

        node.attr("transform", function(d) {
            return "translate(" + d.x + "," + d.y + ")";
        });

        link.attr("d", function(d) {
            var dx = d.target.x - d.source.x,
                    dy = d.target.y - d.source.y,
                    dr = Math.sqrt(dx * dx + dy * dy);

            return "M" + d.source.x + "," + d.source.y + "A" + dr + "," + dr + " 0 0,1 " + d.target.x + "," + d.target.y;
        });
    }
    ;

    function fade(opacity) {
        return function(d) {
            node.style("stroke-opacity", function(o) {
                thisOpacity = isConnected(d, o) ? 1 : opacity;
                this.setAttribute('fill-opacity', thisOpacity);
                return thisOpacity;
            });

            link.style("stroke-opacity", function(o) {
                return o.source === d || o.target === d ? 1 : opacity;
            });
        };
    }
}

function renderListFed(data) {
    // JAX-RS serializes an empty list as null, and a 'collection of one' as an object (not an 'array of one')
    var listVal = data.results.bindings == null ? [] : (data.results.bindings instanceof Array ? data.results.bindings : [data.results.bindings]);
    var listVar = data.head.vars == null ? [] : (data.head.vars instanceof Array ? data.head.vars : [data.head.vars]);

//	$('#tbResFed thead tr').remove();
//	$('#tbResFed tbody tr').remove();

    //Rendering the headers
    var tableHeader = '<tr>';
    $.each(listVar, function(index, item) {
        tableHeader = tableHeader + '<th>?' + item + '</th>';
    });
    tableHeader = tableHeader + '</tr>';
    $('#tbResFed thead').html(tableHeader);

    //Rendering the values
    $.each(listVal, function(index, item) {
        var row = "<tr>";

        for (var i = 0; i < listVar.length; i++) {
            var v = listVar[i];
            if (item.hasOwnProperty(v)) {
                row = row + "<td>" + htmlEncode(item[v].value) + "</td>";
            } else {
                row = row + "<td></td>";
            }
        }

        row = row + "</tr>";
        $('#tbResFed tbody').append(row);
    });
}

// Given a JSON data specifying the value associated to a tag, returns the 
// processed template with (Handlebars.js)
function processHbTemplate(hbTemplate, contextData) {
    var theTemplate = Handlebars.compile(hbTemplate);
    var theCompiledHtml = theTemplate(contextData);
    return theCompiledHtml;
}

