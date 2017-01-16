// http call to reset the configuration of the federation engine
function resetDQP() {
    console.log('Reset KGRAM-DQP');
    $.ajax({
        type: 'POST',
        url: rootURL + '/dqp/reset',
        dataType: "text",
        success: function (data, textStatus, jqXHR) {
            //infoSuccess('KGRAM-DQP data sources reset.');
            console.log('KGRAM-DQP data sources reset. ' + data);

            configureDQP();
        },
        error: function (jqXHR, textStatus, errorThrown) {
            //infoError('Can\'t reset KGRAM-DQP: ' + textStatus);
            console.log(errorThrown);
        }
    });
}

function configureDQP() {
    console.log("Configuring DQP with " + validDataSources);
    $.each(validDataSources, function (index, item) {
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
            success: function (data, textStatus, jqXHR) {
                console.log(data);
            },
            error: function (jqXHR, textStatus, errorThrown) {
                infoError('Corese/KGRAM error: ' + textStatus);
                console.log(errorThrown);
            }
        });
    });
//	infoSuccess('Configured KGRAM-DQP with '+validDataSources+' endpoints.');
}
