/* This config tests functionalities with:
 - headTitle
 - customCSS
*/

var chaiseConfig = {
    name: "Sample",
    layout: 'list',
    confirmDelete: true,
    navbarBrandText: 'Something.jpg',
    navbarBrand: '/',
    navbarBrandImage: 'something.jpg',
    logoutURL: '/image-annotation',
    headTitle: 'some sample title 23423lkj42;l31j4',
    customCSS: '/path/to/custom/css',
    dataBrowser: '',
    maxColumns: 6,
    showUnfilteredResults: false,
    defaultAnnotationColor: 'red',
    feedbackURL: 'http://goo.gl/forms/f30sfheh4H',
    helpURL: '/help/using-the-data-browser/',
    showBadgeCounts: false,
    recordUiGridEnabled: false,
    recordUiGridExportCSVEnabled: true,
    recordUiGridExportPDFEnabled: true,
    editRecord: true,
    showDeleteButton: true,
    tour: {
      pickRandom: false,
      searchInputAttribute: "Data",
      searchChosenAttribute: "Data Type",
      searchInputValue: "micro",
      extraAttribute: "Mouse Anatomic Source",
      chosenAttribute: "Data Type",
      chosenValue: "Expression microarray - gene"
    },
    navbarMenu: {
        newTab: true,
        children: [
            {
                // This "Search" menu item has 2 nested dropdowns.
                // Use the "name" key to label a menu item.
                // Use the "children" key to specify dropdowns; you can nest as many dropdowns as you need.
                name: "Search",
                children: [
                    {
                        name: "Search 1",
                        children: [
                            {
                                name: "Search 1.1",
                                url: "/chaise/search/#1/YOUR_CATALOG:YOUR_SCHEMA"
                            }
                        ]
                    }
                ]
            },
            {
                // This "Create" menu item doesn't have any dropdowns.
                // Use the "url" key to specify this menu item's url and to signal that it doesn't have any children.
                // URLs can be absolute or relative to the document root.
                name: "Create",
                url: "/chaise/recordedit/#1/YOUR_CATALOG:YOUR_SCHEMA"
            }
        ]
    }
};

if (typeof module === 'object' && module.exports && typeof require === 'function') {
    exports.config = chaiseConfig;
}