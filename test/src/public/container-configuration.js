// configuration file for all features
var containerConfiguration = {

    'com.rooxteam.webapi': {
        'endpointUrl': 'https://oauth.mts.ru/webapi-1.3/api/',
        'emulateNetscaler': false
    },
    'com.rooxteam.sso': {
        'ssoUrl': 'SSOUrl',
        'portalBaseUrl': 'BaseUrl',
        'service': 'service',
        'realm': 'realm'
    },
    'com.rooxteam.auth': {
        'authorizeEndpointUrl': '@unconfigured@',
        'response_type': 'json',
        'redirect_uri': '/oauth/js/blank.html',
        'client_id': '@unconfigured@'
    },
    'com.rooxteam.statistic': {
        "ENABLED": true,
        "LIC_ENABLED": true,
        "SERVER_ADDRESS": 'http://oauth.mts.ru/pushreport',
        "SERVICE_TYPE_PARAMETER": 'YA_REPORT_SERVICE',
        "CHECKSUM_PARAMETER": 'YA_REPORT_CHECKSUM',
        "SENDING_TIME_PARAMETER": 'YA_REPORT_SENDING_TIME',
        "COUNTER_SERVICE_TYPE": 'counter',
        "ACCUMULATE_TIME": 60000,
        'TIMER_UPDATE_INTERVAL': 5000,
        "ACCUMULATE_OPERATION_LIMIT": 3,        //after this accumulate operation limit - try send to server report
        "OVER_ACCUMULATE_OPERATION_LIMIT": 30,     //max over accumulation limit if can't send report
        "MAX_URL_LENGTH": 2000,
        "TRACEKIT_ENABLED": false,
        "IO_EVENTS_ENABLED": true,
        "VIEW_EVENTS_ENABLED": true,
        "DOM_EVENTS_ENABLED": true,
        "DOM_EVENTS": {
            "click": {
                "verbose": 4,
                "selector": ""
            }
        }
    },

    'com.rooxteam.network.util': {
        'MSISDN_URL': 'http://h2o.mts.ru/router/',
        'MSISDN_REFRESH_INTERVAL' : 30 * 24 * 60 * 60 * 1000,
        'UPDATE_THROTTLE_INTERVAL' : 30 * 1000,
        'UPDATE_MAX_TRIES' : 5
    },

    'com.rooxteam.config': {
        'NEWS': {
            'DEBUG': false,
            /*News widget configuration (all intervals in milliseconds)*/
            'UPDATE_INTERVAL': 5000, /* 5 sec */
            'MIN_UPDATE_INTERVAL': 10800000          /* 3 h   */
        },
        'ACCOUNT': {
            /* Account information configuration (all intervals in milliseconds) */
            'MIN_UPDATE_INTERVAL': 3000,
            'ACTUALITY_TIME': 43200000
        },
        'FEEDBACK': {
            'MAX_NUMBER_MESSAGES_PER_LIMIT_INTERVAL': 3,
            'LIMIT_INTERVAL': 900000 /* 15 min*/
        }
    },

    "rpc": {
        "commSwf": "/xpc.swf",
        "passReferrer": "c2p:query",
        "parentRelayUrl": "/rpc_relay.html",
        "useLegacyProtocol": false
    },
    "shindig.auth": {
        "authToken": null
    },
    "core.util": {
        "core": {},
        "com.rooxteam.sso": {},
        "com.rooxteam.auth": {},
        "com.rooxteam.statistic": {},
        "com.rooxteam.network": {}
    },
    "core.io": {
        "jsonProxyUrl": "//%host%/gadgets/makeRequest",
        "proxyUrl": "//%host%/gadgets/proxy?container=%container%&refresh=%refresh%&url=%url%%rewriteMime%"
    },
    "opensocial": {
        // Path to fetch opensocial data from
        // Must be on the same domain as the gadget rendering server
        "path": "http://%host%${CONTEXT_ROOT}/rpc",
        // Path to issue invalidate calls
        "invalidatePath": "http://%host%${CONTEXT_ROOT}/rpc",
        "domain": "shindig",
        "enableCaja": false,
        "supportedFields": {
            "person": ["id", {"name": ["familyName", "givenName", "unstructured"]}, "thumbnailUrl", "profileUrl"],
            "activity": ["appId", "body", "bodyId", "externalId", "id", "mediaItems", "postedTime", "priority",
                "streamFaviconUrl", "streamSourceUrl", "streamTitle", "streamUrl", "templateParams", "title",
                "url", "userId"],
            "activityEntry": ["actor", "content", "generator", "icon", "id", "object", "published", "provider", "target",
                "title", "updated", "url", "verb"],
            "album": ["id", "thumbnailUrl", "title", "description", "location", "ownerId"],
            "mediaItem": ["album_id", "created", "description", "duration", "file_size", "id", "language", "last_updated",
                "location", "mime_type", "num_comments", "num_views", "num_votes", "rating", "start_time",
                "tagged_people", "tags", "thumbnail_url", "title", "type", "url"]
        }
    },
    "osapi.services": {
        "gadgets.rpc": ["container.listMethods"]
    },
    "osapi": {
        // The endpoints to query for available JSONRPC/REST services
        "endPoints": [ "//%host%${CONTEXT_ROOT}/rpc" ]
    },
    "osapi.useOAuth2": true,
    "shindig-container": {
        "serverBase": "${CONTEXT_ROOT}/gadgets/"
    },
    "container": {
        "relayPath": "/rpc_relay.html"
    },
//    this is actually not needed, but container wouldn't start without object minimessage.css
    "minimessage": {
        "css": []
    }
};

