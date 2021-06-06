class Student extends React.Component {
	constructor(props){		
        super(props);
		this.state= {
			headers : {count:{}, rank:{}, index:{}, time:{}, unixtime:{}, prob:{}, result:{}, answer:{}},
			quizMode:false,
            quizDisplayMode:'result',
			sid : null
		};
		this.studentHandler = this.studentHandler.bind(this);
		this.table = React.createRef();		
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
			this.table.current.resetProblemGroups(this.props.database.filter(filterFunc), this.state.headers);
		});
    }
	
	render() {
		return (
			<div id="student_modal" className="modal" tabIndex="-1" role="dialog" aria-labelledby="student_modal" aria-hidden="true">
				<div className="modal-dialog modal-lg" role="dialog" style={{height:'80%', maxWidth:'80%'}}>
					<div className="modal-content">
						<div className="modal-header">
							<h5 className="modal-title">{'Single Student Result - ' + this.props.hwset + ' - ' + this.state.sid}</h5>
							<button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
						</div>
						<div className="modal-body" style={{margin:'20px', height:'100%',overflowX:'scroll'}} >
							<Table ref={this.table} updatecheckboxes={this.props.updatecheckboxes} updatequery={()=>{return true;}} container='student_modal' />
						</div>
					</div>
				</div>
			</div>
		);
	}
}