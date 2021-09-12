

//angular wrapper for jquery knob
angular.module('jg.knob', []).directive('jgKnob', function () {
    return {
        restrict: 'AE',
        require: 'ngModel',
        //module properties
        scope: {
            displayInput: "=",
            cursor: "=",
            width: "=",
            min: "=",
            max: "=",
            gaugeStep: "=",
            lineCap: "=",
            ngModel:'=',
            angleOffset: "=",
            linecap: "=",
            fgColor: "=",
            angleArc: "=",
            value: "=",
        },
        link: function (scope, elm, attrs, ngModel) {

            ngModel.$render = function () {
                elm.val(ngModel.$viewValue).trigger("change");
            };

            elm.knob({
                displayInput: scope.displayInput,
                cursor: scope.cursor,
                width: scope.width,
                height: scope.width,
                min: scope.min,
                max: scope.max,
                step: scope.gaugeStep,
                angleOffset: scope.angleOffset,
                lineCap: scope.linecap,
                fgColor: scope.fgColor,
                angleArc: scope.angleArc,
                change: function (value) {
                    ngModel.$setViewValue(value);
                }
            });
       
            /* setup the watches for property change */
            scope.$watch('width', function () {
                if (typeof scope.width !== 'undefined') {
                    elm.trigger('configure', { width: scope.width, height: scope.width });
                }
            });

            scope.$watch('fgColor', function () {
                if (typeof scope.fgColor !== 'undefined') {
                    elm.trigger('configure', { fgColor: scope.fgColor, inputColor: scope.fgColor });
                }
            });

            scope.$watch('value', function () {
                if (typeof scope.value !== 'undefined') {
                    elm.val(scope.value).trigger('change');
                }
            });

            scope.$watch('min', function () {
                if (typeof scope.min !== 'undefined') {
                    elm.trigger('configure', { "min": scope.min });
                }
            });

            scope.$watch('max', function () {
                if (typeof scope.max !== 'undefined') {
                    elm.trigger('configure', { "max": scope.max });
                }
            });

            scope.$watch('gaugeStep', function () {
                if (typeof scope.gaugeStep !== 'undefined') {
                    elm.trigger('configure', { "step": scope.gaugeStep });
                }
            });

            scope.$watch('angleArc', function () {
                if (typeof scope.angleArc !== 'undefined') {
                    elm.trigger('configure', { "angleArc": scope.angleArc });
                }
            });

            scope.$watch('angleOffset', function () {
                if (typeof scope.angleOffset !== 'undefined') {
                    elm.trigger('configure', { "angleOffset": scope.angleOffset });
                }
            });
        },
    }
});