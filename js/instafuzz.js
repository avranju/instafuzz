$(function () {
    "use strict";

    var pic = $("#picture");
    var ctx = pic[0].getContext("2d");
    var sourceImage = null;

    // preview filter renderer objects
    var previewRenderers = [];

    // the main renderer
    var mainRenderer = new InstaFuzz.FilterRenderer($("#picture"), null, "#262237");

    // populate the filters control and render default preview image
    InstaFuzz.Utils.loadImage("images/user.png", function (img) {
        var index = 0,
            templHtml = $("#filter-template").html(),
            template = Handlebars.compile(templHtml),
            filtersList = $("#filters-list");

        InstaFuzz.Filters.items.forEach(function (filter) {
            var context = {
                filterName: filter.name,
                filterId: index
            };

            // get the canvas tag for this filter and render the preview image in it
            filtersList.append(template(context));
            var filterContainer = $("div[data-filter-id='" + index.toString() + "']", filtersList);
            var canvas = $("canvas", filterContainer);

            // create and initialize a filter renderer
            var renderer = new InstaFuzz.FilterRenderer(canvas, filter, "rgba(0, 0, 0, 0)");
            previewRenderers.push(renderer);

            // render preview image
            renderer.renderImage(img);

            // add click handler for filter renderer
            filterContainer.bind("click", onApplyFilter);

            ++index;
        });
    });

    function onApplyFilter() {
        var filterId = parseInt($(this).data("filter-id"));
        scheduleFilter(
            filterId,
            mainRenderer,
            sourceImage,
            false,
            filterId === 0);
    }

    // handle "Add" button click
    $("#loadImage").click(function () {
        $("#fileUpload").click();
    });

    function suppressEvent(e) {
        e.stopPropagation();
        e.preventDefault();
    }

    //
    // handle drag/drop of files
    //
    pic.bind("drop", function (e) {
        suppressEvent(e);
        var files = e.originalEvent.dataTransfer.files;
        if (files.length > 0) {
            mainRenderer.renderText("Loading...", { fontSize: "35pt" });
            var reader = new FileReader();
            reader.onloadend = function (e2) {
                drawImageToCanvas(e2.target.result);
            };
            reader.readAsDataURL(files[0]);
        }
    });
    pic.bind("dragover", suppressEvent).bind("dragenter", suppressEvent);

    // handle file selection via file picker dialog
    $("#fileUpload").bind("change", function (e) {
        var filesList = this.files;
        if (filesList.length === 0) {
            return;
        }

        var file = filesList[0];
        drawImageToCanvas(URL.createObjectURL(file));
    });

    function drawImageToCanvas(url) {
        InstaFuzz.Utils.loadImage(url, function (img) {
            // save reference to source image
            sourceImage = img;

            mainRenderer.clearCanvas();
            mainRenderer.renderImage(img);

            // load image filter previews
            loadPreviews(img);
        });
    }

    //
    // start the web worker
    //
    var worker = new Worker("js/filter-worker.js");
    worker.onmessage = function (e) {
        var isPreview = e.data.tag;
        switch (e.data.type) {
            case "image":
                if (isPreview) {
                    previewRenderers[e.data.filterId].context.putImageData(e.data.imageData, 0, 0);
                } else {
                    mainRenderer.context.putImageData(e.data.imageData, 0, 0);
                }

                console.log("Filter took " + e.data.timeTaken + "ms.");
                break;

            case "progress":
                onFilterProgress(
                    e.data.progress,
                    InstaFuzz.Filters.getFilter(e.data.filterId),
                    isPreview);
                break;
        }
    };

    // loads preview image filters for all the filters
    function loadPreviews(img) {
        // iterate through all the filters on the UI
        var index = 0;
        previewRenderers.forEach(function (renderer) {
            scheduleFilter(index, renderer, img, true, true);
            ++index;
        });
    }

    function scheduleFilter(filterId, renderer, img, isPreview, resetRender) {
        if (resetRender) {
            renderer.clearCanvas();
            renderer.renderImage(img);
        }

        // apply filter and render
        var imageData = renderer.context.getImageData(
            0, 0,
            renderer.size.width,
            renderer.size.height);

        worker.postMessage({
            imageData: imageData,
            width: imageData.width,
            height: imageData.height,
            filterKey: filterId,
            tag: isPreview
        });
    }

    // handle progress notification from filters
    function onFilterProgress(progress, filter, isPreview) {
        var renderer = (isPreview) ? previewRenderers[filter.id] : mainRenderer;
        renderer.drawProgress(progress);
    }

    //
    // render drag/drop instructions on the canvas
    //
    mainRenderer.renderText("Click \"Add\" to add image or drag/drop an image file here.", {
        fontSize: "35pt"
    });
});
