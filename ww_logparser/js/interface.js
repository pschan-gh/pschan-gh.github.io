function computeColWidths(headers, container) {    
    let colWidths = {};
    let widths;
    let c = '#' + container;
    let tableWidth = 0;
    console.log(headers);
    
    // Object.keys(headers).filter(field => {return headers[field].visible;}).map(field => {
    //     widths = [];
    //     $("td[data-field='" + field + "']").each(function() {
    //         widths.push($(this).text().length);
    //     });
    //     $("th[data-field='" + field + "']").each(function() {
    //         widths.push($(this).find('a.header').first().text().length);
    //     });
    //     colWidths[field] = Math.min(400, 12*Math.max(...widths)) + 50;
    // });
    Object.keys(headers).map(field => {
        tableWidth += 400;
        $(c + ' th[data-field="' + field + '"]').each(function() {
            $(this).css('width', 400);
        });
        $(c + ' td[data-field="' + field + '"]').each(function() {
            $(this).css('width', 400);
        });
    });
    
    $(c + ' table').css('width', tableWidth + 20);
    
    let width;
    let currWidth;
    Object.keys(headers).filter(field => {return headers[field].visible;}).map(field => {
        width = 0;
        $(c + " td[data-field='" + field + "']").each(function() {
            if ($(this).find('span').length) {
                currWidth = $(this).find('span')[0].offsetWidth;
                width = currWidth > width ? currWidth : width;
            }
        });
        if ($(c + " th[data-field='" + field + "'] a").length) {
            currWidth = $(c + " th[data-field='" + field + "'] a")[0].offsetWidth;
            width = currWidth > width ? currWidth : width;
        }
        console.log(field + ' ' + width);
        // colWidths[field] = Math.min(400, Math.max(...widths)) + 50;
        colWidths[field] = field.match(/count|rank/i) ? Math.min(400, width) : Math.min(400, width) + 40;
    });
    console.log(colWidths);            
    return colWidths;
}

function updateTableWidth(colWidths, container) {
    let tableWidth = 0;
    let c = '#' + container;
        
    Object.keys(colWidths).map(field => {
        tableWidth += colWidths[field];
        $(c + ' th[data-field="' + field + '"]').css('width', colWidths[field]);
    });    
    $(c + ' table').css('width', tableWidth + 20);
    $(c + ' tbody').css('margin-top', parseInt($('th').first().css('height')));
}

function freezeColumns($frozen, colWidths, container) {
    console.log('freezing columns');
    // console.log(colWidths);
    // console.log($frozen);
    
    let c = '#' + container;
    // console.log('updating ' + c);
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
        // console.log($frozen.eq(i).find('input').attr('data-field'));
        // console.log(colWidths[$frozen.eq(i).find('input').attr('data-field')]);
        // console.log(offset);
    }
}
