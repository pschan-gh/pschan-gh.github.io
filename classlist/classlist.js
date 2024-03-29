var sortField = 'undefined';
var groupField = 'undefined';
var headerNames = [];
var sanitizedHeaders = [];
var headerTypes = {};
var baseQuery;
var clickedArray = {};
var wscale = 1;
var colWidths = {};
var primaryDbKeyValues = [];
var primaryDbKey = '';
var primaryKey = '';
var primaryFile = null;
var columnData = new Object();
var webworkFields = ['student_id', 'lname', 'fname', 'status', 'comment', 'section', 'recitation', 'email', 'user_id', 'password', 'permission'];
var mainArray = new Array();

var emailSuffix;
var passwordAutoGen;
var url = new URL(window.location.href);
emailSuffix = url.searchParams.get("email_suffix") ? url.searchParams.get("email_suffix") : '';
passwordAutoGen = url.searchParams.get("password_auto") ? url.searchParams.get("password_auto") : 'false';

function report () {
};

function initializeDB(data, headers, key) {
    $('#mainTable').find('tbody').html('');

    var row;
    var rows = [];
    var field;
    var dbKey = key;
    var dbName = 'csvDB' + JSON.stringify(data).hashCode();

    console.log('DB NAME: ' + dbName);
    console.log(dbName + ' DELETED');

    sortField = key;
    groupField = key;
    primaryKey = key;
    primaryDbKey = dbKey;

    var row;
    var rows = [];

    postInitialization(null, mainArray);
    updateTable(null, mainArray, data, headers, primaryKey, true);

}

function resetTable() {
    $('#mainTable > tbody > tr').remove();
    $('#header_row').html('<th id="th_count" clicked="0" field="count" class="col_count header"><a href="#">#</a><div class="triangle">&#x25BA;</div></th>');

    var hfield;

    sanitizedHeaders.map(function(sfield) {
        hfield = sfield;
        var $th = $("<th>", {"id" : 'th_' + hfield, 'clicked': '0', 'field': hfield, "class":'col_' + hfield});
        var html = '<a id="a_' + hfield + '" href="#" class="header" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">' + hfield.replace(/_/, ' ') + '</a>';
        html += '<div class="dropdown-menu" aria-labelledby="a_' + hfield + '"><a class="dropdown-item group_by" field="' + hfield + '" href="#">Group by</a><a class="dropdown-item fields statistics" field="' + hfield + '" href="#" >Statistics</a><a class="dropdown-item recalculate fields" data-toggle="modal" data-target="#column_bin" field="' + hfield + '" href="#">Recalculate</a></div>';

        html += "<div class='triangle'>&#x25BA;</div>";
        $th.html(html);
        $th.appendTo($('#header_row'));
    });

    $('th').attr('clicked', 0);

}

function sanitize(str) {
    var str = str.replace(/^\s+|\s+$/g, "").replace(/\s/g, "_").replace(/[^a-z0-9_]/ig, "").toUpperCase();
    str = str.replace(/([a-zA-Z])_(\d+)/g,"$1$2");
    return str;
}

function updateTable(db, table, data, headers, key, isPrimary) {
    console.log(data);
    var sanitizedField;
    console.log(sanitizedHeaders);
    for (var j = 0; j < headers.length; j++) {
        var field = headers[j];
        sanitizedField = sanitize(field);
        sanitizedField = sanitizedField == '' ? 'BLANK' + j.toString() : sanitizedField;
        if (sanitizedHeaders.indexOf(sanitizedField) <= -1) {
            console.log('ADDING HEADER ' + sanitizedField);            
            headerNames.push(sanitizedField);
            sanitizedHeaders.push(sanitizedField);
            columnData[sanitizedField]['name'] = sanitizedField;
        }
    }

    primaryDbKey = key;
    primaryKey = key;
    sortField = key;
    groupField = key;

    // updateFieldsMenu();
    
    resetTable();
    updateRows(data, db, table, primaryDbKey);
    
}

// https://stackoverflow.com/questions/1349404/generate-random-string-characters-in-javascript
function passwordGen(length) {
   var result           = '';
   var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
   var charactersLength = characters.length;
   for ( var i = 0; i < length; i++ ) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
   }
   return result;
}

function updateRows(data, db, table, secondaryDbKey) {
    var str, row;
    var newRows = [];
    var sanitizedField;
    var sfield, field;
    var fieldMask = {};

    $('#messages').html('Updating Database<img class="loading" src="./Loading_icon.gif"/>');
    console.log(data);
    console.log(sanitizedHeaders);
    window.setTimeout(function(){
        let sanitizedField;
        let dataRow = data[0];
        console.log(dataRow);

        let re = {};
        re['student_id'] = new RegExp($('#idRe').val(), 'i');
        re['fullname'] = new RegExp($('#fullnameRe').val(), 'i');
        re['firstname'] = new RegExp($('#firstnameRe').val(), 'i');
        re['lastname'] = new RegExp($('#lastnameRe').val(), 'i');
        re['comment'] = new RegExp($('#commentRe').val(), 'i');
        re['section'] = new RegExp($('#sectionRe').val(), 'i');
        re['email'] = new RegExp($('#emailRe').val(), 'i');
        re['password'] = new RegExp($('#passwordRe').val(), 'i');

        for (key in dataRow) {
            for (field in re) {
                if (key.match(re[field]) && key.match(re[field])!='' && typeof key.match(re[field]) != 'undefined' && key.match(re[field])!=null) {
                    fieldMask[field] = key;
                    break;
                }
            }
        }


        console.log(fieldMask);

        for (let i = 0; i < data.length; i++) {
            dataRow = data[i];
            console.log(dataRow);
            var rowObj = {};

            if (typeof dataRow[fieldMask['student_id']] === typeof undefined) {
                continue;
            }

            if ('fullname' in fieldMask) {
                if (typeof dataRow[fieldMask['fullname']] === typeof undefined) {
                    dataRow[fieldMask['fullname']] = ',';
                } else {
                    if(!dataRow[fieldMask['fullname']].match(',')) {
                        dataRow[fieldMask['fullname']] += ',';
                    }
                }
            }

            rowObj['STUDENT_ID'] = dataRow[fieldMask['student_id']];
            if ('firstname' in fieldMask && 'lastname' in fieldMask) {
                rowObj['FNAME'] = dataRow[fieldMask['firstname']];
                rowObj['LNAME'] = dataRow[fieldMask['lastname']];
            } else if ('fullname' in fieldMask) {
                let fullname = dataRow[fieldMask['fullname']].split(',');
                rowObj['LNAME'] = fullname[0].replace(/[^a-z ]/ig, '');;
                if (fullname.length > 1) {
                    rowObj['FNAME'] = fullname[1].replace(/[^a-z ]/ig, '');
                } else {
                    rowObj['FNAME'] = '';
                }
            }

            rowObj['STATUS'] = 'C';
            if (fieldMask['comment'] in dataRow) {
                rowObj['COMMENT'] = dataRow[fieldMask['comment']];
            }
            if (fieldMask['section'] in dataRow) {
                rowObj['SECTION'] = dataRow[fieldMask['section']];
            }
            rowObj['RECITATION'] = '';
            if (emailSuffix != '') {
                rowObj['EMAIL'] = dataRow[fieldMask['student_id']] + '@' + emailSuffix;
            } else {
                rowObj['EMAIL'] = dataRow[fieldMask['email']];
            }
            rowObj['USER_ID'] = dataRow[fieldMask['student_id']];
            if (passwordAutoGen == 'true') {
                // rowObj['PASSWORD'] = 'FAILSAFE' + Math.floor(Math.random() * 10000).toString();
                rowObj['PASSWORD'] = passwordGen(8);
            } else {
                rowObj['PASSWORD'] = dataRow[fieldMask['PASSWORD']];
            }
            rowObj['PERMISSION'] = '0';


            console.log(rowObj);

            let secondaryKeyValue = rowObj[secondaryDbKey];
            // console.log('SECONDDARY KEY: ' + secondaryKeyValue);
            if (secondaryKeyValue == null || typeof secondaryKeyValue == typeof undefined || secondaryKeyValue == '') {
                console.log('INVALID KEY: ' + secondaryDbKey);
                continue;
            }
            secondaryKeyValue = secondaryKeyValue.toString().trim();

            // insert new database entry
            if (primaryDbKeyValues.indexOf(secondaryKeyValue) <= -1 && secondaryKeyValue != '') {
                // console.log('NEW ENTRY');
                var datum = rowObj;

                datum[primaryDbKey] = secondaryKeyValue;
                table.push(datum);
                
                primaryDbKeyValues.push(secondaryKeyValue.toString());
            } else { // udpate existing database entry
                for(let i = 0; i < table.length; i++) {
                    if (table[i][primaryDbKey] == rowObj[secondaryDbKey]) {
                        sanitizedHeaders.map(function(sfield) {
                            let dbField = sfield;
                            if (dbField != primaryDbKey) {
                                let value = rowObj[dbField];
                                if (value != null && typeof value != typeof undefined) {
                                    table[i][dbField] = value;
                                }                            
                            }
                        });
                        break;
                    }
                }
            }
        }
        for (var key in colWidths) {
            if (colWidths.hasOwnProperty(key)) {
                colWidths[key] = colWidths[key] + 2;
            }
        }
        console.log('INSERT INTO TABLE');
        let columnsWithRoutines = [];
        recalculateColumns(db, table, columnsWithRoutines);
    }, 0);
}

function recalculateColumns(db, table, columns) {

    var newRows = [];
    let functionStr = 'return db.select().from(table).exec()';
    console.log(functionStr);
    console.log(columnData);
    let queryFunc = new Function('db', 'table',  functionStr);
    let sanitizedField;
    let dbField;

    table.forEach(function(rowObj) {
        columns.forEach(col => {
            let sfield = col.name;
            let routine = col.routine;
            columnData[sfield].routine = routine;


            let routineStr = routine.replace(/\(@([^\)]+)\)/g, 'row[sanitize("$1")]');
            // console.log(routineStr);
            let routineFunc = new Function('row',  routineStr);
            // console.log(sfield);
            // console.log(sfield);
            rowObj[sfield] = routineFunc(rowObj);
            var datum = rowObj;
            
        });
    });
    queryHWSet(db, table, baseQuery, groupField);
}

//https://stackoverflow.com/questions/7616461/generate-a-hash-from-string-in-javascript
String.prototype.hashCode = function() {
    var hash = 0, i, chr;
    if (this.length === 0) return hash;
    for (i = 0; i < this.length; i++) {
        chr   = this.charCodeAt(i);
        hash  = ((hash << 5) - hash) + chr;
        hash |= 0; // Convert to 32bit integer
    }
    return hash;
};

function queryHWSet(db, table, query, field) {

    $('th').css('background-color', '');
    $('th').css('color', '');
    $('th').find('a').css('color', '');
    $('th').find('div').css('color', '');
    $('td').css('border-left', '');
    $('td').css('border-right', '');
    $('td').css('color', '#eee');

    var dbGroup = field;

    resetTable();

    var prev_row = null;
    var prev_tableRow = null;
    var white = 'rgb(255, 255, 255)';
    var grey = 'rgb(245, 245, 245)';
    var bgcolor;
    // var order = lf.Order.DESC;
    var order = 'DESC';
    var index = 0;
    var count = 0;

    var queryFunc = new Function('db', 'table',  'return db.' + query + '.exec()');

    $('#messages').html('Running Query<img class="loading" src="./Loading_icon.gif"/>');
    window.setTimeout(function(){
        // return queryFunc(db, table).then(function(rows) {
        // rows.forEach(function(row, rowIndex) {
        table.forEach(function(row) {
            // console.log(row);
            var tableRow = document.getElementById('mainTable').getElementsByTagName('tbody')[0].insertRow(-1);

            var cell;
            cell = tableRow.insertCell(0);
            $(cell).addClass('col_count');
            $(cell).attr('field', 'count');

            if ((prev_row == null) || (prev_row[dbGroup] != row[dbGroup])) {
                $(".col_count[index='" + index + "']:not(:first)").html(count + '<strong style="float:right">&ndash;</strong>');
                $("td.root[index='" + index + "']").html(count);
                index++;
                count = 1;
                $(cell).addClass('root');
                $(tableRow).addClass('root');
            } else {
                count++;
                $(cell).addClass('branch');
                $(tableRow).addClass('branch');
            }
            $(".col_count[index='" + index + "']:not(:first)").html(count + '<strong style="float:right">&ndash;</strong>');
            $("td.root[index='" + index + "']").html(count);

            $(tableRow).attr('index', index);
            $(cell).attr('index', index);
            $(cell).attr('clicked', 0);
            cell.textContent = count ;

            sanitizedHeaders.map(function(hfield) {
                var $td = $("<td>", {
                    'field': hfield,
                    'class':'col_' + hfield
                });
                $td.text(row[hfield]);
                $td.appendTo($(tableRow));
            });

            prev_row = row;
            prev_tableRow = tableRow;

        });

        refreshTable(db, table, field);
    }, 0);
}

function refreshTable(db, table, field) {
    console.log('REFRESHTABLE');
    updateKeys();

    $('#messages').text('Query Completed');
    $('#query_msg').hide();

    $('td.root').each(function() {
        var count = $(this).html();
        if (count > 1) {
            $(this).html(count + "<strong style='color:SteelBlue;float:right'>+</strong>");
        }
    });


    var colClass = 'col_' + field;

    $('td.' + colClass).css('border-left', '2px solid SteelBlue');
    $('td.' + colClass).css('border-right', '2px solid SteelBlue');

    if (field != 'unixtime') {
        // $('td').css('color', '#ccc');
        $('td.' + colClass).css('color', '');
        $('td.col_count').css('color', '');
    } else {
        $('td').css('color', '');
    }

    $('td').off();
    $('td.col_count').click(function() {
        console.log('COL_COUNT CLICKED');
        var index = $(this).closest('tr').attr('index');
        var clicked = 1 - parseInt($(this).closest('tr').find('td.col_count').attr('clicked'));
        $(".col_count[index='" + index + "']").attr('clicked', clicked);
        $(".col_count[index='" + index + "']").closest('tr').attr('clicked', clicked);

        $("td").css('color', '');
        $("td." + colClass).css('color', '');
        $("td.col_count").css('color', '');
        $("tbody tr[clicked=1] td").css('color', '');
        $("tbody tr[clicked!=1] td").css('background-color', '');

        $("tbody tr[clicked=1]").show();
        $("tbody tr[clicked=1] td.col_chkbox input[type='checkbox']").prop('checked', true);
        $("tbody tr[clicked!=1]").hide();
        $("tbody tr[clicked!=1] td.col_chkbox input[type='checkbox']").prop('checked', false);
        $("tbody tr.root").show();

        $("td.col_count[clicked=1]").each(function() {
            $(this).html($(this).html().replace(/\+/, '-'));
        });
        $("td.col_count[clicked!=1]").each(function() {
            $(this).html($(this).html().replace(/\-/, '+'));
        });
    });



    var sfield;
    for (var j = 0; j < sanitizedHeaders.length; j++) {
        sfield = sanitizedHeaders[j];
        colWidths[sfield] = Math.max($("td[field='" + sfield + "']").width(), $("th[field='" + sfield + "']").width());
    }
    colWidths['count'] = 25;

    for (var key in colWidths) {
        if (colWidths.hasOwnProperty(key)) {
            colWidths[key] = colWidths[key] + 25;
        }
    }

    var tableWidth = 0;
    $('th:visible').each(function() {
        tableWidth += colWidths[$(this).attr('field')];
    });

    // $('#mainTable').css('width', 'auto');
    $('#mainTable').css('width', tableWidth);
    $('#table-container').css('width', tableWidth + 15);
    $('tbody tr').css('width', tableWidth);
    $('thead tr').css('width', tableWidth);
    $('th, td').each(function() {
        $(this).css('width', colWidths[$(this).attr('field')]);
    });
    $('tbody').css('margin-top', parseInt($('th').first().css('height')));

    $('.nav-item.calculated_column').show();
    $('tr.branch').hide();

    updateButtons(db, table);
}

function updateButtons(db, table) {
    var fieldToLf = {};
    sanitizedHeaders.map(function(field) {
        fieldToLf[field] = 'table.' + field;
        if (!(clickedArray.hasOwnProperty(field))) {
            clickedArray[field] = 0;
        }
    });

    $("#exportCSV").off();
    $("#exportCSV").click(function () {
        $('th div.triangle').html('');

        var $table = $('#mainTable');
        var csv = $table.table2csv('return', {
            "separator": ",",
            "newline": "\n",
            "quoteFields": true,
            "excludeColumns": ".col_chkbox, .col_count",
            "excludeRows": "",
            "trimContent": true,
            "filename": "table.csv"
        });

        csv = csv.replace(/Group byStatisticsRecalculate/g, '');

        let lines = csv.split('\n');
        lines.splice(0,1);
        csv = lines.join('\n');

        // https://stackoverflow.com/questions/42462764/javascript-export-csv-encoding-utf-8-issue/42466254
        // var universalBOM = "\uFEFF";
        // var a = document.createElement('a');
        // a.setAttribute('href', 'data:text/csv;charset=ISO-8859-1,'
        // + encodeURIComponent(universalBOM + csv));
        // a.setAttribute('download', 'classlist.lst');

        var a = document.createElement('a');
        a.setAttribute('href', 'data:text/csv;charset=ISO-8859-1,'
        + encodeURIComponent(csv));
        a.setAttribute('download', 'classlist.lst');

        a.click()
        // window.location.href = 'data:text/csv;charset=UTF-8,' + encodeURIComponent(universalBOM + csv);
        $('th div.triangle').html('&#x25ba;');
    });


    $('.field_reference').html('');
    sanitizedHeaders.forEach(function(field) {
        $('.field_reference').append('<button class="field btn btn-outline-info btn-sm">' + field + '</button>');
    });

    $('.field_reference button.field').off();
    $('.field_reference button.field').click(function(e) {
        e.preventDefault();
        e.stopPropagation();
        // console.log(e);
        insertAtCursor(document.getElementById('column_routine'), '+(@' + $(this).text() + ')');
    });
    $('#calculated_column').off();
    $('#calculated_column').click(function() {
        $('#column_bin').find('.column_name').val('COL' + sanitizedHeaders.length);
    });

    $('#query_submit').off();
    $('#query_submit').on('click', function() {
        baseQuery = $('#query').val();
        queryHWSet(db, table, baseQuery, primaryKey);
        $('.dropdown-toggle.query').dropdown('toggle');
    })

    $('#column_submit').off();
    $('#column_submit').on('click', function() {
        let sfield = $('#column_bin').find('.column_name').val();
        let routine = $('#column_routine').val();
        // columnData[sanitizedField]['name'] = sanitizedField;
        // $('.dropdown-toggle.query').dropdown('toggle');
        $('#messages').html('Adding Column<img class="loading" src="./Loading_icon.gif"/>');
        window.setTimeout(function(){
            recalculateColumns(db, table, [{name: sfield, routine: routine}]);
            $('#column_bin').modal('hide');
        }, 0);

    });

    $('.secondary-input').off();
    $('#secondary-file-input').on('change', function(event) {
        var reader = new FileReader();
        reader.onload = function(e) {
            var results = Papa.parse(e.target.result, {
                header: true,
                dynamicTyping: false,
            });
            console.log(results);
            data = results.data;
            if (data.length < 1) {
                return;
            }
            // headers = results.meta['fields'];
            headers = webworkFields;
            console.log(headers);
            // var contents = e.target.result;
            updateTable(db, table, data, headers, primaryKey, false);
            $('#second_key_li').show();
            $('a.pastebin').addClass('disabled');
            $('a.query').addClass('disabled');
        }
        reader.readAsText(event.target.files[0]);
    });
    

    $('#fields_submit').off();
    $('#fields_submit').on('click', function() {
        var results = Papa.parse($('#fields').val(), {
            header: true,
            dynamicTyping: false,
        });
        console.log(results);
        data = results.data;
        if (data.length < 1) {
            return;
        }
        // headers = results.meta['fields'];
        let headers = webworkFields;
        console.log(headers);
        updateTable(db, table, data, headers, primaryKey, false);
        $('#second_key_li').show();
        $('a.pastebin').addClass('disabled');
        $('a.query').addClass('disabled');
        $('#pastebin').modal('hide')
    });

    $("th a").off();

    $('th').find('.fields.statistics').off();
    $('th').find('.fields.statistics').click(function() {
        var array = [];
        var field = $(this).attr('field');
        $("td[field='" + field + "']").each(function() {
            if ($(this).text() != '' && $(this).text() != null && typeof $(this).text() != typeof undefined) {
                array.push(+($(this).text()));
            }
        });

        statistics(array, field);
    });

    $('.fields.recalculate').off();
    $('.fields.recalculate').click(function() {
        let sfield = $(this).attr('field');
        $('#column_bin').find('.column_name').val(sfield);
        $('#column_routine').val('');
        $('#column_routine').val(columnData[sfield]['routine']);
    });

    $("th div.triangle").off();
    $("th div.triangle").on('click', function() {
        $('th div.triangle').html('&#x25ba;');
        sortField = $(this).closest('th').attr('field');

        var clicked = clickedArray[sortField];
        clicked = clicked == 0 ? -1 : -1*clicked;
        clickedArray[sortField] = clicked;

        $(this).closest('th').attr('clicked', clicked);

        var aContent, bContent;
        var tbody = $('#mainTable').find('tbody');

        console.log(groupField);
        if (sortField != groupField && sortField != 'count' && groupField != primaryKey) {
            tbody.find('tr').sort(function(a, b) {
                aContent = $('td[field="' + sortField + '"]', a).html();
                bContent = $('td[field="' + sortField + '"]', b).html();

                aContent = typeof aContent !== typeof undefined ? aContent : '';
                bContent = typeof bContent !== typeof undefined ? bContent : '';

                if (isNaN(aContent) || isNaN(bContent)) {
                    return ($('td[field="' + groupField + '"]', a).html().localeCompare($('td[field="' + groupField + '"]', b).html())) || clicked*(aContent.localeCompare(bContent));
                } else {
                    return ($('td[field="' + groupField + '"]', a).html().localeCompare($('td[field="' + groupField + '"]', b).html())) || clicked*(+aContent - +bContent);
                }
            }).appendTo(tbody);
        } else {
            tbody.find('tr').sort(function(a, b) {
                aContent = $('td[field="' + sortField + '"]', a).html();
                bContent = $('td[field="' + sortField + '"]', b).html();
                if ((isNaN(aContent) || isNaN(bContent)) && sortField != 'count') {
                    return clicked*(aContent.localeCompare(bContent));
                } else {
                    return clicked*(+aContent - +bContent);
                }
            }).appendTo(tbody);
        }
        tbody.find('tr').each(function(rowIndex) {
            $(this).find('td[field=' + sortField+ ']')
                .attr('data-toggle', 'tooltip')
                .attr('data-placement', 'bottom')
                .attr('title', 'rank ' + (rowIndex + 1).toString());
        });

        tbody.find('tr.branch').each(function() {
            var index = $(this).closest('th').attr('index');
            $(this).closest('th').detach().insertAfter($("tr.root[index='" + index + "']"));
        });
        if ($(this).closest('th').attr('clicked') == 1) {
            $(this).html('&#x25B2;');
        } else if ($(this).closest('th').attr('clicked') == -1){
            $(this).html('&#x25BC;');
        }
        $('tbody').css('margin-top', parseInt($('th').first().css('height')) + 'px');
    });

    var field;
    $("th").each(function() {
        field = $(this).attr('field');
        if (field != groupField) {
            $(this).find('a.triangle').html('&#x25BA;');
            $(this).css('background-color', '');
            $(this).find('a').css('color', '');
            $(this).find('div').css('color', '');
        } else {
            $(this).css('background-color', 'SteelBlue');
            $(this).find('a.header').css('color', 'white');
            $(this).find('div.triangle').css('color', 'white');

            if (clickedArray[field] == 1) {
                $(this).find('.triangle').html('&#x25B2;');
                $(this).find('.triangle').show();
            } else if (clickedArray[field] == -1) {
                $(this).find('.triangle').html('&#x25BC;');
                $(this).find('.triangle').show();
            }
        }
    });

    $('tr').off();
    $('tr').on('click', function() {
        $('td').css('color', '');
        $(this).find('td').css('color', 'red');
    });

}

function statistics(values, field) {
    $('#statistics').modal('toggle');
    $('.modal-title.field').text(field);

    let array = values.map(value => {return isNaN(value) ? 0 : value;});

    $('#statistics').find('.modal-body').find('.stats').html('COUNT: ' + array.length + '<br/>MEDIAN: ' + math.median(array) + '<br/>' + 'MEAN: ' + Math.round(100*math.mean(array))/100 +  '<br/>' + 'Standard Deviation: ' + Math.round(100*math.std(array))/100);

    $('#max').val(math.max(array));

}

// function updateFieldsMenu() {
//     $('#columns_menu').html('');
//     var a = document.createElement("a");
//     $(a).addClass("dropdown-item");
//     $(a).attr('href', "#");
//     $(a).html("<input class='field_checkbox' checked type='checkbox' field='count' id='count_checkbox'>&nbsp;<label class='form-check-label' for='count_checkbox'>Count</label>");
//     $("#columns_menu").append(a);
// 
//     sanitizedHeaders.map(function(field) {
//         addFieldToMenu(field);
//     });
// 
// }

function updateKeys() {
    var o = new Option("option text", "value");
    $(o).html('Select Primary Key...');
    $(o).attr('selected');
    $("#key_sel").append(o);

    sanitizedHeaders.map(function(field) {
        var o = new Option("option text", "value");
        $(o).html(field);
        $(o).val(field);
        $("#key_sel").append(o);
    });

    $('.field_checkbox').off();
    $('.field_checkbox').on('change', function() {
        var field = $(this).attr('field');
        if ($(this).is(':checked')) {
            $('th[field="' + field + '"], td[field="' + field + '"]').show();
        } else {
            $('th[field="' + field + '"], td[field="' + field + '"]').hide();
        }

        var tableWidth = 0;
        $('th:visible').each(function() {
            tableWidth += colWidths[$(this).attr('field')];
        });

        $('#table-container').css('width', tableWidth + 15);
        $('#mainTable').css('width', tableWidth);
        $('#mainTable > thead > tr').css('width', tableWidth);
    });

    // https://stackoverflow.com/questions/659508/how-can-i-shift-select-multiple-checkboxes-like-gmail
    var $chkboxes = $('.field_checkbox');
    var lastChecked = null;
    $chkboxes.click(function(e) {
        if (!lastChecked) {
            lastChecked = this;
            return;
        }

        if (e.shiftKey) {
            var start = $chkboxes.index(this);
            var end = $chkboxes.index(lastChecked);

            $chkboxes.slice(Math.min(start,end), Math.max(start,end)+ 1).prop('checked', lastChecked.checked);

            $chkboxes.each(function() {
                var field = $(this).attr('field');
                if ($(this).is(':checked')) {
                    $('th[field="' + field + '"], td[field="' + field + '"]').show();
                } else {
                    $('th[field="' + field + '"], td[field="' + field + '"]').hide();
                }

                var tableWidth = 0;
                $('th:visible').each(function() {
                    tableWidth += colWidths[$(this).attr('field')];
                });

                $('#table-container').css('width', tableWidth + 15);
                $('#mainTable').css('width', tableWidth);
                $('#mainTable > thead > tr').css('width', tableWidth);
            });
        }

        lastChecked = this;
    });

    $('#columns_menu').find('.fields.statistics').click(function() {
        var array = [];
        var field = $(this).attr('field');
        $("td[field='" + field + "']").each(function() {
            array.push($(this).text());
        });
        statistics(array, field);
    });

}

function loadPrimary(data, headers) {
    colWidths = {};
    
    var field;
    var sanitizedField;

    headerNames = [];
    sanitizedHeaders = [];
    colWidths = {};

    for (j = 0; j < headers.length; j++) {
        field = headers[j].replace(/^\s+|\s+$/g, "");
        field = field == '' ? 'BLANK' + (j + 1) : field;
        headerNames.push(field);
        sanitizedField = sanitize(field);
        sanitizedHeaders.push(sanitizedField);
        headerTypes[sanitizedField] = 'STRING';
        columnData[sanitizedField] = {};
        columnData[sanitizedField]['routine'] = '';        
    }

    updateKeys();
    
    for (key in data[0]) {
        // $('#headers').append('<button type="button" class="btn btn-sm btn-outline-info">' + key + '</button>');
        $('select.re').append('<option value="^' + key + '$">' + key + '</option>');
    };
    $('#regex_bin').modal('show');

    $('#regex_submit').off();
    $('#regex_submit').click(function(){
        initializeDB(data, headers, sanitize('student_id'));
        $('#regex_bin').modal('hide');
        $('#reload_button').show();
    });
    $('#reload_button').off();
    $('#reload_button').click(function(){
        headerNames = [];
        sanitizedHeaders = [];
        headerTypes = {};
        baseQuery = '';
        clickedArray = {};
        colWidths = {};
        primaryDbKeyValues = [];
        primaryDbKey = '';
        primaryKey = '';
        primaryFile = null;
        mainArray = new Array();
        $('#regex_bin').modal('show');
    });
    // $('#key_sel').on('change', function() {
    //     initializeDB(data, headers, sanitize($(this).val()));
    //     $("#key_sel").tooltip('hide');
    // });
}


// https://stackoverflow.com/questions/11076975/insert-text-into-textarea-at-cursor-position-javascript
function insertAtCursor(myField, myValue) {
    //IE support
    if (document.selection) {
        myField.focus();
        sel = document.selection.createRange();
        sel.text = myValue;
    }
    if (myField.selectionStart || myField.selectionStart == '0') {
        var startPos = myField.selectionStart;
        var endPos = myField.selectionEnd;
        myField.value = myField.value.substring(0, startPos)
            + myValue
            + myField.value.substring(endPos, myField.value.length);
    } else {
        myField.value += myValue;
    }
    myField.focus();
}

function postInitialization(db, table) {
    console.log('POSTINIT');

    // $('.nav-item.dropdown.update').show();
    $('#key_sel').closest('li').find('a').addClass("disabled").attr('aria-disabled', 'true');
    $('#export').show();
    $('a.pastebin').removeClass('disabled');
    $('a.query').removeClass('disabled');

    $('#import').hide();    
    $('#primary-file-input').closest('li').hide();
    $('#query').closest('li').show();
    $('#messages').html('<strong>Database Loaded.</strong>');
    $('#hover_msg').hide();

    baseQuery = "select().from(table)";
    $('#query').val(baseQuery);

    var fieldToLf = {};
    sanitizedHeaders.map(function(field) {
        fieldToLf[field] = 'table.' + field;
        if (!(clickedArray.hasOwnProperty(field))) {
            clickedArray[field] = 0;
        }
    });
    clickedArray['count'] = 0;

    updateButtons(db, table);

}

$(function () {

    $('input[type=file]').click(function () {
        this.value = null;
    });

    var $table = $('#mainTable');

    $('#primary-file-input').change(function(e) {
        var reader = new FileReader();
        reader.onload = function(e) {
            let plaintextDB = e.target.result;
            let results = Papa.parse(plaintextDB, {
                header: true,
                dynamicTyping: false,
            });
            console.log(results);
            data = results.data;
                if (data.length < 1) {
                    return;
                }
                // let headers = results.meta['fields'];
                let headers = webworkFields;
                console.log(headers);
            loadPrimary(data, headers);
        }
        reader.readAsText(e.target.files[0]);
        $('a.pastebin').addClass('disabled');
        $('a.query').addClass('disabled');
    });

    $('#importXLSX').change(function(e) {
        // https://stackoverflow.com/questions/8238407/how-to-parse-excel-file-in-javascript-html5
        var reader = new FileReader();
        reader.onload = function(e) {
            var data = e.target.result;
            var workbook = XLSX.read(data, {
                type: 'binary'
            });

            // console.log(workbook.SheetNames);
            let sheetName = workbook.SheetNames[0];
            var XL_row_object = XLSX.utils.sheet_to_row_object_array(workbook.Sheets[sheetName]);
            console.log(XL_row_object);
            var json_object = JSON.stringify(XL_row_object);
            let headers = Object.keys(XL_row_object[0]);
            console.log(headers);
            loadPrimary(XL_row_object, headers);
        };

        reader.onerror = function(ex) {
            console.log(ex);
        };
        reader.readAsBinaryString(e.target.files[0]);
    });

    $('#fields_submit').on('click', function() {
        let results = Papa.parse($('#fields').val(), {
            header: true,
            dynamicTyping: false,
        });
        console.log(results);
        data = results.data;
            if (data.length < 1) {
                return;
            }
        // let headers = results.meta['fields'];
        let headers = webworkFields;
        loadPrimary(data, headers);
        $('a.pastebin').addClass('disabled');
        $('a.query').addClass('disabled');
        $('#pastebin').modal('hide');
    });

    $('#query').keydown(function(event) {
        if (event.keyCode === 13) {
            event.preventDefault();
            $('#query_submit').click();
        }
    });

    $('#paste_file').on('change', function(e) {
        var reader = new FileReader();
        reader.onload = function(e) {
            var contents = e.target.result;
            $('#fields').val(contents);
        }
        reader.readAsText(e.target.files[0]);
    });

     $('[data-toggle="tooltip"]').tooltip();

     $('select.re').change(function() {
         if (!$(this).val().match(/Select/)) {
             $(this).closest('div.row').find('input[type="text"]').val($(this).val());
         }
     });

     $('#reset').click(function() {
         $('.nav-item.dropdown.update').hide();
         $('#key_sel').closest('li').find('a').removeClass("disabled").attr('aria-disabled', 'false');
         $('#export').hide();
         $('a.pastebin').addClass('disabled');
         $('a.query').add('disabled');

         $('#import').show();
         $('#exportJSON').hide();
         $('#columns_toggle').hide();
         $('#fields').closest('li').show();
         $('#primary-file-input').closest('li').show();
         $('#query').closest('li').hide();
         $('#messages').html('');
         $('#hover_msg').html('No Database Loaded Yet').show();

         $('#table-container').css('width', '100%');
         $('#mainTable').css('width', '100%');
         $('#mainTable thead tr').html('');
         $('#mainTable tbody').html('').css('margin-top', '');
         sortField = 'undefined';
         groupField = 'undefined';
         headerNames = [];
         sanitizedHeaders = [];
         headerTypes = {};
         baseQuery = '';
         clickedArray = {};
         colWidths = {};
         primaryDbKeyValues = [];
         primaryDbKey = '';
         primaryKey = '';
         primaryFile = null;
         columnData = new Object();
         mainArray = new Array();
     });
})
