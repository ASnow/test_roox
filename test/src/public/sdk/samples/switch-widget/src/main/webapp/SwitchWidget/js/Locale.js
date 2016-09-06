var roox = roox || {};


(function() {

    function Locale(localeBaseDir) {
        this.localeMap = {};
        this.localeBaseDir = localeBaseDir;
    }

    Locale.prototype = {
        getLocale: function(lang, func) {
            if (this.localeMap[lang]!= undefined) {
                func(this.localeMap[lang])
            } else {
                var url = this.localeBaseDir + lang + '.locale';
                var self = this;
                $.ajax({
                    type: "GET",
                    url: url,
                    contentType: "application/json; charset=utf-8",
                    dataType: "json",
                    success: function(locale) {
                        self.localeMap[lang] = locale;
                        func(locale)
                    }
                });
            }
        }
    },

        roox.Locale = Locale;

})();
