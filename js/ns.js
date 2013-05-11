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
