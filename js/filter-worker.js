importScripts("ns.js", "filters.js");

var tag = null;
onmessage = function (e) {
    var opt = e.data;
    var imageData = opt.imageData;
    var filter;
    
    tag = opt.tag;
    filter = InstaFuzz.Filters.getFilter(opt.filterKey);

    var start = Date.now();
    filter.apply(imageData);
    var end = Date.now();

    postMessage({
        type: "image",
        imageData: imageData,
        filterId: filter.id,
        tag: tag,
        timeTaken: end - start
    });
}

// handle progress notification from filters
function onFilterProgress(progress, filter) {
    postMessage({
        type: "progress",
        progress: progress,
        filterId: filter.id,
        tag: tag
    });
}

InstaFuzz.Filters.setProgressCallback(onFilterProgress);
