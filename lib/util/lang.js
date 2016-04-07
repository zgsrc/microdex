require("sugar");

var natural = require("natural"),
    smaz = require("smaz");

var expansion = { };

exports.addExpansions = function(term, expansions) {
    if (expansion[term] == null) {
        expansion[term] = [ ];
    }
    
    expansion[term].add(expansions);
};

exports.removeExpansions = function(term, expansions) {
    if (expansion[term] == null) {
        expansion[term] = [ ];
    }
    
    expansion[term].remove(expansions);
};

exports.divider = "‖";

exports.metadata = function(text, meta) {
    return text + exports.divider + meta;
};

exports.stopwords = natural.stopwords;

exports.terms = function(text) {
    if (text == null || text.trim() == "") {
        return [ ];
    }
    
    if (text.lastIndexOf(exports.divider) > 0) {
        text = text.to(text.lastIndexOf(exports.divider));
    }
    
    text = text.trim();
    text = natural.removeDiacritics(text);
    text = text.replace(/(\W|_)+/g, " ");
    text = natural.normalize(text).join(' ');
    
    var tokens = text.split(/\s+/g).compact(true),
        proper = tokens.filter(t => { 
            return t.capitalize() == t && t.length > 1 && natural.stopwords.indexOf(t.toLowerCase()) < 0; 
        }).map(t => {
            return natural.Metaphone.process(t);
        });
    
    tokens = tokens.map("toLowerCase")
                 .exclude(...exports.stopwords)
                 .map(natural.PorterStemmer.stem)
                 .include(proper)
                 .compact(true)
                 .unique();
    
    tokens.add(tokens.map(t => expansion[t]).flatten().compact(true));
    
    return tokens;
};

exports.compress = smaz.compress;

exports.decompress = smaz.decompress;