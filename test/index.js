require("sugar");

var mlog = require("mocha-logger"),
    fs = require("fs"),
    async = require("async"),
    microdex = null,
    text = null;

require("chai").should();

describe("Module", function() {
    it("ain't broke", function() {
        microdex = require("../");
    });
});

describe("Search Engine", function() {
    before(function(done) {
        fs.readdir(__dirname + "/corpora", function(err, files) {
            if (err) throw err;
            else {
                files = files.filter(/.*txt/);
                async.map(files, function(file, cb) {
                    fs.readFile(__dirname + "/corpora/" + file, cb);
                }, function(err, results) {
                    if (err) throw err;
                    else {
                        text = { };
                        files.zip(results).forEach(f => {
                            text[f.first().replace(".txt", "")] = f.last().toString().words().inGroupsOf(10).map(g => { 
                                return g.join(' ').compact().trim() 
                            }).compact(true);
                        });
                        
                        done();
                    }
                });
            }
        });
    });
    
    it("can initialize the schema", function() {
        microdex.init(JSON.parse(fs.readFileSync(__dirname + "/config.json")));
    });
    
    it("can create the schema", function(done) {
        this.timeout(300000);
        microdex.schema.create({ 
            minReadCapacity: 100,
            minWriteCapacity: 100
        }, done);
    });

    it.skip("can index the corpus", function(done) {
        this.timeout(3600000);
        async.forEachSeries(Object.keys(text), function(macro, cb) {
            var bytes = text[macro].sum("length"),
                start = Date.create().getTime();
            
            microdex.index("domain", macro, text[macro], function(err) {
                var duration = Date.create().getTime() - start;
                mlog.log(`indexed ${macro} (${bytes.bytes()}) in ${duration.duration()} = ${(bytes / duration).format(2)} kB per sec`);
                cb(err);
            });
        }, done);
    });
    
    it("can search the corpus", function(done) {
        this.timeout(360000);
        microdex.search("domain", "america the beautiful", function(err, results) {
            if (err) throw err;
            results.should.be.an("object");
            results.query.should.be.a("string");
            results.results.should.be.an("array");
            done();
        })
    });
    
    it.skip("can delete the schema", function(done) {
        this.timeout(300000);
        microdex.schema.drop(done);
    });
});