load("container-configuration.js");
load("container-init.js");
load("container-api.js");
load("container-override.js");
load("container-io-override.js");
load("container-util.js");
load("html_sanitizer_minified.js");

gadgets.config.init(containerConfiguration)

function randomString(length) {
    var chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz'.split('');

    if (! length) {
        length = Math.floor(Math.random() * chars.length);
    }

    var str = '';
    for (var i = 0; i < length; i++) {
        str += chars[Math.floor(Math.random() * chars.length)];
    }
    return str;
}

window.addEventListener('storage', function(event) {
    if (event.key == 'com.roox.cm.Common.App.Properties.unit.MacAddress') {
        window.sessionStorage.setItem('com.rooxteam.widgets.SECURITY_TOKEN', JSON.stringify(randomString(20)));
    }
}, false);
