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
        $.get('templates/demo-systemic.html', function (data) {
            template = _.template(data, {});//Option to pass any dynamic values to template
            that.$el.html(template());//adding the template content to the main template.
            
//            var items = JSON.stringify([{ "id" : "http://pathwaycommons.org/pc2/TemplateReactionRegulation_11477356ece4e65812abcacc0bfc5cd9",
//                "properties" : {
//                  "http://www.w3.org/1999/02/22-rdf-syntax-ns#type" : [ "http://www.biopax.org/release/biopax-level3.owl#TemplateReactionRegulation" ] ,
//                  "http://www.biopax.org/release/biopax-level3.owl#controlled" : [ "Transcription of B3GALTL" ] ,
//                  "http://www.biopax.org/release/biopax-level3.owl#controller" : [ "ZHX2" ] ,
//                  "http://www.biopax.org/release/biopax-level3.owl#dataSource" : [ "http://pathwaycommons.org/pc2/transfac" ] ,
//                  "http://www.biopax.org/release/biopax-level3.owl#displayName" : [ "ACTIVATION" ] } },
//
//                { "id" : "http://pathwaycommons.org/pc2/TemplateReactionRegulation_6b09ee1185ca4ae5c2b259c7476f401a",
//                "properties" : {
//                  "http://www.w3.org/1999/02/22-rdf-syntax-ns#type" : [ "http://www.biopax.org/release/biopax-level3.owl#TemplateReactionRegulation" ] ,
//                  "http://www.biopax.org/release/biopax-level3.owl#controlled" : [ "Transcription of B3GALTL" ] ,
//                  "http://www.biopax.org/release/biopax-level3.owl#controller" : [ "CYP26A1" ] ,
//                  "http://www.biopax.org/release/biopax-level3.owl#dataSource" : [ "http://pathwaycommons.org/pc2/transfac" ] ,
//                  "http://www.biopax.org/release/biopax-level3.owl#displayName" : [ "ACTIVATION" ] } }]);
            
            
            var constructQuery = [
                "PREFIX bp: <http://www.biopax.org/release/biopax-level3.owl#>",
                "PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>",
                "CONSTRUCT {",
                    "?tempReac bp:displayName ?type ; bp:controlled ?controlledName ; bp:controller ?controllerName ; bp:dataSource ?source .",
                "}WHERE{",
                    "FILTER( ?classControl IN ( bp:Catalysis, bp:Modulation, bp:TemplateReactionRegulation ) ) .",
                    "FILTER( ( regex(?controlledName, 'GALT', 'i') or regex(?controllerName, 'GALT', 'i') ) and !regex(?source, 'mirtar', 'i') ) .",
                    "?tempReac a ?classControl .",
                    "?tempReac bp:displayName ?reacName ; bp:controlled ?controlled ; bp:controller ?controller ; bp:controlType ?type ; bp:dataSource ?source .",
                    "?controlled bp:displayName ?controlledName .",
                    "?controller bp:displayName ?controllerName .",
                "}"
            ].join(" ");
            // Make SPARQL query to PathwayCommons endpoint
            sparqlSysBio(constructQuery);
            
        }, 'html');
        return this;
    }
});

var myDemoSysbioView = new DemoSysbioView();

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
                checkSessionValidity()
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

////////////////////////////////////////////////////////////////
// Communication with the Provenance
////////////////////////////////////////////////////////////////
function listGalaxyHistories(credentials) {
    $.ajax({
        type: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        url: rootURL + '/provenance/histories',
        data: JSON.stringify(credentials),
        dataType: "json",
        success: function (data, textStatus, jqXHR) {
            var obj = JSON.parse(data);
            //console.log(obj);
            renderGalaxyHistories(obj) ;
        },
        error: function (jqXHR, textStatus, errorThrown) {
            infoError(jqXHR.responseText);
        }
    });
}

function getProvTriples(credentials, hid, title) {
    $('#genProvBtn-'+hid+'[gHistoryId='+hid+']').html("Loading ...");
    $('#genProvBtn-'+hid+'[gHistoryId='+hid+']').attr("disabled", true);
    console.log("disabling btn "+hid);
    $.ajax({
        type: 'POST',
        headers: {
            'Accept': 'text/plain',
            'Content-Type': 'application/json'
        },
        url: rootURL + '/provenance/genProv/'+hid,
        data: JSON.stringify(credentials),
        dataType: "text",
        success: function (data, textStatus, jqXHR) {
            $('#parProvGraph').html("");
            $('#parProvTriples').html("<textarea id=\"codeArea\" rows=\"3\" readonly></textarea>");
            $('#parProvTriples').append("<p class=\"text-right\"><em>"+title+"</em></p>");

            var code = CodeMirror.fromTextArea(document.getElementById("codeArea"), {
                lineNumbers: true,
                readOnly: true,
                mode: "text/turtle"
            });
            code.getDoc().setValue(data);

            $('#genProvBtn-'+hid+'[gHistoryId='+hid+']').html("export PROV");
            $('#genProvBtn-'+hid+'[gHistoryId='+hid+']').attr("disabled", false);
            console.log("enabling btn "+hid);
            EventBus.trigger(EVT_PROV_DONE);
        },
        error: function (jqXHR, textStatus, errorThrown) {
            console.log(jqXHR.responseText);(jqXHR.responseText);
            $('#genProvBtn-'+hid+'[gHistoryId='+hid+']').html("export PROV");
            $('#genProvBtn-'+hid+'[gHistoryId='+hid+']').attr("disabled", false);
            console.log("enabling btn "+hid);
            EventBus.trigger(EVT_PROV_DONE);
        }
    });
}

function getProvVis(credentials, hid, title) {
    $('#visProvBtn-'+hid+'[gHistoryId='+hid+']').html("Loading ...");
    $('#visProvBtn-'+hid+'[gHistoryId='+hid+']').attr("disabled", true);
    console.log("disabling btn "+hid);
    $.ajax({
        type: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        url: rootURL + '/provenance/visProv/'+hid,
        data: JSON.stringify(credentials),
        dataType: "json",
        success: function (data, textStatus, jqXHR) {
            renderProv(data, title);
            $('#visProvBtn-'+hid+'[gHistoryId='+hid+']').html("visualise PROV");
            $('#visProvBtn-'+hid+'[gHistoryId='+hid+']').attr("disabled", false);
            console.log("enabling btn "+hid);
            EventBus.trigger(EVT_PROV_DONE);

        },
        error: function (jqXHR, textStatus, errorThrown) {
            //response = jqXHR.responseText;
            // infoError(jqXHR.responseText);
            console.log(jqXHR.responseText);
            $('#visProvBtn-'+hid+'[gHistoryId='+hid+']').html("visualise PROV");
            $('#visProvBtn-'+hid+'[gHistoryId='+hid+']').attr("disabled", false);
            console.log("enabling btn "+hid);
            EventBus.trigger(EVT_PROV_DONE);
        }
    });
}

////////////////////////////////////////////////////////////////
// Communication with the API
////////////////////////////////////////////////////////////////

function login(email, password) {
    $.ajax({
        type: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        url: rootURL + '/sandbox/login',
        data: JSON.stringify({'email': email, 'password': password}),
        dataType: "text",
        success: function (data, textStatus, jqXHR) {

            EventBus.trigger(EVT_LOGIN, data);

        },
        error: function (jqXHR, textStatus, errorThrown) {
            response = jqXHR.responseText;
//            infoError(jqXHR.responseText);
            if (response.indexOf("unregistered") > -1) {
                loginInfo("Unknown user email, please register first.");
            } else if (response.indexOf("wrong") > -1) {
                loginInfo(("Please check your password."));
            } else {
                infoError(jqXHR.responseText);
            }
        }
    });
}

function register(email, password) {
    $.ajax({
        type: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        url: rootURL + '/sandbox/signin',
        data: JSON.stringify({'email': email, 'password': password}),
        dataType: "text",
        success: function (data, textStatus, jqXHR) {
            EventBus.trigger(EVT_LOGIN, data);
        },
        error: function (jqXHR, textStatus, errorThrown) {
            response = jqXHR.responseText;
//            infoError(jqXHR.responseText);
            if (response.indexOf("exists") > -1) {
                loginInfo("User already exists, please enter another email adress, or ask for password reset.");
            } else {
                infoError(jqXHR.responseText);
            }
        }
    });
}

function logout() {
    var sid = readCookie("sid");
    $.ajax({
        type: 'GET',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'session-id': sid
        },
        url: rootURL + '/sandbox/logout',
        dataType: "text",
        success: function (data, textStatus, jqXHR) {
            EventBus.trigger(EVT_LOGOUT);
        },
        error: function (jqXHR, textStatus, errorThrown) {
            response = jqXHR.responseText;
            infoError(jqXHR.responseText);
            if (response.indexOf("unregistered") > -1) {
                loginInfo("Unknown user email, please register first.");
            } else if (response.indexOf("wrong") > -1) {
                loginInfo(("Please check your password."));
            } else {
                infoError(jqXHR.responseText);
            }
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



function load() {
    $('#btnLoad').attr("disabled", true);
    $("#btnLoad").html("Loading ...");
    console.log('Loading ' + $('#txtLoad').val() + ' to ' + rootURL + ' / ' + $('#graphLoad').val());
    $.ajax({
        type: 'POST',
        url: rootURL + '/sparql/load',
        data: {'remote_path': $('#txtLoad').val(), 'source': $('#graphLoad').val()},
        dataType: "text",
        success: function (data, textStatus, jqXHR) {
            console.log(data);
            infoSuccess("Loading done.");
            $('#btnLoad').attr("disabled", false);
            $("#btnLoad").html("Load");
        },
        error: function (jqXHR, textStatus, errorThrown) {
            infoError('Corese/KGRAM error: ' + textStatus);
            console.log(errorThrown);
            console.log(jqXHR);
            $('#btnLoad').attr("disabled", false);
            $("#btnLoad").html("Load");
        }
    });
}

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
        success: function (data, textStatus, jqXHR) {
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
        error: function (jqXHR, textStatus, errorThrown) {
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

function sparqlSysBio(sparqlQuery) {
    console.log("sending query");
//    $('#btnQuery').attr("disabled", true);
//    $('#btnQuery').html("Querying ...");
    endpointURL = 'http://rdf.pathwaycommons.org/sparql/';

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
        //contentType: 'application/x-www-form-urlencoded; charset=UTF-8',
        crossDomain: true,
        success: function (data, textStatus, jqXHR) {
            // get valid JSON format
            items = JSON.parse(JSON.stringify(data));
            
            // adding cytoscape graphe
            var cy = cytoscape({
                container: document.getElementById('cy'), // container to render in
                
                boxSelectionEnabled: false,
                
                autounselectify: true,
                style: [ // the stylesheet for the graph
                    {
                        selector: 'node',
                        style: {
                            'background-color': '#666',
                            'width' : 10,
                            'height' : 10,
                            'font-size' : 5,
                            'label': 'data(id)'
                        }
                    },

                    {
                        selector: 'edge',
                        style: {
                            'width': 1,
                            'line-color': '#ccc',
                            'target-arrow-color': '#ccc',
                            'target-arrow-shape': 'triangle',
                            'curve-style': 'bezier'
                            //'label': 'data(type)'
                        }
                    }
                ],
                
                zoom: 1,
                //pan: { x: 100, y: 50 },
                fit: true,
                padding: 30,

                layout: {
                    name: 'breadthfirst',
                    directed: true,
                    padding: 10
                }
                
            });
            //console.log(items);
            // Tranform JSON format to Cytoscape JSON format
            var i = 0;
            for (var item in items) {
                var name = item; // URI of interaction
                cy.add([
                    {
                        // Controller/source name
                        data: {
                           id: items[item]["http://www.biopax.org/release/biopax-level3.owl#controller"][0]["value"],
                           position: { x: i, y: 1+i }
                        }
                    },
                    {
                        // Controlled/target name
                        data: {
                           id: items[item]["http://www.biopax.org/release/biopax-level3.owl#controlled"][0]["value"],
                           position: { x: 3, y: 3 }
                        }
                    },                    
                    {
                        // Directed edge
                        data: {
                            id: name,
                            source: items[item]["http://www.biopax.org/release/biopax-level3.owl#controller"][0]["value"], //controller
                            target: items[item]["http://www.biopax.org/release/biopax-level3.owl#controlled"][0]["value"], //controlled
                            type: items[item]["http://www.biopax.org/release/biopax-level3.owl#displayName"][0]["value"]
                        }   
                    }
                ]);
                i++;
            }
                        
            // Add class tu edge of type ACTIVATION
            cy.filter(function(i, element){
                if( element.isEdge() && element.data("type") === 'ACTIVATION' ){
                    element.addClass('classActiv');
                }
            });
            // Color edge of type ACTIVATION
            cy.$('.classActiv').style({ 
                'target-arrow-color' : '#3399ff', 
                'line-color' : '#3399ff' 
            });
            cy.center();
            cy.layout({name:'breadthfirst'});
        },
        error: function (jqXHR, textStatus, errorThrown) {

            infoError("SPARQL querying failure: " + errorThrown);
            console.log(jqXHR.responseText);
        }
    });
}

function pollCost() {
    $.ajax({
        url: rootURL + '/dqp/getCost',
        type: 'GET',
        dataType: 'json',
        success: function (data) {
            // depending on the data, either call setTimeout or simply don't
//            renderCostOneTab(data);
            renderCostMultiTab(data);
            if ($('#btnQueryFed').is(":disabled")) {
                setTimeout(pollCost, 500);
            }
        },
        error: function (jqXHR, textStatus, errorThrown) {
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
        success: function (data, textStatus, jqXHR) {
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
        error: function (jqXHR, textStatus, errorThrown) {
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

function loginInfo(message) {
    $('#loginInfo').text(message);
}
function loginInfoReset() {
    $('#loginInfo').text();
}

function renderGalaxyHistories(data) {
    $('#tableGalaxyHistories thead tr').remove();
    $('#tableGalaxyHistories tbody tr').remove();
    // var table = $('#tableGalaxyHistories').DataTable();
    // table.destroy();

    // $('#tableGalaxyHistories thead').html('<tr> <th>Available Galaxy histories</th> <th>Provenance export</th></tr>');
    $('#tableGalaxyHistories thead').html('<tr> <th></th> <th></th> </tr>');

    if (data.histories.length > 0) {
        $.each(data.histories, function (index, item) {
            //console.log(item);
            var row = "<tr>";
            row = row + "<td>" + htmlEncode(item.label) + "</td>";
            row = row + "<td align=right >\n\
                        <button id=\"genProvBtn-"+item.id+"\" gHistoryId=\""+item.id+"\" class=\"btn btn-xs btn-success myBtnRDFProv\" type=button>export PROV</button> \n\
                        <button id=\"visProvBtn-"+item.id+"\" gHistoryId=\""+item.id+"\" class=\"btn btn-xs btn-info myBtnD3Prov\" type=button>visualise PROV</button></td>" ;
            row = row + "</tr>";

            $('#tableGalaxyHistories tbody').append(row);
        });
    }

    $('#tableGalaxyHistories').DataTable({
        dom:' <"search"f><"top"l>rt<"bottom"ip><"clear">',
        retrieve: true,
        paging: true, 
        reponsive: true,
        ordering:  false
    });
}

function renderProv(data, title) {
    $('#parProvTriples').html("");
    $('#parProvGraph').html("");
    renderD3(data,"#parProvGraph");
    $('#parProvGraph').append("<p class=\"text-right\"><em>"+title+"</em></p>");
}

function renderList(data) {

    // JAX-RS serializes an empty list as null, and a 'collection of one' as an object (not an 'array of one')
    var listVal = data.results.bindings == null ? [] : (data.results.bindings instanceof Array ? data.results.bindings : [data.results.bindings]);
    var listVar = data.head.vars == null ? [] : (data.head.vars instanceof Array ? data.head.vars : [data.head.vars]);

    $('#tbRes thead tr').remove();
    $('#tbRes tbody tr').remove();

    if (data.results.bindings.length > 0) {
        //Rendering the headers
        var tableHeader = '<tr>';
        $.each(listVar, function (index, item) {
            tableHeader = tableHeader + '<th>?' + item + '</th>';
        });
        tableHeader = tableHeader + '</tr>';
        $('#tbRes thead').html(tableHeader);

        //Rendering the values
        $.each(listVal, function (index, item) {
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
    $.each(listQCost, function (index, item) {
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
    $.each(listQCost, function (index, item) {
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
    $.each(listSrcCost, function (index, item) {
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
    $.each(listSrcCost, function (index, item) {
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
            .style("stroke-width", function (d) {
                if (d.label.indexOf("prov#") !== -1) {
                    return 4;
                }
                return 4;
            })
            .on("mouseout", function (d, i) {
                d3.select(this).style("stroke", " #a0a0a0");
            })
            .on("mouseover", function (d, i) {
                d3.select(this).style("stroke", " #000000");
            });

    link.append("title")
            .text(function (d) {
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
            .text(function (d) {
                return d.name;
            });

    node.append("circle")
            .attr("class", "node")
            .attr("r", function (d) {
                if (d.group === 0) {
                    return 6;
                }
                return 12;
            })
            .on("dblclick", function (d) {
                d.fixed = false;
            })
            .on("mouseover", fade(.1)).on("mouseout", fade(1))
            .style("stroke", function (d) {
                return color(d.group);
            })
            .style("stroke-width", 5)
            .style("stroke-width", function (d) {
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
            .style("fill", function (d) {
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
            .text(function (d) {
                var vName = "\"" + d.name.substring(2, d.name.length);
//                console.log(vName);
                if (((sMaps.indexOf(vName) !== -1) || (sMaps.indexOf(d.name) !== -1)) && (d.group !== 0)) {
                    return d.name;
                }
            });


    var linkedByIndex = {};
    d3Data.edges.forEach(function (d) {
        linkedByIndex[d.source.index + "," + d.target.index] = 1;
    });

    function isConnected(a, b) {
        return linkedByIndex[a.index + "," + b.index] || linkedByIndex[b.index + "," + a.index] || a.index === b.index;
    }

    force.on("tick", tick);

    function tick() {
        link.attr("x1", function (d) {
            return d.source.x;
        })
                .attr("y1", function (d) {
                    return d.source.y;
                })
                .attr("x2", function (d) {
                    return d.target.x;
                })
                .attr("y2", function (d) {
                    return d.target.y;
                });

        node.attr("transform", function (d) {
            return "translate(" + d.x + "," + d.y + ")";
        });

        link.attr("d", function (d) {
            var dx = d.target.x - d.source.x,
                    dy = d.target.y - d.source.y,
                    dr = Math.sqrt(dx * dx + dy * dy);

            return "M" + d.source.x + "," + d.source.y + "A" + dr + "," + dr + " 0 0,1 " + d.target.x + "," + d.target.y;
        });
    }
    ;

    function fade(opacity) {
        return function (d) {
            node.style("stroke-opacity", function (o) {
                thisOpacity = isConnected(d, o) ? 1 : opacity;
                this.setAttribute('fill-opacity', thisOpacity);
                return thisOpacity;
            });

            link.style("stroke-opacity", function (o) {
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
    $.each(listVar, function (index, item) {
        tableHeader = tableHeader + '<th>?' + item + '</th>';
    });
    tableHeader = tableHeader + '</tr>';
    $('#tbResFed thead').html(tableHeader);

    //Rendering the values
    $.each(listVal, function (index, item) {
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


