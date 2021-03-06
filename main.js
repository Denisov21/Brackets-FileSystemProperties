/*
 * Copyright (c) 2014 Andrew MacKenzie
 *
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 */

/*jslint bitwise: true, vars: true, plusplus: true, devel: true, nomen: true,  regexp: true, indent: 4, maxerr: 50 */
/*global define, brackets, Mustache, $ */


define(function (require, exports, module) {
    "use strict";

    // Brackets modules
    var CommandManager      = brackets.getModule("command/CommandManager"),
        Menus               = brackets.getModule("command/Menus"),
        ExtensionUtils      = brackets.getModule("utils/ExtensionUtils"),
		NodeDomain			= brackets.getModule("utils/NodeDomain"),
        ProjectManager      = brackets.getModule("project/ProjectManager"),
        moment              = require("moment"),
        Dialogs             = brackets.getModule("widgets/Dialogs"),
        Strings             = require("strings"),
        propDialogTmpl      = require("text!templates/property-dialog.html");

    var contextMenu         = Menus.getContextMenu(Menus.ContextMenuIds.PROJECT_MENU);

    var fsDomain = new NodeDomain("fsDomain", ExtensionUtils.getModulePath(module, "node/fsDomain"));

    function formatDateTime(theDateTime) {
        return moment(theDateTime).format("ddd, MMM Do YYYY, h:mm:ss a");
    }

    function handleChmod(mode, filePath) {
        fsDomain.exec("handleChmod", filePath, mode)
            .done(function () {
                $("#grpPerms").addClass("success");
                console.log("Permissions changed to: " + mode);
            }).fail(function (err) {
                $("#grpPerms").addClass("error");
                console.error("error in fs.chmod: " + err);
            });
    }

    function readablizeBytes(bytes) {
        var s = ['bytes', 'kB', 'MB', 'GB', 'TB', 'PB'];
        var e = Math.floor(Math.log(bytes) / Math.log(1024));
        return (bytes / Math.pow(1024, e)).toFixed(2) + " " + s[e];
    }

    function showPropertiesDialog(stats, filePath) {
        var modified,
            accessed,
            created,
            modeOctal,
            propDialog,
            sizeText,
            compiledDialog;

        sizeText = readablizeBytes(stats.size);
        modified =  new Date(stats.mtime);
        accessed =  new Date(stats.atime);
        created  =  new Date(stats.ctime);
        modeOctal = (stats.mode & parseInt('777', 8)).toString(8);
        compiledDialog = Mustache.render(propDialogTmpl,
                                         {Strings:  Strings,
                                          fileName: stats.fileName,
                                          size: sizeText,
                                          sizeBytes: stats.size.toLocaleString(),
                                          uid: stats.uid,
                                          gid: stats.gid,
                                          mdate: formatDateTime(modified),
                                          adate: formatDateTime(accessed),
                                          cdate: formatDateTime(created),
                                          perms: modeOctal
                                         });
        propDialog = Dialogs.showModalDialogUsingTemplate(compiledDialog);
        $("#btnPerms").click(function () {
            handleChmod($("#txtPerms").val(), filePath);
        });
    }

    function showProperties() {
        var selectedItem;

        selectedItem = ProjectManager.getSelectedItem();
        fsDomain.exec("getFileProperties", selectedItem._path, selectedItem._name)
            .done(function (stats) {
                showPropertiesDialog(stats, selectedItem._path);
            }).fail(function (err) {
                console.error("error in fs.stat: " + err);
            });

    }
    ExtensionUtils.loadStyleSheet(module, 'styles/main.css');
    CommandManager.register(Strings.PROPERTIES_MENU, "mackenza.cmdShowProperties", showProperties);
    contextMenu.addMenuItem("mackenza.cmdShowProperties", "", Menus.LAST);

});
