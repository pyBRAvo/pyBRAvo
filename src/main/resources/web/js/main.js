/** 
 * Controler code for the SyMeTRIC Data API web application
 *
 * author : alban.gaignard@cnrs.fr
 */

// The root URL for the RESTful services
var rootURL = "http://" + window.location.host;
console.log("Connecting to the SyMeTRIC Data API " + rootURL);

var myRouter = Backbone.Router.extend({
    
    container: null,
    homeView: null,
    regulatoryNetwork: null,
    signalingNetwork: null,
    batchReconstruction: null,
    aboutView: null,
    docView: null,
    
    initialize: function() {
        this.container = new ContainerView({ el: $("#mainContainer") });
    },

    routes: {
        "": "home",
        "regulatory-network": "regulatoryRoute",
        "signaling-network": "signalingRoute",
        "batch-reconstruction": "batchRoute",
        "about": "aboutRoute",
        "documentation": "docRoute"
    },

    home: function () {
        if (this.homeView == null) {
            this.homeView = new WelcomeView();
        }

        this.container.myChildView = this.homeView;
        this.container.render();
    },
    
    regulatoryRoute: function () {
        if (this.regulatoryNetwork == null) {
            this.regulatoryNetwork = new RegulatoryView();
        }

        this.container.myChildView = this.regulatoryNetwork;
        this.container.render();
    },

    signalingRoute: function () {
        if (this.signalingNetwork == null) {
            this.signalingNetwork = new SignalingView();
        }

        this.container.myChildView = this.signalingNetwork;
        this.container.render();
    },

    batchRoute: function () {
        if (this.batchReconstruction == null) {
            this.batchReconstruction = new BatchView();
        }

        this.container.myChildView = this.batchReconstruction;
        this.container.render();
    },
    
    aboutRoute: function () {
        if (this.aboutView == null) {
            this.aboutView = new AboutView();
        }

        this.container.myChildView = this.aboutView;
        this.container.render();
    },
    
    docRoute: function () {
        if (this.docView == null) {
            this.docView = new DocView();
        }

        this.container.myChildView = this.docView;
        this.container.render();
    }
});

var ContainerView = Backbone.View.extend({
     myChildView: null,
     
     render: function() {
        this.$el.html(this.myChildView.$el); 
        return this;
    }
});


////////////////////////////////////////////
// Web app views
////////////////////////////////////////////

var WelcomeView = Backbone.View.extend({
//    el: "#mainContainer", //Container div inside which we would be dynamically loading the templates
    initialize: function () {
//        _.bindAll(this, "render");
        console.log('Welcome View Initialized');
        this.render();
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

//*************************************
//*************************************
//*************************************

$(document).ready(function () {
    router = new myRouter();
    Backbone.history.start();
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

function initialCy() {
    var initial = cytoscape({
        container: document.getElementById('cy'), // container to render in
        //boxSelectionEnabled: false,
        //autounselectify: true,
        style: [ // the stylesheet for the graph
            {
                selector: 'node',
                style: {
                    'background-color': '#898484', // grey
                    'width' : 12,
                    'height' : 12,
                    'label': 'data(id)'
                }
            },
            {
                selector: '$node > node', // parent - meta node
                css: {
                    'padding-top': '10px',
                    'padding-left': '10px',
                    'padding-bottom': '10px',
                    'padding-right': '10px',
                    'text-valign': 'top',
                    'text-halign': 'center',
                    'background-color': '#bbb',
                    'background-opacity': 0.3
                }
            },
            {
                selector: 'edge',
                style: {
                    'width': 2,
                    'line-color': '#ccc',
                    'mid-target-arrow-color': '#ccc',
                    'mid-target-arrow-shape': 'triangle',
                    'curve-style': 'bezier'
                }
            }
        ],
        layout: {
            name: 'cola',
            nodeSpacing: 5,
            avoidOverlap: true,
            maxSimulationTime: 4000,
            flow: { axis: 'y'},
            unconstrIter: 10,
            handleDisconnected: true
        }
    });
    return initial;
}