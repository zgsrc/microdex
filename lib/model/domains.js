var async = require("async"),		
    lang = require("../util/lang");
		
module.exports = function(options) {
    return {
        name: "Domains",
        key: { domain: "string", term: "string" },
        read: 5,
        write: 5,
        methods: function(table) {
            this.addDocuments = function(domain, macro, micros, cb) {
                if (!Array.isArray(micros)) {
                    micros = [ micros ];
                }
		
                var terms = lang.terms(micros.join(' '));
                async.forEachLimit(terms, options.parallelism || 2, function(term, cb) {
                    table.edit({ domain: domain, term: term }).add({ 
                        macros: [ macro ] 
                    }).upsert(cb);
                }, cb);
            };
		
            this.search = function(domain, terms, cb) {
                if (!Array.isArray(terms)) {
                    terms = [ terms ];
                }
		
                table.getAll(terms.map(term => { 
                    return { domain: domain, term: term }; 
                }), cb);
            };
        }
    };
};