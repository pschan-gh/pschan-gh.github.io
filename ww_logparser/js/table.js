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
                    <th key='count' data-field='count' className='col_count'>Count</th>
                    <th key='rank' data-field='rank' className='col_rank'>Rank</th>                    
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
    let rank = props.index;
    return (
        <tr data-group-index={props.groupindex}>
            <td key='count' data-field='count' className='col_count' data-count={props.count}><div className="count-number" style={{float:'left'}}>{props.count}</div><div style={{float:'right'}} className="expandcollapse">+</div></td>
            <td key='rank' data-field='rank' className='col_rank' >{rank}</td>        
            {Object.keys(props.headers).filter(field => field != 'rank' && field != 'count').map((field, index) => {
                if (field != 'sid') {           
                    return (
                        <td key={field} className={'col_' + field} data-field={field}>{props.row[field]}
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

class Tbody extends React.Component {
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
        $(container + ' tbody tr').off();
        $(container + ' td.col_count').off();
        $(container + ' tbody tr').click(function() {
            $(container + ' td').css('color', '');
            $(this).find('td').css('color', 'red');
        });
        if (groupField != 'index' && groupField != '') {
            let groupCount = $(container + ' tbody').attr('data-group-count');
            for (let i = 1; i <= groupCount; i++) {            
                $(container + ' tbody tr[data-group-index=' + i + ']').not(":eq(0)").hide();
                $(container + ' tbody tr[data-group-index="' + i + '"] div.expandcollapse').text('+');
                $(container + ' tbody tr[data-group-index="' + i + '"] td.col_count').click(() => {
                    if ($(container + ' tbody tr[data-group-index="' + i + '"]').length > 1) {
                        if ($(container + ' tbody tr[data-group-index="' + i + '"]:eq(1)').is(":visible")) {
                            $(container + ' tbody tr[data-group-index="' + i + '"]:not(:first)').hide();
                            $(container + ' tbody tr[data-group-index="' + i + '"] div.expandcollapse').text('+');
                            $(container + ' tbody tr[data-group-index="' + i + '"]').css('background-color', '');
                        } else {
                            $(container + ' tbody tr[data-group-index="' + i + '"]').show();
                            $(container + ' tbody tr[data-group-index="' + i + '"] div.expandcollapse').text('-');
                            let bgcolor = 'hsl(' + (i * 150) % 360 + ', 55%, 95%)';
                            $(container + ' tbody tr[data-group-index="' + i + '"]').css('background-color', bgcolor);
                        }
                    }
                });
            }
        } else {
            $(container + ' div.expandcollapse').hide();
        }
        console.log('updating table width');
        let widths = computeColWidths(this.props.headers);
        let colIndex = $('#' + this.props.columnlist + ".sortable a").index($('#' + this.props.columnlist + ' .freezeCol').first()[0]);
        let $frozen = $('#' + this.props.columnlist + ".sortable a").slice(0, colIndex);        
        freezeColumns($frozen, widths, this.props.container);
        updateTableWidth(widths, this.props.container);
        
    }
    
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
            quizDisplayMode:'result'
        };
        this.handleSort = this.handleSort.bind(this);
        this.updateTable = this.updateTable.bind(this);
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
            answer = row.answer;
            prob = row.prob;
            score = row.score;
            
            let processed_ans = answer;
            if (quizMode) {
                if (!answer.match(/submit/ig) || answer.match(/no answer entered/ig)) {
                    continue;
                }
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
        console.log(finalAnswers);
        console.log(problems);
        let headers = {count:{}, rank:{}, sid:{}};
        problems.map(field => {
            headers['Problem ' + field.toString()] = {sort:0, visible:true};
        });
        
        let item, datum;
        let datalist = Object.keys(finalAnswers).map(sid => {
            item = finalAnswers[sid][selectedSet];
            datum = {sid:sid};
            problems.map(prob => {
                try {
                    datum['Problem ' + prob] = item[prob][quizDisplayMode];
                } catch(e) {
                    console.log(datum);
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

    updateTable(gf = this.state.groupField, sortField = this.state.sortField, datalist = this.state.datalist.slice(), headers = this.state.headers, quizMode = this.state.quizMode, quizDisplayMode = this.state.quizDisplayMode) {
        console.log('updating table');
        
        const groupField = gf;
        console.log(headers);
        let values = datalist.map(item => {
            return item[groupField];
        });
        
        let uniqueSorted = [''];
        
        if(groupField != 'index') {
            let unique = values.filter((value, index, self) => { return self.indexOf(value) === index; });
            let order = headers[groupField].sort;
            uniqueSorted = unique.sort((a, b) => {                
                if (!(isNaN(parseFloat(a)) || isNaN(parseFloat(b)))) {
                    return order*(parseFloat(a) - parseFloat(b));
                } else {
                    return order*a.localeCompare(b); 
                }
            });            
        }
    
        let datum;
        let updatedGroups = uniqueSorted.map(value => {
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
                table.push(datum);
            }
            return table.sort((a, b) => {return this.sortByField(headers, a, b, sortField);});
        });                
        
        datalist = [].concat.apply([], updatedGroups);
                
        console.log(headers);
        this.setState({
            groups:updatedGroups,
            groupField:groupField,
            sortField:sortField,
            datalist: datalist,
            headers:headers,
            quizMode:quizMode,
            quizDisplayMode:quizDisplayMode
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
    }

    render() {
        return(
            <table id={this.props.id} className="table table-bordered table-hover">
            <Header groups={this.state.groups} grouphandler={this.updateTable} groupfield={this.state.groupField} headers={this.state.headers} handlesort={this.handleSort} />
            <Tbody groups={this.state.groups} groupfield={this.state.groupField} container={this.props.container} columnlist={this.props.columnlist} headers={this.state.headers} student={this.props.student} container={this.props.container} />
            </table>
        )
    }
}
