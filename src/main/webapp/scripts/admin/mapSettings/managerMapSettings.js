var mMapSettings = {
    pFormAddMap: null,
    validatorFormAddMap: null,
    dtPanel: null,
    dt: null,
    mapThumbnail: null,

    init: function () {

        if (this.dtPanel == null) {
            this.dtPanel = $("#maps-dt");
            this.initDt();
        }

        if (this.pFormAddMap == null) {
            this.pFormAddMap = $("#form-addmap-dialog");

            this.validatorFormAddMap = new Validate({
                form: this.pFormAddMap
            });
        }
        document.getElementById('map-thumbnail').addEventListener('change', this.handleMapImageSelect, false);


    },

    // Init list of Maps (datatable)
    initDt: function () {
        if (this.dt == null) {
            this.dt = this.dtPanel.on('search.dt', function (e) {
                Utils.deselectAllVisibleRows(mMapSettings.dt);
                mMapSettings.toggleButtonsOnSelect();
            }).dataTable({
                "dom": '<"toolbar">frtp',
                "scrollX": true,
                "scrollY": "500px",
                "processing": true,
                "scrollCollapse": true,
                "paginationType": "full",
                "ajax": function (data, callback, settings) {
                    Utils.ajaxCall("./mapConfig?oper=getMapList", "get", "json", data, function (response) {
                        var data = response.result;
                        callback(data);
                    });
                },
                "columns": [
                    {"data": "idMap", "name": "idMap", "title": "ID", "sortable": false, "visible": true},
                    {"data": "mapName", "name": "mapName", "title": LocaleManager.getKey("Manager_Map_Settings_Label_NameMap"), "sortable": true, "visible": true},
                    {"data": "projection", "name": "projection", "title": LocaleManager.getKey("Manager_Map_Settings_Projection_simple"), "sortable": true, "visible": true},
                    {"data": "units", "name": "units", "title": LocaleManager.getKey("Manager_Map_Settings_Units_simple"), "sortable": true, "visible": true}
                ],
                "language": {
                    "url": "scripts/locale/datatable/dt_" + LocaleManager.locale + ".lang"
                },
                "paginate": false
            });

            mMapSettings.toggleButtonsOnSelect();
            this.dt.find("tbody").on('click', 'tr', function (e) {

                if ($(this).hasClass('selected')) {
                    $(this).removeClass('selected');
                } else {
                    Utils.deselectAllVisibleRows(mMapSettings.dt);
                    $(this).addClass('selected');
                }
                mMapSettings.toggleButtonsOnSelect();
            });
        }
    },

    /**
     * Open dialog to insert a new map
     * @Author: Agencia de implementacion
     * */
    openDialogAddMap: function () {
        this.createAddFormPanel();
        Utils.cleanForm(this.pFormAddMap);

        // clean scales, resolutions
        this.populateScales(new Array());
        this.populateResolutions(new Array());

        if (this.pFormAddMap != null)
            if (this.validatorFormAddMap != null) {
                this.validatorFormAddMap.reset();
            }

        this.pFormAddMap.dialog("open");

        return;
    },
    openDialogUpdateMap: function () {
        this.createUpdateFormPanel();
        Utils.cleanForm(this.pFormAddMap);
        if (this.pFormAddMap != null)
            if (this.validatorFormAddMap != null) {
                this.validatorFormAddMap.reset();
            }

        // populate form with existing data
        var selectedRow = Utils.getSelectedRow(this.dt)[0];

        mMapSettings.requests.getMapData(selectedRow.idMap);

        this.pFormAddMap.dialog("open");

        return;
    },
    openDialogDeleteMap: function () {
        var selectedRow = Utils.getSelectedRow(this.dt)[0];
        if (selectedRow.length == 0) {
            AlertDialog.createOkDefaultDialog(
                    LocaleManager.getKey("AlertDialog_Error_Title"),
                    LocaleManaget.getKey("General_No_Dt_Record_Selected")
                    );
            return;
        }

        var buttons = {};
        buttons[LocaleManager.getKey('General_Confirm')] = function () {
            if (selectedRow.idMap != null && selectedRow.idMap != undefined)
                mMapSettings.requests.deleteMap(selectedRow.idMap);
            $(this).dialog("close");
        };

        buttons[LocaleManager.getKey('General_Cancel')] = function () {
            $(this).dialog("close");
        };

        var deleteDialogConfirm = AlertDialog.buildDialog({
            isToCreate: true,
            title: LocaleManager.getKey("General_MsgConfirmTitle"),
            message: LocaleManager.getKey("General_MsgConfirm"),
            type: "question",
            buttons: buttons
        });

        deleteDialogConfirm.data({"mapId": selectedRow.idMap});
        deleteDialogConfirm.dialog("open");

    },

    createUpdateFormPanel: function () {
        $("#form-dialog-header").data("locale_key", "Manager_Map_HeaderForm_Update");
        LocaleManager.refreshLocalizedElement($("#form-dialog-header"));

        //Reset validator
        if (this.validatorFormAddMap) {
            this.validatorFormAddMap.reset();
        }

        var buttons = {};
        buttons[LocaleManager.getKey('General_Cancel')] = function () {
            //Utils.closeDialogForm(mMaps.pFormAddMap);
            $(this).dialog("close");
        };

        buttons[LocaleManager.getKey('General_Save')] = function () {
            //mMaps.submitAddMap();
            var settings = mMapSettings.getDataFromPage();

            var isValid = mMapSettings.validatorFormAddMap.valid();
            if (!isValid) {
                return;
            }

            mMapSettings.requests.updateMap(settings);
            $(this).dialog("close");
        };

        DialogUtils.renderDialog(LocaleManager.getKey("General_TitleForm"), buttons, {
            modal: false,
            resizable: false,
            height: 400,
            width: 700,
            closeFn: function () {
                Utils.cleanForm(this.pFormAddMap);
            }
        }, this.pFormAddMap);

        return this.pFormAddMap;
    },

    createAddFormPanel: function () {
        $("#form-dialog-header").data("locale_key", "Manager_Map_HeaderForm_Add");
        LocaleManager.refreshLocalizedElement($("#form-dialog-header"));

        //Reset validator
        if (this.validatorFormAddMap) {
            this.validatorFormAddMap.reset();
        }

        var buttons = {};
        buttons[LocaleManager.getKey('General_Cancel')] = function () {
            $(this).dialog("close");
        };

        buttons[LocaleManager.getKey('General_Save')] = function () {
            var isValid = mMapSettings.validatorFormAddMap.valid();
            if (!isValid) {
                return;
            }

            var settings = mMapSettings.getDataFromPage();

            delete settings.idMap;

            mMapSettings.requests.addNewMap(settings);
            $(this).dialog("close");
        };

        DialogUtils.renderDialog(LocaleManager.getKey("General_TitleForm"), buttons, {
            modal: false,
            resizable: false,
            height: 400,
            width: 700,
            closeFn: function () {
                Utils.cleanForm(this.pFormAddMap);
            }
        }, this.pFormAddMap);

        return this.pFormAddMap;
    },

    getDataFromPage: function () {
        var settings = new Object();


        settings.thumbnail = this.mapThumbnail;

        settings.idMap = $("#map-input-id").val();
        settings.mapName = $("#name-input").val();

        settings.projection = $("#projection-input").val();
        settings.units = $("#units-input").val();

        //Set mapscale if it is a valid value
        var maxScale = $("#default-maxscale-input").val();
        if (Utils.isFloat(maxScale)) {
            settings.maxScale = maxScale;
        }

        settings.zoom = $("#default-zoomlevel-input").val();
        settings.centerx = $("#centerx-input").val();
        settings.centery = $("#centery-input").val();

        settings.defaultExtentMinX = $("#minx-input").val();
        settings.defaultExtentMinY = $("#miny-input").val();
        settings.defaultExtentMaxX = $("#maxx-input").val();
        settings.defaultExtentMaxY = $("#maxy-input").val();

        settings.showOverview = $("#show_overview").is(":checked");
        settings.dotsPerInch = $("#dots-per-inch-input").val();
        if (settings.dotsPerInch.trim() == "") {
            settings.dotsPerInch = null;
        }

        /*
         * Custom scales / resolutions radio
         */
        var enableCustomScalesResolutionsVal = "";
        var selectedRadio = $("input[type='radio'][name='enable_custom_scales_resolutions']:checked");
        if (selectedRadio.length > 0) {
            enableCustomScalesResolutionsVal = selectedRadio.val();
        }
        settings.enableCustomScalesResolutions = enableCustomScalesResolutionsVal;

        settings.customScales = this.getScalesFromPage();
        settings.customResolutions = this.getResolutionsFromPage();

        settings.roles = [];
        $(".mm_roles").each(function (i, obj) {
            if ($(obj).is(":checked"))
                settings.roles.push(parseInt($(obj).val()));
        });
        return settings;
    },

    refreshDataButtons: function () {
        var numScalesSelected = $("#list_scales .ui-selected").length;
        if (numScalesSelected > 0) {
            $("#scales-delete").show();
        } else {
            $("#scales-delete").hide();
        }

        var numResolutionsSelected = $("#list_resolutions .ui-selected").length;
        if (numResolutionsSelected > 0) {
            $("#resolutions-delete").show();
        } else {
            $("#resolutions-delete").hide();
        }
    },

    handleMapImageSelect: function (evt) {
//            -------------------
//            var maxSize = $("#map-thumbnail").attr("max-size");
//            console.log(maxSize);
//            -------------------

        var image = evt.target.files[0];


        if (image.type.match('image.*')) {
            if (image.size > 100000) {
                $("#map-thumbnail-preview").remove();
                alert(LocaleManager.getKey("Manager_Map_Settings_File_Size_Exceeded"));
            } else {
                var reader = new FileReader();
                reader.onload = (
                        function (f) {
                            return function (e) {
                                var result = e.target.result;
                                mMapSettings.mapThumbnail = result;
                                var span = document.createElement('span');
                                span.innerHTML = ['<img class="thumb" src="', result, '" title="', escape(f.name), '"/>'].join('');
                                document.getElementById('map-thumbnail-preview').insertBefore(span, null);
                            };
                        }

                )(image);
                reader.readAsDataURL(image);
            }
        }
    },

    populatePage: function (settings) {
        $("#map-input-id").val(settings.idMap);
        $("#name-input").val(settings.mapName);
        $("#projection-input").val(settings.projection);
        $("#units-input").val(settings.units);

        $("#map-thumbnail-preview").empty();//always remove thumbnail preview

        if (settings.thumbnail !== void 0) {
            var span = document.createElement('span');
            span.innerHTML = ['<img class="thumb" src="', settings.thumbnail, '"/>'].join('');
            document.getElementById('map-thumbnail-preview').insertBefore(span, null);
        }

        $("#default-maxscale-input").val(settings.maxScale);

        $("#minx-input").val(settings.defaultExtentMinX);
        $("#miny-input").val(settings.defaultExtentMinY);
        $("#maxx-input").val(settings.defaultExtentMaxX);
        $("#maxy-input").val(settings.defaultExtentMaxY);

        $("#show_overview").prop('checked', settings.showOverview);

        $("#dots-per-inch-input").val(settings.dotsPerInch);

        /*
         * Scales / resolutions radio
         */
        $("input[type='radio'][name='enable_custom_scales_resolutions']").prop("checked", false);

        if (settings.enableCustomScalesResolutions === "scales") {
            $("#custom_sr_scales").prop("checked", true);
        } else if (settings.enableCustomScalesResolutions === "resolutions") {
            $("#custom_sr_resolutions").prop("checked", true);
        } else {
            $("#custom_sr_none").prop("checked", true);
        }

        /*
         * Populate scales
         */
        var scaleList = settings.customScales;
        this.populateScales(scaleList);
        /*
         * Populate resolutions
         */
        var resolutionList = settings.customResolutions;
        this.populateResolutions(resolutionList);

        $.ajax({
            url: './roles',
            type: 'POST',
            dataType: 'json',
            data: {oper: 'roles'}
        }).done(function (response) {
            var cont = $("#mm_roles");
            cont.html("");
            $.each(response.result.data, function (i, rol) {
                var chk_cont = $("<tr>", {});
                var chk_cont2 = $("<td>", {'class': 'mm_role_name', 'html': rol.roleName});
                var ops={
                    type: "checkbox",
                    value: rol.idRole,
                    class: "mm_roles",
                };
                if(settings.roles.indexOf(rol.idRole)>-1){
                    ops.checked=true;
                }
                var chk = $("<input>", ops);
                chk_cont2.append(chk);
                chk_cont.append(chk_cont2);
                cont.append(chk_cont);
            });
        });

    },

    populateScales: function (scaleArray) {
        mMapSettings.refreshDataButtons();
        var list = $("#list_scales");
        list.empty();

        if (!Utils.isNullOrUndefined(scaleArray)) {
            Utils.populateListFromArray($("#list_scales"), scaleArray, "scale");
            $(list).selectable({
                stop: function () {
                    mMapSettings.refreshDataButtons();
                }
            });
        }
    },

    getScalesFromPage: function () {
        var scales = [];
        $("#list_scales li").each(function (k, v) {
            var textValue = $(v).text();
            var intValue = parseInt(textValue);
            scales.push(intValue);
        });

        return scales;
    },

    deleteScale: function () {
        $("#list_scales .ui-selected").remove();
    },

    addScale: function () {
        var newValue = $("#scale-input").val();

        /*
         * Test that the value is an integer
         */
        if (!Utils.isInt(newValue)) {
            AlertDialog.createOkDefaultDialog(LocaleManager.getKey("General_Error"), LocaleManager.getKey("Manager_Map_Settings_CustomScale_Integer"), "warning");
            return;
        }

        var currentScaleList = this.getScalesFromPage();
        $("#scale-input").val("");

        currentScaleList.push(parseInt(newValue));
        Utils.orderArrayNumber(currentScaleList);

        this.populateScales(currentScaleList);
    },

    populateResolutions: function (resolutionArray) {
        mMapSettings.refreshDataButtons();
        var list = $("#list_resolutions");
        list.empty();
        if (!Utils.isNullOrUndefined(resolutionArray)) {
            Utils.populateListFromArray($("#list_resolutions"), resolutionArray, "resolution");
            $(list).selectable({
                stop: function () {
                    mMapSettings.refreshDataButtons();
                }
            });
        }
    },

    getResolutionsFromPage: function () {
        var resolutions = [];
        $("#list_resolutions li").each(function (k, v) {
            var textValue = $(v).text();
            var floatValue = parseFloat(textValue);
            resolutions.push(floatValue);
        });

        return resolutions;
    },

    deleteResolution: function () {
        $("#list_resolutions .ui-selected").remove();
    },

    addResolution: function () {
        var newValue = $("#resolution-input").val();

        /*
         * Test that the value is a float
         */
        if (!Utils.isFloat(newValue)) {
            AlertDialog.createOkDefaultDialog(LocaleManager.getKey("General_Error"), LocaleManager.getKey("Manager_Map_Settings_CustomResolution_Float"), "warning");
            return;
        }

        var currentResolutionList = this.getResolutionsFromPage();
        $("#resolution-input").val("");

        currentResolutionList.push(parseFloat(newValue));
        Utils.orderArrayNumber(currentResolutionList);

        this.populateResolutions(currentResolutionList);
    },

    requests: {

        getMapData: function (idMap) {
            Utils.ajaxCallSynch("./mapConfig", "POST", "json", {
                oper: "mapSettings",
                idMap: idMap
            }, function (response) {
                if (response.success) {
                    mMapSettings.populatePage(response.result);
                }
            });
        },
        deleteMap: function (idMap) {
            Utils.ajaxCallSynch("./mapConfig", "POST", "json", {
                oper: "deleteMap",
                idMap: idMap
            }, function (response) {
                if (response.success) {
                    mMapSettings.reloadGrid();
                }
            });
        },

        updateMap: function (settings) {

            Utils.ajaxCallSynch("./mapConfig", "POST", "json", {
                oper: "saveMapSettings",
                settings: JSON.stringify(settings)
            }, function (response) {
                if (response.success) {
                    AlertDialog.createOkDefaultDialog(LocaleManager.getKey("Manager_Item_ConfigSystem"), LocaleManager.getKey("Manager_Config_Saved_Ok"), "info", function () {
                        //Reload
                        mMapSettings.reloadGrid();
                    });
                }
            });
        },

        addNewMap: function (settings) {
            Utils.ajaxCallSynch("./mapConfig", "POST", "json", {
                oper: "createNewMap",
                settings: JSON.stringify(settings)
            }, function (response) {
                if (response.success) {
                    AlertDialog.createOkDefaultDialog(LocaleManager.getKey("Manager_Item_ConfigSystem"), LocaleManager.getKey("Manager_Config_Saved_Ok"), "info", function () {
                        //Reload
                        mMapSettings.reloadGrid();
                    });
                }
            });
        }

    },
    // Enable proper button to enable/disable layerSource
    toggleButtonsOnSelect: function () {
        var selectedRow = Utils.getSelectedRow(this.dt)[0];
        if (!Utils.isNullOrUndefined(selectedRow)) {
            $("#m-maps-delete").show();
            $("#m-maps-update").show();
        } else {
            $("#m-maps-delete").hide();
            $("#m-maps-update").hide();
        }
    },
    reloadGrid: function (callback, resetPaging) {
        this.dt.api().ajax.reload(callback, resetPaging);
    }
};