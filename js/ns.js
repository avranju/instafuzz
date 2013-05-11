(function (scope) {
    "use strict";

    //
    // define the namespace definition object
    //
    function defineNamespace(ns, props) {
        // "ns" is expected to be a period delimited list of namespace names
        var components = ns.split(".");

        // iterate through each component and create the objects
        var current = scope;
        components.forEach(function (c) {
            if (!(current[c])) {
                current[c] = {};
            }

            current = current[c];
        });

        // add the members
        if (props) {
            for (var p in props) {
                current[p] = props[p];
            }
        }
    }

    // define "App" namespace on "scope"
    defineNamespace("App.Namespace", {
        define: function (ns, props) {
            defineNamespace(ns, props);
        }
    });
})(this);
