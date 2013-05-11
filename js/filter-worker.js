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
