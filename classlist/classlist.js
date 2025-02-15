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
const webworkFields = ['student_id', 'lname', 'fname', 'status', 'comment', 'section', 'recitation', 'email', 'user_id', 'password', 'permission'];
var mainArray = new Array();

const url = new URL(window.location.href);
const emailSuffix = url.searchParams.get("email_suffix") ? url.searchParams.get("email_suffix") : '';
const passwordAutoGen = url.searchParams.get("password_auto") ? url.searchParams.get("password_auto") : 'true';
const passwordIsId = url.searchParams.get("password_is_id") ? url.searchParams.get("password_is_id") : 'false';

function report() {
};

function initializeDB(data, headers, key) {
    const dbKey = key;

    document.querySelector('#mainTable tbody').innerHTML = '';
    
    sortField = key;
    groupField = key;
    primaryKey = key;
    primaryDbKey = dbKey;

    postInitialization();
    updateTable(null, mainArray, data, headers, primaryKey, true);

}

function resetTable() {
    document.querySelectorAll('#mainTable > tbody > tr').forEach(tr => tr.remove());
    document.querySelector('#header_row').innerHTML = '<th id="th_count" clicked="0" field="count" class="col_count header"><a href="#">#</a></th>';

    let hfield;

    sanitizedHeaders.map(function (sfield) {
        hfield = sfield;
        let th = document.createElement('th');
        th.id = 'th_' + hfield;
        th.setAttribute('clicked', '0');
        th.setAttribute('field', hfield);
        th.className = 'col_' + hfield;

        // let html = `<a id="a_${hfield}" href="#" class="header" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">${hfield.replace(/_/, ' ')}</a>
        //     <div class="dropdown-menu" aria-labelledby="a_${hfield}">
        //         <a class="dropdown-item group_by" field="${hfield}" href="#">Group by</a>
        //         <a class="dropdown-item fields statistics" field="${hfield}" href="#">Statistics</a>
        //         <a class="dropdown-item recalculate fields" data-toggle="modal" data-target="#column_bin" field="${hfield}" href="#">Recalculate</a>
        //     </div>`;

        th.innerHTML = `${hfield}`;

        document.querySelector('#header_row').appendChild(th);

    });

    document.querySelectorAll('th').forEach(th => th.setAttribute('clicked', '0'));

}

function sanitize(str) {
    return str.replace(/^\s+|\s+$/g, "")
                .replace(/\s/g, "_")
                .replace(/[^a-z0-9_]/ig, "")
                .toUpperCase()
                .replace(/([a-zA-Z])_(\d+)/g, "$1$2");
}

function updateTable(db, table, data, headers, key, isPrimary) {
    // console.log(data);
    headers.forEach((field, j) => {
        let sanitizedField = sanitize(field);
        sanitizedField = sanitizedField === '' ? 'BLANK' + j.toString() : sanitizedField;
        if (sanitizedHeaders.indexOf(sanitizedField) === -1) {
            console.log('ADDING HEADER ' + sanitizedField);
            headerNames.push(sanitizedField);
            sanitizedHeaders.push(sanitizedField);
        }
    });

    primaryDbKey = key;
    primaryKey = key;
    sortField = key;
    groupField = key;

    // updateFieldsMenu();

    resetTable();
    updateRows(data, db, table, primaryDbKey);

}

function generateSalt() {
    // Define the pool of alphanumeric characters
    const alphanumeric = "./ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    let result = "";
    for (let i = 0; i < 2; i++) {
        // Pick a random character from the pool
        const randomIndex = Math.floor(Math.random() * alphanumeric.length);
        result += alphanumeric[randomIndex];
    }

    return result;
}

// https://stackoverflow.com/questions/1349404/generate-random-string-characters-in-javascript
function passwordGen(length) {
    var result = '';
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

function updateRows(data, db, table, secondaryDbKey) {
    const regexFields = ['student_id', 'fullname', 'firstname', 'lastname', 'comment', 'section', 'email', 'password'];
    let field;
    let fieldMask = {};

    document.getElementById('messages').innerHTML = 'Updating Database<img class="loading" src="./Loading_icon.gif"/>';
    console.log(data);
    console.log(sanitizedHeaders);
    window.setTimeout(function () {
        let dataRow = data[0];
        console.log(dataRow);
    
        let re = {};
        regexFields.forEach(rfield => {
            try {
                re[rfield] = new RegExp(document.getElementById(`${rfield}Re`).value, 'i');
            } catch(e) {
                alert(rfield);
            }
        });

        for (key in dataRow) {
            for (field in re) {
                if (key.match(re[field]) && key.match(re[field]) != '' && typeof key.match(re[field]) != 'undefined' && key.match(re[field]) != null) {
                    fieldMask[field] = key;
                    break;
                }
            }
        }

        console.log(fieldMask);

        // for (let i = 0; i < data.length; i++) {
        data.forEach(function (dataRow, i) {
            dataRow = data[i];
            console.log(dataRow);
            var rowObj = {};

            if (typeof dataRow[fieldMask['student_id']] === typeof undefined) {
                return;
            }

            if ('fullname' in fieldMask) {
                if (typeof dataRow[fieldMask['fullname']] === typeof undefined) {
                    dataRow[fieldMask['fullname']] = ',';
                } else {
                    if (!dataRow[fieldMask['fullname']].match(',')) {
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
                rowObj['PASSWORD'] = unixCryptTD(passwordGen(8), generateSalt());
            } else {
                if (passwordIsId == 'true') {
                    rowObj['PASSWORD'] = unixCryptTD(dataRow[fieldMask['student_id']].replace(/^"|"$/g, ''), generateSalt());
                } else {
                    console.log('password: ' + dataRow[fieldMask['password']]);
                    rowObj['PASSWORD'] = unixCryptTD(typeof (dataRow[fieldMask['password']]) === 'undefined' ? passwordGen(8) : dataRow[fieldMask['password']].replace(/^"|"$/g, ''), generateSalt());
                }
            }
            rowObj['PERMISSION'] = '0';

            console.log(rowObj);

            let secondaryKeyValue = rowObj[secondaryDbKey];
            // console.log('SECONDDARY KEY: ' + secondaryKeyValue);
            if (secondaryKeyValue == null || typeof secondaryKeyValue == typeof undefined || secondaryKeyValue == '') {
                console.log('INVALID KEY: ' + secondaryDbKey);
                return;
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
                for (let i = 0; i < table.length; i++) {
                    if (table[i][primaryDbKey] == rowObj[secondaryDbKey]) {
                        sanitizedHeaders.map(function (sfield) {
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
        });

        for (let key in colWidths) {
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
    
    table.forEach(function (rowObj) {
        columns.forEach(col => {
            let sfield = col.name;
            let routine = col.routine;
            
            let routineStr = routine.replace(/\(@([^\)]+)\)/g, 'row[sanitize("$1")]');
            let routineFunc = new Function('row', routineStr);
            rowObj[sfield] = routineFunc(rowObj);

        });
    });
    queryDataSet(db, table);
}

function queryDataSet(db, table) {
    document.querySelectorAll('th').forEach(th => {
        th.style.backgroundColor = '';
        th.style.color = '';
        th.querySelectorAll('a').forEach(a => a.style.color = '');
        th.querySelectorAll('div').forEach(div => div.style.color = '');
    });

    document.querySelectorAll('td').forEach(td => {
        td.style.borderLeft = '';
        td.style.borderRight = '';
        td.style.color = '#eee';
    });

    resetTable();

    document.getElementById('messages').innerHTML = 'Running Query<img class="loading" src="./Loading_icon.gif"/>';

    window.setTimeout(function () {
        table.forEach((row, index) => {
            let tableRow = document.getElementById('mainTable').getElementsByTagName('tbody')[0].insertRow(-1);
        
            let cell = tableRow.insertCell(0);
            cell.classList.add('col_count');
            cell.setAttribute('field', 'count');
            cell.textContent = index + 1;
        
            sanitizedHeaders.forEach(hfield => {
                let td = document.createElement('td');
                td.setAttribute('field', hfield);
                td.classList.add('col_' + hfield);
                td.textContent = row[hfield];
                tableRow.appendChild(td);
            });
        
            prev_row = row;
            prev_tableRow = tableRow;
        });

        refreshTable();
    }, 0);
}

function refreshTable() {
    console.log('REFRESHTABLE');

    document.getElementById('messages').textContent = 'Query Completed';
    
    document.querySelectorAll('td.root').forEach(td => {
        let count = parseInt(td.innerHTML, 10);
        if (count > 1) {
            td.innerHTML = `${count}<strong style='color:SteelBlue;float:right'>+</strong>`;
        }
    });

    // let colClass = 'col_' + field;

    // document.querySelectorAll(`td.${colClass}`).forEach(td => {
    //     td.style.borderLeft = '2px solid SteelBlue';
    //     td.style.borderRight = '2px solid SteelBlue';
    // });


    sanitizedHeaders.forEach(sfield => {
        colWidths[sfield] = Math.max(
            ...Array.from(document.querySelectorAll(`td[field='${sfield}']`)).map(td => td.offsetWidth),
            ...Array.from(document.querySelectorAll(`th[field='${sfield}']`)).map(th => th.offsetWidth)
        );
    });
    colWidths['count'] = 25;

    for (let key in colWidths) {
        if (colWidths.hasOwnProperty(key)) {
            colWidths[key] += 25;
        }
    }

    // Calculate table width
    const tableWidth = Array.from(document.querySelectorAll('th')).reduce((sum, th) => sum + colWidths[th.getAttribute('field')], 0);

    // Apply table and container widths
    const mainTable = document.getElementById('mainTable');
    mainTable.style.width = `${tableWidth}px`;
    document.getElementById('table-container').style.width = `${tableWidth + 15}px`;

    // Apply widths to rows and cells
    const applyWidth = (el) => el.style.width = `${colWidths[el.getAttribute('field')]}px`;
    document.querySelectorAll('tbody tr, thead tr').forEach(tr => tr.style.width = `${tableWidth}px`);
    document.querySelectorAll('th, td').forEach(applyWidth);

    // Adjust tbody margin
    document.querySelector('tbody').style.marginTop = document.querySelector('th').offsetHeight + 'px';

    document.querySelectorAll('.nav-item.calculated_column').forEach(el => el.style.display = '');
    document.querySelectorAll('tr.branch').forEach(tr => tr.style.display = 'none');

}

function handleExportCSVClick() {
    // document.querySelectorAll('th div.triangle').forEach(div => div.innerHTML = '');
    let csv = table2csv('return', {
        "separator": ",",
        "newline": "\n",
        "quoteFields": false,
        "excludeColumns": ".col_count, .col_rank",
        "excludeRows": "",
        "trimContent": true,
        "filename": "untitled.lst"
    }, document.querySelector('#mainTable'));
    download('untitled.lst', csv);
}

function handleFieldsSubmitClick() {
    let results = Papa.parse(document.getElementById('fields').value, {
        header: true,
        dynamicTyping: false,
    });
    console.log(results);
    let data = results.data;
    if (data.length < 1) {
        return;
    }
    let headers = webworkFields;
    console.log(headers);
    updateTable(db, table, data, headers, primaryKey, false);
    document.getElementById('second_key_li').style.display = '';
    document.querySelectorAll('a.pastebin, a.query').forEach(a => a.classList.add('disabled'));
    document.getElementById('pastebin').classList.add('hide');
}

function loadPrimary(data, headers = WeBWorKFields) {
    colWidths = {};
    headerNames = [];
    sanitizedHeaders = [];
    colWidths = {};

    for (let key in data[0]) {
        document.querySelectorAll('select.re').forEach(el => el.insertAdjacentHTML('beforeend', `<option value="^${key}$">${key}</option>`));
    }
    document.getElementById('regex_bin').classList.add('show');
    document.getElementById('regex_bin').style.display = "block";
    
    document.getElementById('regex_submit').replaceWith(document.getElementById('regex_submit').cloneNode(true));
    document.getElementById('regex_submit').addEventListener('click', function () {
        initializeDB(data, headers, sanitize('student_id'));
        document.getElementById('regex_bin').classList.remove('show');
        document.getElementById('regex_bin').style.display = "none";
    });
    
}

function postInitialization() {
    console.log('POSTINIT');

    document.getElementById('export').style.display = '';
    document.querySelectorAll('a.pastebin, a.query').forEach(a => a.classList.remove('disabled'));

    document.getElementById('import').style.display = 'none';
    document.querySelector('#primary-file-input').closest('li').style.display = 'none';
    document.getElementById('messages').innerHTML = '<strong>Database Loaded.</strong>';
    document.getElementById('hover_msg').style.display = 'none';
}

document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('input[type=file]').forEach(input => {
        input.addEventListener('click', function () {
            this.value = null;
        });
    });

    document.getElementById('exportCSV')
    .addEventListener('click', handleExportCSVClick);
    document.getElementById('fields_submit')
    .addEventListener('click', handleFieldsSubmitClick);

    document.getElementById('primary-file-input').addEventListener('change', function (e) {
        var reader = new FileReader();
        reader.onload = function (e) {
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
    });

    document.getElementById('importXLSX').addEventListener('change', function (e) {
        var reader = new FileReader();
        reader.onload = function (e) {
            var data = e.target.result;
            var workbook = XLSX.read(data, {
                type: 'binary'
            });
    
            let sheetName = workbook.SheetNames[0];
            var XL_row_object = XLSX.utils.sheet_to_row_object_array(workbook.Sheets[sheetName]);
            console.log(XL_row_object);
            let headers = webworkFields;
            loadPrimary(XL_row_object, headers);
        };
    
        reader.onerror = function (ex) {
            console.log(ex);
        };
        reader.readAsBinaryString(e.target.files[0]);
    });
    
    document.getElementById('paste_file').addEventListener('change', function (e) {
        var reader = new FileReader();
        reader.onload = function (e) {
            var contents = e.target.result;
            document.getElementById('fields').value = contents;
        };
        reader.readAsText(e.target.files[0]);
    });


    document.querySelectorAll('select.re').forEach(el => el.addEventListener('change', function () {
        if (!this.value.match(/Default/)) {
            this.closest('div.row').querySelector('input[type="text"]').value = this.value;
        }
    }));

})
