iconService.$inject = ['$rootScope', '$sce'];

function iconService($rootScope, $sce) {
    var srv = {
        list: {
            "images/edit.png": {
                base: null
            },
            "images/help.png": {
                base: null
            },
            "images/openBelt.png": {
                base: null
            },
            'images/logo_small.png': {
                base: null
            },
            'images/logo.png': {
                base: null
            }
        },
        add: function (icon, base) {
            if (this.list[icon]) return;

            this.list[icon] = {
                base: base
            }
        },
        get: function (icon, original) {
            var item = this.list[icon];
            if (!item) return null;
            var base = (this.useGlobalBase && !original ? this.globalBase : item.base) || "";
            return  $sce.trustAsResourceUrl(base + icon);
        },
        useGlobalBase: false,
        globalBase: null
    }

    $rootScope.icons = srv;

    return srv;
}