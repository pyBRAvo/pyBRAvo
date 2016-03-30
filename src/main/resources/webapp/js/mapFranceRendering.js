/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

"use strict";

function displayMap(jsonData) {

    $('#mapRow').html('');
    $('#mapRow').append('<div id="map"></div>');

    //if (map != undefined) { map.remove(); }
    var initZoom = 6.5;
    var map = L.map('map').setView([47.5, 1], initZoom);

    // var Esri_WorldGrayCanvas = L.tileLayer('http://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
    // 		attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ',
    // 		maxZoom: 16
    // 	});
    // Esri_WorldGrayCanvas.addTo(map);


//     var OpenStreetMap_France = L.tileLayer('http://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png', {
//     	maxZoom: 19,
//     	attribution: '&copy; Openstreetmap France | &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
//     });

//     OpenStreetMap_France.addTo(map);

//    var cases = [{"code": "44", "nb": "101"},
//        {"code": "85", "nb": "1001"}];

    // var marker = L.marker([51.387, 7.664]).addTo(map);
    // marker.bindPopup("This is Berlin.").openPopup();

    function sumCases(list) {
        var array = list.split(",");
        var sum = 0;
        for (var j = 0; j < array.length; j++) {
            var num = parseInt(array[j]) || 0;
            sum += num;
        }
        return sum;
    }

    function getCaseNb(obj, code) {
        var bindings = jsonData.results.bindings == null ? [] : (jsonData.results.bindings instanceof Array ? jsonData.results.bindings : [jsonData.results.bindings]);
//        var listVar = jsonData.head.vars == null ? [] : (jsonData.head.vars instanceof Array ? jsonData.head.vars : [jsonData.head.vars]);

//        for (var i in bindings) {
        for (var i = 0; i < bindings.length; i++) {
//            console.log(bindings[i].area.value);
            if (bindings[i].area.value) {
                if (bindings[i].area.value == code) {
                    
                    return sumCases(bindings[i].cases.value);
                }
            }
        } // for
        return null;
    } // getCaseNb

    function getInfos(obj, code) {
        var bindings = jsonData.results.bindings == null ? [] : (jsonData.results.bindings instanceof Array ? jsonData.results.bindings : [jsonData.results.bindings]);
//        var listVar = jsonData.head.vars == null ? [] : (jsonData.head.vars instanceof Array ? jsonData.head.vars : [jsonData.head.vars]);

//        for (var i in bindings) {
        for (var i = 0; i < bindings.length; i++) {
//            console.log(bindings[i].area.value);
            if (bindings[i].area.value) {
                if (bindings[i].area.value == code) {
                    var infos = {area: bindings[i].area.value,
                        cases: sumCases(bindings[i].cases.value),
                        icd10: bindings[i].ICD.value,
//                        omimRefs: bindings[i].omimRefs.value};
                        genes: bindings[i].geneIds.value};
                    return infos;
                }
            }
        } // for
        return null;
    } // getCaseNb

    // get color depending on population density value
    function getColor(d) {
        return d > 250 ? '#800026' :
                d > 200 ? '#BD0026' :
                d > 150 ? '#E31A1C' :
                d > 100 ? '#FC4E2A' :
                d > 50 ? '#FD8D3C' :
                d > 10 ? '#FEB24C' :
                d > 5 ? '#FED976' :
                '#FFEDA0';
    }

    function style(feature) {
//         console.log(getCaseNb(cases,feature.properties.code));
//         console.log(feature.properties.code);
        return {
            fillColor: getColor(getCaseNb(jsonData, feature.properties.code)),
            // fillColor: '#E31A1C',
            weight: 2,
            opacity: 1,
            color: 'white',
            dashArray: '2',
            fillOpacity: 0.5
        }
    }

    // L.geoJson(departementsData).addTo(map);

    var geojson;

    // event handling
    function highlightFeature(e) {
        var layer = e.target;

        layer.setStyle({
            weight: 5,
            color: 'white',
            dashArray: '',
            fillOpacity: 0.7
        });

        if (!L.Browser.ie && !L.Browser.opera) {
            layer.bringToFront();
        }

        info.update(layer.feature.properties);
    }

    // event handling
    function resetHighlight(e) {
        geojson.resetStyle(e.target);
        info.update();
    }

    // event handling
    function zoomToFeature(e) {
        map.fitBounds(e.target.getBounds());
    }

    // event handling
    function resetZoom(e) {
        map.setZoom(initZoom);
    }

    // event handling
    function onEachFeature(feature, layer) {
        layer.on({
            mouseover: highlightFeature,
            mouseout: resetHighlight,
            click: zoomToFeature,
            dblclick: resetZoom
        });
    }

    geojson = L.geoJson(departementsData, {style: style, onEachFeature: onEachFeature}).addTo(map);

    //////////////////////////////////////////////////
    // Display more informations 
    var info = L.control();

    info.onAdd = function (map) {
        this._div = L.DomUtil.create('div', 'info'); // create a div with a class "info"
        this.update();
        return this._div;
    };

    // method that we will use to update the control based on feature properties passed
    info.update = function (props) {
        // var nb = getCaseNb(cases,props.code);
        if (!props) {
            this._div.innerHTML = '<h5>Death cases in France, North West area</h5>';
        } else {
            var infos = getInfos(jsonData, props.code);
            //this._div.innerHTML = '<h4>Decease cases in France, North West area</h4>' +
            //        ((props && getCaseNb(jsonData, props.code))
            //                ? '<b>' + props.nom + '(' + props.code + ') </b><br />' + getCaseNb(jsonData, props.code) + ' decease cases'
            //                : '');
            this._div.innerHTML = '<h5>Death cases in France, North West area</h5>' +
                    ((infos)
                            ? '<b>' + props.nom + '(' + props.code + ') </b><br />'
                            + 'Decease cases : ' + infos.cases + '<br />'
                            + ' ICD10 codes : ' + infos.icd10 + '<br />'
                            + 'Genes : ' + infos.genes + '<br />'
                            : '');
        }
    };

    info.addTo(map);

    //////////////////////////////////////////////////
    // Display a legend 
    var legend = L.control({position: 'bottomright'});

    legend.onAdd = function (map) {

        var div = L.DomUtil.create('div', 'info legend'),
                grades = [0, 5, 10, 50, 100, 150, 200, 250],
                labels = [];

        // loop through our density intervals and generate a label with a colored square for each interval
        for (var i = 0; i < grades.length; i++) {
            div.innerHTML +=
                    '<i style="background:' + getColor(grades[i] + 1) + '"></i> ' +
                    grades[i] + (grades[i + 1] ? '&ndash;' + grades[i + 1] + '<br>' : '+');
        }

        return div;
    };

    legend.addTo(map);
}