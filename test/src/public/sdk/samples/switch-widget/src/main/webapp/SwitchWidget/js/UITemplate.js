var roox = roox || {};

(function() {

    function getTemplate(url, callback) {
        $.ajax({
            type: "GET",
            url: url,
            contentType: "text/html; charset=utf-8",
            dataType: "html",
            cache:false,
            success: function(template) {
                callback(template);
            }
        });
    }

    function UITemplate(templateUrl, locale) {
        this.templateUrl = templateUrl;
        this.template = null;
        this.locale = locale;
    }

    UITemplate.prototype = {
        render : function(context) {
            this.renderToString(context, function(tplString) {
                $('body').html(tplString);
                gadgets.window.adjustHeight();
            })
        },

        renderToDiv: function(context, div) {
            this.renderToString(context, function(tplString) {
                div.html(tplString);
                gadgets.window.adjustHeight();
            })
        },

        renderToString: function(context, callback) {

            if (context) {
                var self = this;
                var lang = (context.lang) ? (context.lang) : 'ru_ru';
                if (self.locale) {
                    this.locale.getLocale(lang, function(locale) {
                        context.Msg = locale;
                        self._renderToString(context, callback)
                    })
                } else {
                    context.Msg = {};
                    self._renderToString(context, callback)
                }

            }
        },

        _renderToString: function(context, callback) {
            var self = this;
            if (self.template != undefined) {
                callback($.tmpl(self.template, context))
            } else {
                getTemplate(self.templateUrl, function(template) {
                    if (template) {
                        self.template = template;
                        callback($.tmpl(template, context))
                    }
                });
            }
        }

    },

        roox.UITemplate = UITemplate;

})();
