function computeColWidths(headers) {
    let colWidths = {};
    let widths;
    console.log(headers);
    Object.keys(headers).filter(field => {return headers[field].visible;}).map(field => {
        widths = [];
        $("td[data-field='" + field + "']").each(function() {
            widths.push($(this).text().length);
        });
        $("th[data-field='" + field + "']").each(function() {
            widths.push($(this).find('a.header').first().text().length);
        });
        colWidths[field] = Math.min(400, 10*Math.max(...widths)) + 30;
    });
    return colWidths;
}

function updateTableWidth(colWidths, container) {
    let tableWidth = 0;
    let c = '#' + container;
    console.log('updating ' + c);
    
    Object.keys(colWidths).map(field => {
        tableWidth += colWidths[field];
        $(c + ' th[data-field="' + field + '"]').each(function() {
            $(this).css('width', colWidths[$(this).attr('data-field')]);
        });
    });
    
    // $(c).css('width', tableWidth + 50);    
    $(c + ' table').css('width', tableWidth + 20);
    $(c + ' tbody').css('margin-top', parseInt($('th').first().css('height')));
}

function freezeColumns($frozen, colWidths, container) {
    console.log('freezing columns');
    console.log(colWidths);
    console.log($frozen);
    
    let c = '#' + container;
    console.log('updating ' + c);
    $(c + ' thead th').css('position', '');
    $(c + ' thead th').css('left', '');
    $(c + ' thead th').css('z-index', '');
    $(c + ' thead th').css('background-color', '');
    
    $(c + ' tr td').css('position', '');
    $(c + ' tr td').css('left', '');
    $(c + ' tr td').css('z-index', '');
    $(c + ' tr td').css('background-color', '');
    
    let offset = 0;
    let i;
    for (i = 0; i < $frozen.length; i++) {
        $(c + ' thead th').eq(i).css('position', 'sticky');
        $(c + ' thead th').eq(i).css('left', offset);
        $(c + ' thead th').eq(i).css('z-index', 10);
        
        $(c + ' tr td:nth-child(' + (i + 1) + ')').css('position', 'sticky');
        $(c + ' tr td:nth-child(' + (i + 1) + ')').css('left', offset);
        $(c + ' tr td:nth-child(' + (i + 1) + ')').css('z-index', 1);
        $(c + ' tr td:nth-child(' + (i + 1) + ')').css('background-color', '#eee');        
        offset += colWidths[$frozen.eq(i).find('input').attr('data-field')];
        console.log($frozen.eq(i).find('input').attr('data-field'));
        console.log(colWidths[$frozen.eq(i).find('input').attr('data-field')]);
        console.log(offset);
    }
}
