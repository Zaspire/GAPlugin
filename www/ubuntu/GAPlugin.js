var exec = require('cordova/exec');

var tid;

var manifest;

function readManifest(cb) {
    if (manifest) {
        cb();
        return;
    }
    var i = 0;
    var uri = '../config.xml';

    function read() {
        var xmlhttp = new XMLHttpRequest();
        xmlhttp.open('GET', uri, true);
        xmlhttp.onreadystatechange = function() {
            if (xmlhttp.readyState === 4){
                if (xmlhttp.responseText) {
                    try {
                        var node = xmlhttp.responseXML.childNodes[0];
                        manifest = {
                            id: node.attributes['id'].nodeValue,
                            name: node.getElementsByTagName('name')[0].childNodes[0].nodeValue,
                            version: node.attributes['version'].nodeValue
                        };
                    } catch (e) {}
                    cb();
                } else {
                    if (i > 5) {
                        manifest = {};
                        cb();
                        return;
                    }
                    i++;
                    uri = '../' + uri;
                    read();
                }
            }
        };

        xmlhttp.send(null);
    }
    read();
}

function json2params(obj) {
    var res = '';
    for (var i in obj) {
        if (res.length)
            res += '&'
        res += i + '=' + encodeURIComponent(obj[i]);
    }

    return res;
}

function logEvent(success, fail, params) {
    if (!tid) {
        if (fail)
            fail();
        return;
    }

    function sendRequest() {
        var p = {
            v: 1,
            tid: tid,
            cid: device.uuid,
            sr: screen.width + 'x' + screen.height, // screen resolution
            vp: window.innerWidth + 'x' + window.innerHeight, // Viewport size
            ul: navigator.language,
            an: manifest.name, // Application Name
            aid: manifest.id, // Application ID
            av: manifest.version //Application Version
        };

        var uri = 'http://www.google-analytics.com/collect';
        var data = json2params(p) + '&' + json2params(params);

        var xmlhttp = new XMLHttpRequest();
        xmlhttp.open('POST', uri, true);
        xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
        xmlhttp.setRequestHeader("Content-length", data.length);
        xmlhttp.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
        xmlhttp.setRequestHeader("Connection", "close");
        xmlhttp.onreadystatechange = function() {
            if (xmlhttp.readyState === 4){
                if (xmlhttp.status == 200) {
                    success();
                } else {
                    if (fail)
                        fail();
                }
            }
        };

        xmlhttp.send(data);
    }

    readManifest(sendRequest);
}

var variables = {};

module.exports = {
    init: function(success, fail, id, period) {
        tid = id;
    },

    trackPage: function(success, fail, pageURL) {
        var params = {
            t: 'screenview',
            cd: pageURL
        };
        logEvent(success, fail, params);
    },

    trackEvent: function(success, fail, category, eventAction, eventLabel, eventValue) {
        var params = {
            t: 'event',
            ec: category,
            ea: eventAction,
            el: eventLabel,
            ev: eventValue
        };
        for (var i in variables) {
            params['cd' + i] = variables[i];
        }
        variables = {};
        logEvent(success, fail, params);
    },

    setVariable: function(success, fail, index, value) {
        variables[index] = value;
    },

    exit: function(success, fail) {
    }
};
