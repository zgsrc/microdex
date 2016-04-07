module.exports = {
    name: "Macros",
    key: { domain: "string", macro: "string" },
    read: 5,
    write: 5,
    methods: function(table) {
        this.addDocuments = function(domain, macro, micros, cb) {
            if (!Array.isArray(micros)) micros = [ micros ];
            table.edit({ domain: domain, macro: macro }).add({ 
                micros: micros
            }).upsert(cb);
        };
        
        this.removeDocuments = function(domain, macro, micros, cb) {
            if (!Array.isArray(micros)) micros = [ micros ];
            table.edit({ domain: domain, macro: macro }).remove({ 
                micros: micros
            }).upsert(cb);
        };
        
        this.search = function(domain, macros, cb) {
            table.getAll(macros.map(macro => {
                return { domain: domain, macro: macro };
            }).flatten(), [ "domain" , "macro", "properties" ], cb);
        };
    }
};