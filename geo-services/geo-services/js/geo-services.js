var com = com || {};
com.rooxteam = com.rooxteam || {};
com.rooxteam.widgets = com.rooxteam.widgets || {};

(function() {
    'use strict';

    // Точка входа в виджет
    function GeoServices(moduleId, noIndex, moduleBaseUrl) {

            this.moduleId = moduleId;
            this.widgetId = '#widget' + moduleId;
            this.$el = $(this.widgetId);
            this.context = {};

			// сохранение в модели настроек виджета
            var prefs = new gadgets.Prefs(moduleId);
            var gPrefs = gadgets.util.unescapeString(prefs.getString("inputData"));
            if (gPrefs !== "") {
                this.prefs = JSON.parse(gPrefs);
            } // end if

            var viewPrefix = "",
                commonUrls;

            // Пути
            if (typeof moduleBaseUrl == 'undefined' || moduleBaseUrl === "./") {
                commonUrls = widgetUrls;
                this.widgetBaseUrl = commonUrls[moduleId].substring(0, commonUrls[moduleId].lastIndexOf('/'));
            } else {
                this.widgetBaseUrl = moduleBaseUrl;
            } // end if

            this.context.widgetImagesUrl = this.widgetBaseUrl + viewPrefix + "/img";

            // язык по умолчанию
            com.rooxteam.i18n.setLang(this.getLanguage());

            //  перв. установка ajax-запросов
            $.ajaxSetup({
                headers: {
                    Accept: "application/json"
                },
                cache: false
            });

            // отрисовка шаблона
            this.render("templates/main", this.context)
                .always(jQuery.proxy(this.handlers, this));

        } // end fun

    GeoServices.prototype = {

        // навешивание событий
        handlers: function() {
            var self = this;

            // первоначальная загрузка данных
            this.update();

            $("[data-update-button]").on("click", function(e) {
                self.update();
            });
        },

        // событие обновления данных
        update: function() {

            var self = this;

			// отображаем индикатор загрузки
            $("[data-loader]").show();

            // каскадный запрос в различные сервисы для получения погоды и времени
            $.ajax({
                type: "GET",
                dataType: "json",
                url: "http://freegeoip.net/json/"
            }).done(function(data) {

                var ip = data.ip;
                var latitude = data.latitude;
                var longitude = data.latitude;

                $.ajax({
                    type: "GET",
                    dataType: "json",
                    url: "http://api.openweathermap.org/data/2.5/weather?lat=" + latitude + "&lon=" + longitude
                }).done(function(data) {

                    var deg_kelvin = data.main.temp;
                    var C = (deg_kelvin - 273.15).toFixed(1);
                    if (C > 0) C = '+' + C;

                    var weather = data.weather[0].main;
                    var weather_desc = data.weather[0].description;

					// отображаем погоду в виджете
                    $("[data-deg]").html(C);
                    $("[data-weather]").html(weather + ', ');
                    $("[data-weather-desc]").html(weather_desc);

                    $.ajax({
                        type: "GET",
                        dataType: "json",
                        url: "http://api.worldweatheronline.com/free/v2/tz.ashx?key=9deeb29fa7a82a7c3fe570b658669&q=" + ip + "&format=json"
                    }).done(function(obj) {

                        var dt = obj.data.time_zone[0].localtime + '';

                        var timeArray = / ([0-9]{1,2}):([0-9]{1,2})/g.exec(dt);
                        var h = timeArray[1];
                        var m = timeArray[2];

						// отображаем время в виджете
                        $("[data-time]").html(h + ':' + m);
						
						// скрываем индикатор загрузки
                        $("[data-loader]").hide();
						
						// скрываем блок ошибки
                        $("[data-error]").hide();


                    }).fail(function(e) {
					
                        var errText = self.standartError(e.status);
						
						// отображаем ошибку
                        $("[data-error]").html(errText + '<br><br>');
                        $("[data-error]").show();

						// скрываем индикатор загрузки
                        $("[data-loader]").hide();

                    });

                }).fail(function(e) {
                    var errText = self.standartError(e.status);
					
					// отображаем ошибку
                    $("[data-error]").html(errText + '<br><br>');
                    $("[data-error]").show();

					// скрываем индикатор загрузки
                    $("[data-loader]").hide();
                });

            }).fail(function(e) {
                var errText = self.standartError(e.status);
				
				// отображаем ошибку
                $("[data-error]").html(errText + '<br><br>');
                $("[data-error]").show();

				// скрываем индикатор загрузки
                $("[data-loader]").hide();
            });

        },

        // отрисовка шаблона	
        render: function(tplName, context, callback) {
            var widgetElement = $(this.widgetId);
            var moduleId = this.moduleId;
            var templateBaseDir = this.widgetBaseUrl + '/../templates/';
            var renderContext = $.extend({}, context, {
                moduleId: moduleId,
                templateBaseDir: templateBaseDir
            });
            this.widgetBaseUrl = widgetUrls[this.moduleId].substring(0, widgetUrls[moduleId].lastIndexOf('.xml'));
            return com.rooxteam.templates.renderToEl(
                tplName,
                renderContext,
                widgetElement,
                callback,
                moduleId).always(function() {

                // для работы с less
                if (typeof com.rooxteam.lesscss !== "undefined") {
                    com.rooxteam.lesscss.reInit();
                }
            });
        },

        getLanguage: function() {
            return com.rooxteam.i18n.getLanguage();
        },

		// получаем перевод слова
        getTranslation: function(key, namespace) {
            return com.rooxteam.i18n.getTranslation(key, namespace, this.moduleId);
        },

		// получаем настройки
        getPrefs: function() {
            return this.prefs;
        },

        // стандартные ошибки
        standartError: function(code) {

            var self = this;

            code = parseInt(code, 10);

            var errorText = self.getTranslation("ConnectionError", "error");
            if (code === 404) {
                errorText = self.getTranslation("ErrorReadingData", "error");
            }
            if (code === 403) {
                errorText = self.getTranslation("403_Forbidden", "error");
            }
            if (code === 400) {
                errorText = self.getTranslation("400_BadRequest", "error");
            }
            if (code === 500) {
                errorText = self.getTranslation("500_InternalServerError", "error");
            }
            if (code === 503) {
                errorText = self.getTranslation("503_ServiceUnavailable", "error");
            }

            return errorText;
        }
    }; // end prototype

    com.rooxteam.widgets.GeoServices = GeoServices;

})();