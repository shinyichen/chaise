/*
 * Copyright 2016 University of Southern California
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// The Chaise RecordSet module
angular.module('recordset', ['ERMrest'])

// Register the 'context' object which can be accessed by config and other
// services.
.constant('context', {
    chaiseURL: '',  // 'https://www.example.org/chaise
    serviceURL: '', // 'https://www.example.org/ermrest'
    catalogID: '',  // '1'
    schemaName: '', // 'isa'
    tableName: '',  // 'assay'
    filters: [],
    sort: null        // 'column::desc::' ::desc:: is option, ,only allow 1 column
})

// Register configuration work to be performed on module loading.
.config(['context', function(context) {
    // Note that we do not like using angular's '$location' service because
    // it encodes and/or decodes the URL in ways that are incompatible with
    // our applications. We need control of the encoding of the URLs.

    // First, configure the service URL, assuming its this origin plus the
    // typical deployment location for ermrest.
    context.serviceURL = window.location.origin + "/ermrest";

    // Then, parse the URL fragment id (aka, hash). Expected format:
    //  "#catalog_id/[schema_name:]table_name[/{attribute::op::value}{&attribute::op::value}*][@sort(column[::desc::])]"
    var hash = window.location.hash;
    if (hash === undefined || hash == '' || hash.length == 1) {
        return;
    }

    context.chaiseURL = window.location.href.replace(hash, '');
    context.chaiseURL = context.chaiseURL.replace("/recordset/", '');
    console.log(context.chaiseURL);

    // parse out @sort(...)
    if (hash.indexOf("@sort(") !== -1) {
        context.sort = hash.match(/@sort\((.*)\)/)[1];
    }

    // content before @sort
    var parts = hash.split("@sort(")[0];
    var fragment = parts.substring(1).split('/');
    var len = fragment.length;
    context.catalogID = fragment[0];
    if (len > 1) {

        // Parse the schema:table name
        schemaTable = fragment[1].split(':');
        if (schemaTable.length > 1) {
            context.schemaName = schemaTable[0];
            context.tableName = schemaTable[1];
        }
        else {
            context.schemaName = '';
            context.tableName = schemaTable[0];
        }

        // Parse the filters
        if (len>2) {
            // The '/' is also a valid separator for conjunctions but for
            // simplicity we just support '&' at this point. Something for
            // future discussion.
            var conjunction = fragment[2].split('&');
            for (var i in conjunction) {
                var filter = conjunction[i].split("::");
                if (filter.length != 3) {
                    // Currently, this only supports binary predicates, skips others
                    console.log("invalid filter string: " + filter);
                    continue;
                }

                // Push filters as simple (name, op, value) triples
                if (filter[1] === "eq") {
                    context.filters.push({name:filter[0],op:"=",value:filter[2]});
                } else {
                    context.filters.push({name:filter[0],op:"::"+filter[1]+"::",value:filter[2]});
                }
            }
            console.log(context.filters);
        }
    }
}])

// Register the 'recordsetModel' object, which can be accessed by other
// services, but cannot be access by providers (and config, apparently).
.value('recordsetModel', {
    tableName: null,  // table name
    header:[],        // columns display names
    columns: [],      // column names
    filter: null,
    sortby: null,     // column name, user selected or null
    sortOrder: null,  // asc (default) or desc
    rowset:null,      // rows of data
    key: [] ,         // primary key set as an array of Column objects
    count: 0          // total number of rows

})

.factory('pageInfo', ['context', function(context) {
    return {
        loading: true,
        previousButtonDisabled: true,
        nextButtonDisabled: false,
        pageLimit: 10,
        recordStart: 1,
        recordEnd: this.pageLimit
    };
    
}])

// Register the recordset controller
.controller('recordsetController', ['$scope', '$rootScope', 'pageInfo', '$window', 'recordsetModel', 'context', function($scope, $rootScope, pageInfo, $window, recordsetModel, context) {

    $scope.vm = recordsetModel;

    $scope.pageInfo = pageInfo;
    
    pageInfo.recordStart = 1;
    
    pageInfo.recordEnd = pageInfo.pageLimit;
    
    $scope.pageLimit = function(limit) {
        pageInfo.pageLimit = limit;
        $scope.sort();
    };

    $scope.sort = function () {

        // update the address bar
        // page does not reload
        location.replace($scope.permalink());
        $rootScope.location = window.location.href;

        pageInfo.previousButtonDisabled = true;
        pageInfo.nextButtonDisabled = true;

        var sort = [];
        if (recordsetModel.sortby !== null) {
            sort.push({"column": recordsetModel.sortby, "order": recordsetModel.sortOrder});
        }

        for (var i = 0; i < recordsetModel.key.length; i++) { // all the key columns
            var col = recordsetModel.key[i].name;
            if (col !== recordsetModel.sortby) {
                sort.push({"column": col, "order": "asc"});
            }
        }

        pageInfo.loading = true;

        recordsetModel.table.entity.get(recordsetModel.filter, pageInfo.pageLimit, null, sort).then(function (rowset) {
            pageInfo.loading = false;
            console.log(rowset);
            recordsetModel.rowset = rowset;

            // enable buttons
            pageInfo.recordStart = 1;
            pageInfo.recordEnd = pageInfo.recordStart + rowset.length() - 1;
            pageInfo.previousButtonDisabled = true; // on page 1
            pageInfo.nextButtonDisabled = (recordsetModel.count <= pageInfo.recordEnd);
        }, function (response) {
            console.log("Error getting entities: ");
            console.log(response);

            pageInfo.loading = false;

            // enable buttons
            pageInfo.previousButtonDisabled = (pageInfo.recordStart === 1); // on page 1
            pageInfo.nextButtonDisabled = (recordsetModel.count <= pageInfo.recordEnd);
        })
    };

    $scope.sortby = function(column) {
        if (recordsetModel.sortby !== column) {
            recordsetModel.sortby = column;
            recordsetModel.sortOrder = "asc";
            $scope.sort();
        }

    };

    $scope.toggleSortOrder = function () {
        recordsetModel.sortOrder = (recordsetModel.sortOrder === 'asc' ? recordsetModel.sortOrder = 'desc' : recordsetModel.sortOrder = 'asc');
        $scope.sort();
    };

    $scope.permalink = function() {
        var url = window.location.href.replace(window.location.hash, ''); // everything before #
        url = url + "#" + context.catalogID + "/" +
            (context.schemaName !== '' ? context.schemaName + ":" : "") +
            context.tableName;

        if (recordsetModel.filter !== null) {
            url = url + "/" + recordsetModel.filter.toUri();
        }

        if (recordsetModel.sortby !== null) {
            url = url + "@sort(" + recordsetModel.sortby;
            if (recordsetModel.sortOrder === "desc") {
                url = url + "::desc::";
            }
            url = url + ")";
        }
        return url;
    };

    $scope.before = function() {

        if (pageInfo.recordStart > 1) { // not on page 1

            pageInfo.loading = true;

            // disable buttons while loading
            pageInfo.previousButtonDisabled = true;
            pageInfo.nextButtonDisabled = true;

            recordsetModel.rowset.before().then(function (rowset) {
                console.log(rowset);
                $window.scrollTo(0, 0);
                recordsetModel.rowset = rowset;
                pageInfo.recordStart -= pageInfo.pageLimit;
                pageInfo.recordEnd = pageInfo.recordStart + rowset.length() -1;

                pageInfo.loading = false;

                // enable buttons
                pageInfo.previousButtonDisabled = (pageInfo.recordStart === 1); // on page 1
                pageInfo.nextButtonDisabled = (recordsetModel.count <= pageInfo.recordEnd);  // on last page

            }, function (response) {
                console.log(response);

                pageInfo.loading = false;

                // enable buttons
                pageInfo.previousButtonDisabled = (pageInfo.recordStart === 1); // on page 1
                pageInfo.nextButtonDisabled = (recordsetModel.count <= pageInfo.recordEnd);  // on last page
            });
        }
    };

    $scope.after = function() {

        if (pageInfo.recordEnd < recordsetModel.count) { // more records

            pageInfo.loading = true;

            // disable buttons while loading
            pageInfo.previousButtonDisabled = true;
            pageInfo.nextButtonDisabled = true;

            recordsetModel.rowset.after().then(function(rowset) {
                console.log(rowset);

                $window.scrollTo(0, 0);
                recordsetModel.rowset = rowset;
                pageInfo.recordStart += pageInfo.pageLimit;
                pageInfo.recordEnd = pageInfo.recordStart + rowset.length() - 1;

                pageInfo.loading = false;

                // enable buttons
                pageInfo.previousButtonDisabled = (pageInfo.recordStart === 1); // on page 1
                pageInfo.nextButtonDisabled = (recordsetModel.count <= pageInfo.recordEnd);  // on last page

            }, function(response) {
                console.log(response);

                pageInfo.loading = false;

                //enable buttons
                pageInfo.previousButtonDisabled = (pageInfo.recordStart === 1); // on page 1
                pageInfo.nextButtonDisabled = (recordsetModel.count <= pageInfo.recordEnd);  // on last page
            });
        }

    };

    $scope.gotoRowLink = function(index) {
        var row = recordsetModel.rowset.data[index];
        var path = context.chaiseURL + "/record/#" + context.catalogID + "/" + context.schemaName + ":" + context.tableName + "/";
        for (var k = 0; k < recordsetModel.key.length; k++) {
            var key = recordsetModel.key[k].name;
            if (k === 0) {
                path = path + key + "=" + row[key];
            } else {
                path = path + "&" + key + "=" + row[key];
            }
        }

        location.assign(path);
    }


}])

// Register work to be performed after loading all modules
.run(['pageInfo', 'context', 'recordsetModel', 'ermrestServerFactory', '$rootScope', function(pageInfo, context, recordsetModel, ermrestServerFactory, $rootScope) {

    $rootScope.location = window.location.href;
    pageInfo.loading = true;
    recordsetModel.tableName = context.tableName;

    // Get rowset data from ermrest
    var server = ermrestServerFactory.getServer(context.serviceURL);
    server.catalogs.get(context.catalogID).then(function(catalog) {
        console.log(catalog);

        // get table definition
        var table = catalog.schemas.get(context.schemaName).tables.get(context.tableName);
        console.log(table);
        recordsetModel.table = table;
        recordsetModel.columns = table.columns.names();
        recordsetModel.header = table.columns.names();
        console.log(recordsetModel.header);

        // build up filters
        var filter = null;
        var len = context.filters.length;
        if (len == 1) {
          filter = new ERMrest.BinaryPredicate(
            table.columns.get(context.filters[0].name),
            context.filters[0].op,
            context.filters[0].value);
        }
        else if (len > 1) {
          var filters = [];
          for (var i=0; i<len; i++) {
            filters.push(
              new ERMrest.BinaryPredicate(
                table.columns.get(context.filters[i].name),
                context.filters[i].op,
                context.filters[i].value)
            );
          }
          filter = new ERMrest.Conjunction(filters);
        }
        recordsetModel.filter = filter;

        // Key, used for paging
        recordsetModel.key = table.keys.all()[0].colset.columns;

        // sorting
        var sort = [];

        // user selected column as the priority in sort
        // followed by all the key columns
        if (context.sort !== null) {
            if (context.sort.endsWith("::desc::")) {
                recordsetModel.sortby = context.sort.match(/(.*)::desc::/)[1];
                recordsetModel.sortOrder = 'desc';
            } else {
                recordsetModel.sortby = context.sort;
                recordsetModel.sortOrder = 'asc';
            }

            sort.push({"column": recordsetModel.sortby, "order": recordsetModel.sortOrder});
        }

        for (i = 0; i < recordsetModel.key.length; i++) { // all the key columns
            var col = recordsetModel.key[i].name;
            if (col !== recordsetModel.sortby) {
                sort.push({"column": col, "order": "asc"});
            }
        }

        // first get row count
        table.entity.count(filter).then(function(count) {
            recordsetModel.count = count;

            // get rowset from table
            table.entity.get(filter, pageInfo.pageLimit, null, sort).then(function (rowset) {
                console.log(rowset);
                recordsetModel.rowset = rowset;

                pageInfo.loading = false;
                pageInfo.recordStart = 1;
                pageInfo.recordEnd = pageInfo.recordStart + rowset.length() - 1;
                pageInfo.previousButtonDisabled = true;
                pageInfo.nextButtonDisabled = recordsetModel.count <= pageInfo.recordEnd;

            }, function(error) {
                console.log(error);
                pageInfo.loading = false;
                pageInfo.previousButtonDisabled = true;
                pageInfo.nextButtonDisabled = true;
            });
        }, function(response) {
            pageInfo.loading = false;
            pageInfo.previousButtonDisabled = true;
            pageInfo.nextButtonDisabled = true;
            return module._q.reject(response.data);
        });

    });

    window.onhashchange = function() {
        // when address bar changes by user
        if (window.location.href !== $rootScope.location) {
            location.reload();
        }
    }

}])

/* end recordset */;