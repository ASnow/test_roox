if (typeof Host === 'undefined' && window.location.protocol === 'http:' && (window.location.hostname == '127.0.0.1' || window.location.hostname == 'localhost')) {
    function closeBrowserWindow() {
        location.replace('about:blank'); var w = window.open('about:blank', '_self', ''); w && w.close(); window.close();
    }
    Host = {
        _postAction: function(data) {
            $.ajax({
                type: 'POST',
                dataType: 'json',
                contentType: 'application/json',
                url: '/action',
                data: JSON.stringify(data),
                cache: false,
                processData: false
            });
        },
        processMessageEvent: function(data) {
            Host._postAction({id : 'message', data : data});
        },
        getSessionStorageData: function() {
            return {};
        }
    };
    var es = new EventSource('/events');
    gadgets.util.attachBrowserEvent(es, 'messageEvent', function(event) {
        var data = null;
        try {
            data = JSON.parse(event.data);
            if (data.id == 'com.roox.cm.Common.App.CloseHttpFacadeUrl' && data.data && data.data.url == window.location.pathname) {
                closeBrowserWindow();
                return;
            }
            data.__messageSource = 'Host';
            window.top.postMessage(JSON.stringify(data), '*');
        } catch (err) {
            window.top.postMessage(event.data, '*');
        }
    }, false);
    gadgets.util.attachBrowserEvent(es, 'shutdownEvent', function(event) { closeBrowserWindow(); }, false);
    gadgets.util.attachBrowserEvent(es, 'storageInitEvent', function(event) {
        var data = null;
        try {
            data = JSON.parse(event.data);
        } catch (err) {
            return;
        }
        for (var prop in data) {
            var valueStr = data[prop];
            var value = null;
            try {
                value = JSON.parse(valueStr);
            } catch (err) {
                continue;
            }
            var storage = window.sessionStorage || window.localStorage;
            if (storage) {
                if (value === null) {
                    if (storage.getItem(prop) === null) {
                        continue;
                    }
                    storage.removeItem(prop);
                } else {
                    if (storage.getItem(prop) === valueStr) {
                        continue;
                    }
                    storage.setItem(prop, valueStr);
                }
            }
            var messageData = JSON.stringify({ id: '__storageEvent', key: prop, value: value, __messageSource: 'Host' });
            window.top.postMessage(messageData, '*');
        }
    }, false);
}

gadgets.config.init(containerConfiguration);

var loadWidget, loadWidgets, loadWidgetsDeferred;
$(window).load(function() {

    CommonContainer = new osapi.container.Container({});
    CommonContainer.views.createElementForEmbeddedExperience = function (opt_viewTarget) {
        // ducktyping check for HTMLElement
        if (opt_viewTarget && opt_viewTarget.style) {
            var eeDiv = document.createElement('div');
            document.body.appendChild(eeDiv);
            eeDiv.style.position = 'absolute';
            eeDiv.style['z-index'] = 99;
            eeDiv.style.left = findPositionX(opt_viewTarget) + 'px';
            eeDiv.style['top'] = findPositionY(opt_viewTarget) + 'px';
            eeDiv.style['width'] = opt_viewTarget.style.width;
            eeDiv.style['height'] = opt_viewTarget.style.height;
            //@todo we need listeners for resize events
            return eeDiv;
        }

    };

    CommonContainer.views.destroyElement = function (site) {
        CommonContainer.ee.close(site);
    };
    CommonContainer.rpcRegister("gadget_loaded", function (rpcArgs, data) {
        var metadata = rpcArgs['gs'].getActiveGadgetHolder().getGadgetInfo();
        var iframeId = rpcArgs['gs'].getActiveGadgetHolder().getIframeId();
        gadgets.log('gadget_loaded', rpcArgs['gs'], metadata, data);
        var msg = {};

        if (metadata.views['default'].html) {
            msg['html'] = metadata.views['default'].html;
        }
        if (metadata.views['default'].url) {
            msg['url'] = metadata.views['default'].url;
        }
        if (metadata.views['default'].replacedContent) {
            msg['replacedContent'] = metadata.views['default'].replacedContent;
        }
        gadgets.rpc.call(iframeId, 'setPrefs', function () {

        }, rpcArgs['gs'].getActiveGadgetHolder().renderParams_.userPrefs);

        var params = gadgets.util.getUrlParameters();

        var basePath = "";
        //process relative urls
        var url = rpcArgs['gs'].getActiveGadgetHolder().renderParams_.gadgetUrl;
        var path = url && url.substring(0, url.lastIndexOf('/'));
        if (path !== '.' && path) {
            basePath = path + "/";
        }

        //Compile templates/locales if any and feature exists
        var toPrepend = [];
        var toProcess = [];

        if (metadata.modulePrefs.templates && jQuery && com.rooxteam.templates && com.rooxteam.templates.compile) {
            toPrepend.push(com.rooxteam.templates.compile(jQuery(metadata.modulePrefs.templates), rpcArgs.gs.id_, basePath));
        }

        if (metadata.modulePrefs.locales && jQuery && com.rooxteam.i18n && com.rooxteam.i18n.compile) {
            toPrepend.push(com.rooxteam.i18n.compile(jQuery(metadata.modulePrefs.locales), rpcArgs.gs.id_, basePath));
        }
        //todo copy xml nodes to prevent disapearing http://stackoverflow.com/questions/20059932/javascript-invalid-calling-object-error-with-xml
        try {
            if (metadata.modulePrefs.legacy_locales && metadata.modulePrefs.legacy_locales.length && jQuery && com.rooxteam.i18n.compileLegacyProcessor) {
                toProcess.push(com.rooxteam.i18n.compileLegacyProcessor(metadata.modulePrefs.legacy_locales));
            }
        } catch(e) {
            //ignore error
        }


        function setFinalHtml(msg) {
            "use strict";
            if (toProcess.length) {
                var html = msg['html'];
                while (toProcess.length > 0) {
                    html = (toProcess.shift())(html);
                }
                msg['html'] = html;
            }
            gadgets.rpc.call(iframeId, 'setWidgetInnerHtml', function () {}, msg);
        }
        if (toPrepend.length) {
            $.when.apply(null, toPrepend).done(function(){
                var args = Array.prototype.slice.call(arguments);
                msg['html'] = args.join('') + msg['html'];
                setFinalHtml(msg);
            });
        } else {
            setFinalHtml(msg);
        }
    });

    CommonContainer.rpcRegister("gadget_scripts_loaded", function (rpcArgs, data) {
        var iframeId = rpcArgs['gs'].getActiveGadgetHolder().getIframeId();
        gadgets.rpc.call(iframeId, 'runOnLoadHandlers');
    });

    roox.HtmlMessage = new roox.HtmlMessage();
    CommonContainer.rpcRegister("htmlmessagecreate", roox.HtmlMessage.create);
    CommonContainer.rpcRegister("htmlmessagehide", roox.HtmlMessage.hide);

    var params = gadgets.util.getUrlParameters();
    params['enable_statistic'] = (/(\?|&)enable_statistic($|&)/g).test(location.href);

    function processStaticticInScreens(global){
        //Disable stat for widget screenshots
        if(params['enable_statistic'] === false){
            var old = global.gadgets.config.get('com.rooxteam.statistic');
            old['ENABLED'] = false;
            global.gadgets.config.update({'com.rooxteam.statistic': old}, true);
        }
    }
    function processLanguage(lang){
        "use strict";
        var PROPERTY_LANGUAGE_NAME = 'com.roox.cm.Common.App.Properties.unit.LanguageName';
        var sharedContext = com.rooxteam.sharedcontext.getDataContext();
        sharedContext.putDataSet(PROPERTY_LANGUAGE_NAME, lang);
        if (com.rooxteam.i18n && com.rooxteam.i18n.setLanguage) {
            com.rooxteam.i18n.setLanguage(lang);
        }
    }
    var _loadWidget = function(targetElement, url, prefs) {
        prefs = prefs || {};
        return $.Deferred(function(d){
            var parms = {};
            parms[osapi.container.RenderParam.WIDTH] = '100%';
            parms[osapi.container.RenderParam.USER_PREFS] = prefs;

            if (typeof params['script'] !== "undefined") {
                parms[osapi.container.RenderParam.USER_PREFS]['disableAutoStart'] = true;
            }

            if (typeof params['lang'] !== "undefined") {
                processLanguage(params['lang']);
            }
            parms['gadgetUrl'] = url;
            var site = CommonContainer.newGadgetSite(targetElement);
            CommonContainer.navigateGadget(site, url, {}, parms);

            CommonContainer.rpcRegister("gadget_processed"+site.id_, function(rpcArgs){
                d.resolve(
                    document.getElementById(rpcArgs.gs.currentGadgetHolder_.iframeId_).contentWindow, rpcArgs.gs.id_
                );
                //Disable stat for widget screenshots
                if(typeof params['script'] != "undefined"){
                    processStaticticInScreens(document.getElementById(rpcArgs.gs.currentGadgetHolder_.iframeId_).contentWindow);
                }
            });
        })
    };
    var  _loadWidgetsArray = function(widgetsArray) {
        //widgetsArray = [[targetElement, url, prefs],[targetElement, url, prefs]]
        //return joined promises as promise
        var promises = [];
        for (var i = 0; i < widgetsArray.length; i++) {
            promises.push(_loadWidget.apply(this, widgetsArray[i]));
        }
        return $.when.apply(this, promises);
    };


    loadWidget = function(targetElement, url, prefs) {
        prefs = prefs || {};
        if (typeof params['script'] != "undefined") {
            processStaticticInScreens(window);
            loadWidgetsDeferred = $.getScript(params['script']).then(function(data, textStatus, jqxhr) {
                //We waiting a required function roox.renderScreenshot and optional roox.renderScreenshotView variable
                if(roox.renderScreenshotView) prefs['view'] = roox.renderScreenshotView;
                if(roox.renderScreenshotPrefs) $.extend(prefs, roox.renderScreenshotPrefs);
                prefs['disableAutoStart'] = true;
                return _loadWidget(targetElement, url, prefs).then(roox.renderScreenshot);
            });
            return loadWidgetsDeferred;
        } else {
            loadWidgetsDeferred = _loadWidget(targetElement, url, prefs);
            return loadWidgetsDeferred;
        }
    };
    loadWidgets = function(widgetsArray) {
        if (typeof params['script'] != "undefined") {
            processStaticticInScreens(window);
            //We waiting a required function roox.renderScreenshot
            loadWidgetsDeferred =  $.getScript(params['script']).then(function(data, textStatus, jqxhr) {
                return _loadWidgetsArray(widgetsArray).then(roox.renderScreenshot);
            });
            return loadWidgetsDeferred;
        } else {
            loadWidgetsDeferred =  _loadWidgetsArray(widgetsArray);
            return loadWidgetsDeferred;
        }
    };
});

