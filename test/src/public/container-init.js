/**
 * Created by IntelliJ IDEA.
 * User: KKorsakov
 * Date: 06.10.11
 * Time: 18:16
 * To change this template use File | Settings | File Templates.
 */


window['___jsl'] = window['___jsl'] || {};
(window['___jsl']['ci'] = (window['___jsl']['ci'] || [])).push(
    {
        "opensocial":{
            "invalidatePath":"http://%host%/rpc",
            "path":"http://%host%/rpc",
            "domain":"shindig",
            "supportedFields":{
                "person":[
                    "id",
                    {"name":["familyName","givenName","unstructured"]},
                    "thumbnailUrl",
                    "profileUrl"
                ],
                "mediaItem":["album_id","created","description","duration","file_size","id","language","last_updated","location","mime_type","num_comments","num_views","num_votes","rating","start_time","tagged_people","tags","thumbnail_url","title","type","url"],
                "album":["id","thumbnailUrl","title","description","location","ownerId"],
                "activity":["appId","body","bodyId","externalId","id","mediaItems","postedTime","priority","streamFaviconUrl","streamSourceUrl","streamTitle","streamUrl","templateParams","title","url","userId"],
                "activityEntry":["actor","content","generator","icon","id","object","published","provider","target","title","updated","url","verb"]},
            "enableCaja":false
        },
        "rpc":{
            "commSwf":"/xpc.swf",
            "passReferrer":"c2p:query",
            "parentRelayUrl":"/container/rpc_relay.html",
            "useLegacyProtocol":false},
        "shindig.auth":{
            "authToken":"-1:-1:*:*:*:0:default"},
        "container":{
            "relayPath":"/gadgets/files/container/rpc_relay.html"},
        "views":{"default":{"isOnlyVisible":false,"urlTemplate":"http://localhost/gadgets/default?{var}","aliases":["home","profile","canvas"]},
            "canvas":{"isOnlyVisible":true,"urlTemplate":"http://localhost/gadgets/canvas?{var}","aliases":["FULL_PAGE"]},"profile":{"isOnlyVisible":false,"urlTemplate":"http://localhost/gadgets/profile?{var}","aliases":["DASHBOARD","default"]}},
        "osapi":{
            "endPoints":["//%host%/rpc"],
            "useOAuth2":true},
        "osapi.services":{
            "gadgets.rpc":["container.listMethods"],
            "//%host%/rpc":["samplecontainer.update",
                "activities.supportedFields",
                "gadgets.metadata",
                "albums.supportedFields",
                "gadgets.proxySupportedFields",
                "albums.get",
                "mediaItems.create",
                "http.put",
                "system.listMethods",
                "gadgets.proxy",
                "gadgets.cajole",
                "http.head",
                "messages.create",
                "albums.delete",
                "mediaItems.update",
                "messages.delete",
                "appdata.update",
                "gadgets.js",
                "http.post",
                "gadgets.tokenSupportedFields",
                "samplecontainer.create",
                "http.get",
                "appdata.delete",
                "appdata.create",
                "gadgets.supportedFields",
                "mediaItems.get",
                "activities.update",
                "activities.delete",
                "albums.update",
                "activities.get",
                "messages.modify",
                "activitystreams.create",
                "appdata.get",
                "messages.get",
                "cache.invalidate",
                "samplecontainer.get",
                "people.supportedFields",
                "http.delete",
                "gadgets.jsSupportedFields",
                "people.get",
                "activitystreams.get",
                "mediaItems.supportedFields",
                "mediaItems.delete",
                "activitystreams.update",
                "gadgets.cajaSupportedFields",
                "activities.create",
                "albums.create",
                "gadgets.token",
                "activitystreams.delete",
                "activitystreams.supportedFields"
            ]},
        "core.io":{"jsonProxyUrl":"//%host%/gadgets/makeRequest","proxyUrl":"//%host%/gadgets/proxy?container=%container%&refresh=%refresh%&url=%url%%rewriteMime%"}});
window['___jsl'] = window['___jsl'] || {};
window['___jsl']['u'] = 'http:\/\/localhost:8080\/gadgets\/js\/container:rpc:core.io:xmlutil:setprefs:minimessage:pubsub-2:com.rooxteam.webapi:com.rooxteam.sharedcontext:yotacm.js?c=1&debug=1&container=default';
window['___jsl']['f'] = ['core','container','rpc','open-views','xmlutil','setprefs','pubsub-2','minimessage'];

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

if (typeof JSON !== 'undefined' && typeof window.sessionStorage !== 'undefined') {
    var token=randomString(20);
    window.sessionStorage.setItem('com.rooxteam.widgets.SECURITY_TOKEN', JSON.stringify(token));
}
