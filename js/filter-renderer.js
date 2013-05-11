/*
Copyright 2013 Rajasekharan Vengalil

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/

(function () {
    "use strict";

    function FilterRenderer(canvas, filter, backgroundColor) {
        this.canvas = canvas;
        this.size = {
            width: canvas.width(),
            height: canvas.height()
        };
        this.context = this.canvas[0].getContext("2d");
        this.filter = filter;
        this.backgroundColor = backgroundColor;

        // clear background
        this.clearCanvas();
    }

    FilterRenderer.prototype.renderImage = function (img) {
        var imageWidth = img.width;
        var imageHeight = img.height;
        var canvasWidth = this.size.width;
        var canvasHeight = this.size.height;
        var width, height;

        if ((imageWidth / imageHeight) >= (canvasWidth / canvasHeight)) {
            width = canvasWidth;
            height = (imageHeight * canvasWidth / imageWidth);
        } else {
            width = (imageWidth * canvasHeight / imageHeight);
            height = canvasHeight;
        }

        var x = (canvasWidth - width) / 2;
        var y = (canvasHeight - height) / 2;
        this.context.drawImage(img, x, y, width, height);
    };

    FilterRenderer.prototype.clearCanvas = function (color) {
        color = (color) ? color : this.backgroundColor;
        this.context.save();
        this.context.fillStyle = color;
        this.context.fillRect(0, 0, this.size.width, this.size.height);
        this.context.restore();
    };

    // wrapText taken from here: http://www.html5canvastutorials.com/tutorials/html5-canvas-wrap-text-tutorial/
    function wrapText(context, text, x, y, maxWidth, lineHeight) {
        var words = text.split(' ');
        var line = '';

        for (var n = 0; n < words.length; n++) {
            var testLine = line + words[n] + ' ';
            var metrics = context.measureText(testLine);
            var testWidth = metrics.width;
            if (testWidth > maxWidth) {
                context.fillText(line, x, y);
                line = words[n] + ' ';
                y += lineHeight;
            }
            else {
                line = testLine;
            }
        }
        context.fillText(line, x, y);
    }

    function getTextWrapLineCount(context, text, maxWidth, lineHeight) {
        var words = text.split(' ');
        var line = '';
        var lineCount = 1;

        for (var n = 0; n < words.length; n++) {
            var testLine = line + words[n] + ' ';
            var metrics = context.measureText(testLine);
            var testWidth = metrics.width;
            if (testWidth > maxWidth) {
                line = words[n] + ' ';
                ++lineCount;
            }
            else {
                line = testLine;
            }
        }

        return lineCount;
    }

    // This function taken from here: http://stackoverflow.com/a/9847841
    function getTextHeight(fontFamily, fontSize) {
        var text = $('<span style="font-family: ' + fontFamily + '; font-size: ' + fontSize + ';">Hg</span>');
        var block = $('<div style="display: inline-block; width: 1px; height: 0px;"></div>');

        var div = $('<div></div>');
        div.append(text, block);

        var body = $('body');
        body.append(div);

        var result = {};

        try {
            block.css({ verticalAlign: 'baseline' });
            result.ascent = block.offset().top - text.offset().top;

            block.css({ verticalAlign: 'bottom' });
            result.height = block.offset().top - text.offset().top;

            result.descent = result.height - result.ascent;

        } finally {
            div.remove();
        }

        return result;
    };

    FilterRenderer.prototype.renderText = function (text, options) {
        var result, lineHeight, lineCount;

        // setup default options
        options = (options) ? options : {};
        options = $.extend({
            fontFamily: "Calibri, Arial, 'DejaVu Sans', 'Liberation Sans', Freesans, sans-serif",
            fontSize: "10pt",
            fontColor: "rgba(255, 255, 255, 0.25)"
        }, options);

        result = getTextHeight(options.fontFamily, options.fontSize);
        lineHeight = parseInt(result.height);

        this.clearCanvas();
        this.context.save();
        this.context.font = options.fontSize + " " + options.fontFamily;
        this.context.textAlign = "center";
        this.context.fillStyle = options.fontColor;

        lineCount = getTextWrapLineCount(this.context, text, this.size.width - 20, lineHeight);
        wrapText(this.context, text,
                 parseInt(this.size.width / 2),
                 parseInt((this.size.height - (lineCount * lineHeight)) / 2),
                 this.size.width - 40,
                 lineHeight);
        this.context.restore();
    }

    FilterRenderer.prototype.drawProgress = function (progress) {
        // compute size of progress bar
        var psize = {
            width: parseInt(this.size.width * 0.9),
            height: parseInt(this.size.height * 0.02)
        };

        // compute location of progress
        var position = {
            left: (this.size.width - psize.width) / 2,
            top: this.size.height - psize.height - 5,
        };

        // draw progress
        this.context.save();
        this.context.fillStyle = "#c11c1c";
        this.context.fillRect(
            position.left,
            position.top,
            (psize.width * progress) / 100,
            psize.height);
        this.context.restore();
    }

    App.Namespace.define("InstaFuzz", {
        FilterRenderer: FilterRenderer
    });

})();
