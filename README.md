![Microdex](/package.png "Microdex")

# Microdex

Micro-document full-text index.

## Purpose

Allows search over a large number of small strings (i.e. micro-documents).  Alternatively, allows macro-documents (e.g. a book or a chapter) to be split into micro-documents (e.g. pages or lines) and get more specifically scoped search results.

## Design

The search space has three tiers:

1) Micro-documents (i.e. small strings).
2) Macro-documents, to which the searchable strings belong.
3) Domains, or top-level search segments.  Essentially namespaces.

A query takes place within a domain and returns micro-documents grouped into macro-documents.

So taking the book example above, the domain might be "Shakespeare", and our results might be names of plays and lines within those plays that match supplied keywords.

```javascript
var microdex = require("microdex");

microdex.init();
microdex.schema.create(err => {
    microdex.index("Shakespeare", "Romeo and Juliet", [ /* lines */ ], err => { 
        microdex.search("Shakespeare", "wherefore are thou romeo", (err, results) => {
            console.log(results) // { query: "wherefore...", time: 200, results: [  ] }
        });
    });
});
```

### Features

* Uses AWS DynamoDB as storage and query medium.
* Removes stop words to increase precision.
* Employs English language stemming and phonetics for improved recall.
* Support for query expansion.
* Small string compression to increase capacity.

### Limitations

Per DynamoDB limitations:

* Each macro-document can contain 400kB of micro-documents.
* Each search term within a macro-document can point to 400kB of micro-documents.

## Installation

    npm install microdex

## Setup

```javascript
var microdex = require("microdex");

// Initialize with AWS DynamoDB options + a parallelism option
microdex.init({ });

// Initialize with create options found in Dynq
microdex.schema.create({ }, err => { });
```

## Use

The core API is purposely designed to be very simple.

#### microdex.index(domain, macro, micros, cb)

Indexes one or more micro-documents within a given domain and macro-document.

#### microdex.delete(domain, macro, micros, cb)

Deletes one or more micro-documents within a given domain and macro-document.

#### microdex.search(domain, query, cb)

Searches a domain with a given query.

### Customizations

Internally, `microdex` uses a `lang` module which is customizable.

#### microdex.lang.terms(text)

The terms method is used to extract search terms from a query or micro-document.  Use for your own purposes, or even override it if you dare.

#### microdex.lang.stopwords

An array of stopwords that the `terms` methods removes from text.

#### microdex.lang.addExpansions(term, expansions)

Query expansion adds search terms when it finds base terms.  For example, you might want to search on "university" when you see the word "college".

#### microdex.lang.removeExpansions(term, expansions)

Removes expansions that added with the method above.

#### microdex.lang.metadata(text, data)

Adds metadata to a micro-document that should not be indexed.  This is accomplished by separating the two by a special divider string (see below).  For example, if each micro-document is a line within a macro-document, you may wish to store a line number along with the literal text.

#### microdex.lang.divider

A string that is used as a separator between micro-document text and metadata.