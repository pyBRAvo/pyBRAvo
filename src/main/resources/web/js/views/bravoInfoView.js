/** 
 * BRAvo view code
 * For batch assembly
 *
 * @author : Marie Lefebvre
 */

var AboutView = Backbone.View.extend({

    initialize: function () {

        this.render();
        console.log('About View Initialized');
    },
    render: function() {
        this.$el.html("Coming soon."); 
        return this;
    }
});

var DocView = Backbone.View.extend({

    initialize: function () {

        this.render();
        console.log('Documentation View Initialized');
    },
    render: function() {
        this.$el.html("Coming soon."); 
        return this;
    }
});
