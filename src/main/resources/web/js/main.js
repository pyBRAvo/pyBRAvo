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
    view1: null,
    view2: null,
    view3: null,
    
    initialize: function() {
        this.container = new ContainerView({ el: $("#mainContainer") });
    },

    routes: {
        "": "home",
        "view1": "regulatoryRoute",
        "view2": "signalingRoute",
        "view3": "batchRoute"
    },

    home: function () {
        if (this.homeView == null) {
            this.homeView = new WelcomeView();
        }

        this.container.myChildView = this.homeView;
        this.container.render();
    },
    
    regulatoryRoute: function () {
        if (this.view1 == null) {
            this.view1 = new RegulatoryView();
        }

        this.container.myChildView = this.view1;
        this.container.render();
    },

    signalingRoute: function () {
        if (this.view2 == null) {
            this.view2 = new SignalingView();
        }

        this.container.myChildView = this.view2;
        this.container.render();
    },

    batchRoute: function () {
        if (this.view3 == null) {
            this.view3 = new BatchView();
        }

        this.container.myChildView = this.view3;
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
//var myWelcomeView = new WelcomeView();

//*************************************
//*************************************
//*************************************

$(document).ready(function () {
//
//    $('#demo-ld-menu').click(function () {
//        if (! $("#demo-ld-menu").hasClass("disabled")) {
//            myDemoEpidemioView.render();
//        }
//    });
//
//    $('#demo-wf-menu').click(function () {
//        if (! $("#demo-wf-menu").hasClass("disabled")) {
//            myDemoProvView.render();
//        }
//    });
//
//    $('#demo-sb-menu').click(function () {
//        if (! $("#demo-sb-menu").hasClass("disabled")) {
//            myDemoSysbioView.render();
//        }
//    });
//    
//    $('[data-toggle="tooltip"]').tooltip(); 
//    myWelcomeView.render();
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
