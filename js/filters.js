(function () {
    "use strict";

    var Filters = {
        items: [],
        onprogress: null,

        addFilter: function (f) {
            f.id = this.items.length;
            this.items.push(f);
        },

        setProgressCallback: function(callback) {
            this.onprogress = callback;
        },

        notifyProgress: function(imageData, x, y, filter) {
            if (this.onprogress) {
                // we use y axis as indicator of progress
                this.onprogress(parseInt((y / imageData.height) * 100), filter);
            }
        },

        getFilter: function (index) {
            return this.items[index];
        },

        getFilterByName: function (name) {
            for (var i = 0; i < this.items.length; i++) {
                if (this.items[i].name === name) {
                    return this.items[i];
                }
            }

            return null;
        }
    };

    //
    // "None" filter
    //
    Filters.addFilter({
        name: "None",
        apply: function (imageData) {
            return;
        }
    });

    //
    // "Weighted Grayscale" filter
    //
    Filters.addFilter({
        name: "Weighted Grayscale",
        apply: function (imageData) {
            var w = imageData.width, h = imageData.height;
            var data = imageData.data;
            var index;
            for (var y = 0; y < h; ++y) {
                for (var x = 0; x < w; ++x) {
                    index = (x + y * imageData.width) * 4;
                    var luminance = parseInt((data[index + 0] * 0.3) + (data[index + 1] * 0.59) + (data[index + 2] * 0.11));
                    data[index + 0] = data[index + 1] = data[index + 2] = luminance;
                }

                Filters.notifyProgress(imageData, x, y, this);
            }

            Filters.notifyProgress(imageData, w, h, this);
        }
    });

    //
    // "Simple Grayscale" filter
    //
    Filters.addFilter({
        name: "Simple Grayscale",
        apply: function (imageData) {
            var w = imageData.width, h = imageData.height;
            var data = imageData.data;
            var index;
            for (var y = 0; y < h; ++y) {
                for (var x = 0; x < w; ++x) {
                    index = (x + y * imageData.width) * 4;
                    var luminance = parseInt(data[index + 0] + data[index + 1] + data[index + 2]) / 3;
                    data[index + 0] = data[index + 1] = data[index + 2] = luminance;
                }

                Filters.notifyProgress(imageData, x, y, this);
            }

            Filters.notifyProgress(imageData, w, h, this);
        }
    });

    //
    // "Invert" filter
    //
    Filters.addFilter({
        name: "Invert",
        apply: function (imageData) {
            var w = imageData.width, h = imageData.height;
            var data = imageData.data;
            var index;
            for (var y = 0; y < h; ++y) {
                for (var x = 0; x < w; ++x) {
                    index = (x + y * imageData.width) * 4;
                    data[index + 0] =  255 - data[index + 0];
                    data[index + 1] = 255 - data[index + 1];
                    data[index + 2] = 255 - data[index + 2];
                }

                Filters.notifyProgress(imageData, x, y, this);
            }

            Filters.notifyProgress(imageData, w, h, this);
        }
    });

    function applyFilterMatrix(imageData, filter) {
        var finalPixel = { r: 0, g: 0, b: 0 },
            filterGrid = filter.filterGrid.grid,
            factor = filter.filterGrid.factor,
            bias = (filter.filterGrid.bias) ? filter.filterGrid.bias : 0.0,
            gridCounter,
            gridValue,
            sourcePixel,
            x, y, x2, y2,
            index,
            width = imageData.width,
            height = imageData.height,
            data = imageData.data,
            buffer = new Uint8Array(data.length * 4),
            filterRange = (Math.sqrt(filterGrid.length) - 1) / 2;

        for (y = 0; y < height; ++y) {
            for (x = 0; x < width; ++x) {
                gridCounter = 0;
                finalPixel.r = finalPixel.g = finalPixel.b = 0;

                for (y2 = -filterRange; y2 <= filterRange; ++y2) {
                    for (x2 = -filterRange; x2 <= filterRange; ++x2) {
                        sourcePixel = getPixel(imageData, x + x2, y + y2);
                        gridValue = filterGrid[gridCounter++];

                        finalPixel.r += sourcePixel.r * gridValue;
                        finalPixel.g += sourcePixel.g * gridValue;
                        finalPixel.b += sourcePixel.b * gridValue;
                    }
                }

                // save pixel in destination buffer
                index = (x + y * width) * 4;
                buffer[index] = Math.min(Math.max(parseInt(finalPixel.r * factor + bias), 0), 255);
                buffer[index + 1] = Math.min(Math.max(parseInt(finalPixel.g * factor + bias), 0), 255);
                buffer[index + 2] = Math.min(Math.max(parseInt(finalPixel.b * factor + bias), 0), 255);
                buffer[index + 3] = data[index + 3];
            }

            Filters.notifyProgress(imageData, x, y, filter);
        }

        Filters.notifyProgress(imageData, width, height, filter);
        copyArrayToImage(imageData, buffer);

        return buffer;
    }

    function getPixel(imageData, x, y) {
        var data = imageData.data, index = 0;

        // normalize x and y and compute index
        x = (x < 0) ? (imageData.width + x) : x;
        y = (y < 0) ? (imageData.height + y) : y;
        index = (x + y * imageData.width) * 4;

        return {
            r: data[index],
            g: data[index + 1],
            b: data[index + 2]
        };
    }

    function copyArrayToImage(imageData, buffer) {
        var len = buffer.length,
            data = imageData.data;
        for (var i = 0; i < len; ++i) {
            data[i] = buffer[i];
        }
    }

    Filters.addFilter({
        name: "Blur",
        filterGrid: {
            factor: 1.0 / 13.0,
            grid: [
                0, 0, 1, 0, 0,
                0, 1, 1, 1, 0,
                1, 1, 1, 1, 1,
                0, 1, 1, 1, 0,
                0, 0, 1, 0, 0
            ]
        },

        apply: function (imageData) {
            applyFilterMatrix(imageData, this);
        }
    });

    Filters.addFilter({
        name: "Motion Blur",
        filterGrid: {
            factor: 1.0 / 9.0,
            grid: [
                1, 0, 0, 0, 0, 0, 0, 0, 0,
                0, 1, 0, 0, 0, 0, 0, 0, 0,
                0, 0, 1, 0, 0, 0, 0, 0, 0,
                0, 0, 0, 1, 0, 0, 0, 0, 0,
                0, 0, 0, 0, 1, 0, 0, 0, 0,
                0, 0, 0, 0, 0, 1, 0, 0, 0,
                0, 0, 0, 0, 0, 0, 1, 0, 0,
                0, 0, 0, 0, 0, 0, 0, 1, 0,
                0, 0, 0, 0, 0, 0, 0, 0, 1
            ]
        },

        apply: function (imageData) {
            applyFilterMatrix(imageData, this);
        }
    });

    Filters.addFilter({
        name: "Horizontal Edges",
        filterGrid: {
            factor: 1.0,
            grid: [
                0, 0, 0, 0, 0,
                0, 0, 0, 0, 0,
                -1, -1, 2, 0, 0,
                0, 0, 0, 0, 0,
                0, 0, 0, 0, 0,
            ]
        },

        apply: function (imageData) {
            applyFilterMatrix(imageData, this);
        }
    });

    Filters.addFilter({
        name: "Vertical Edges",
        filterGrid: {
            factor: 1.0,
            grid: [
                0, 0, -1, 0, 0,
                0, 0, -1, 0, 0,
                0, 0, 4, 0, 0,
                0, 0, -1, 0, 0,
                0, 0, -1, 0, 0,
            ]
        },

        apply: function (imageData) {
            applyFilterMatrix(imageData, this);
        }
    });

    Filters.addFilter({
        name: "Diagonal Edges",
        filterGrid: {
            factor: 1.0,
            grid: [
                -1, 0, 0, 0, 0,
                0, -2, 0, 0, 0,
                0, 0, 6, 0, 0,
                0, 0, 0, -2, 0,
                0, 0, 0, 0, -1
            ]
        },

        apply: function (imageData) {
            applyFilterMatrix(imageData, this);
        }
    });

    Filters.addFilter({
        name: "All Edges",
        filterGrid: {
            factor: 1.0,
            grid: [
                -1, -1, -1,
                -1, 8, -1,
                -1, -1, -1
            ]
        },

        apply: function (imageData) {
            applyFilterMatrix(imageData, this);
        }
    });

    Filters.addFilter({
        name: "Sharpen",
        filterGrid: {
            factor: 1.0,
            grid: [
                -1, -1, -1,
                -1, 9, -1,
                -1, -1, -1
            ]
        },

        apply: function (imageData) {
            applyFilterMatrix(imageData, this);
        }
    });

    Filters.addFilter({
        name: "Subtle Sharpen",
        filterGrid: {
            factor: 1.0 / 8.0,
            grid: [
                -1, -1, -1, -1, -1,
                -1, 2, 2, 2, -1,
                -1, 2, 8, 2, -1,
                -1, 2, 2, 2, -1,
                -1, -1, -1, -1, -1
            ]
        },

        apply: function (imageData) {
            applyFilterMatrix(imageData, this);
        }
    });

    Filters.addFilter({
        name: "Excessive Edges",
        filterGrid: {
            factor: 1.0,
            grid: [
                1, 1, 1,
                1, -7, 1,
                1, 1, 1
            ]
        },

        apply: function (imageData) {
            applyFilterMatrix(imageData, this);
        }
    });

    Filters.addFilter({
        name: "Emboss",
        filterGrid: {
            factor: 1.0,
            bias: 128.0,
            grid: [
                -1, -1, 0,
                -1, 0, 1,
                0, 1, 1
            ]
        },

        apply: function (imageData) {
            applyFilterMatrix(imageData, this);
        }
    });

    //Filters.addFilter({
    //    name: "Emboss Grayscale",
    
    //    apply: function (imageData) {
    //        // apply emboss filter
    //        var embossFilter = Filters.getFilterByName("Emboss");
    //        embossFilter.apply(imageData);

    //        // apply weighted grayscale filter
    //        var grayscaleFilter = Filters.getFilterByName("Simple Grayscale");
    //        grayscaleFilter.apply(imageData);
    //    }
    //});

    //
    // "Pixelate" filter
    //
    Filters.addFilter({
        name: "Pixelate",
        pixelWidth: 10,
        pixelHeight: 10,

        getAverageColor: function (imageData, cx, cy) {
            var avg = [0, 0, 0, 0];
            var data = imageData.data;
            var count = 0;
            var index;
            for (var x = cx; x < (cx + this.pixelWidth); ++x) {
                for (var y = cy; y < (cy + this.pixelHeight); ++y) {
                    index = (x + y * imageData.width) * 4;
                    avg[0] += data[index + 0];
                    avg[1] += data[index + 1];
                    avg[2] += data[index + 2];
                    avg[3] += data[index + 3];
                    ++count;
                }
            }

            avg[0] = avg[0] / count;
            avg[1] = avg[1] / count;
            avg[2] = avg[2] / count;
            avg[3] = avg[3] / count;

            return avg;
        },

        pixelate: function (imageData, cx, cy) {
            var avg = this.getAverageColor(imageData, cx, cy);
            var data = imageData.data;
            var index;
            for (var x = cx; x < (cx + this.pixelWidth); ++x) {
                for (var y = cy; y < (cy + this.pixelHeight); ++y) {
                    index = (x + y * imageData.width) * 4;
                    data[index + 0] = avg[0];
                    data[index + 1] = avg[1];
                    data[index + 2] = avg[2];
                    data[index + 3] = avg[3];
                }
            }
        },

        apply: function (imageData) {
            var w = imageData.width, h = imageData.height;
            var data = imageData.data;
            var index;
            for (var y = 0; y < h; y += this.pixelHeight) {
                for (var x = 0; x < w; x += this.pixelWidth) {
                    this.pixelate(imageData, x, y);
                }

                Filters.notifyProgress(imageData, x, y, this);
            }

            Filters.notifyProgress(imageData, w, h, this);
        }
    });

    // export the Filters object
    App.Namespace.define("InstaFuzz", {
        Filters: Filters
    });
})();
