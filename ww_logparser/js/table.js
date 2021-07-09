function MaxPerPage(props) {
    return (
        <div className='me-5' style={{display:'inline-block'}}>
        <select className="form-control" style={{width:'auto'}} name="maxperpage" onChange={props.handlemaxperpage} >
        <option value="50">Max Per Page</option>
        <option value="50">50</option>
        <option value="100">100</option>
            <option value="200">200</option>
            <option value="500">500</option>
        </select>
    </div>
);
}

function Sort(props) {
    if (props.sort == 1) {
        return(            
            <a className="triangle" onClick={() => props.handlesort(props.field)}><i className="bi bi-caret-up-fill"></i></a>
        );
    } else if (props.sort == -1) {
        return(
            <a className="triangle" onClick={() => props.handlesort(props.field)}><i className="bi bi-caret-down-fill"></i></a>
        );
    } else {
        return(
            <a className="triangle" onClick={() => props.handlesort(props.field)}><i className="bi bi-caret-right"></i></a>
        );
    }
}

function Page(props) {
    return(
        <table id={props.id} className="table table-bordered table-hover">
            <Header groups={props.groups} grouphandler={props.grouphandler} groupfield={props.groupfield} headers={props.headers} handlesort={props.handlesort} />
            <TbodyPage datalist={props.datalist} groups={props.groups} groupfield={props.groupfield} container={props.container} columnlist={props.columnlist} headers={props.headers} student={props.student} page={props.page} maxperpage={props.maxperpage}/>
        </table>
    );
}

class Header extends React.Component {
    constructor(props) {
        super(props); 
        this.StatisticsHandler = this.StatisticsHandler.bind(this);
        
    }    
    
    StatisticsHandler(field) {
        let table = [];
        this.props.groups.forEach(group => {
            group.map(element => {
                table.push(element);
            });
        });
        let values = table.map(item => {return item[field];});
        statistics(values, field);
    }
        
    render() {        
        return(
            <thead>
                <tr id="header_row" className="table-secondary">
                    <th key='count' data-field='count' className='col_count'><a>Count</a></th>
                    <th key='rank' data-field='rank' className='col_rank'><a>Rank</a></th>                    
                    {Object.keys(this.props.headers).filter(field => field != 'rank' && field != 'count').map((field, i) => {
                        let groupby = this.props.groupfield == field ? 'groupby' : '';
                        return (
                            <th key={field} data-field={field} className={groupby}>
                                <a href="#" className="header" data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false">{field}</a>
                                <div className="dropdown-menu" aria-labelledby={field}>
                                    <a className="dropdown-item group_by" data-field={field} href="#"  onClick={() => this.props.grouphandler(field)}>Group by</a>
                                    <a className="dropdown-item fields statistics" data-field={field} href="#" data-bs-toggle="modal" data-bs-target="#statistics" onClick={() => this.StatisticsHandler(field)}>Statistics</a>                        
                                </div>
                                <Sort handlesort={this.props.handlesort} field={field} sort={this.props.headers[field].sort} />
                            </th>
                        )
                    })}
                </tr>
            </thead>
        );
    }
}

function TableRow(props) {
    // let rank = props.index;
    return (
        <tr data-group-index={props.groupindex.toString()}>
            <td key='count' data-field='count' className='col_count' data-count={props.count}><div className="count-number" style={{float:'left'}}>{props.count}</div><div style={{float:'right'}} className="expandcollapse">+</div></td>
            <td key='rank' data-field='rank' className='col_rank' ><span>{props.row['rank']}</span></td>
            {Object.keys(props.headers).filter(field => field != 'rank' && field != 'count').map((field, index) => {
                if (field != 'sid') {           
                    return (
                        <td key={field} className={'col_' + field} data-field={field}>
                            <span>{props.row[field]}</span>
                        </td>
                    )
                } else {
                    return (
                        <td key={field} className={'col_' + field} data-field={field}>
                        <a data-bs-toggle="modal" data-bs-target="#student_modal" onClick={()=>{props.student.current.studentHandler(props.row[field]);}}>{props.row[field]}</a>
                        </td>
                    )
                }
            })}
        </tr>    
    );
}

class TbodyBase extends React.Component {
    constructor(props) {
        super(props); 
    }    
    componentDidUpdate() {
        console.log('tbody did update');
        console.log(this.props.headers);
        
        const groupField = this.props.groupfield;
        
        // $(function() {
        const container = '#' + this.props.container;
        console.log(container);
        
        $('a.page[data-index]').removeClass('selected');
        $('a.page[data-index="' + this.props.page + '"]').addClass('selected');
        
        $(container + ' tbody tr').css('background-color', '');
        $(container + ' tbody tr').show();
        $(container + ' tbody tr').off();
        $(container + ' td.col_count').off();        
        $(container + ' tbody tr').click(function() {
            $(container + ' td').css('color', '');
            $(this).find('td').css('color', 'red');
        });
        if (groupField != 'index' && groupField != '') {
            $(container + ' td.col_rank span').hide();
            let groupCount = $(container + ' tbody').attr('data-group-count');
            for (let i = 1; i <= groupCount; i++) {            
                $(container + ' tbody tr[data-group-index=' + i + ']').not(":eq(0)").hide();
                if ($(container + ' tbody tr[data-group-index="' + i + '"]').length > 1) {
                    $(container + ' tbody tr[data-group-index="' + i + '"] div.expandcollapse').text('+');
                } else {
                    $(container + ' tbody tr[data-group-index="' + i + '"] div.expandcollapse').text('');
                }
                $(container + ' tbody tr[data-group-index="' + i + '"] td.col_count').click(() => {
                    if ($(container + ' tbody tr[data-group-index="' + i + '"]').length > 1) {
                        if ($(container + ' tbody tr[data-group-index="' + i + '"]:eq(1)').is(":visible")) {
                            $(container + ' tbody tr[data-group-index="' + i + '"]:not(:first)').hide();
                            $(container + ' tbody tr[data-group-index="' + i + '"] div.expandcollapse').text('+');
                            $(container + ' tbody tr[data-group-index="' + i + '"]').css('background-color', '');
                            $(container + ' tbody tr[data-group-index="' + i + '"] td.col_rank span').hide();
                        } else {
                            $(container + ' tbody tr[data-group-index="' + i + '"]').show();
                            $(container + ' tbody tr[data-group-index="' + i + '"] div.expandcollapse').text('-');
                            let bgcolor = 'hsl(' + (i * 150) % 360 + ', 55%, 95%)';
                            $(container + ' tbody tr[data-group-index="' + i + '"]').css('background-color', bgcolor);
                            $(container + ' tbody tr[data-group-index="' + i + '"] td.col_rank span').show();
                        }
                    } 
                });
            }
            $(container + ' div.expandcollapse').show();
        } else {
            $(container + ' div.expandcollapse').hide();
        }
        
        Object.keys(this.props.headers).map(field => {
            if ('visible' in this.props.headers[field]) {
                if(this.props.headers[field].visible) {
                    $('#' + this.props.container + ' th[data-field="' + field + '"],' + '#' + this.props.container + ' td[data-field="' + field + '"]').show();
                } else {
                    $('#' + this.props.container + ' th[data-field="' + field + '"],' + '#' + this.props.container + ' td[data-field="' + field + '"]').hide();
                }
            }
        });
        
        console.log('updating table width');
        console.log(this.props.container);
        let widths = computeColWidths(this.props.headers, this.props.container);
        let colIndex = $('#' + this.props.columnlist + ".sortable a").index($('#' + this.props.columnlist + ' .freezeCol').first()[0]);
        let $frozen = $('#' + this.props.columnlist + ".sortable a").slice(0, colIndex);        
        freezeColumns($frozen, widths, this.props.container);
        updateTableWidth(widths, this.props.container);
        
    }
}

class Tbody extends TbodyBase {        
    render() {
        return (
            <tbody data-group-count={this.props.groups.length}>
            {
                this.props.groups.map((group, groupIndex) => {
                    return group.map((row, index, group) => {
                        return <TableRow  groupindex={groupIndex + 1} row={row} count={group.length} headers={this.props.headers} index={index + 1} key={group.toString() + (index + 1).toString()} student={this.props.student} />
                    })
                })
            }
            </tbody>
        );
    }    
}

class TbodyPage extends TbodyBase {    
    render() {
        // console.log(this.props.datalist.slice(this.props.page, this.props.page + this.props.maxperpage));
        return (
            <tbody data-group-count={this.props.groups.length}>
            {
                this.props.datalist.slice(+(this.props.page)*(+(this.props.maxperpage)), Math.min(+(this.props.page)*(+(this.props.maxperpage)) + +(this.props.maxperpage), this.props.datalist.length)).map((row, index) => {
                    return (
                        <TableRow  groupindex={row['group-index']} row={row} count={row.count} headers={this.props.headers} index={index + 1} key={index} student={this.props.student} />
                    );
                })
            }
            </tbody>
        );
    }    
}

class Table extends React.Component {
    constructor(props) {
        super(props); 
        this.state = {
            sortArray:{},
            sortField:'',
            groupField:'index',
            groups:[],
            datalist:[],
            hwSortArray:{},
            hwSortField:'',
            problemHeaders:{count:{}, rank:{}, index:{}, unixtime:{}, time:{}, sid:{}, result:{}, score:{}, answer:{}},
            headers:{},
            quizMode:false,
            quizDisplayMode:'result',
            page:0,
            maxPerPage:50,
            numPage:1
        };
        
        this.handleMaxPerPage = this.handleMaxPerPage.bind(this);
        this.handleSort = this.handleSort.bind(this);
        this.handlePage = this.handlePage.bind(this);
        this.updateTable = this.updateTable.bind(this);
    }        

    handleMaxPerPage(e) {
        const max = e.target.value;
        console.log(max);
        this.setState({
            page:0,
            maxPerPage:parseInt(max),
            numPages:Math.floor(this.state.datalist.length/max) + 1
        });
    }

    handlePage(page) {
        const p = page >= this.state.numPages ? this.state.numPages -1 : (page < 0 ? 0 : page);
        this.setState({
            page:parseInt(p)
        });
    }

    resetHw(database, selectedSet, problems, quizMode = this.state.quizMode, quizDisplayMode = this.state.quizDisplayMode, filter = 'true') {
        console.log('resetting groups');
        // const database = this.props.database;
        
        let hwSortArray = {};
        let hwsetData = {};
        let finalAnswers = {};
        let index, answer, utime, metaData, time, sid, hwset, result, score, prob;
        let row;
        
        console.log(database);
        for(let i = 0; i < database.length; i++) {
            row = database[i];
            index = row.index;
            sid = row.sid;
            hwset = row.hwset;
            result = row.result;
            time = row.time;
            utime = row.utime;
            answer = row.answer;
            prob = row.prob;
            score = row.score;
            
            let processed_ans = answer;
            if (quizMode) {
                if (!answer.match(/submit/ig) || (answer.match(/no answer entered|no_answer/ig) && score == '0')) {
                    continue;
                }
                // if (!answer.match(/submit/ig)) {
                //     continue;
                // }
                processed_ans = answer.replace(/\[submit\] */ig, '');
            }

            if (typeof finalAnswers[sid] === 'undefined') {
                finalAnswers[sid] = new Array();
            }

            if (typeof finalAnswers[sid][hwset] === 'undefined') {
                finalAnswers[sid][hwset] = new Array();
            }
            

            if (typeof finalAnswers[sid][hwset][prob] === 'undefined' || finalAnswers[sid][hwset][prob]['unixtime'] < utime) {
                finalAnswers[sid][hwset][prob] = {
                    'prob': prob,
                    'answer': processed_ans,
                    'result': result,
                    'unixtime': utime,
                    'hwset': hwset,
                    'time': time,
                    'sid': sid,
                    'index':index,
                    'score': score
                }
            }
        }
        // console.log(finalAnswers);
        // console.log(problems);
        let headers = {
            count:{sort:0, visible:true}, 
            rank:{sort:0, visible:true}, 
            index:{sort:0, visible:true}, 
            sid:{sort:0, visible:true}
        };
        problems.map(field => {
            headers['Problem ' + field.toString()] = {sort:0, visible:true};
        });
        
        let item, datum;
        let datalist = Object.keys(finalAnswers).map((sid, index) => {
            item = finalAnswers[sid][selectedSet];
            datum = {index:index, sid:sid};
            problems.map(prob => {
                try {
                    datum['Problem ' + prob] = item[prob][quizDisplayMode];
                } catch(e) {
                    datum['Problem ' + prob] = quizDisplayMode == 'score' ? 0 : 'EMPTY';
                }
            });
            return datum;
        });
        console.log(headers);
        this.setState({
            quizMode:quizMode,
            quizDisplayMode:quizDisplayMode
        }, function() {
            const filterFunc =  new Function('item', 'return ' + filter);
            this.updateTable('index', '', datalist.filter(filterFunc), headers, quizMode, quizDisplayMode);
            this.props.updatecheckboxes(headers);
        });
    }

    resetProblemGroups(datalist, headers = this.state.problemHeaders, quizMode = this.state.quizMode, quizDisplayMode = this.state.quizDisplayMode) {
        console.log('resetting groups');
        console.log(headers);
        Object.keys(headers).map(field => {
            headers[field].sort = 0;
            headers[field].visible = true;
        });
        let sortArray = {};
        
        this.updateTable('index', 'unixtime', datalist, headers, quizMode, quizDisplayMode);
    }

    updateTable(gf = this.state.groupField, sortField = this.state.sortField, datalist = this.state.datalist.slice(), oldHeaders = this.state.headers, quizMode = this.state.quizMode, quizDisplayMode = this.state.quizDisplayMode) {
        console.log('updating table');
        const groupField = gf;
        
        let headers = {...oldHeaders};
        console.log(headers);
        
        let values = datalist.map(item => {
            return item[groupField];
        });
        
        let uniqueSorted = [''];
        
        if(groupField != 'index') {
            let unique = values.filter((value, index, self) => { return self.indexOf(value) === index; });
            console.log(unique);
            let order = headers[groupField].sort == 0 ? 1 : headers[groupField].sort;
            headers[groupField].sort = order;
            uniqueSorted = unique.sort((a, b) => {                
                if (!(isNaN(parseFloat(a)) || isNaN(parseFloat(b)))) {
                    return order*(parseFloat(a) - parseFloat(b));
                } else {
                    return order*(a.toString().localeCompare(b.toString())); 
                }
            });            
        }
    
        let datum;
        let updatedGroups = uniqueSorted.map((value, index) => {
            let table = [];
            for (let i = 0; i < datalist.length; i++) {
                let item = datalist[i];
                if (item[groupField] != value && groupField != 'index') {
                    continue;
                }
                datum = {};                
                Object.keys(headers).map(field => {
                    if (item[field] == null || typeof item[field] == 'undefined') {
                        datum[field] = '';
                    } else {
                        datum[field] = item[field];
                    }
                });
                datum['group-index'] = index + 1;
                table.push(datum);
            }
            return table.sort((a, b) => {return this.sortByField(headers, a, b, sortField);});
        }); 
        
        let countedGroups = updatedGroups.map(group => {            
            return group.map((datum, rank, group) => {
                let counted = {...datum};
                if(groupField != 'index') {
                    counted['rank'] = rank;
                } else {
                    counted['rank'] = '';
                }
                counted['count'] = group.length;
                return counted;
            });
        });
        datalist = [].concat.apply([], countedGroups);
                
        console.log(headers);
        this.setState({
            groups:updatedGroups,
            groupField:groupField,
            sortField:sortField,
            datalist: datalist,
            headers:headers,
            quizMode:quizMode,
            quizDisplayMode:quizDisplayMode,
            page:0,
            numPages:Math.floor(datalist.length/this.state.maxPerPage) + 1
        }, function(){ 
            console.log(this.state.headers);
            this.props.updatecheckboxes(headers);
            this.props.updatequery(headers);
        });
    }

    handleSort(sortField) {
        console.log(sortField);
        let headers = {...this.state.headers};
        if ('sort' in headers[sortField]) {
            headers[sortField].sort =  headers[sortField].sort == 1 ? -1 : 1;
        } else {
            headers[sortField].sort =  1 ;
        }
        this.updateTable(this.state.groupField, sortField, this.state.datalist.slice(), headers);
    }

    sortByField(headers, a, b, field) {
        if (field == '') {
            return true;
        }
        let clicked = headers[field].sort;
        
        let diff;
        if (!(isNaN(a[field]) || isNaN(b[field]))) {
            diff =  clicked*(+a[field] - +b[field]);
        } else {
            diff = clicked*a[field].toString().localeCompare(b[field].toString()); 
        }
        
        return diff;
    }
    
    componentDidUpdate() {
        $('#' + this.props.container + ' .pagination .page-item').removeClass('active');
        $('#' + this.props.container + ' .pagination .page-item[data-page="' + this.state.page + '"]').addClass('active');
    }

    render() {
        // <table id={this.props.id} className="table table-bordered table-hover">
        //     <Header groups={this.state.groups} grouphandler={this.updateTable} groupfield={this.state.groupField} headers={this.state.headers} handlesort={this.handleSort} />
        //     <Tbody groups={this.state.groups} groupfield={this.state.groupField} columnlist={this.props.columnlist} headers={this.state.headers} student={this.props.student} container={this.props.container} />
        // </table>
        const numPages = this.state.numPages;
        return(
            <div className="page-container">
                <div className="table-container">
                    <Page datalist={this.state.datalist} page={this.state.page} groups={this.state.groups} groupfield={this.state.groupField} grouphandler={this.updateTable} container={this.props.container} columnlist={this.props.columnlist} headers={this.state.headers} student={this.props.student} container={this.props.container} handlesort={this.handleSort} maxperpage={this.state.maxPerPage}/>
                </div>
                <div className="pages d-flex justify-content-start pt-2">
                    <MaxPerPage handlemaxperpage={this.handleMaxPerPage} />
                    <nav>
                        <ul className="pagination">
                            <li key="prev" className="page-item">
                                <a className="page-link" href="#" aria-label="Previous" onClick={()=>{this.handlePage(this.state.page - 1);}} >
                                    <span aria-hidden="true">&laquo;</span>
                                </a>
                            </li>
                            <li key="first" style={{display:'inline-block'}} className="page-item">
                                <a className="page-link" href="#" onClick={()=>{this.handlePage(0)}}>
                                    First
                                </a>
                            </li>
                            {
                                [...Array(numPages).keys()].slice(
                                    Math.max(this.state.page - 4 - Math.max(4 - numPages + 1 + this.state.page , 0), 0), 
                                    Math.min(this.state.page + 4 + Math.max(4 - this.state.page , 0), numPages - 1)  + 1
                                ).map( page => {
                                    return (
                                        <li key={page} style={{display:'inline-block'}} className="page-item" data-page={page}>
                                            <a className="page-link" href="#" onClick={()=>{this.handlePage(page)}}>
                                                {
                                                    // Math.min(this.state.maxPerPage*(index + 1), this.state.datalist.length)
                                                    page + 1
                                                }
                                            </a>
                                        </li>
                                    )
                                })
                            }
                            <li key="last" style={{display:'inline-block'}} className="page-item">
                                <a className="page-link" href="#" onClick={()=>{this.handlePage(numPages - 1)}}>
                                    Last ({numPages})
                                </a>
                            </li>
                            <li key="next" className="page-item">
                                <a className="page-link" href="#" aria-label="Next" onClick={()=>{this.handlePage(this.state.page + 1);}} >
                                    <span aria-hidden="true">&raquo;</span>
                                </a>
                            </li>
                        </ul>
                    </nav>
                </div>
            </div>
        )
    }
}
