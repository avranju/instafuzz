(function () {
    "use strict";

    App.Namespace.define("InstaFuzz.Utils", {
        loadImage: function (url, complete) {
            var img = new Image();
            img.src = url;
            img.onload = function () {
                complete(img);
            };
        }
    });

})();
