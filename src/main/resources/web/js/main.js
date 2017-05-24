/** 
 * Controler code for the SyMeTRIC Data API web application
 *
 * author : alban.gaignard@cnrs.fr
 */

// The root URL for the RESTful services
var rootURL = "http://" + window.location.host;
console.log("Connecting to the SyMeTRIC Data API " + rootURL);

var EventBus = _.extend({}, Backbone.Events);
var EVT_INIT = 'init';
var EVT_LOGIN = 'login';
var EVT_LOGOUT = 'logout';
var EVT_LOADING = 'loading';
var EVT_FINNISHED = 'finnished';
var EVT_PROV_WORKING = 'prov working';
var EVT_PROV_DONE = 'prov done';


////////////////////////////////////////////
// Web app views
////////////////////////////////////////////

var WelcomeView = Backbone.View.extend({
    el: "#mainContainer", //Container div inside which we would be dynamically loading the templates
    initialize: function () {
        _.bindAll(this, "render");
        console.log('Welcome View Initialized');
    },
    render: function () {
        var that = this;
        //Fetching the template contents
        $.get('templates/home.html', function (data) {
            template = _.template(data, {});//Option to pass any dynamic values to template
            that.$el.html(template());//adding the template content to the main template.
        }, 'html');
        return this;
    }
});
var myWelcomeView = new WelcomeView();

//*************************************
//*************************************
//*************************************

$(document).ready(function () {

    EventBus.trigger(EVT_INIT);

    (function checkSessionValidity() {
        var sid = readCookie("sid");
        console.log("Checking session " + sid + " validity for auto logout.");

        $.ajax({
            url: rootURL + "/sandbox/isactive",
            type: "GET",
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'session-id': sid
            },
            dataType: "text",
            complete: setTimeout(function () {
                checkSessionValidity();
            }, 180000), 
            timeout: 2000,
            success: function (data) {
                if (data.indexOf("true") > -1) {
                    EventBus.trigger(EVT_LOGIN, sid);
                } else {
//                    infoWarning("You have been disconnedted due to inactive session.")
                    EventBus.trigger(EVT_LOGOUT);
                }
            },
            error: function (jqXHR, textStatus, errorThrown) {
                console.log(textStatus);
            }
        })
    })();

    $('#demo-ld-menu').click(function () {
        if (! $("#demo-ld-menu").hasClass("disabled")) {
            myDemoEpidemioView.render();
        }
    });

    $('#demo-wf-menu').click(function () {
        if (! $("#demo-wf-menu").hasClass("disabled")) {
            myDemoProvView.render();
        }
    });

    $('#demo-sb-menu').click(function () {
        if (! $("#demo-sb-menu").hasClass("disabled")) {
            myDemoSysbioView.render();
        }
    });

});


////////////////////////////////////////////
// Web app util functions
////////////////////////////////////////////

EventBus.on(EVT_INIT, function () {
    console.log("EVT_INIT");

    var myLoginMenu = '<li class="dropdown" id="menuLogin"> \n\
                                <a class="dropdown-toggle" href="#" data-toggle="dropdown" id="navLogin">Login</a> \n\
                                <!--<div class="dropdown-menu" style="padding:17px; width: 300px; ">--> \n\
                                <div class="dropdown-menu" style="padding:17px; "> \n\
                                    <div class="container-fluid"> \n\
                                        <form class="form" role="form" id="formLogin"> \n\
                                            <div class="form-group-sm"> \n\
                                                <input name="username" id="emailField" type="text" placeholder="Username" size="30">  \n\
                                            </div> \n\
                                            <br> \n\
                                            <div class="form-group-sm"> \n\
                                                <input name="password" id="passwordField" type="password" placeholder="Password" size="30"><br> \n\
                                            </div> \n\
                                            <br> \n\
                                            <div class="form-group-sm"> \n\
                                                <p class="valign">Don\'t have an account yet ? <a class="waves-effect waves-light" id="registerBtn">register</a></p> \n\
                                                <span id="loginInfo" class="red-text text-darken-2"></span> \n\
                                            </div> \n\
                                            <br> \n\
                                            <div class="form-group-sm"> \n\
                                                <button type="button" id="loginBtn" class="btn btn-sm">Login</button> \n\
                                            </div> \n\
                                        </form> \n\
                                    </div> \n\
                                </div> \n\
                            </li>';

    $('#userMenu').html(myLoginMenu);

    $('#loginInfo').html('');
    $('#emailField').val('');
    $('#passwordField').val('');

    $('#loginBtn').click(function () {
        e = $('#emailField').val();
        p = $('#passwordField').val();
        if ((e.length === 0) || (p.length === 0)) {
            loginInfo("Please fill the login and password fields.");
        } else {
            login(e, p);
        }
    });

    $('#registerBtn').click(function () {
        e = $('#emailField').val();
        p = $('#passwordField').val();
        if ((e.length === 0) || (p.length === 0)) {
            loginInfo("Please fill the login and password fields.");
        } else {
            register(e, p);
        }
    });

    //desactivate the demos
    $("#demo-ld-menu").addClass("disabled");
    $("#demo-sb-menu").addClass("disabled");
    $("#demo-om-menu").addClass("disabled");
    $("#demo-wf-menu").addClass("disabled");

    //render the welcome panel
    myWelcomeView.render();    
});

EventBus.on(EVT_LOGIN, function (sessionId) {
    console.log("EVT_LOGIN");
    if (!sessionId) {
        console.log("DELETING COOKIE !!");
    }
    createCookie("sid", sessionId, 7);


    var myMenu = '<li class="dropdown"> <a href="#" class="dropdown-toggle" data-toggle="dropdown"><span class="glyphicon glyphicon-user"></span></a> \n\
                        <ul class="dropdown-menu"> \n\
                            <li><a href="#!">Profile</a></li> \n\
                            <li class="divider"></li> \n\
                            <li><a id="logoutBtn">Logout</a></li> \n\
                        </ul>\n\
                    </li>';

    $('#userMenu').html(myMenu);

//    $('.dropdown-toggle').dropdown();

    $('#logoutBtn').click(function () {
        logout();
    });

    $('#loginInfo').html('');
    $('#emailField').val('');
    $('#passwordField').val('');

    //activate the demos
    $("#demo-ld-menu").removeClass("disabled");
    $("#demo-sb-menu").removeClass("disabled");
//    $("#demo-om-menu").removeClass("disabled");
    $("#demo-wf-menu").removeClass("disabled");
});

EventBus.on(EVT_LOGOUT, function () {
    console.log("EVT_LOGOUT");
    eraseCookie("sid");

    EventBus.trigger(EVT_INIT);
});

// Useful functions for array handling
Array.prototype.contains = function (a) {
    return this.indexOf(a) != -1
};
Array.prototype.remove = function (a) {
    if (this.contains(a)) {
        return this.splice(this.indexOf(a), 1)
    }
};

$.support.cors = true;

function alertTimeout(wait) {
    setTimeout(function () {
        $('#footer').children('.alert:last-child').remove();
    }, wait);
}

function infoSuccess(message) {
    console.log("INFO" + message);
    Materialize.toast(message, 2000);
}

function infoWarning(message) {
    console.log("WARN" + message);
    Materialize.toast("<i class=\"material-icons\">warning</i> " + message, 2000);
}

function infoError(message) {
    console.log("ERROR" + message);
    Materialize.toast("<i class=\"material-icons\">error_outline</i> " + message, 2000);
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

function createCookie(name, value, days) {
    if (days) {
        var date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        var expires = "; expires=" + date.toGMTString();
    }
    else
        var expires = "";
    document.cookie = name + "=" + value + expires + "; path=/";
}

function readCookie(name) {
    var nameEQ = name + "=";
    var ca = document.cookie.split(';');
    for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ')
            c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) == 0)
            return c.substring(nameEQ.length, c.length);
    }
    return null;
}

function eraseCookie(name) {
    createCookie(name, "", -1);
}

////////////////////////////////
// HTML rendering
////////////////////////////////

function loginInfo(message) {
    $('#loginInfo').text(message);
}
function loginInfoReset() {
    $('#loginInfo').text();
}

//
// TO REMOVE ?
//

//
//function load() {
//    $('#btnLoad').attr("disabled", true);
//    $("#btnLoad").html("Loading ...");
//    console.log('Loading ' + $('#txtLoad').val() + ' to ' + rootURL + ' / ' + $('#graphLoad').val());
//    $.ajax({
//        type: 'POST',
//        url: rootURL + '/sparql/load',
//        data: {'remote_path': $('#txtLoad').val(), 'source': $('#graphLoad').val()},
//        dataType: "text",
//        success: function (data, textStatus, jqXHR) {
//            console.log(data);
//            infoSuccess("Loading done.");
//            $('#btnLoad').attr("disabled", false);
//            $("#btnLoad").html("Load");
//        },
//        error: function (jqXHR, textStatus, errorThrown) {
//            infoError('Corese/KGRAM error: ' + textStatus);
//            console.log(errorThrown);
//            console.log(jqXHR);
//            $('#btnLoad').attr("disabled", false);
//            $("#btnLoad").html("Load");
//        }
//    });
//}
//

//
//function sparqlFed(sparqlQuery) {
//    $('#btnQueryFed').attr("disabled", true);
//    $("#btnQueryFed").html("Querying ...");
//    $('#tbAdvanced tbody').html("");
//    $('#tbResFed thead').html("");
//    $('#tbResFed tbody').html("");
//    $('#parProvGraph svg').remove();
//
//    console.log('Federated sparql querying ' + sparqlQuery);
//    fedURL = '';
//    if ($('#checkProv').prop('checked')) {
//        fedURL = rootURL + '/dqp/sparqlprov';
//    } else {
//        fedURL = rootURL + '/dqp/sparql';
//    }
//
//    if ($('#checkAdvanced').prop('checked')) {
//        pollCost();
//    } else {
//        $('#parAdvanced').html("");
//    }
//
//    var boolTPgrouping = $('#checkTPGrouping').prop('checked');
//    if (boolTPgrouping) {
//        console.log("Triple pattern grouping enabled");
//    } else {
//        console.log("Triple pattern grouping disabled");
//    }
//
//
//    $.ajax({
//        type: 'GET',
//        headers: {
//            Accept: "application/sparql-results+json"
//        },
//        // url: rootURL + '/dqp/sparql',
//        url: fedURL,
//        data: {'query': sparqlQuery, 'tpgrouping': boolTPgrouping, 'slicing': $('#txtSlice').val()},
//        //dataType: "application/sparql-results+json",
//        dataType: "json",
//        crossDomain: true,
//        success: function (data, textStatus, jqXHR) {
////                        console.log(data)
//            if ($('#checkProv').prop('checked')) {
//                renderListFed(data.mappings);
//                renderD3(data, "#parProvGraph");
//            } else {
//                renderListFed(data);
//            }
//
//            $('#btnQueryFed').attr("disabled", false);
//            $("#btnQueryFed").html("Query");
//        },
//        error: function (jqXHR, textStatus, errorThrown) {
//            infoError("SPARQL querying failure: " + textStatus);
//            $('#tbResFed thead tr').remove();
//            $('#tbResFed tbody tr').remove();
//            $('#parProvGraph svg').remove();
//
//            console.log(errorThrown);
//            console.log(jqXHR.responseText);
//            $('#btnQueryFed').attr("disabled", false);
//            $("#btnQueryFed").html("Query");
//        }
//    });
//}

//function pollCost() {
//    $.ajax({
//        url: rootURL + '/dqp/getCost',
//        type: 'GET',
//        dataType: 'json',
//        success: function (data) {
//            // depending on the data, either call setTimeout or simply don't
////            renderCostOneTab(data);
//            renderCostMultiTab(data);
//            if ($('#btnQueryFed').is(":disabled")) {
//                setTimeout(pollCost, 500);
//            }
//        },
//        error: function (jqXHR, textStatus, errorThrown) {
//            console.log(textStatus);
//            console.log(jqXHR.responseText);
//            console.log(errorThrown);
//            infoError(rootURL + '/dqp/getCost' + " does not monitor DQP cost");
//        }
//    });
//}

//
//function addDataSource(endpointURL) {
//    if (!validDataSources.contains(endpointURL)) {
//        $('#tbDataSources tbody').append("<tr> \n\
//                    <td>" + endpointURL + "</td>\n\
//                    <td align=right >\n\
//                        <button id=\"testBtn\" class=\"btn btn-xs btn-success\" type=button>Test</button> \n\
//                        <button id=\"delBtn\" class=\"btn btn-xs btn-danger\" type=button>Delete</button></td> \n\
//                    </tr>");
//        testEndpoint(endpointURL, $('#tbDataSources tbody tr:last').index());
//    }
//}

//function testEndpoint(endpointURL, rowIndex) {
//    console.log("Testing " + endpointURL + " endpoint !");
//    $.ajax({
//        type: 'POST',
//        url: rootURL + '/dqp/testDatasources',
//        data: {'endpointUrl': endpointURL},
//        dataType: 'json',
//        success: function (data, textStatus, jqXHR) {
//            console.log(data);
//            if (data.test === true) {
//                console.log(endpointURL + " responds to SPARQL queries");
//
//                //update the icon of the data source
//                $('#tbDataSources tbody tr:eq(' + rowIndex + ') td:eq(1)').html('<button id=\"testBtn\" class=\"btn btn-xs btn-success\" type=button>Test</button> \n\
//                            <button id=\"delBtn\" class=\"btn btn-xs btn-danger\" type=button>Delete</button>\n\
//                            <i class=\"glyphicon glyphicon-ok\"></i>');
//                //update the internal list of data sources
//                if (!validDataSources.contains(endpointURL)) {
//                    validDataSources.push(endpointURL);
//                }
//                resetDQP();
//            } else {
//                console.log(endpointURL + " does NOT respond to SPARQL queries");
//            }
//        },
//        error: function (jqXHR, textStatus, errorThrown) {
//            console.log(jqXHR);
//            console.log(errorThrown);
//            infoError(endpointURL + " does not responds to SPARQL queries");
//            //update the icon of the data source
//            //$('#tbDataSources tbody tr:eq('+rowIndex+')').append('<td><i class=\"icon-warning-sign\"></i></td>');
//            $('#tbDataSources tbody tr:eq(' + rowIndex + ') td:eq(1)').html('<button id=\"testBtn\" class=\"btn btn-xs btn-success\" type=button>Test</button> \n\
//                            <button id=\"delBtn\" class=\"btn btn-xs btn-danger\" type=button>Delete</button>\n\
//                            <i class=\"glyphicon glyphicon-warning-sign\"></i></td>');
//        }
//    });
//}

//function renderList(data) {
//
//    // JAX-RS serializes an empty list as null, and a 'collection of one' as an object (not an 'array of one')
//    var listVal = data.results.bindings == null ? [] : (data.results.bindings instanceof Array ? data.results.bindings : [data.results.bindings]);
//    var listVar = data.head.vars == null ? [] : (data.head.vars instanceof Array ? data.head.vars : [data.head.vars]);
//
//    $('#tbRes thead tr').remove();
//    $('#tbRes tbody tr').remove();
//
//    if (data.results.bindings.length > 0) {
//        //Rendering the headers
//        var tableHeader = '<tr>';
//        $.each(listVar, function (index, item) {
//            tableHeader = tableHeader + '<th>?' + item + '</th>';
//        });
//        tableHeader = tableHeader + '</tr>';
//        $('#tbRes thead').html(tableHeader);
//
//        //Rendering the values
//        $.each(listVal, function (index, item) {
//            var row = "<tr>";
//
//            for (var i = 0; i < listVar.length; i++) {
//                var v = listVar[i];
//                if (item.hasOwnProperty(v)) {
//                    row = row + "<td>" + htmlEncode(item[v].value) + "</td>";
//                } else {
//                    row = row + "<td></td>";
//                }
//            }
//
//            row = row + "</tr>";
////                $('#tbRes tbody').prepend(row);
//            $('#tbRes tbody').append(row);
//        });
//    }
//}

//function renderCostMultiTab(data) {
//    $('#parAdvanced').html("");
//
//    var table = "<table id=\"tbAdvanced\" class=\"table table-striped\"> \n <tbody>  ";
//
//    var totalQReq = data.totalQueryReq;
//    var totalQRes = data.totalQueryRes;
//    var totalSrcReq = data.totalSourceReq;
//    var totalSrcRes = data.totalSourceRes;
//
//    var listQCost = data.queryCost;
//    // number of requests per subqueries
//
//
//    table = table + "<caption><strong>Requests per subquery</strong></caption> \n";
//    $.each(listQCost, function (index, item) {
//        console.log(listQCost[index].query);
//        console.log(listQCost[index].nbReq);
//        console.log(listQCost[index].nbRes);
//        var query = listQCost[index].query;
//        var v = Math.round(100 * (listQCost[index].nbReq) / totalQReq);
//        var p = '<div class="progress"> \n\
//                <div class="progress-bar mypopover" role="progressbar" aria-valuenow="' + v + '" aria-valuemin="0" aria-valuemax="' + 100 + '" style="width: ' + v + '%;"> \n\
//               <span>' + v + '% of total requests</span> \n\
//               </div> \n\
//                </div>';
//        table = table + "<tr> \n\
//                    <td>" + htmlEncode(query) + "</td>\n\
//                    <td align=left >\n\
//                    " + p + "\n\
//                </td></tr> \n";
//        //$('#parAdvanced').append(p);
//        //console.log(query+' : '+v+'% of total requests');
//    });
//    table = table + "</tbody></table>";
//    $('#parAdvanced').append(table);
//    $('#parAdvanced').append("<br>");
//
//    table = "<table id=\"tbAdvanced\" class=\"table table-striped\"> \n <tbody>  ";
//    // number of results per subqueries
//    table = table + "<caption><strong>Results per subquery</strong></caption> \n";
//    $.each(listQCost, function (index, item) {
//        //console.log(listQCost[index].query);
//        //console.log(listQCost[index].nbReq);
//        //console.log(listQCost[index].nbRes);
//        var query = listQCost[index].query;
//        var v = Math.round(100 * (listQCost[index].nbRes) / totalQRes);
//        var p = '<div class="progress"> \n\
//                <div class="progress-bar progress-bar-success" role="progressbar" aria-valuenow="' + v + '" aria-valuemin="0" aria-valuemax="' + 100 + '" style="width: ' + v + '%;"> \n\
//                <span>' + v + '% of total results</span> \n\
//                </div> \n\
//            </div>';
//        table = table + "<tr> \n\
//                    <td>" + htmlEncode(query) + "</td>\n\
//                    <td align=left >\n\
//                    " + p + "\n\
//                </td></tr> \n";
//        //$('#parAdvanced').append(p);
//        //console.log(query+' : '+v+'% of total results');
//    });
//    table = table + "</tbody></table>";
//    $('#parAdvanced').append(table);
//    $('#parAdvanced').append("<br>");
//    // $('#parAdvanced').append("<br>");
//
//
//
//    var listSrcCost = data.sourceCost;
//    table = "<table id=\"tbAdvanced\" class=\"table table-striped\"> \n <tbody>  ";
//    // number of requests per source
//    table = table + "<caption><strong>Requests per source</strong></caption> \n";
//    $.each(listSrcCost, function (index, item) {
//        //console.log(listQCost[index].query);
//        //console.log(listQCost[index].nbReq);
//        //console.log(listQCost[index].nbRes);
//        var source = listSrcCost[index].source;
//        var v = Math.round(100 * (listSrcCost[index].nbReq) / totalSrcReq);
//        var p = '<div class="progress"> \n\
//                <div class="progress-bar" role="progressbar" aria-valuenow="' + v + '" aria-valuemin="0" aria-valuemax="' + 100 + '" style="width: ' + v + '%;"> \n\
//               <span>' + v + '% of total requests</span> \n\
//               </div> \n\
//            </div>';
//        table = table + "<tr> \n\
//                    <td>" + htmlEncode(source) + "</td>\n\
//                    <td align=left >\n\
//                    " + p + "\n\
//                </td></tr> \n";
//        //$('#parAdvanced').append(p);
//        //console.log(source+' : '+v+'% of total requests');
//    });
//    table = table + "</tbody></table>";
//    $('#parAdvanced').append(table);
//    $('#parAdvanced').append("<br>");
//
//    // number of results per source
//    table = "<table id=\"tbAdvanced\" class=\"table table-striped\"> \n <tbody>  ";
//    table = table + "<caption><strong>Results per source</strong></caption> \n";
//    $.each(listSrcCost, function (index, item) {
//        //console.log(listQCost[index].query);
//        //console.log(listQCost[index].nbReq);
//        //console.log(listQCost[index].nbRes);
//        var source = listSrcCost[index].source;
//        var v = Math.round(100 * (listSrcCost[index].nbRes) / totalSrcRes);
//        var p = '<div class="progress"> \n\
//                <div class="progress-bar progress-bar-success" role="progressbar" aria-valuenow="' + v + '" aria-valuemin="0" aria-valuemax="' + 100 + '" style="width: ' + v + '%;"> \n\
//                <span>' + v + '% of total results</span> \n\
//                </div> \n\
//            </div>';
//        table = table + "<tr> \n\
//                    <td>" + htmlEncode(source) + "</td>\n\
//                    <td align=left >\n\
//                    " + p + "\n\
//                </td></tr> \n";
//        //$('#parAdvanced').append(p);
//        //console.log(source+' : '+v+'% of total results');
//    });
//    table = table + "</tbody></table>";
//    $('#parAdvanced').append(table);
//    $('#parAdvanced').append("<br>");
////    $('#tbAdvanced').append(table);
//}


//function renderListFed(data) {
//    // JAX-RS serializes an empty list as null, and a 'collection of one' as an object (not an 'array of one')
//    var listVal = data.results.bindings == null ? [] : (data.results.bindings instanceof Array ? data.results.bindings : [data.results.bindings]);
//    var listVar = data.head.vars == null ? [] : (data.head.vars instanceof Array ? data.head.vars : [data.head.vars]);
//
////	$('#tbResFed thead tr').remove();
////	$('#tbResFed tbody tr').remove();
//
//    //Rendering the headers
//    var tableHeader = '<tr>';
//    $.each(listVar, function (index, item) {
//        tableHeader = tableHeader + '<th>?' + item + '</th>';
//    });
//    tableHeader = tableHeader + '</tr>';
//    $('#tbResFed thead').html(tableHeader);
//
//    //Rendering the values
//    $.each(listVal, function (index, item) {
//        var row = "<tr>";
//
//        for (var i = 0; i < listVar.length; i++) {
//            var v = listVar[i];
//            if (item.hasOwnProperty(v)) {
//                row = row + "<td>" + htmlEncode(item[v].value) + "</td>";
//            } else {
//                row = row + "<td></td>";
//            }
//        }
//
//        row = row + "</tr>";
//        $('#tbResFed tbody').append(row);
//    });
//}




