//'use strict';

/* Model Module */

var facetsModel = angular.module('facetsModel', []);

//angular.module('ermrestApp').factory('FacetsData', function() {
facetsModel.factory('FacetsData', function() {
	return {
		'box': {},
		'chooseColumns': {},
		'collectionsPredicate': '',
		'colsDefs': [],
		'colsDescr': {},
		'colsGroup': {},
		'datasetFiles': {},
		'denormalizedView': {},
		'detailColumns': [],
		'detailRows': [],
		'details': false,
		'enabledFilters': {},
		'entryRow': [],
		'entityPredicates': [],
		'entry3Dview': '',
		'entrySubtitle': '',
		'entryTitle': '',
		'ermrestData': [],
		'facetClass': {},
		'facetPreviousValues': {},
		'facets': [],
		'files': [],
		'filterAllText': '',
		'filterOptions': {
			filterText: "",
			useExternalFilter: true
		},
		'filterSearchAllTimeout': null,
		'filterSliderTimeout': null,
		'filterTextTimeout': null,
		'level': 0,
		'linearizeView': {},
		'isDetail': false,
		'maxPages': 0,
		'metadata': {},
		'modalIndex': -1,
		'moreFlag': false,
		'narrow': {},
		'pageMap': {},
		'pageNavigation': false,
		'pagingOptions': {
			pageSizes: [25, 50, 100],
			pageSize: 25,
			currentPage: 1},
			'pageRange': [],
			'ready': false,
			'score': [],
			'searchFilter': '',
			'searchFilterTimeout': null,
			'searchFilterValue': {},
			'selectedEntity': null,
			'sortColumns': [''],
			'sortDirection': 'asc',
			'sortDirectionOptions': ['asc', 'desc'],
			'sortFacet': '',
			'sortInfo': {'fields': [], 'directions': []},
			'spinner': [],
			'table': '',
			'tables': [],
			'tablesStack': [],
			'tag': null,
			'tagPages': 5,
			'textEntryRow': [],
			'tiles': [],
			'totalServerItems': 0,
			'tree': [],
			'view': 'list',
			'viewer3dFile': []
	};
});
