/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

/*global ActiveXObject, DOMParser */
/*global shindig */

/**
 * @fileoverview Provides remote content retrieval facilities.
 *     Available to every gadget.
 */

/**
 * @class Provides remote content retrieval functions.
 */

gadgets.io = function() {
    /**
     * Holds configuration-related data such as proxy urls.
     */
    var config = {};

    /**
     * Holds state for OAuth.
     */
    var oauthState;

    /**
     * Internal facility to create an xhr request.
     * @return {XMLHttpRequest}
     */
    function makeXhr() {
        var x;
        if (typeof shindig != 'undefined' &&
            shindig.xhrwrapper &&
            shindig.xhrwrapper.createXHR) {
            return shindig.xhrwrapper.createXHR();
        } else if (typeof ActiveXObject != 'undefined' && typeof MSApp == 'undefined') {
            x = new ActiveXObject('Msxml2.XMLHTTP');
            if (!x) {
                x = new ActiveXObject('Microsoft.XMLHTTP');
            }
            return x;
        }
        // The second construct is for the benefit of jsunit...
        else if (typeof XMLHttpRequest != 'undefined' || window.XMLHttpRequest) {
            return new window.XMLHttpRequest();
        }
        else throw ('no xhr available');
    }

    /**
     * Checks the xobj for errors, may call the callback with an error response
     * if the error is fatal.
     *
     * @param {Object} xobj The XHR object to check.
     * @param {function(Object)} callback The callback to call if the error is fatal.
     * @return {boolean} true if the xobj is not ready to be processed.
     */
    function hadError(url,xobj, callback) {
        if (xobj['readyState'] !== 4) {
            return true;
        }
        try {
            // for 'file:' urls return code 0 is normal
            if (!(xobj['status'] == 200||(xobj['status'] == 0))) {
                var error = ('' + xobj['status']);
                if (xobj['responseText']) {
                    error = error + ' ' + xobj['responseText'];
                }
                callback({
                    'errors': [error],
                    'rc': xobj['status'],
                    'text': xobj['responseText']
                });
                return true;
            }
        } catch (e) {
            callback({
                'errors': [e['number'] + ' Error not specified'],
                'rc': e['number'],
                'text': e['description']
            });
            return true;
        }
        return false;
    }

    /**
     * Handles non-proxied XHR callback processing.
     *
     * @param {string} url
     * @param {function(Object)} callback
     * @param {Object} params
     * @param {Object} xobj
     */
    function processNonProxiedResponse(url, callback, params, xobj) {
        if (xobj['readyState'] === 4 && gadgets.util.hasFeature('com.rooxteam.statistic')) {
            var config = com.rooxteam.config.statistic,
                responseJSONparsed;
            if (config.IO_EVENTS_ENABLED) {
                var widgetData = com.rooxteam.statistic.getWidgetData();
                var data = com.rooxteam.statistic.getContext({
                    "url": url,
                    "stat": xobj.status,
                    "len": (xobj.response && xobj.response.length) || 0,
                    "mthd": params.METHOD
                }, widgetData);
                if (window.JSON && xobj.response && xobj.response.length) {
                    try{
                        responseJSONparsed = window.JSON.parse(xobj.response);
                    }catch (e) {
                        // do nothing
                    }
                    if (responseJSONparsed && responseJSONparsed.error && responseJSONparsed.error.hasOwnProperty('code')) {
                        if (data.stat!==responseJSONparsed.error.code) {
                            data.error_code = responseJSONparsed.error.code;
                        }
                    }
                }
                com.rooxteam.statistic.client.logOperationAuth('io.request', data, 1, null, null);
            }
        }

        if (hadError(url, xobj, callback)) {
            return;
        }
        var data = {
            'body': xobj['responseText']
        };
        if (typeof MSApp == 'undefined') {
            callback(transformResponseData(params, data));
        } else {
            MSApp.execUnsafeLocalFunction(function () { callback(transformResponseData(params, data)); });
        }
    }

    var UNPARSEABLE_CRUFT = "throw 1; < don't be evil' >";

    /**
     * Handles XHR callback processing.
     *
     * @param {string} url
     * @param {function(Object)} callback
     * @param {Object} params
     * @param {Object} xobj
     */
    function processResponse(url, callback, params, xobj) {
        if (hadError(url,xobj, callback)) {
            return;
        }
        var txt = xobj['responseText'];

        // remove unparseable cruft used to prevent cross-site script inclusion
        var offset = txt.indexOf(UNPARSEABLE_CRUFT) + UNPARSEABLE_CRUFT.length;

        // If no cruft then just return without a callback - avoid JS errors
        // TODO craft an error response?
        if (offset < UNPARSEABLE_CRUFT.length) return;
        txt = txt.substr(offset);

        // We are using eval directly here  because the outer response comes from a
        // trusted source, and json parsing is slow in IE.
        var data = eval('(' + txt + ')');
        data = data[url];
        // Save off any transient OAuth state the server wants back later.
        if (data['oauthState']) {
            oauthState = data['oauthState'];
        }
        // Update the security token if the server sent us a new one
        if (data['st']) {
            shindig.auth.updateSecurityToken(data['st']);
        }
        if (typeof MSApp == 'undefined') {
            callback(transformResponseData(params, data));
        } else {
            MSApp.execUnsafeLocalFunction(function () { callback(transformResponseData(params, data)); });
        }
    }

    /**
     * @param {Object} params
     * @param {Object} data
     * @return {Object}
     */

    function transformResponseData(params, data) {
        // Sometimes rc is not present, generally when used
        // by jsonrpccontainer, so assume 200 in its absence.
        var resp = {
            'text': data['body'],
            'rc': data['rc'] || 200,
            'headers': data['headers'],
            'oauthApprovalUrl': data['oauthApprovalUrl'],
            'oauthError': data['oauthError'],
            'oauthErrorText': data['oauthErrorText'],
            'errors': []
        };

        if (resp['rc'] < 200 || resp['rc'] >= 400) {
            resp['errors'] = [resp['rc'] + ' Error'];
        } else if (!(resp['text'] === undefined) && !(resp['text'] === null)) {
            if (resp['rc'] >= 300 && resp['rc'] < 400) {
                // Redirect pages will usually contain arbitrary
                // HTML which will fail during parsing, inadvertently
                // causing a 500 response. Thus we treat as text.
                params['CONTENT_TYPE'] = 'TEXT';
            }
            switch (params['CONTENT_TYPE']) {
                case 'JSON':
                case 'FEED':
                    resp['data'] = gadgets.json.parse(resp.text);
                    if (!resp['data']) {
                        resp['errors'].push('500 Failed to parse JSON');
                        resp['rc'] = 500;
                        resp['data'] = null;
                    }
                    break;
                case 'DOM':
                    var dom;
                    if (typeof ActiveXObject != 'undefined' && typeof MSApp == 'undefined') {
                        dom = new ActiveXObject('Microsoft.XMLDOM');
                        dom.async = false;
                        dom.validateOnParse = false;
                        dom.resolveExternals = false;
                        if (!dom.loadXML(resp['text'])) {
                            resp['errors'].push('500 Failed to parse XML');
                            resp['rc'] = 500;
                        } else {
                            resp['data'] = dom;
                        }
                    } else {
                        var parser = new DOMParser();
                        dom = parser.parseFromString(resp['text'], 'text/xml');
                        if ('parsererror' === dom.documentElement.nodeName) {
                            resp['errors'].push('500 Failed to parse XML');
                            resp['rc'] = 500;
                        } else {
                            resp['data'] = dom;
                        }
                    }
                    break;
                default:
                    resp['data'] = resp['text'];
                    break;
            }
        }
        return resp;
    }

    /**
     * Sends an XHR post or get request
     *
     * @param {string} realUrl The url to fetch data from that was requested by the gadget.
     * @param {string} proxyUrl The url to proxy through.
     * @param {function()} callback The function to call once the data is fetched.
     * @param {Object} paramData The params to use when processing the response.
     * @param {string} method
     * @param {function(requiredFeatures,function(Object),Object,Object)}
     *     processResponseFunction The function that should process the
     *     response from the sever before calling the callback.
     * @param {Object=} opt_headers - Optional headers including a Content-Type that defaults to
     *     'application/x-www-form-urlencoded'.
     */
    function makeXhrRequest(realUrl, proxyUrl, callback, paramData, method,
                            params, processResponseFunction, opt_headers) {
        var xhr = makeXhr();
        if (proxyUrl.indexOf('//') == 0) {
            proxyUrl = document.location.protocol + proxyUrl;
        }

        xhr.open(method, proxyUrl, true);
        if (callback) {
            xhr.onreadystatechange = gadgets.util.makeClosure(
                null, processResponseFunction, realUrl, callback, params, xhr);
        }
        if (paramData !== null) {
            var contentTypeHeader = 'Content-Type';
            var contentType = 'application/x-www-form-urlencoded';
            if (typeof opt_headers === 'string') {
                // This turned out to come directly from a public API, so we need to
                // keep compatibility...
                contentType = opt_headers;
                opt_headers = {};
            }
            var headers = opt_headers || {};
            if (!headers[contentTypeHeader]) headers[contentTypeHeader] = contentType;

            for (var headerName in headers) {
                xhr.setRequestHeader(headerName, headers[headerName]);
            }
        }
        xhr.send(paramData);
    }

    /**
     * Satisfy a request with data that is prefetched as per the gadget Preload
     * directive. The preloader will only satisfy a request for a specific piece
     * of content once.
     *
     * @param {Object} postData The definition of the request to be executed by the proxy.
     * @param {Object} params The params to use when processing the response.
     * @param {function(Object)} callback The function to call once the data is fetched.
     * @return {boolean} true if the request can be satisfied by the preloaded
     *         content false otherwise.
     */
    function respondWithPreload(postData, params, callback) {
        if (gadgets.io.preloaded_ && postData.httpMethod === 'GET') {
            for (var i = 0; i < gadgets.io.preloaded_.length; i++) {
                var preload = gadgets.io.preloaded_[i];
                if (preload && (preload.id === postData.url)) {
                    // Only satisfy once
                    delete gadgets.io.preloaded_[i];

                    if (preload['rc'] !== 200) {
                        callback({'rc': preload['rc'], 'errors': [preload['rc'] + ' Error']});
                    } else {
                        if (preload['oauthState']) {
                            oauthState = preload['oauthState'];
                        }
                        var resp = {
                            'body': preload['body'],
                            'rc': preload['rc'],
                            'headers': preload['headers'],
                            'oauthApprovalUrl': preload['oauthApprovalUrl'],
                            'oauthError': preload['oauthError'],
                            'oauthErrorText': preload['oauthErrorText'],
                            'errors': []
                        };
                        callback(transformResponseData(params, resp));
                    }
                    return true;
                }
            }
        }
        return false;
    }

    /**
     * @param {Object} configuration Configuration settings.
     * @private
     */
    function init(configuration) {
        config = configuration['core.io'] || {};
    }

    gadgets.config.register('core.io', null, init);

    return /** @scope gadgets.io */ {
        /**
         * Fetches content from the provided URL and feeds that content into the
         * callback function.
         *
         * Example:
         * <pre>
         * gadgets.io.makeRequest(url, fn,
         *    {contentType: gadgets.io.ContentType.FEED});
         * </pre>
         *
         * @param {string} url The URL where the content is located.
         * @param {function(Object)} callback The function to call with the data from
         *     the URL once it is fetched.
         * @param {Object.<gadgets.io.RequestParameters, Object>=} opt_params
         *     Additional
         *     <a href="gadgets.io.RequestParameters.html">parameters</a>
         *     to pass to the request.
         *
         * @member gadgets.io
         */
        makeRequest: function(url, callback, opt_params) {
            // TODO: This method also needs to respect all members of
            // gadgets.io.RequestParameters, and validate them.
            var params = opt_params || {};

//            if (document.location.protocol == 'http:' || document.location.protocol == 'https:') {
//
//                var httpMethod = params['METHOD'] || 'GET';
//                var refreshInterval = params['REFRESH_INTERVAL'];
//
//                // Check if authorization is requested
//                var auth, st;
//                if (params['AUTHORIZATION'] && params['AUTHORIZATION'] !== 'NONE') {
//                    auth = params['AUTHORIZATION'].toLowerCase();
//                    st = shindig.auth.getSecurityToken();
//                } else {
//                    // Unauthenticated GET requests are cacheable
//                    if (httpMethod === 'GET' && refreshInterval === undefined) {
//                        refreshInterval = 3600;
//                    }
//                }
//
//                // Include owner information?
//                var signOwner = true;
//                if (typeof params['OWNER_SIGNED'] !== 'undefined') {
//                    signOwner = params['OWNER_SIGNED'];
//                }
//
//                // Include viewer information?
//                var signViewer = true;
//                if (typeof params['VIEWER_SIGNED'] !== 'undefined') {
//                    signViewer = params['VIEWER_SIGNED'];
//                }
//
//                var headers = params['HEADERS'] || {};
//                if (httpMethod === 'POST' && !headers['Content-Type']) {
//                    headers['Content-Type'] = 'application/x-www-form-urlencoded';
//                }
//
//                var urlParams = gadgets.util.getUrlParameters();
//
//                var paramData = {
//                    'url': url,
//                    'httpMethod': httpMethod,
//                    'headers': gadgets.io.encodeValues(headers, false),
//                    'postData': params['POST_DATA'] || '',
//                    'authz': auth || '',
//                    'st': st || '',
//                    'contentType': params['CONTENT_TYPE'] || 'TEXT',
//                    'numEntries': params['NUM_ENTRIES'] || '3',
//                    'getSummaries': !!params['GET_SUMMARIES'],
//                    'signOwner': signOwner,
//                    'signViewer': signViewer,
//                    'gadget': urlParams['url'],
//                    'container': urlParams['container'] || urlParams['synd'] || 'default',
//                    // should we bypass gadget spec cache (e.g. to read OAuth provider URLs)
//                    'bypassSpecCache': gadgets.util.getUrlParameters()['nocache'] || '',
//                    'getFullHeaders': !!params['GET_FULL_HEADERS']
//                };
//
//                // OAuth goodies
//                if (auth === 'oauth' || auth === 'signed') {
//                    if (gadgets.io.oauthReceivedCallbackUrl_) {
//                        paramData['OAUTH_RECEIVED_CALLBACK'] = gadgets.io.oauthReceivedCallbackUrl_;
//                        gadgets.io.oauthReceivedCallbackUrl_ = null;
//                    }
//                    paramData['oauthState'] = oauthState || '';
//                    // Just copy the OAuth parameters into the req to the server
//                    for (var opt in params) {
//                        if (params.hasOwnProperty(opt)) {
//                            if (opt.indexOf('OAUTH_') === 0) {
//                                paramData[opt] = params[opt];
//                            }
//                        }
//                    }
//                }
//
//                var proxyUrl = config['jsonProxyUrl'].replace('%host%', document.location.host);
//
//                // FIXME -- processResponse is not used in call
//                if (!respondWithPreload(paramData, params, callback)) {
//                    if (httpMethod === 'GET' && refreshInterval > 0) {
//                        // this content should be cached
//                        // Add paramData to the URL
//                        var extraparams = '?refresh=' + refreshInterval + '&' +
//                            gadgets.io.encodeValues(paramData);
//
//                        makeXhrRequest(url, proxyUrl + extraparams, callback,
//                            null, 'GET', params, processResponse);
//
//                    } else {
//                        makeXhrRequest(url, proxyUrl, callback,
//                            gadgets.io.encodeValues(paramData), 'POST', params,
//                            processResponse);
//                    }
//                }
//            } else {
            // direct call
            // proxy via localhost
            var opt_headers = params['HEADERS'] || {};
            opt_headers['Accept-Encoding'] = 'deflate';
            gadgets.io.makeNonProxiedRequest(url, callback, opt_params, opt_headers);
//            }
        },

        /**
         * @param {string} relativeUrl url to fetch via xhr.
         * @param callback callback to call when response is received or for error.
         * @param {Object=} opt_params
         * @param {Object=} opt_headers
         *
         */
        makeNonProxiedRequest: function(relativeUrl, callback, opt_params, opt_headers) {
            var params = opt_params || {};
            makeXhrRequest(relativeUrl, relativeUrl, callback, params['POST_DATA'],
                params['METHOD'], params, processNonProxiedResponse, opt_headers);
        },

        /**
         * Used to clear out the oauthState, for testing only.
         *
         * @private
         */
        clearOAuthState: function() {
            oauthState = undefined;
        },

        /**
         * Converts an input object into a URL-encoded data requiredFeatures.
         * (key=value&amp;...)
         *
         * @param {Object} fields The post fields you wish to encode.
         * @param {boolean=} opt_noEscaping An optional parameter specifying whether
         *     to turn off escaping of the parameters. Defaults to false.
         * @return {string} The processed post data in www-form-urlencoded format.
         *
         * @member gadgets.io
         */
        encodeValues: function(fields, opt_noEscaping) {
            var escape = !opt_noEscaping;

            var buf = [];
            var first = false;
            for (var i in fields) {
                if (fields.hasOwnProperty(i) && !/___$/.test(i)) {
                    if (!first) {
                        first = true;
                    } else {
                        buf.push('&');
                    }
                    buf.push(escape ? encodeURIComponent(i) : i);
                    buf.push('=');
                    buf.push(escape ? encodeURIComponent(fields[i]) : fields[i]);
                }
            }
            return buf.join('');
        },

        /**
         * Gets the proxy version of the passed-in URL.
         *
         * @param {string} url The URL to get the proxy URL for.
         * @param {Object.<gadgets.io.RequestParameters, Object>=} opt_params Optional Parameter Object.
         *     The following properties are supported:
         *       .REFRESH_INTERVAL The number of seconds that this
         *           content should be cached.  Defaults to 3600.
         *
         * @return {string} The proxied version of the URL.
         * @member gadgets.io
         */
        getProxyUrl: function(url, opt_params) {
            var proxyUrl = config['proxyUrl'];
            if (!proxyUrl) {
                return proxyUrl;
            }
            var params = opt_params || {};
            var refresh = params['REFRESH_INTERVAL'];
            if (refresh === undefined) {
                refresh = '3600';
            }

            var urlParams = gadgets.util.getUrlParameters();

            var rewriteMimeParam =
                params['rewriteMime'] ? '&rewriteMime=' + encodeURIComponent(params['rewriteMime']) : '';
            var ret = proxyUrl.replace('%url%', encodeURIComponent(url)).
                replace('%host%', document.location.host).
                replace('%rawurl%', url).
                replace('%refresh%', encodeURIComponent(refresh)).
                replace('%gadget%', encodeURIComponent(urlParams['url'])).
                replace('%container%', encodeURIComponent(urlParams['container'] || urlParams['synd'] || 'default')).
                replace('%rewriteMime%', rewriteMimeParam);
            if (ret.indexOf('//') == 0) {
                ret = window.location.protocol + ret;
            }
            return ret;
        }
    };
}();

/**
 * @const
 **/
gadgets.io.RequestParameters = gadgets.util.makeEnum([
    'METHOD',
    'CONTENT_TYPE',
    'POST_DATA',
    'HEADERS',
    'AUTHORIZATION',
    'NUM_ENTRIES',
    'GET_SUMMARIES',
    'GET_FULL_HEADERS',
    'REFRESH_INTERVAL',
    'OAUTH_SERVICE_NAME',
    'OAUTH_USE_TOKEN',
    'OAUTH_TOKEN_NAME',
    'OAUTH_REQUEST_TOKEN',
    'OAUTH_REQUEST_TOKEN_SECRET',
    'OAUTH_RECEIVED_CALLBACK'
]);

/**
 * @const
 */
gadgets.io.MethodType = gadgets.util.makeEnum([
    'GET', 'POST', 'PUT', 'DELETE', 'HEAD'
]);

/**
 * @const
 */
gadgets.io.ContentType = gadgets.util.makeEnum([
    'TEXT', 'DOM', 'JSON', 'FEED'
]);

/**
 * @const
 */
gadgets.io.AuthorizationType = gadgets.util.makeEnum([
    'NONE', 'SIGNED', 'OAUTH'
]);


/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

/**
 * @class
 * Tame and expose core gadgets.io.* API to cajoled gadgets
 */
tamings___.push(function(imports) {
    caja___.whitelistFuncs([
        [gadgets.io, 'encodeValues'],
        [gadgets.io, 'getProxyUrl'],
        [gadgets.io, 'makeRequest']
    ]);
});


/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership. The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License. You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations under the License.
 */

(function() {

    /**
     * It is common to batch requests together to make them more efficient.
     *
     * Note: the container config specified endpoints at which services are to be
     * found. When creating a batch, the calls are split out into separate
     * requests based on the transport, as it may get sent to a different server
     * on the backend.
     */
    var newBatch = function() {
        var that = {};

        // An array of requests where each request is
        // { key : <key>
        //   request : {
        //     method : <service-method>
        //     rpc  : <request params>
        //     transport : <rpc dispatcher>
        //  }
        // }

        /** @type {Array.<Object>} */
        var keyedRequests = [];

        /**
         * Create a new request in the batch
         * @param {string} key id for the request.
         * @param {Object} request the opensocial request object which is of the form
         * { method : <service-method>
         *   rpc  : <request>
         *   transport : <rpc dispatcher>
         * }.
         */
        var add = function(key, request) {
            if (request && key) {
                keyedRequests.push({'key' : key, 'request' : request});
            }
            return that;
        };

        /**
         * Convert our internal request format into a JSON-RPC
         * @param {Object} request
         */
        var toJsonRpc = function(request) {
            var jsonRpc = { 'method': request['request']['method'], 'id': request['key'] };
            if (request['request']['rpc']) {
                jsonRpc['params'] = request['request']['rpc'];
            }
            return jsonRpc;
        };

        /**
         * Call to make a batch execute its requests. Batch will distribute calls over their
         * bound transports and then merge them before calling the userCallback. If the result
         * of an rpc is another rpc request then it will be chained and executed.
         *
         * @param {function(Object)} userCallback the callback to the gadget where results are passed.
         */
        var execute = function(userCallback) {
            var batchResult = {};

            var perTransportBatch = {};

            // Break requests into their per-transport batches in call order
            /** @type {number} */
            var latchCount = 0;
            var transports = [];
            for (var i = 0; i < keyedRequests.length; i++) {
                // Batch requests per-transport
                var transport = keyedRequests[i]['request']['transport'];
                if (!perTransportBatch[transport['name']]) {
                    transports.push(transport);
                    latchCount++;
                }
                perTransportBatch[transport['name']] = perTransportBatch[transport['name']] || [];

                // Transform the request into JSON-RPC form before sending to the transport
                perTransportBatch[transport['name']].push(toJsonRpc(keyedRequests[i]));
            }

            // Define callback for transports
            var transportCallback = function(transportBatchResult) {
                if (transportBatchResult['error']) {
                    batchResult['error'] = transportBatchResult['error'];
                }
                // Merge transport results into overall result and hoist data.
                // All transport results are required to be of the format
                // { <key> : <JSON-RPC response>, ...}
                for (var i = 0; i < keyedRequests.length; i++) {
                    var key = keyedRequests[i]['key'];
                    var response = transportBatchResult[key];
                    if (response) {
                        if (response['error']) {
                            // No need to hoist error responses
                            batchResult[key] = response;
                        } else {
                            // Handle both compliant and non-compliant JSON-RPC data responses.
                            batchResult[key] = response['data'] || response['result'];
                        }
                    }
                }

                // Latch on no. of transports before calling user callback
                latchCount--;
                if (latchCount === 0) {
                    userCallback(batchResult);
                }
            };

            // For each transport execute its local batch of requests
            for (var j = 0; j < transports.length; j++) {
                transports[j].execute(perTransportBatch[transports[j]['name']], transportCallback);
            }

            // Force the callback to occur asynchronously even if there were no actual calls
            if (latchCount == 0) {
                window.setTimeout(function() {userCallback(batchResult)}, 0);
            }
        };

        that.execute = execute;
        that.add = add;
        return that;
    };

    osapi.newBatch = newBatch;
})();


/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership. The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License. You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations under the License.
 */

/**
 * Called by the transports for each service method that they expose
 * @param {string} method  The method to expose e.g. "people.get".
 * @param {Object.<string,Object>} transport The transport used to
 *    execute a call for the method.
 */
osapi._registerMethod = function(method, transport) {
    // Skip registration of local newBatch implementation.
    if (method === 'newBatch') {
        return;
    }

    // Lookup last method value.
    var parts = method.split('.');
    var last = osapi;
    for (var i = 0; i < parts.length - 1; i++) {
        last[parts[i]] = last[parts[i]] || {};
        last = last[parts[i]];
    }
    var basename = parts[parts.length - 1], old;

    // registered methods are now 'last one in wins'.  See tamings__ below.
    if (last[basename]) {
        old = last[basename];
    }

    last[basename] = function(rpc) {
        // TODO: This shouldn't really be necessary. The spec should be clear
        // enough about defaults that we dont have to populate this.
        rpc = rpc || {};
        rpc['userId'] = rpc['userId'] || '@viewer';
        rpc['groupId'] = rpc['groupId'] || '@self';
        var boundCall = new osapi._BoundCall(method, transport, rpc);
        return boundCall;
    };

    if (typeof tamings___ !== 'undefined') {
        var newTaming = function() {
            caja___.markTameAsFunction(last[basename], method);
        };

        // Remove the old taming if we are replacing it, no sense in growing the array
        // needlessly. This function (_registerMethod) gets called a lot.
        if (old && old.__taming_index) {
            last[basename].__taming_index = old.__taming_index;
            tamings___[old.__taming_index] = newTaming;
        }
        else {
            last[basename].__taming_index = tamings___.length;
            tamings___.push(newTaming);
        }
    }
};

// This was formerly an anonymous ad-hoc object, but that triggers a caja
// bug: http://code.google.com/p/google-caja/issues/detail?id=1355
// Workaround is to make it a class.
osapi._BoundCall = function(method, transport, rpc) {
    this['method'] = method;
    this['transport'] = transport;
    this['rpc'] = rpc;
};

osapi._BoundCall.prototype.execute = function(callback) {
    var cajaReady = (typeof caja___ !== 'undefined'
        && caja___.getUseless
        && caja___.getUseless());
    var that = cajaReady ? caja___.getUseless() : this;
    var feralCallback = cajaReady ? caja___.untame(callback) : callback;
    var batch = osapi.newBatch();
    batch.add(this.method, this);
    batch.execute(function(batchResult) {
        if (batchResult.error) {
            feralCallback.call(that, batchResult.error);
        } else {
            feralCallback.call(that, batchResult[that.method]);
        }
    });
};


/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

/**
 * @class
 * Tame and expose core osapi.* API to cajoled gadgets
 */
tamings___.push(function(imports) {
    function newBatch() {
        var batch = osapi.newBatch();
        caja___.whitelistFuncs([
            [batch, 'add'],
            [batch, 'execute']
        ]);
        return caja___.tame(batch);
    }

    caja___.markTameAsFunction(newBatch, 'newBatch');
    caja___.tamesTo(osapi.newBatch, newBatch);
    caja___.whitelistCtors([
        [osapi, '_BoundCall', Object]
    ]);
    caja___.whitelistMeths([
        [osapi._BoundCall, 'execute']
    ]);
});