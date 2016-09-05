if (typeof MSApp != 'undefined') {
    var innerHtmlDescriptor = Object.getOwnPropertyDescriptor(Element.prototype, 'innerHTML');
    var outerHtmlDescriptor = Object.getOwnPropertyDescriptor(Element.prototype, 'outerHTML');
    var insertBeforeOrig = Element.prototype.insertBefore;
    var insertAfterOrig = Element.prototype.insertAfter;
    var appendChildOrig = Element.prototype.appendChild;
    Object.defineProperty(Element.prototype, 'innerHTML', {
        set: function(value) {
            MSApp.execUnsafeLocalFunction(function () {
                innerHtmlDescriptor.set.call(this, value);
            });
        }
    });
    Object.defineProperty(Element.prototype, 'outerHTML', {
        set: function(value) {
            MSApp.execUnsafeLocalFunction(function () {
                outerHtmlDescriptor.set.call(this, value);
            });
        }
    });
    Element.prototype.insertBefore = function () {
        var $this = this, $arguments = arguments, $result;
        MSApp.execUnsafeLocalFunction(function () {
            $result = insertBeforeOrig.apply($this, $arguments);
        });
        return $result;
    };
    Element.prototype.insertAfter = function () {
        var $this = this, $arguments = arguments, $result;
        MSApp.execUnsafeLocalFunction(function () {
            $result = insertAfterOrig.apply($this, $arguments);
        });
        return $result;
    };
    Element.prototype.appendChild = function () {
        var $this = this, $arguments = arguments, $result;
        MSApp.execUnsafeLocalFunction(function () {
            $result = appendChildOrig.apply($this, $arguments);
        });
        return $result;
    };
}
