/**
 * Communication with the Provenance
 *
 * @author : alban.gaignard@cnrs.fr
 */
 
/**
 * 
 * @param {type} credentials
 */
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

/**
 * 
 * @param {type} credentials
 * @param {type} hid
 * @param {type} title
 * @returns {undefined}
 */
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

/**
 * 
 * @param {type} credentials
 * @param {type} hid
 * @param {type} title
 * @returns {undefined}
 */
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

/**
 * 
 * @param {type} data
 */
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
};

/**
 * 
 * @param {type} data
 * @param {type} title
 * @returns {undefined}
 */
function renderProv(data, title) {
    $('#parProvTriples').html("");
    $('#parProvGraph').html("");
    renderD3(data,"#parProvGraph");
    $('#parProvGraph').append("<p class=\"text-right\"><em>"+title+"</em></p>");
}

/**
 * 
 * @param {type} data
 * @param {type} htmlCompId
 * @returns {undefined}
 */
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

