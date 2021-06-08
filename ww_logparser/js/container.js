class Container extends React.Component {
    constructor(props){
        super(props);
        this.state = {
            filename:'',
            loglist:[],
            database:[],            
            hwsets:[],
            hwset:null,
            problems:[],  
            problem:'default',          
            // wwFields:['sid', 'answer', 'index', 'unixtime', 'time', 'hwset', 'prob' , 'result', 'score'],
            headers: {count:{}, rank:{}, index:{}, time:{}, sid:{}, result:{}, score:{}, answer:{}},
            filter:'true',
            quizMode:false,
            quizDisplayMode:'result',
            // freezeColIndex:2
        };
        
        this.handleQuery = this.handleQuery.bind(this);
        this.exportHandler = this.exportHandler.bind(this);
        this.fileHandler = this.fileHandler.bind(this);
        this.hwsetHandler = this.hwsetHandler.bind(this);
        this.problemHandler = this.problemHandler.bind(this);
        this.updateCheckboxes = this.updateCheckboxes.bind(this);
        this.updateQuery = this.updateQuery.bind(this);
        this.updateMasterHeaders = this.updateMasterHeaders.bind(this);
        this.updateDatabase = this.updateDatabase.bind(this)
        this.handleQuizMode = this.handleQuizMode.bind(this);
        this.handleQuizDisplay = this.handleQuizDisplay.bind(this);
        this.updateTableHeaders = this.updateTableHeaders.bind(this);
        this.fileInput = React.createRef();
        this.table = React.createRef();
        this.student = React.createRef();
        this.nav = React.createRef();
    }    
    
    handleQuery(e, queryItems) {
        e.preventDefault();
        console.log(e);
        console.log(queryItems);
        let filter = '';
        queryItems.map(query => {            
            if (query.field == 'Show All') { 
                filter = 'true';
            } else {
                filter += ' ' + query.conjunction +  ' (item["' + query.field + '"] ' + query.condition + ')';
            }
            console.log(filter);            
        });
        $('#query_modal').modal('toggle');
        filter = '(' + this.state.filter + ')' + filter;
        console.log(filter);
        const filterFunc =  new Function('item', 'return ' + filter);
        if (this.state.problem == 'default') {
            this.table.current.resetHw(this.state.database, this.state.hwset, this.state.problems, this.state.quizMode, this.state.quizDisplayMode, filter);
        } else {
            this.table.current.resetProblemGroups(this.state.database.filter(filterFunc));
            this.updateCheckboxes();
        }
    }
    
    exportHandler() {
        console.log('export');
        
        let $table = $('#mainTable');
        var csv = $table.table2csv('return', {
            "separator": ",",
            "newline": "\n",
            "quoteFields": true,
            "excludeColumns": ".col_count, .col_rank",
            "excludeRows": "",
            "trimContent": true,
            "filename": "table.csv"
        });
        // https://stackoverflow.com/questions/42462764/javascript-export-csv-encoding-utf-8-issue/42466254
        var universalBOM = "\uFEFF";
        var a = document.createElement('a');
        a.setAttribute('href', 'data:text/csv;charset=UTF-8,'
        + encodeURIComponent(universalBOM + csv));
        a.setAttribute('download', 'untitled.csv');
        a.click()
    }
    
    updateCheckboxes(headers) {
        this.nav.current.updateCheckboxes(headers);
    }
    updateQuery(headers) {
        this.nav.current.updateQuery(headers);
    }
    
    updateMasterHeaders(headers) {
        let updatedHeaders = {count:{}, rank:{}};
        Object.keys(headers).map(field => {
            updatedHeaders[field] = headers[field];
        });
        console.log(updatedHeaders);
        this.setState({
            headers:updatedHeaders,
        });
        this.nav.current.updateCheckboxes(headers);
    }
    
    updateTableHeaders(headers) {
        this.table.current.setState({headers:headers});
    }
    
    handleQuizDisplay(e) {
        const value = e.target.value;
        console.log('display ' + value);
        this.setState({
            quizDisplayMode : value
        }, function() {
            this.table.current.resetHw(this.state.database, this.state.hwset, this.state.problems, this.state.quizMode, value);
        });
    }
    
    handleQuizMode(e) {
        const quizMode = e.target.checked;
        console.log(quizMode);
        this.updateDatabase(this.state.hwset, quizMode);
    }
    
    updateDatabase(selectedSet, quizMode = this.state.quizMode, quizDisplayMode = this.state.quizDisplayMode) {
        const loglist = this.state.loglist;
        const entryRegexp = /^(.*?)\t(\d+)\t(.*?)$/;
        const dqRegex = /\"/ig;
        
        let problems = [];
        let match, row;
        let index, answer, utime, metaData, time, sid, hwset, prob, result;
        let database = [];
        
        for (var i = 0; i < loglist.length - 1; i++) {
            match = entryRegexp.exec(loglist[i]);
            if (typeof(match) !== 'undefined' && match !== null)  {
                
                metaData = match[1].split(/\|/);
                hwset = metaData[2];
                if (hwset != selectedSet) {
                    continue;
                }                
                
                utime = match[2];
                
                time = metaData[0];
                
                // sid = maskSID == 0 ? metaData[1] : CryptoJS.MD5(metaData[1] + salt).toString(CryptoJS.enc.Hex).slice(0, 8);
                sid = metaData[1];
                
                answer = match[3].replace(dqRegex, "").replace(/\t/g, '; ').replace(/[^a-z0-9\s\;\+\-\_\^\(\)\[\]\*\/\\]/ig, ''); //.replace(/inf/g, '\\infty');
                        
                prob = parseInt(metaData[3]);
                if (!(problems.includes(prob))) {
                    problems.push(prob);
                }
                
                result = metaData[4];
                if (typeof(result) == 'undefined' || result == null) {
                    result = '1';
                }
                
                row = {
                    'index': i,
                    'unixtime': utime,
                    'sid': sid,
                    'answer': answer,
                    'time': time,
                    'hwset': hwset,
                    'prob': prob,
                    'result': result,
                    'score': Math.round(100*(result.match(/1/g) || []).length/(result.length))
                };                
                database.push(row);
            }
        }
        const problemsSorted = problems.sort((a, b) => a - b);
        this.setState({
            database:database,
            hwset:selectedSet,
            problems:problemsSorted,
            filter:'true',
            quizMode:quizMode,
            quizDisplayMode:quizDisplayMode
        },  function() {
            this.table.current.resetHw(database, selectedSet, problemsSorted, quizMode, quizDisplayMode);
        });
    }
    
    hwsetHandler(e) {
        const {name, value} = e.target;
        const hwset = value;
        this.setState({
            problems:[],
            problem:'default',
            quizMode:false
        }, function() { this.updateDatabase(hwset, this.state.quizMode) });
    }
    
    problemHandler(e) {
        const {name, value} = e.target;
        const problem = value;
        console.log(problem);
        if (problem != 'default') {
            this.setState({
                filter:'item["prob"] == ' + problem,
                problem:problem,
            },  function() {
                const filter = 'item["prob"] == ' + problem;
                const filterFunc =  new Function('item', 'return ' + filter);                
                this.table.current.resetProblemGroups(this.state.database.filter(filterFunc));
                this.updateCheckboxes();
            });
        } else {
            this.setState({
                filter:'true',
                problem:problem,
            }, function() {
                const filter = 'true';
                const filterFunc =  new Function('item', 'return ' + filter);       
                this.table.current.resetHw(this.state.database.filter(filterFunc), this.state.hwset, this.state.problems, this.state.quizMode, this.state.quizDisplayMode);
            });
        }
    }
    
    fileHandler(e, fileinput) {
        e.preventDefault();        
        console.log(
        `Selected file - ${fileinput.current.files[0].name}`
        );
        const reader = new FileReader();
        const scope = this;
        const entryRegexp = /^(.*?)\t(\d+)\t(.*?)$/;
                
        reader.onload = function(e) {
            let hwsets = [];
            const loglist = e.target.result.split(/\r?\n/);
            let hwset;
            
            loglist.forEach(entry => {
                var match = entryRegexp.exec(entry);
                if (typeof(match) !== 'undefined' && match !== null)  {
                    hwset = match[1].split(/\|/)[2];
                    if (!(hwsets.includes(hwset))) {
                        hwsets.push(hwset);
                    }
                }
            });
                        
            scope.setState({
                loglist: loglist,
                hwsets:hwsets,
                filename:fileinput.current.files[0].name
            }, function() {console.log(this.state);});
            
            // $('select.key').show();
            // $('select.key').prop('disabled', false);
        }
        reader.readAsText(fileinput.current.files[0]);
    }
    
    componentDidUpdate() {
        const headers = this.state.headers;
        
        let widths = computeColWidths(this.state.headers);
        console.log(widths);
        let colIndex = $('#main-column-list.sortable a').index($('.freezeCol').first()[0]);
        let $frozen = $('#main-column-list.sortable a').slice(0, colIndex);        
        freezeColumns($frozen, widths, this.props.container);
        updateTableWidth(widths, this.props.container);
    }
    
    render() {
        return (
        <div className="inner-container">
            <Nav ref={this.nav} fileinput={this.fileInput} table={this.table} filehandler={this.fileHandler} hwsets={this.state.hwsets} hwsethandler={this.hwsetHandler} problems={this.state.problems} problem={this.state.problem} problemhandler={this.problemHandler} handlequizmode={this.handleQuizMode} handlequizdisplay={this.handleQuizDisplay} updatemasterheaders={this.updateHeaders} updatetableheaders={this.updateTableHeaders} headers={this.state.headers} quizmode={this.state.quizMode} exporthandler={this.exportHandler} handlequery={this.handleQuery} columnlist='main-column-list'/>
            <div id="outer-table-container">
                <div id="table-container">
                    <Table ref={this.table} id='mainTable' updatecheckboxes={this.updateCheckboxes} updatequery={this.updateQuery} student={this.student} container='table-container' columnlist='main-column-list' />
                </div>
            </div>    
            <Student ref={this.student} updatecheckboxes={this.updateCheckboxes} updatequery={this.updateQuery} database={this.state.database} hwset={this.state.hwset} />
        </div>
        )
    }
}

ReactDOM.render(<Container />, document.getElementById('container'))
