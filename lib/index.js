require("sugar");

var async = require("async"),
    dynq = require("dynq");

var lang = exports.lang = require("./util/lang");

var schema = exports.schema = null;

exports.init = function(options) {
    schema = exports.schema = dynq.connect(options).schema().require(__dirname + "/model", { 
        parallelism: options.parallelism 
    });
};

exports.index = function(domain, macro, micros, cb) {
    if (micros && micros.length) {
        micros = micros.compact(true).unique();
        async.parallel([
            function(cb) { schema.tables.domains.indexmicros(domain, macro, micros, cb); },
            function(cb) { schema.tables.macros.indexmicros(domain, macro, micros, cb); },
            function(cb) { schema.tables.terms.indexmicros(domain, macro, micros, cb); }
        ], cb);
    }
    else cb();
};

exports.delete = function(domain, macro, micros, cb) {
    if (micros && micros.length) {
        micros = micros.compact(true).unique();
        async.parallel([
            cb => { schema.tables.macros.delete(domain, macro, micros, cb); },
            cb => { schema.tables.terms.delete(domain, macro, micros, cb); }
        ], cb);
    }
    else cb();
};

exports.search = function(domain, query, cb) {
    var startTime = (new Date()).getTime(),
        terms = lang.terms(query);
    
    schema.tables.domains.search(domain, terms, (err, plan) => {
        if (err) cb(err);
        else {
            var macros = plan.map("macros").flatten().compact(true).unique();
            async.parallel([
                cb => { schema.tables.macros.search(domain, macros, cb); },
                cb => { schema.tables.terms.search(plan, cb); }
            ], (err, results) => {
                if (err) cb(err);
                else {
                    results[0].each((e, i) => { 
                        var matches = results[1].filter(r => {
                            return r.macro == e.domain + "/" + e.macro;
                        });
                        
                        var micros = matches.map("micros");
                        e.micros = micros.flatten().compact(true).unique();
                        e.score = micros.sum("length");
                        
                        // Quality over Quantity Heuristic: Bump multi-keyword matches x 5
                        e.score += (e.micros.length - e.score) * 5;
                        
                        delete e.domain;
                    });
                    
                    var sort = results[0].sortBy("score", true),
                        time = (new Date()).getTime() - startTime;
                    
                    cb(null, { 
                        query: query,
                        time: time,
                        results: sort
                    });
                }
            });
        }
    });
};