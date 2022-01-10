// This software is released under the MIT license:
//
// Permission is hereby granted, free of charge, to any person obtaining a copy of
// this software and associated documentation files (the "Software"), to deal in
// the Software without restriction, including without limitation the rights to
// use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
// the Software, and to permit persons to whom the Software is furnished to do so,
// subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
// FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
// COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
// IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
// CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

// https://stackoverflow.com/questions/6139107/programmatically-select-text-in-a-contenteditable-html-element/6150060#6150060
function selectElementContents(el) {
    var range = document.createRange();
    range.selectNodeContents(el);
    var sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
}

var curr = {row: 0, col: 0};

function rref(B) { // from https://github.com/substack/rref
	let A = B;
	console.log(A);
	var rows = A.length;
    var columns = A[0].length;

	console.log(rows + ' ' + columns);
    var lead = 0;
    for (var k = 0; k < rows; k++) {
        if (columns <= lead) return;

        var i = k;
		console.log(parseFloat(A[i][lead]));
		console.log(A);

        while (parseFloat(A[i][lead]) == 0) {
            i++;
            if (rows === i) {
                i = k;
                lead++;
                if (columns === lead) {
					return A;
				}
            }
        }
        var irow = A[i], krow = A[k];
        A[i] = krow, A[k] = irow;
        var val = parseFloat(A[k][lead]);
		console.log(val);
        for (var j = 0; j < columns; j++) {
            A[k][j] = parseFloat(A[k][j]) / val;
        }

        for (var i = 0; i < rows; i++) {
            if (i === k) continue;
            val = parseFloat(A[i][lead]);
            for (var j = 0; j < columns; j++) {
                A[i][j] = parseFloat(A[i][j]) - val * parseFloat(A[k][j]);
            }
        }
        lead++;
    }

    return A;
}

function matrixEditor(popupdiv, report, input) {

    this.input = input;
    curr = {row: 0, col: 0};
    this.popupdiv = popupdiv;

    this.table = $(popupdiv).find('table').first()[0];
    // this.table = popupdiv;

    this.updateFromCode = function(ww_code) {
        $(this.table).html('');
        var code = ww_code.replace(/(^\s*\[\s*\[\s*)|(\s*\]\s*\]\s*$)/g,'');
        console.log(code);
        var rows = code.split(/\s*\]\s*,\s*\[\s*/);
        console.log(rows);

        var html =  rows.map(function(row_str) {
            return '<tr>' + row_str.split(/\s*,\s*/).map(function(value) {
                return '<td>' + value + '</td>';
            }).join('') + '</tr>';
        }).join('');
        console.log(html);
        $(this.table).append(html);
        $(this.table).find('td').attr('contenteditable', 'true');
        curr.row = 0;
        curr.col = 0;
        $(this.table).find('td').css('border', '1px solid #ddd');
        this.updateMatrix();

        var me = this;
        var table = this.table;

        $(this.table).find('tr td').off();
        $(this.table).find('td').click(function() {
            $(this)[0].focus();
            $(this).attr('contenteditable', 'true');
            curr.row = $(table).find('tr td:focus').closest('tr').index();
            curr.col = $(table).find('tr td:focus').index();
            console.log(curr);
        });
    }

    this.addRow = function(dir) {
        var html = '';
        for (var i = 1; i <= $(this.table).find('tr').first().find('td').length; i++) {
            html += '<td></td>';
        }
        if(dir == 1) {
            $(this.table).append('<tr>' + html + '</tr>');
            curr.row = $(this.table).find('tr').length - 1;
        } else {
            $(this.table).prepend('<tr>' + html + '</tr>');
            curr.row = 0;
        }
    }

    this.addCol = function(dir) {
        if(dir == 1) {
            $(this.table).find('tr').each(function() {
                $(this).append('<td></td>');
            });
            curr.col = $(this.table).find('tr').first().find('td').length - 1;
        } else {
            $(this.table).find('tr').each(function() {
                $(this).prepend('<td></td>');
            });
            curr.col = 0;
        }
    }

    this.cleanUp = function() {
        var max_col = $(this.table).find('tr').first().find('td').length;
        var max_row = $(this.table).find('tr').length;
        if (curr.row != 0 && this.emptyRow(0) && max_row > 1) {
            $(this.table).find('tr').first().remove();
        }

        max_col = $(this.table).find('tr').first().find('td').length;
        max_row = $(this.table).find('tr').length;
        if (curr.col != 0 && this.emptyCol(0) && max_col > 1) {
            $(this.table).find('tr').each(function(){
                $(this).find('td').first().remove();
            });
        }

        max_col = $(this.table).find('tr').first().find('td').length;
        max_row = $(this.table).find('tr').length;
        if (curr.row != max_row - 1 && this.emptyRow(max_row - 1) && max_row > 1) {
            $('.matrix-field tr').last().remove();
        }

        max_col = $(this.table).find('tr').first().find('td').length;
        max_row = $(this.table).find('tr').length;
        if (curr.col != max_col - 1 && this.emptyCol(max_col - 1) && max_col > 1) {
            $(this.table).find('tr').each(function(){
                $(this).find('td').last().remove();
            });
        }
        $(this.table).find('td').css('border', '1px solid #ddd');
    }

    this.move = function(row_offset, col_offset) {
        var max_col = $(this.table).find('tr').first().find('td').length;
        var max_row = $(this.table).find('tr').length;

        if (row_offset == 1) {
            if (curr.row == max_row - 1) {
                this.addRow(1);
            } else {
                curr.row++;
            };
        }
        if (col_offset == 1) {
            if (curr.col == max_col - 1) {
                this.addCol(1);
            } else {
                curr.col++;
            };
        }

        if (row_offset == -1) {
            if (curr.row > 0) {
                curr.row--;
            } else {
                curr.row = 0;
                this.addRow(-1);
            }
        }

        if (col_offset == -1) {
            if(curr.col > 0) {
                curr.col--;
            } else {
                curr.col = 0;
                this.addCol(-1);
            }
        }

        // $('#row_info').text(curr.row);
        // $('#col_info').text(curr.col);

        $('td').attr('contenteditable', 'true');
        var el = $(this.table).find('tr').eq(curr.row).find('td').eq(curr.col)[0];
        el.focus();
        selectElementContents(el);
        this.cleanUp();
        curr.row = $(this.table).find('tr td:focus').closest('tr').index();
        curr.col = $(this.table).find('tr td:focus').index();

        max_col = $(this.table).find('tr').first().find('td').length;
        max_row = $(this.table).find('tr').length;

        $('#row_info').text(max_row);
        $('#col_info').text(max_col);
    }


    this.emptyRow = function(row) {
        var empty = true;
        $(this.table).find('tr').eq(row).find('td').each(function() {
            if ($(this).text() != '' && $(this).text() != null) {
                empty =  false;
                return false;
            }
        });
        return empty;
    }

    this.emptyCol = function(col) {
        var empty = true;
        $(this.table).find('tr').each(function(){
            $(this).find('td').eq(col).each(function() {
                if ($(this).text() != '' && $(this).text() != null) {
                    empty =  false;
                    return false;
                }
            });
        });

        return empty;
    }

    this.checkKey = function(e) {
        // e = e || window.event;


        console.log(curr);
        // console.log(this.table);
        var td = $(this.table).find('tr').eq(curr.row).find('td').eq(curr.col)[0];

        // https://stackoverflow.com/questions/7451468/contenteditable-div-how-can-i-determine-if-the-cursor-is-at-the-start-or-end-o/7478420#7478420
        // Get the current cusor position
        range = window.getSelection().getRangeAt(0)
        // Create a new range to deal with text before the cursor
        pre_range = document.createRange();
        // Have this range select the entire contents of the editable div
        pre_range.selectNodeContents(td);
        // Set the end point of this range to the start point of the cursor
        pre_range.setEnd(range.startContainer, range.startOffset);
        // Fetch the contents of this range (text before the cursor)
        this_text = pre_range.cloneContents();
        // If the text's length is 0, we're at the start of the div.
        at_start = this_text.textContent.length === 0;
        // Rinse and repeat for text after the cursor to determine if we're at the end.
        post_range = document.createRange();
        post_range.selectNodeContents(td);
        post_range.setStart(range.endContainer, range.endOffset);
        next_text = post_range.cloneContents();
        at_end = next_text.textContent.length === 0;

        // console.log('AT: ' + at_start + ' ' + at_end);
        console.log('KEYCODE: ' + e.keyCode);

        if (e.keyCode === 38) {
            // up arrow
            this.move(-1, 0);
        }
        else if (e.keyCode === 40) {
            // down arrow
            this.move(1, 0);
        }
        else if (e.keyCode === 37 && at_start) {
            // left arrow
            this.move(0, -1);
        }
        else if (e.keyCode == 39 && at_end) {
            // right arrow
            this.move(0, 1);
        }

        var key = e.key;

        var me = this;
        var table = this.table;

        $(this.table).find('tr td').off();
        $(this.table).find('tr td').click(function() {
            $(this)[0].focus();
            $(this).attr('contenteditable', 'true');
            // curr.row = $(this).closest('tr').index();
            // curr.col = $(this).index();
            curr.row = $(table).find('tr td:focus').closest('tr').index();
            curr.col = $(table).find('tr td:focus').index();
            console.log(curr);
            // me.cleanUp();
        });

        // https://jsfiddle.net/Mottie/8w5x7e1s/
        $(this.table).find('td').on('focus', function() {
            var cell = this;
            // select all text in contenteditable
            // see http://stackoverflow.com/a/6150060/145346
            var range, selection;
            if (document.body.createTextRange) {
                range = document.body.createTextRange();
                range.moveToElementText(cell);
                range.select();
            } else if (window.getSelection) {
                selection = window.getSelection();
                range = document.createRange();
                range.selectNodeContents(cell);
                selection.removeAllRanges();
                selection.addRange(range);
            }
        });

        // this.updateMatrix();
    }

    this.updateMatrix = function() {

        var input = this.input;
        var popupdiv = this.popupdiv;

        console.log('updateMatrix');
        // $(this.table).keyup(function() {
        console.log(this.table);

        var ww_code = '[';

        var values = [];
        $(this.table)[0].querySelectorAll('tr').forEach(tr => {
			console.log(tr);
			let row = [];
			tr.querySelectorAll('td').forEach(td => {
                if (td.textContent != '' && td.textContent != null) {
                    row.push(td.textContent);
                } else {
                    row.push('0');
                }
            });
			console.log(row);
            values.push(row);
        });
        console.log(values);

        ww_code = '[' + values.map(function(row) {
            var row_code = row.map(function(val) {
                return val;
            }).join(" , ");
            return '[' + row_code + ']';
        }).join(" , ") + ']';
        console.log(ww_code);
        $(input).val(ww_code);

		const octaveCode = '[' + values.map(function(row, index) {
            var row_code = row.map(function(val) {
                return val;
            }).join(" , ");
            return row_code;
        }).join("; ") + ']';
		document.querySelector('#octave').value = octaveCode;

        var latex_code = "\n$\\begin{pmatrix}\n" + values.map(function(row) {
            var row_code = row.map(function(val) {
                return val;
            }).join(" & ");
            return row_code;
        }).join("\\\\\n") + "\n\\end{pmatrix}$";

        var cached_tex = $(report).find('.cached_tex').first().text();
        console.log(cached_tex);
        console.log(latex_code);
        // $('#latex').html('<pre style="color:#f00">' + latex_code + '</pre>');
        if (latex_code != cached_tex) {
            var $preview = $(report).find('.jax_preview');
            $preview.text(latex_code);
            MathJax.Hub.Queue(["Typeset", MathJax.Hub, $preview[0]]);
            $(report).find('.cached_tex').text(latex_code);
        }
        // });
		const rrefValues = rref(values);
		console.log(rrefValues);
        let tableHTML =  '<table class="table table-bordered">' + rrefValues.map(row => {
            return '<tr>' + row.map(value => {
                return '<td>' + value + '</td>';
            }).join('') + '</tr>';
        }).join('') + '</table>';
		document.querySelector('#rref').innerHTML = tableHTML;
    }

}
