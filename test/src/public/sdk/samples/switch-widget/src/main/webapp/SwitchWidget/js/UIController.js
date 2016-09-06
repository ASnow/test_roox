var roox = roox || {};

(function() {

    var PROPERTY_LANGUAGE_NAME = 'com.roox.cm.Common.App.Properties.unit.LanguageName';
    var TAB1_STATE = 'tab1_state';
    var TAB2_STATE = 'tab2_state';
    var DEFAULT_STATE = TAB1_STATE;

    var sharedContext;

    function UIController(moduleId) {
        var self = this;
        sharedContext = com.rooxteam.sharedcontext.getDataContext();
        this.moduleId = moduleId;
        this.initContext();
        this.initTemplates();
        self.updateWindow();
    }


    UIController.prototype = {

        initTemplates: function() {
            $('#widget' + this.moduleId).html('<div id="scrollable" style="width:100%;height:100%;overflow-y:auto;"/>');
            var viewPrefix = this.getViewPrefix();
            var widgetBaseUrl = baseUrls[this.getModuleId()];
            if (widgetBaseUrl) {
                widgetBaseUrl = widgetBaseUrl.substring(0, widgetBaseUrl.lastIndexOf('/'));
            } else {
                widgetBaseUrl = '';
            }
            var templateBaseDir = widgetBaseUrl + '/SwitchWidget/templates/';
            var localeBaseDir = widgetBaseUrl + '/SwitchWidget/locale/';
            var locale = new roox.Locale(localeBaseDir);
            this.tab1Tpl = new roox.UITemplate(templateBaseDir + viewPrefix + "tab1.html", locale);
            this.tab2Tpl = new roox.UITemplate(templateBaseDir + viewPrefix + "tab2.html", locale);

        },

        initContext: function() {
            this.context = {};
            this.context.state = DEFAULT_STATE;
            var widgetBaseUrl = baseUrls[this.getModuleId()];
            if (widgetBaseUrl) {
                widgetBaseUrl = widgetBaseUrl.substring(0, widgetBaseUrl.lastIndexOf('/'));
            } else {
                widgetBaseUrl = '';
            }
            this.context.widgetBaseUrl = widgetBaseUrl;
        },

        dispose : function() {
        },

        getModuleId: function() {
            return this.moduleId;
        },

        getPref: function(name) {
            var prefs = new gadgets.Prefs(this.getModuleId());
            return prefs.getString(name) ? prefs.getString(name) : null;
        },

        getViewPrefix: function() {
            if (this.getPref("view") == "yota") {
                return "yota_";
            } else {
                return "";
            }
        },

        language: function() {
            var val = sharedContext.getDataSet(PROPERTY_LANGUAGE_NAME);
            return val ? val : 'ru_ru';
        },

        updateWindow: function() {
            var context = this.context;
            context.lang = this.language();
            context.indexLang = this.language().substring(0, 2);
            this.dispatchAction(context)
        },

        dispatchAction: function(context) {
            if (!context.state) {
                context.state = DEFAULT_STATE;
            }
            if (context.state == TAB1_STATE) {
                this.tab1Action(context);
            } else {
                this.tab2Action(context);
            }
        },

        tab1Action: function(context) {
            this.tab1Tpl.renderToDiv(context, $('#scrollable'));
        },

        tab2Action: function(context) {
            this.tab2Tpl.renderToDiv(context, $('#scrollable'));
        },

        switchTabAction: function(state){
            if (state == TAB1_STATE){
                this.context.state = TAB1_STATE;
            }else if(state == TAB2_STATE){
                this.context.state = TAB2_STATE;
            }else{
                this.context.state = DEFAULT_STATE;
            }
            this.updateWindow();
        }
    };

    roox.UIController = UIController;

})();