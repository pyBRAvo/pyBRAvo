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
};