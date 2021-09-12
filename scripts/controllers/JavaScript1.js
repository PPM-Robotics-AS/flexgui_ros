//move an item in the array helper
function array_move(arr, old_index, new_index) {
    if (new_index >= arr.length) {
        var k = new_index - arr.length + 1;
        while (k--) {
            arr.push(undefined);
        }
    }
    arr.splice(new_index, 0, arr.splice(old_index, 1)[0]);
    return arr;
};

//rename the tooltip from jQuery UI
$.widget.bridge('uitooltip', $.ui.tooltip);
$(".info_w_tooltip").uitooltip();

//create the project obkect
var project = {
    // statuc icons on the camera screen
    status: {
        light: true,
        tray: true
    },
    // project init
    init: () => {
        //console.log("Init complete");
    },
    // host root url
    root: 'http://' + window.location.host,
    // helpers
    helpers: {
        dropdownValue: function (arr, prop) {
            return arr.map(el => {
                return el[prop];
        }).filter((v, i, s) => {
            return s.indexOf(v) === i;
}).sort().join(",");
}
},
// screen view models and actions
screenData: {
    "New measurement": {
        // new measurement and its properties
        measurement: {
                name: "", //name of the measurement
                project: "", // project name 
                preset: "", // selected preset's name
                msMethod: "" // selected ms method
        },
        // state of the start button
        get isStartEnabled() {
            return this.measurement.name != "" &&
                this.measurement.project != "" &&
                this.measurement.preset != "";
        },
        // screen initializer
        init: function (params) {
            if (!params) return;

            if (params.create) {
                this.measurement.name = "";
                this.measurement.project = "";
                this.measurement.preset = "";

                return;
            }

            if (params.project) {
                this.measurement.project = params.project;
            }

            if (params.preset) {
                this.measurement.preset = params.preset;
            }
        },
        // action after the screen is loaded
        onLoad: function () {

        }
    },
    "Presets": {
        // currently selected preset's id
            selected: null,
        // currently selected preset
			get selectedPreset() {
			    this.paramSets.find(el => {
			        return el.DT_RowId == this.selected
			    });
			},
        // preset list example
            paramSets: [{
                "DT_RowId": "row_0",
                "name": "A",
                "wellplate": "Wellplate 96",
                "msMethodName": "MS Method 1",
                "measurements": "134"
            },
				{
				    "DT_RowId": "row_1",
				    "name": "Measurement param set 1",
				    "wellplate": "Wellplate 96",
				    "msMethodName": "MS Method 1",
				    "measurements": "1"
				},
				{
				    "DT_RowId": "row_2",
				    "name": "Measurement param set 13",
				    "wellplate": "Wellplate 48",
				    "msMethodName": "ABCD",
				    "measurements": "43"
				},
				{
				    "DT_RowId": "row_3",
				    "name": "Why am I doing this?",
				    "wellplate": "Wellplate 8",
				    "msMethodName": "MS Method 4A",
				    "measurements": "21"
				},
				{
				    "DT_RowId": "row_4",
				    "name": "Lorem 2",
				    "wellplate": "Wellplate 10",
				    "msMethodName": "MS Method 2",
				    "measurements": "4"
				},
				{
				    "DT_RowId": "row_5",
				    "name": "Zombi",
				    "wellplate": "Wellplate 20",
				    "msMethodName": "MS Method 13",
				    "measurements": "2"
				}
            ],
        // screen initializer
            init: function (params) {
                this.selected = null;
            },
        // action after the screen is loaded
            onLoad: function () {
                var tableTemplate = `<table id="dtTable" class="display" style="width:100%">
						<thead>
							<tr>
								<th>Name</th>
								<th>MS Method</th>
								<th>Wellplate</th>
								<th>Measurements</th>
							</tr>
						</thead>
						<tfoot>
							<tr>
								<th>Name</th>
								<th>MS Method</th>
								<th>Wellplate</th>
								<th>Measurements</th>
							</tr>
						</tfoot>
					</table>`;

                $(".tableHolder > div").append(tableTemplate);
                var table = $('#dtTable').DataTable({
                    data: project.currentScreenData.paramSets,
                    columns: [{
                        data: "name"
                    },
						{
						    data: "msMethodName"
						},
						{
						    data: "wellplate"
						},
						{
						    data: "measurements"
						}
                    ],
                    lengthChange: false,
                    rowCallback: function (row, data) {
                        if (data.DT_RowId == project.currentScreenData.selected) {
                            $(row).addClass('selected');
                        } else {
                            $(row).removeClass('selected');
                        }
                    }
                });

                table.on('draw', function () {
                    project.loading = false;
                    $rootScope.$apply();
                });

                $('#dtTable tbody').on('click', 'tr', function () {
                    var id = this.id;
                    $("#" + project.currentScreenData.selected).toggleClass('selected');
                    if (project.currentScreenData.selected == id) {
                        project.currentScreenData.selected = null;
                    } else {
                        project.currentScreenData.selected = id
                        $(this).toggleClass('selected');
                    }
                    $rootScope.$apply();
                });
            }
    },
    "Main": {
        // screen initializer
            init: function (params) {

            },
        // action after the screen is loaded
            onLoad: function () {

            }
    },
    "Measurements": {
            selected: null,
            measurements: [{
                "id": "0",
                "name": "A1",
                "datetime": "04/05/2019",
                "projectName": "Project 2",
                "msMethodName": "MS Method 1",
                "directory": "C:\\MassLynx\\project 2\\measurement 123"
            },
				{
				    "id": "2",
				    "name": "A2",
				    "datetime": "02/05/2019",
				    "projectName": "Project 2",
				    "msMethodName": "MS Method 1",
				    "directory": "C:\\MassLynx\\project 2\\measurement 1"
				},
				{
				    "id": "3",
				    "name": "A3",
				    "datetime": "04/06/2018",
				    "projectName": "Project 3",
				    "msMethodName": "MS Method 4",
				    "directory": "C:\\MassLynx\\project 3\\measurement 41"
				},
				{
				    "id": "4",
				    "name": "A4",
				    "datetime": "01/01/2019",
				    "projectName": "Project 4",
				    "msMethodName": "MS Method 3",
				    "directory": "C:\\MassLynx\\project 4\\23"
				},
				{
				    "id": "5",
				    "name": "A5",
				    "datetime": "04/05/2019",
				    "projectName": "Project 1",
				    "msMethodName": "MS Method 3",
				    "directory": "C:\\MassLynx\\project 1\\a-12"
				},
				{
				    "id": "6",
				    "name": "Something",
				    "datetime": "30/03/2020",
				    "projectName": "Project 3",
				    "msMethodName": "MS Method 2",
				    "directory": "C:\\MassLynx\\project 3\\1234"
				},
				{
				    "id": "7",
				    "name": "Nothing",
				    "datetime": "14/12/2019",
				    "projectName": "Project 2",
				    "msMethodName": "MS Method 2",
				    "directory": "C:\\MassLynx\\project 2\\asd"
				},
				{
				    "id": "8",
				    "name": "Test 1234",
				    "datetime": "04/05/2019",
				    "projectName": "Project 2",
				    "msMethodName": "MS Method 1",
				    "directory": "C:\\MassLynx\\project 2\\measurement 123"
				}
            ],
        // screen initializer
            init: function (params) {
                this.selected = null;
            },
        // action after the screen is loaded
            onLoad: function () {
                var tableTemplate = `<table id="dtTable" class="display" style="width:100%">
						<thead>
							<tr>
								<th>Name</th>
								<th>Date</th>
								<th>Project</th>
								<th>MS Method</th>
								<th>Location</th>
							</tr>
						</thead>
						<tfoot>
							<tr>
								<th>Name</th>
								<th>Data</th>
								<th>Project</th>
								<th>MS Method</th>
								<th>Location</th>
							</tr>
						</tfoot>
					</table>`;

                $(".tableHolder > div").append(tableTemplate);
                var table = $('#dtTable').DataTable({
                    data: project.currentScreenData.measurements,
                    columns: [{
                        data: "name"
                    },
						{
						    data: "datetime"
						},
						{
						    data: "projectName"
						},
						{
						    data: "msMethodName"
						},
						{
						    data: "directory"
						}
                    ],
                    lengthChange: false,
                    rowCallback: function (row, data) {
                        if (data == project.currentScreenData.selected) {
                            $(row).addClass('selected');
                        } else {
                            $(row).removeClass('selected');
                        }
                    }
                });

                table.on('draw', function () {
                    project.loading = false;
                    $rootScope.$apply();
                });

                $('#dtTable tbody').on('click', 'tr', function () {
					
                    console.log(table.row(this).data());
					
                    var data = table.row(this).data();
                    $(".selected").removeClass('selected');
                    if (project.currentScreenData.selected == data) {
                        project.currentScreenData.selected = null;
                    } else {
                        project.currentScreenData.selected = data
                        $(this).toggleClass('selected');
                    }
                    $rootScope.$apply();
                });
            }
    },
    "New preset": {
            preset: {
                _wellplate: "",
				get wellplate() {
				    return this._wellplate;
				},
				set wellplate(v) {
				    //selected wellplate dummy
				    this._wellplate = v;
				    //redraw the plate
				    project.currentScreenData.wellplate.options.wellplate = this.wellplateProperties;
				    project.currentScreenData.wellplate.redraw();
				    //refresh the table to update the wellIds
				    project.currentScreenData.refreshTable();
					
				    project.currentScreenData.history.save();
				},
				get wellplateProperties(){
				    var defaults = {
				        row: 0,
				        col: 0,
				        length: 0,
				        height: 0,
				        width: 0,
				        firstRow: 0,
				        firstCol: 0,
				        rowDist: 0,
				        colDist: 0,
				        size: 0
				    }
					
				    var data =  project.screenData["Wellplates"].wellplates.find(el => {
				        return el.name == this.wellplate
				    }) || defaults;
					
				    return data;
				},
                _measurementOrder: [],
				get measurementOrder() { return this._measurementOrder },
				set measurementOrder(v){ this._measurementOrder = v; project.currentScreenData.history.save(); },
                _ipr: "",
				get ipr() { return this._ipr },
				set ipr(v){ this._ipr = v; project.currentScreenData.history.save(); },
                _msMethod: "",
				get msMethod() { return this._msMethod },
				set msMethod(v){ this._msMethod = v; project.currentScreenData.history.save(); },
                _save: "",
				get save() { return this._save },
				set save(v){ this._save = v; project.currentScreenData.history.save(); }
            },
        editWellSettings: {
            //TODO: do this for freq, shots, pattern and focal length as well
                freq: 0,
                shots: 0,
                pattern: "",
                focalLength: 0,
				get power(){
				    if (project.currentScreenData.selectedRows.length == 0){ 
				        return 0;
				    }
				    if (project.currentScreenData.selectedRows.length > 1){ 
				        if (project.currentScreenData.selectedRows.every(el => { return el.power == project.currentScreenData.selectedRows[0].power})){
				            return project.currentScreenData.selectedRows[0].power;
				        } else return 0;
				    }
				    if (project.currentScreenData.selectedRows.length == 1){ 
				        return project.currentScreenData.selectedRows[0].power;
				    }
				},
            set power(v){
                project.currentScreenData.selectedRows.forEach(el => {
                    el.power = v;
            });
            project.currentScreenData.history.save();
            project.currentScreenData.refreshTable();
        }
    },
    ordering: {
            _current: "Custom",
            get current() {
                return this._current;
            },
        set current(v) {
            this._current = v;

            try {

                if (v == "A1 A2 A3 B1 B2 B3") {
                    project.screenData["New preset"].preset.measurementOrder = this.row();
                } else if (v == "A1 A2 A3 B3 B2 B1") {
                    project.screenData["New preset"].preset.measurementOrder = this.row(true);
                } else if (v == "A1 B1 A2 B2 A3 B3") {
                    project.screenData["New preset"].preset.measurementOrder = this.col();
                } else if (v == "A1 B1 B2 A2 A3 B3") {
                    project.screenData["New preset"].preset.measurementOrder = this.col(true);
                } else if (v == "Random") {
                    project.screenData["New preset"].preset.measurementOrder = this.shuffle();
                } else {
                    return;
                }
            } catch (e) {
                //console.log(e);
            }

            project.screenData["New preset"].selectedRows = [];
            project.screenData["New preset"].refreshTable();
        },
            moveUp: function () {
                var rows = project.screenData["New preset"].selectedRows;
					
                for (var i = 0; i < rows.length; i++) {
                    var idx = project.screenData["New preset"].preset.measurementOrder.indexOf(rows[i]);
                    if (idx - 1 >= 0){
                        project.screenData["New preset"].preset.measurementOrder = array_move(project.screenData["New preset"].preset.measurementOrder, idx, idx - 1);
                    }
                }
					
                project.screenData["New preset"].ordering.current = "Custom";
                project.screenData["New preset"].refreshTable();
            },
            moveDown: function () {
                var rows = project.screenData["New preset"].selectedRows.sort((a,b) => project.screenData["New preset"].preset.measurementOrder.indexOf(a) - project.screenData["New preset"].preset.measurementOrder.indexOf(b));
					
                console.log(rows);
					
                for (var i = rows.length - 1; i >= 0; i--) {
						
                    var idx = project.screenData["New preset"].preset.measurementOrder.indexOf(rows[i]);
                    console.log(rows[i], idx);
						
                    if (idx + 1 != project.screenData["New preset"].preset.measurementOrder.length){
                        project.screenData["New preset"].preset.measurementOrder = array_move(project.screenData["New preset"].preset.measurementOrder, idx, idx + 1);
                    }
                }
					
                project.screenData["New preset"].ordering.current = "Custom";
                project.screenData["New preset"].refreshTable();
            },
            row: function (alternate = false) {
                var retArr = [];
                var oriArr = project.screenData["New preset"].preset.measurementOrder;
                var cols = parseInt(project.screenData["Wellplates"].wellplates.find(el => {
                    return el.name == project.screenData["New preset"].preset.wellplate
                }).col);
                var rows = parseInt(project.screenData["Wellplates"].wellplates.find(el => {
                    return el.name == project.screenData["New preset"].preset.wellplate
                }).row);

                //console.log(retArr, oriArr, cols, rows);

                var d = 1;
                for (var r = 1; r <= rows; r++) {
                    for (var c = d == 1 ? 1 : cols; d == 1 ? c <= cols : c > 0;) {
                        var itemsToAdd = oriArr.filter(el => {
                            return el.col == c && el.row == r
                        });
                        //console.log(r, c, itemsToAdd);
                        retArr = retArr.concat(itemsToAdd);

                        c += (d * 1);
                    }

                    if (alternate) d *= -1;
                }

                return retArr;
            },
                col: function (alternate = false) {
                    var retArr = [];
                    var oriArr = project.screenData["New preset"].preset.measurementOrder;
                    var cols = parseInt(project.screenData["Wellplates"].wellplates.find(el => {
                        return el.name == project.screenData["New preset"].preset.wellplate
                    }).col);
                    var rows = parseInt(project.screenData["Wellplates"].wellplates.find(el => {
                        return el.name == project.screenData["New preset"].preset.wellplate
                    }).row);

                    //console.log(retArr, oriArr, cols, rows);

                    var d = 1;
                    for (var c = 1; c <= cols; c++) {
                        for (var r = d == 1 ? 1 : rows; d == 1 ? r <= rows : r > 0;) {
                            var itemsToAdd = oriArr.filter(el => {
                                return el.col == c && el.row == r
                            });
                            //console.log(r, c, itemsToAdd);
                            retArr = retArr.concat(itemsToAdd);

                            r += (d * 1)
                        }

                        if (alternate) d *= -1;
                    }

                    return retArr;
                },
                        shuffle: function () {
                            var array = project.screenData["New preset"].preset.measurementOrder;
                            var currentIndex = array.length,
                                temporaryValue, randomIndex;

                            // While there remain elements to shuffle...
                            while (0 !== currentIndex) {

                                // Pick a remaining element...
                                randomIndex = Math.floor(Math.random() * currentIndex);
                                currentIndex -= 1;

                                // And swap it with the current element.
                                temporaryValue = array[currentIndex];
                                array[currentIndex] = array[randomIndex];
                                array[randomIndex] = temporaryValue;
                            }

                            return array;
                        }
                },
                selectedRows: [],
                _zoom: 2.3,
                get deleteEnabled() {
                    return this.selectedRows.length > 0
                },
                deleteRows: function () {
                    this.selectedRows.forEach(el => {
                        this.preset.measurementOrder.splice(this.preset.measurementOrder.indexOf(el), 1);
                })

            this.selectedRows = [];
                this.refreshTable();
                this.wellplate.redraw();
            },
        camera: {
                url: "",
                _top: -15,
                _left: -32,
				get top() {
				    return project.currentScreenData.camera._top * project.currentScreenData.zoom / 2.3;
				},
            set top(v) {
                return;
            },
            get left() {
                return project.currentScreenData.camera._left * project.currentScreenData.zoom / 2.3;
            },
            set left(v) {
                return;
            },
            get width() {
                return 786 * project.currentScreenData.zoom / 2.3
            },
            get height() {
                return 533 * project.currentScreenData.zoom / 2.3
            }
        },
    get rowIdPrefix() {
        return "mo_row_";
    },
    get zoom() {
        return this._zoom;
    },
    set zoom(v) {
        this._zoom = v;
        this.wellplate.options.zoom = this.zoom;
        this.wellplate.redraw();
    },
        addPowerMeasurement: function () {
            this.preset.measurementOrder.push({
                row: 0,
                col: 0,
                get id() { return id: e.row == 0 && e.col == 0 ? 0 : (parseInt(e.row) - 1) * project.screenData["New preset"].wellplate.options.wellplate.col + parseInt(e.col) }
            });
            this.refreshTable();
            var $scrollBody = $(this.orderTable.table().node()).parent();
            $scrollBody.scrollTop($scrollBody.get(0).scrollHeight);
        },
        saveState: function () {
            this.savedState = {};
            Object.assign(this.savedPreset, {
                preset: {
                    measurementOrder: this.preset.measurementOrder,
                    wellplate: this.preset.wellplate,
                    ipr: this.preset.ipr,
                    msMethod: this.preset.msMethod
                }
            });
        },
        restoreState: function () {
            if (!this.savedState) return;

            this.preset = this.savedState.preset;
        },
        settings: {
                getWellplateSettings: function() {
                    return {
                        wellplate: project.currentScreenData.preset.wellplateProperties,
                        zoom: project.currentScreenData.zoom,
                        onWellClick: function (r, c, remove) {
                            if (remove) {
                                var item = project.currentScreenData.preset.measurementOrder.find(el => {
                                    return el.row == r && el.col == c
                                });
                                if (item) {
                                    var idx = project.currentScreenData.preset.measurementOrder.indexOf(item);
                                    project.currentScreenData.preset.measurementOrder.splice(idx, 1);
                                }
                            } else {
                                var item = {
                                    row: r,
                                    col: c,
                                    power: 0.0,
                                    freq: 0,
                                    shots: 0,
                                    focalLength: 0,
                                    pattern: "",
                                    get id() { return id: e.row == 0 && e.col == 0 ? 0 : (parseInt(e.row) - 1) * project.screenData["New preset"].wellplate.options.wellplate.col + parseInt(e.col) }
                                }

                                project.currentScreenData.preset.measurementOrder.push(item);
                            }
                        },
                        onSelectionFinished: function () {
                            $rootScope.$apply(function () {
                                project.currentScreenData.history.save();
                                project.currentScreenData.ordering.current = "Custom";
                                project.currentScreenData.refreshTable();
                                var $scrollBody = $(project.currentScreenData.orderTable.table().node()).parent();
                                $scrollBody.scrollTop($scrollBody.get(0).scrollHeight);
                                project.currentScreenData.wellplate.redraw();
                            });
                        },
                        id: "myWellplate",
                        selected: project.currentScreenData.preset.measurementOrder,
                        onLoaded: function () {
                            $rootScope.$apply(function () {
                                project.loading = false;
                            });
                        }
                    }
                },
                getTableSettings: function(){
                    return {
                        data: project.currentScreenData.orderList,
                        scrollY: "280px",
                        info: false,
                        bSort: false,
                        scrollCollapse: true,
                        columns: [{
                            data: "order"
                        },
							{
							    data: "id"
							},
							{
							    data: "row"
							},
							{
							    data: "col"
							}
                        ],
                        paging: false,
                        lengthChange: false,
                        rowCallback: function (row, data) {
                            if (project.currentScreenData.orderTable && $.inArray(data, project.currentScreenData.selectedRows) !== -1) {
                                $(row).addClass('selected');
                            }
                            if (data.id == 0) {
                                $(row).addClass('highlight');
                            }
                        }
                    }
                }
        },
        history: {
                reset: function() {
                    //reset the history
                    this.states = [Immutable.Map({ presetJSON: JSON.stringify(project.currentScreenData.preset) })];
                    this.currentHistoryIndex = 0;
                },
                apply: function() {
                    //console.log("Trying to apply");
                    var preset = JSON.parse(this.states[this.currentHistoryIndex].get('presetJSON'));
                    //console.log("Goint back to: ", preset);
                    Object.keys(project.currentScreenData.preset).forEach(function(k){
                        if (k.indexOf("_") == 0){
                            //console.log("Set ",k,preset[k]);
                            project.currentScreenData.preset[k] = preset[k]
                        }
                    });
					
                    //refresh table and redraw wellplate
                    project.currentScreenData.wellplate.options.wellplate = project.currentScreenData.preset.wellplateProperties;
                    project.currentScreenData.wellplate.selected = project.currentScreenData.preset.measurementOrder;
					
                    project.currentScreenData.wellplate.redraw();
                    project.currentScreenData.refreshTable();
                },
            //state list
                states: null,
            //current index in the history
                currentHistoryIndex: 0,
                undo: function(){
                    if (this.currentHistoryIndex > 0) this.currentHistoryIndex--;
                    this.apply();
                },
                redo: function(){
                    if (this.currentHistoryIndex < this.states.length) this.currentHistoryIndex++;
                    this.apply();
                },
                operation: function(fn){
                    this.states = this.states.slice(0, this.currentHistoryIndex + 1);
    
                    // create a new version of the data by applying
                    // a given function to the current head
                    var newVersion = fn(this.states[this.currentHistoryIndex]);
					
                    // add the new version to the history list and increment
                    // the index to match
                    this.states.push(newVersion);
                    this.currentHistoryIndex++;
					
                    //console.log("SAVED", this);
                },
                save: function(){
                    this.operation(function(data) {
                        return data.set('presetJSON', JSON.stringify(project.currentScreenData.preset));
                    });
                }
        },
        // screen initializer
        init: function (params) {
            this.selectedRows = [];
            this.history.reset();
            if (!params) {
                this.isViewMode = false;
                return;
            }

            if (params.mode == "view") {
                this.isViewMode = true;
            }
				
            if (params.preset) {
                this.preset = preset;
            }
        },
        // action after the screen is loaded
        onLoad: function () {
            var tableTemplate = `<table id="dtTable" class="display" style="width:100%">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Well id</th>
                            <th>Row</th>
                            <th>Column</th>
                        </tr>
                    </thead>
                </table>`;

            project.loading = true;

				
            //append the table
            $(".orderHolder > div").append(tableTemplate);
            project.currentScreenData.orderTable = $('#dtTable').DataTable(project.currentScreenData.settings.getTableSettings());
            project.currentScreenData.wellplate = $(".wellPlateHolder > div").Wellplate(project.currentScreenData.settings.getWellplateSettings());	
				
            //make the list sortable with drag and drop
            $('tbody', $('#dtTable')).sortable({
                start: function (e, ui) {
                    // creates a temporary attribute on the element with the old index
                    $(this).attr('data-previndex', ui.item.index());						
                },
                update: function (e, ui) {
                    // gets the new and old index then removes the temporary attribute
                    var newIndex = ui.item.index();
                    var oldIndex = $(this).attr('data-previndex');
                    $(this).removeAttr('data-previndex');
                    // move the element
                    array_move(project.currentScreenData.preset.measurementOrder, oldIndex, newIndex);
                    // set the ordering to custom
                    project.screenData["New preset"].ordering.current = "Custom";
                    // notify the UI
                    $rootScope.$apply();
                }
            }).on('click', 'tr', function () {
                // Bind click event to rows to be able to select/deselect
                var data = project.currentScreenData.orderTable.row(this).data();
                var index = $.inArray(data, project.currentScreenData.selectedRows);

                //check if already selected or not
                if (index === -1) {
                    project.currentScreenData.selectedRows.push(data);
                } else {
                    project.currentScreenData.selectedRows.splice(index, 1);
                }

                $(this).toggleClass('selected');
                //notify the UI
                $rootScope.$apply();
            });

            // refresh the table
            project.currentScreenData.refreshTable = function () {
                project.currentScreenData.orderTable.clear();
                project.currentScreenData.orderTable.rows.add(project.currentScreenData.orderList);
                project.currentScreenData.orderTable.draw();
            }

            project.loading = false;
        }
    },
    "Status": {
            measurement: {
                project: {
                        projectName: "Hello"
                },
                preset: {
                        name: "Preset 12",
                        msMethod: {
                        name: "MS Method 1"
                        }
                },
                progress: {
                        percent: 30,
                        timeleft: 20
                }
            },
        // screen initializer
        init: function (params) {

        },
        // action after the screen is loaded
        onLoad: function () {


        }
    },
    "Wellplates": {
            selected: null,
            wellplates: [{
                "DT_RowId": "row_0",
                "name": "Plate 96",
                "col": "12",
                "colDist": "4.5",
                "firstCol": "10",
                "firstRow": "10",
                "height": "20",
                "length": "324",
                "row": "8",
                "rowDist": "4.5",
                "size": "20",
                "width": "222"
            },
				{
				    "DT_RowId": "row_1",
				    "name": "Plate 48",
				    "col": "6",
				    "colDist": "4.5",
				    "firstCol": "10",
				    "firstRow": "10",
				    "height": "20",
				    "length": "324",
				    "row": "8",
				    "rowDist": "4.5",
				    "size": "20",
				    "width": "222"
				},
				{
				    "DT_RowId": "row_2",
				    "name": "Plate 24",
				    "col": "6",
				    "colDist": "4.5",
				    "firstCol": "10",
				    "firstRow": "10",
				    "height": "20",
				    "length": "324",
				    "row": "4",
				    "rowDist": "4.5",
				    "size": "20",
				    "width": "222"
				},
				{
				    "DT_RowId": "row_3",
				    "name": "Plate 192",
				    "col": "24",
				    "colDist": "4.5",
				    "firstCol": "10",
				    "firstRow": "10",
				    "height": "20",
				    "length": "648",
				    "row": "8",
				    "rowDist": "4.5",
				    "size": "20",
				    "width": "222"
				}
            ],
        // screen initializer
            init: function (params) {

            },
        // action after the screen is loaded
            onLoad: function () {
                var tableTemplate = `<table id="dtTable" class="display" style="width:100%">
						<thead>
							<tr>
								<th>Name</th>
								<th>Rows</th>
								<th>Columns</th>
								<th>Height</th>
								<th>Length</th>
							</tr>
						</thead>
						<tfoot>
							<tr>
								<th>Name</th>
								<th>Rows</th>
								<th>Columns</th>
								<th>Height</th>
								<th>Length</th>
							</tr>
						</tfoot>
					</table>`;

                $(".tableHolder > div").append(tableTemplate);
                var table = $('#dtTable').DataTable({
                    data: project.currentScreenData.wellplates,
                    columns: [{
                        data: "name"
                    },
						{
						    data: "row"
						},
						{
						    data: "col"
						},
						{
						    data: "height"
						},
						{
						    data: "length"
						}
                    ],
                    lengthChange: false,
                    rowCallback: function (row, data) {
                        if (data.DT_RowId == project.currentScreenData.selected) {
                            $(row).addClass('selected');
                        } else {
                            $(row).removeClass('selected');
                        }
                    }
                });

                table.on('draw', function () {
                    project.loading = false;
                    $rootScope.$apply();
                });

                $('#dtTable tbody').on('click', 'tr', function () {
                    var id = this.id;

                    $("#" + project.currentScreenData.selected).toggleClass('selected');
                    if (project.currentScreenData.selected == id) {
                        project.currentScreenData.selected = null;
                    } else {
                        project.currentScreenData.selected = id
                        $(this).toggleClass('selected');
                    }

                    $rootScope.$apply();
                });
            }
    },
    "Edit wellplate": {
            currentWellplate: null,
        // screen initializer
            init: function (params) {
                if (!params) return;

                if (params.selectedWellplate) {
                    this.currentWellplate = {};
                    Object.assign(this.currentWellplate, params.selectedWellplate);
                }
            },
        // action after the screen is loaded
            onLoad: function () {

            }
    },
    "Projects": {
            selected: null,
            projects: [{
                "DT_RowId": "row_0",
                "datetime": "04/05/2019",
                "projectName": "Project 2",
                "directory": "C:\\MassLynx\\project 2"
            },
				{
				    "DT_RowId": "row_1",
				    "datetime": "02/05/2019",
				    "projectName": "Project 2",
				    "directory": "C:\\MassLynx\\project 2"
				},
				{
				    "DT_RowId": "row_2",
				    "datetime": "04/06/2018",
				    "projectName": "Project 3",
				    "directory": "C:\\MassLynx\\project 3"
				},
				{
				    "DT_RowId": "row_3",
				    "datetime": "01/01/2019",
				    "projectName": "Project 4",
				    "directory": "C:\\MassLynx\\project 4"
				},
				{
				    "DT_RowId": "row_4",
				    "datetime": "04/05/2019",
				    "projectName": "Project 1",
				    "directory": "C:\\MassLynx\\project 1"
				},
				{
				    "DT_RowId": "row_5",
				    "datetime": "30/03/2020",
				    "projectName": "Project 3",
				    "directory": "C:\\MassLynx\\project 3"
				},
				{
				    "DT_RowId": "row_6",
				    "datetime": "14/12/2019",
				    "projectName": "Project 2",
				    "directory": "C:\\MassLynx\\project 2"
				},
				{
				    "DT_RowId": "row_7",
				    "datetime": "04/05/2019",
				    "projectName": "Project 2",
				    "directory": "C:\\MassLynx\\project 2"
				}
            ],
        // screen initializer
            init: function (params) {
                this.selected = null;
            },
        // action after the screen is loaded
            onLoad: function () {
                var tableTemplate = `<table id="dtTable" class="display" style="width:100%">
						<thead>
							<tr>
								<th>Name</th>
								<th>Date</th>
								<th>Saving location</th>
							</tr>
						</thead>
						<tfoot>
							<tr>
								<th>Name</th>
								<th>Date</th>
								<th>Saving location</th>
							</tr>
						</tfoot>
					</table>`;

                $(".tableHolder > div").append(tableTemplate);
                var table = $('#dtTable').DataTable({
                    data: project.currentScreenData.projects,
                    columns: [{
                        data: "projectName"
                    },
						{
						    data: "datetime"
						},
						{
						    data: "directory"
						}
                    ],
                    lengthChange: false,
                    rowCallback: function (row, data) {
                        if (data.DT_RowId == project.currentScreenData.selected) {
                            $(row).addClass('selected');
                        } else {
                            $(row).removeClass('selected');
                        }
                    }
                });

                table.on('draw', function () 
                {
                    project.loading = false;
                    $rootScope.$apply();
                });

                $('#dtTable tbody').on('click', 'tr', function () {
                    var id = this.id;
                    $("#" + project.currentScreenData.selected).toggleClass('selected');
                    if (project.currentScreenData.selected == id) {
                        project.currentScreenData.selected = null;
                    } else {
                        project.currentScreenData.selected = id
                        $(this).toggleClass('selected');
                    }
                    $rootScope.$apply();
                });
            }
    }
},
	get currentScreenData() {
	    return project.screenData[$rootScope.project.currentScreen.properties.name];
	},
	set currentScreenData(v) {
	    project.screenData[$rootScope.project.currentScreen.properties.name] = v;
	},
screenHistory: [],
    prevScreen: function () {
        var screenWithParams = project.screenHistory.pop();
        //console.log("Going back:", screenWithParams)
        project.changeScreen(screenWithParams.from, {}, false);
    },
changeScreen: function (nm, params, saveToHistory = true) {

    if (nm == "Main") {
        this.screenHistory = [];
        #changeScreen(nm);

        return;
    }

    if (saveToHistory)
        project.screenHistory.push({
            to: nm,
            params: params,
            from: $rootScope.project.currentScreen.properties.name
        });

    try {
        project.screenData[nm].init(params);

        #changeScreen(nm);

        project.loading = true;

        if (project.loadTimeout) {
            clearTimeout(project.loadTimeout);
            delete project.loadTimeout;
        }

        project.loadTimeout = setTimeout(function () {
            project.screenData[nm].onLoad();
        }, 500);

    } catch (e) {
        #message("Can not open " + nm + " screen: " + e, #errorMessage);
    }
}
}

$.when(
	//load the required javascripts and css
	$.getScript(project.root + "/files/datatables.js"),
	$.getScript(project.root + "/files/wellplate.js"),
	$.getScript(project.root + "/files/object-watch.js"),
	$.getScript(project.root + "/files/immutable.min.js"),
	$('<link/>', {
	    rel: 'stylesheet',
	    type: 'text/css',
	    href: project.root + "/files/datatables.css"
	}).appendTo('head'),
	$('<link/>', {
	    rel: 'stylesheet',
	    type: 'text/css',
	    href: project.root + "/files/wellplate.css"
	}).appendTo('head'),
	$('<link/>', {
	    rel: 'stylesheet',
	    type: 'text/css',
	    href: project.root + "/files/assets/fontawesome-free-5.10.1-web/css/all.css"
	}).appendTo('head'),
).done(function () {
    project.init();
});

$("body").attr("oncontextmenu", "return false;");

#changeScreen("Main");

return project;