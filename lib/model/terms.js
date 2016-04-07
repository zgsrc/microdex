var async = require("async"),
    lang = require("../util/lang");

module.exports = function(options) {
    return {
        name: "Terms",
        key: { macro: "string", term: "string" },
        read: 5,
        write: 5,
        methods: function(table) {
            this.indexmicros = function(domain, macro, micros, cb) {
                if (!Array.isArray(micros)) {
                    micros = [ micros ];
                }

                var lookup = { };
                micros.forEach(d => { 
                    lang.terms(d).forEach(t => {
                        if (!lookup[t]) lookup[t] = [ ];
                        lookup[t].push(d);
                    });
                });

                async.forEachLimit(Object.keys(lookup), options.parallelism || 2, function(term, cb) {
                    table.edit({ macro: domain + "/" + macro, term: term }).add({ 
                        micros: lookup[term]
                    }).upsert(cb);
                }, cb);
            };

            this.delete = function(domain, macro, micros, cb) {
                if (!Array.isArray(micros)) {
                    micros = [ micros ];
                }

                var lookup = { };
                micros.forEach(d => { 
                    lang.terms(d).forEach(t => {
                        if (!lookup[t]) lookup[t] = [ ];
                        lookup[t].push(d);
                    });
                });

                async.forEachLimit(Object.keys(lookup), options.parallelism || 2, function(term, cb) {
                    table.edit({ macro: domain + "/" + macro, term: term }).remove({ 
                        micros: lookup[term]
                    }).upsert(cb);
                }, cb);
            };

            this.search = function(plan, cb) {
                table.getAll(plan.map(step => {
                    return step.macros.map(macro => {
                        return { macro: step.domain + "/" + macro, term: step.term };
                    });
                }).flatten(), cb);
            };
        }
    };
};