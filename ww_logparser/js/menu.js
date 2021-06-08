function QuizDisplayMode(props) {
    return (
        <a className="nav-link" href="#">
            <select className="form-control display" id="display" name="quiz_display_mode" onChange={props.handlequizdisplay} >
                <option value="Select">Select Display Option ...</option>
                <option value="result">Display Results</option>
                <option value="score">Display Scores</option>
                <option value="answer">Display Answers</option>
            </select>
        </a>
    );
}

function QuizCheckBox(props) {
    return (
        <a className="nav-link">
            <input className='quiz_checkbox' checked={props.quizmode} type='checkbox' name="quiz_mode" onChange={props.handlequizmode} />
            <span>Quiz Mode</span>
        </a>
    );
} 

class Hwsets extends React.Component {
    constructor(props) {
        super(props);        
    }
    
    render() {        
        return (
            <a className="nav-link">
                <select className="form-control hwset" title="Select Homework Set" onChange={this.props.hwsethandler}>
                    <option value="default">Select Homework Set...</option>
                    {this.props.hwsets.map(hw => {
                        return <option key={hw} value={hw}>{hw}</option>;
                        })}
                </select>
            </a>
        );
    }
}

class Problems extends React.Component {
    constructor(props) {
        super(props);        
    }
    
    render() {        
        return (
            <a className="nav-link">
                <select className="form-control problems" title="Select Problem" onChange={this.props.problemhandler}>
                    <option value="default">Select Problem...</option>
                    {this.props.problems.map(p => {
                        return <option key={p} value={p}>{p}</option>;
                        })}
                </select>
            </a>
        );
    }
}

class FileInput extends React.Component {
    constructor(props) {
        super(props);        
    }
    
    render() {
        return (
            <a className="nav-link">
                <label className="form-control dropdown-item" >
                    Open Log File
                    <input type="file" ref={this.props.fileinput} style={{ display: "none" }} onChange={this.props.filehandler}/>
                </label>
            </a>
        );
    }
}

class Nav extends React.Component {
    constructor(props){
        super(props);
        
        this.updateQuery = this.updateQuery.bind(this);
        this.updateCheckboxes = this.updateCheckboxes.bind(this);
        this.checkboxes = React.createRef();
        this.query = React.createRef();
    }
    
    updateCheckboxes(headers =  this.props.headers) {
        const oldHeaders = {...this.checkboxes.current.state.headers};
        let updatedHeaders = {...headers};
        for (let field in headers) {
            if (field in oldHeaders) {
                updatedHeaders[field] = {...oldHeaders[field]};
            }
        }
        
        this.checkboxes.current.initCheckboxes(updatedHeaders);

    }
    
    updateQuery(headers) {
        this.query.current.setState({headers:{...headers}});
    }
    
    componentDidUpdate(props) {                
    }
    
    render() {
        return (
            <nav className="navbar navbar-expand-md navbar-light bg-light">
                <div className="navbar-collapse collapse">
                    <ul className="navbar-nav">
                        <li className="nav-item">
                            <FileInput fileinput={this.props.fileinput} filehandler={e => this.props.filehandler(e, this.props.fileinput)}/>
                        </li>
                        <li className="nav-item">
                            <Hwsets hwsets={this.props.hwsets} hwsethandler={this.props.hwsethandler} />
                        </li>
                        <li className="nav-item">
                            <Problems problems={this.props.problems} problemhandler={this.props.problemhandler} />
                        </li>
                        <li className="nav-item">
                            {this.props.problem == 'default' ?
                            <QuizCheckBox quizmode={this.props.quizmode} handlequizmode={this.props.handlequizmode} /> : null}
                        </li>
                        <li className="nav-item">
                            {this.props.problem == 'default' ?
                            <QuizDisplayMode handlequizdisplay={this.props.handlequizdisplay} /> : null}
                        </li>
                        <li className="nav-item dropdown" id="columns_toggle">
                        <a className="nav-link dropdown-toggle" href="#" id="navbarDropdown" role="button" data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                        Columns
                        </a>
                        <CheckBoxes id={this.props.columnlist} ref={this.checkboxes} headers={this.props.headers} updatetableheaders={this.props.updatetableheaders} freezecolindex={this.props.freezecolindex} container="table-container" />
                        </li>
                        <li className="nav-item query">
                            <a className="nav-link query" href="#" role="button" data-bs-toggle="modal" data-bs-target="#query_modal">Query</a>
                            <Query ref={this.query} filter={this.props.filter} handlequery={this.props.handlequery} />
                        </li>
                    </ul>
                </div>
                <div className="navbar-collapse collapse justify-content-end">
                    <ul className="navbar-nav">
                        <li className="nav-item dropdown export">
                            <a className="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                                Export
                            </a>
                            <div className="dropdown-menu dropdown-menu-end">
                                <a id="exportCSV" className="dropdown-item" onClick={this.props.exporthandler}>
                                    Export to CSV
                                </a>
                            </div>
                        </li>   
                    </ul>
                </div>
            </nav> 
        )
    }
}