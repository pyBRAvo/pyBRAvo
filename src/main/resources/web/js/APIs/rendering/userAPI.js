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