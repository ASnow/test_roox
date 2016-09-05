osapi.container.Service.prototype.getGadgetMetadata = function(request, opt_callback) {

    var callback = opt_callback || function() {
    };

    var finalResponse = {};
    for (var idx = 0; idx < request.ids.length; idx++) {
        var id = request.ids[idx];


        var params = {};
        params[gadgets.io.RequestParameters.CONTENT_TYPE] = gadgets.io.ContentType.DOM;
        params[gadgets.io.RequestParameters.METHOD] = gadgets.io.MethodType.GET;
        params["isCoreRequest"] = true;

        var basePath = "";
        //process relative urls
        var url = id;
        var path = url && url.substring(0, url.lastIndexOf('/'));
        if (path !== '.' && path) {
            basePath = path + "/";
        }
        function replaceUrl(url) {
            if (/^(https?|file|ftps?|mailto|javascript):/i.test(url) || /^(data:image\/[^;]{2,9};)/.test(url)){
                return url; //Url is already absolute
            }
            return  basePath + url;
        }

        //Bypass dustjs compiled js
        var re = /^\s*<script language="javascript" type="text\/javascript">\s*\(function\(\){dust.register/gi;

        gadgets.io.makeNonProxiedRequest(id, function(response) {
            var xml = response.data || response.text;
            var prefs = xml.getElementsByTagName('ModulePrefs').item(0);
            var contents= xml.getElementsByTagName('Content');
            var defaultView={
                    "preferredHeight":0,
                    "quirks":true,
                    "preferredWidth":0
            };
            for(i=0;i<contents.length;i++){
                var content=contents[i];
                if(content.getAttribute('type')=="html"||content.getAttribute('type')==null){
                    var html=content.text||content.innerText||content.textContent;

                    if (!re.test(html) && basePath) {
                        html = replace_all_rel_by_abs(html, replaceUrl);
                    }

                    defaultView['html']=defaultView['html']||'';
                    defaultView['html']=defaultView['html']+html;
                }
                if(content.getAttribute('type')=="url"){
                    defaultView['url']=content.getAttribute('href');
                }
                if (content.getAttribute('href')) {
                    defaultView['replacedContent'] = content.getAttribute('href');
                }
            }
            gadgets.log(defaultView);
            var metadata = {};

            metadata['modulePrefs'] = {
                "title": prefs.getAttribute('title'),
                "height": prefs.getAttribute('height'),
                "width": prefs.getAttribute('width'),
                "templates": prefs.getElementsByTagName('Templates')[0],
                "locales": prefs.getElementsByTagName('Locales')[0],
                "legacy_locales": prefs.getElementsByTagName('Locale'),
                "data": prefs.getElementsByTagName('Data')[0],
                "features":{
                }

            };

            metadata['views'] = {
                "default":defaultView
            };
            metadata.iframeUrl = 'widget.html?widgetDescriptor=' + id;
            finalResponse[id] = metadata;
            callback(finalResponse);

        }, params);


    }

};


/**
 * Render a gadget in this site, using a JSON gadget description.
 *
 * Note: A view provided in either renderParams or viewParams is subject to aliasing if the gadget
 * does not support the view specified.
 *
 * @param {Object} gadgetInfo the JSON gadget description.
 * @param {Object} viewParams Look at osapi.container.ViewParam.
 * @param {Object} renderParams Look at osapi.container.RenderParam.
 */
osapi.container.GadgetSite.prototype.render = function(gadgetInfo, viewParams, renderParams) {
    var curUrl = this.currentGadgetHolder_ ? this.currentGadgetHolder_.getUrl() : null;

    var previousView = null;
    if (curUrl == gadgetInfo['url']) {
        previousView = (this.currentGadgetHolder_ == null) ? null : this.currentGadgetHolder_.getView();
    }

    // Simple function to find a suitable alias
    var findAliasInfo = function(viewConf) {
        if (typeof viewConf !== 'undefined' && viewConf != null) {
            var aliases = viewConf['aliases'] || [];
            for (var i = 0; i < aliases.length; i++) {
                if (gadgetInfo[osapi.container.MetadataResponse.VIEWS][aliases[i]]) {
                    return {'view':aliases[i],
                        'viewInfo':gadgetInfo[osapi.container.MetadataResponse.VIEWS][aliases[i]]};
                }
            }
        }
        return null;
    };

    // Find requested view.
    var view = renderParams[osapi.container.RenderParam.VIEW] ||
        viewParams[osapi.container.ViewParam.VIEW] ||
        previousView;
    var viewInfo = gadgetInfo[osapi.container.MetadataResponse.VIEWS][view];
    if (view && !viewInfo) {
        var aliasInfo = findAliasInfo(gadgets.config.get('views')[view]);
        if (aliasInfo) {
            view = aliasInfo['view'];
            viewInfo = aliasInfo['viewInfo'];
        }
    }

    // Allow default view if requested view is not found.  No sense doing this if the view is already "default".
    if (!viewInfo &&
        renderParams[osapi.container.RenderParam.ALLOW_DEFAULT_VIEW] &&
        view != osapi.container.GadgetSite.DEFAULT_VIEW_) {
        view = osapi.container.GadgetSite.DEFAULT_VIEW_;
        viewInfo = gadgetInfo[osapi.container.MetadataResponse.VIEWS][view];
        if (!viewInfo) {
            var aliasInfo = findAliasInfo(gadgets.config.get('views')[view]);
            if (aliasInfo) {
                view = aliasInfo['view'];
                viewInfo = aliasInfo['viewInfo'];
            }
        }
    }

    // Check if view exists.
    if (!viewInfo) {
        gadgets.warn(['Unsupported view ', view, ' for gadget ', gadgetInfo['url'], '.'].join(''));
        return;
    }

    // Load into the double-buffer if there is one.
    var el = this.loadingGadgetEl_ || this.currentGadgetEl_;
    this.loadingGadgetHolder_ = new osapi.container.GadgetHolder(this.id_, el);

    var localRenderParams = {};
    for (var key in renderParams) {
        localRenderParams[key] = renderParams[key];
    }

    localRenderParams[osapi.container.RenderParam.VIEW] = view;
    localRenderParams[osapi.container.RenderParam.HEIGHT] =
        renderParams[osapi.container.RenderParam.HEIGHT] ||
            viewInfo[osapi.container.MetadataResponse.PREFERRED_HEIGHT] ||
            gadgetInfo[osapi.container.MetadataResponse.MODULE_PREFS][osapi.container.MetadataResponse.HEIGHT] ||
            String(osapi.container.GadgetSite.DEFAULT_HEIGHT_);
    localRenderParams[osapi.container.RenderParam.WIDTH] =
        renderParams[osapi.container.RenderParam.WIDTH] ||
            viewInfo[osapi.container.MetadataResponse.PREFERRED_WIDTH] ||
            gadgetInfo[osapi.container.MetadataResponse.MODULE_PREFS][osapi.container.MetadataResponse.WIDTH] ||
            String(osapi.container.GadgetSite.DEFAULT_WIDTH_);

    this.updateSecurityToken_(gadgetInfo, localRenderParams);

    this.loadingGadgetHolder_.render(gadgetInfo, viewParams, localRenderParams);
    var height = localRenderParams[osapi.container.RenderParam.HEIGHT];
    if (height && /^([0-9]+)$/.test(height)){
        this.currentGadgetEl_.style.height = height + 'px';
    } else if(height && /^([0-9]+)(px|em|ex|%|in|cm|mm|pt|pc)$/.test(height)){
        this.currentGadgetEl_.style.height = height;
    }

    this.onRender(gadgetInfo, viewParams, renderParams);
};

