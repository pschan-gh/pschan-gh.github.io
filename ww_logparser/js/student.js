class Student extends React.Component {
	constructor(props){		
        super(props);
		this.state= {
			headers : {count:{visible:true}, rank:{visible:true}, index:{visible:true}, time:{visible:true}, unixtime:{visible:true}, prob:{visible:true}, result:{visible:true}, answer:{visible:true}},
			quizMode:false,
            quizDisplayMode:'result',
			sid : null
		};
		this.studentHandler = this.studentHandler.bind(this);
        this.updateCheckboxes = this.updateCheckboxes.bind(this);
		this.updateTableHeaders = this.updateTableHeaders.bind(this);
		this.table = React.createRef();		
		this.checkboxes = React.createRef();	
	}
	
    updateCheckboxes(headers) {
        this.checkboxes.current.setState({
            headers:this.state.headers
        });
    }
    
	updateTableHeaders(headers) {
        this.table.current.setState({headers:headers});
    }
	
	studentHandler(sid) {
		this.setState({
			sid:sid,
			headers : {count:{}, rank:{}, index:{}, time:{}, unixtime:{}, prob:{}, result:{}, answer:{}},
		}, function() {
			console.log('updating student');
			const filter = 'item["sid"] == "' + sid + '"';
	        console.log(filter);
	        const filterFunc =  new Function('item', 'return ' + filter);
			this.table.current.resetProblemGroups(this.props.database.filter(filterFunc), this.state.headers, false, 'result');
			// this.checkboxes.current.setState({
			// 	headers:this.state.headers
			// });
		});
    }
	
	render() {
		return (
			<div id="student_modal" className="modal" tabIndex="-1" role="dialog" aria-labelledby="student_modal" aria-hidden="true">
				<div className="modal-dialog modal-lg" role="dialog" style={{height:'80%', maxWidth:'80%'}}>
					<div className="modal-content">
						<div className="modal-header">
							<h5 className="modal-title">{'Single Student Result - ' + this.props.hwset + ' - ' + this.state.sid}</h5>
							<a className="nav-link dropdown-toggle" id="student_columns_button" href="#" role="button" data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
	                        Columns
	                        </a>
							<CheckBoxes id="student_column_list" ref={this.checkboxes} headers={this.state.headers} updatetableheaders={this.updateTableHeaders} container="student_modal" dropdownmenubutton="student_columns_button"/>
							<button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
						</div>
						<div className="modal-body" style={{margin:'20px', height:'100%',overflowX:'scroll'}} >
							<Table ref={this.table} columnlist="student_column_list" updatecheckboxes={this.updateCheckboxes} updatequery={()=>{return true;}} container='student_modal' />
						</div>
					</div>
				</div>
			</div>
		);
	}
}
