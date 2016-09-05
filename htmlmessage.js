var roox = roox || {};
(function() {

    var HTML_MESSAGE_DIV = "htmlmessage";
    var HTML_MESSAGE_CALLBACK = function(result) {
    };

    function HtmlMessage() {
        this.init()
    }

    HtmlMessage.prototype = {

        init: function() {
            $('body').prepend('<div id="' + HTML_MESSAGE_DIV + '" style="position: absolute; top:0; left:0; width: 100%; height: 100%; z-index: 3000; display: none; background-color: #ffffff; -webkit-border-radius: 8px; border-radius: 8px;"></div>');
        },

        show: function() {
            $("#" + HTML_MESSAGE_DIV).show();
        },

        hide: function(){
            $("#" + HTML_MESSAGE_DIV).hide();
        },

        create: function(rpcArgs, html) {
            HTML_MESSAGE_CALLBACK = rpcArgs.callback;
            $("#" + HTML_MESSAGE_DIV).html(html);
            $("#" + HTML_MESSAGE_DIV).show();
        },

        close: function(result) {
            $("#" + HTML_MESSAGE_DIV).hide();
            this.result(result);
        },

        result: function(result) {
            HTML_MESSAGE_CALLBACK(result);
        }

    }

    roox.HtmlMessage = HtmlMessage;
})();
