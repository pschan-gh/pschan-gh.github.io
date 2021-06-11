class FieldCheckBox extends React.Component {
    constructor(props) {
        super(props);
    }
    
    render() {
        return (
            <a className="dropdown-item field" key={this.props.field}>
            <input className='field_checkbox' checked={this.props.checked} type='checkbox' data-field={this.props.field} name={this.props.field} onChange={this.props.handlecheckboxes} /><span>{this.props.field}</span>
            </a>
        );
    }
}

class CheckBoxes extends React.Component {
    constructor(props){
        super(props);        
        this.state = {
            headers:{},
            freezeColIndex:2
        }
        this.handleCheckboxes = this.handleCheckboxes.bind(this);
        this.initCheckboxes = this.initCheckboxes.bind(this);
        this.updateHeaders = this.updateHeaders.bind(this);
    }
    
    updateHeaders() {
        let oldHeaders = this.state.headers;
        let freezeColIndex = $('#' + this.props.id + ".sortable a").index($('#' + this.props.id + ' .freezeCol').first()[0]);
        console.log('updating col: ' + freezeColIndex);
        let $boxes = $('#' + this.props.id + '.sortable input');
        let headers = {count:{}, rank:{}};
        $boxes.each(function() {
            headers[$(this).attr('data-field')] = oldHeaders[$(this).attr('data-field')];
        });
        console.log(headers);
        this.setState({
            headers: headers,
            freezeColIndex:freezeColIndex
        }, function() {this.props.updatetableheaders(headers);});
        
    }
    
    initCheckboxes(headers) {
        Object.keys(headers).map(field => {
            headers[field].visible = true;
        });
        console.log(headers);

        this.setState({headers:headers});
    
    }
    
    handleCheckboxes() {
        console.log('HANDLECHECKBOXES');
        console.log(this.state.headers);
        let headers = {...this.state.headers};
        console.log($('#' + this.props.id + ' .field_checkbox'));
        Object.keys(headers).map(field => {
            headers[field].visible = $('#' + this.props.id + ' .field_checkbox[name="' + field + '"]')[0].checked;
        });
    
        console.log(headers);
        this.setState({
            headers:headers
        });
                        
    }
    
    componentDidUpdate() {
        console.log('#' + this.props.id + ".sortable");
        console.log('#' + this.props.container);
        let $sortable = $('#' + this.props.id + ".sortable" );
        $('#' + this.props.id + " .freezeCol").remove();
        $('<a class="dropdown-item freezeCol" key="freezeCol"><hr/></a>').insertAfter($('#' + this.props.id + '.sortable a.field').eq(this.state.freezeColIndex - 1));
        
        $( function() {                        
            $sortable.sortable();
            $sortable.disableSelection();
        } );
        console.log(this.state.freezeColIndex);        
        
        const headers = this.state.headers;
        console.log(headers); 
        Object.keys(headers).map(field => {
            if ('visible' in this.state.headers[field]) {
                if(this.state.headers[field].visible) {
                    $('#' + this.props.container + ' th[data-field="' + field + '"],' + '#' + this.props.container + ' td[data-field="' + field + '"]').show();
                } else {
                    $('#' + this.props.container + ' th[data-field="' + field + '"],' + '#' + this.props.container + ' td[data-field="' + field + '"]').hide();
                }
            }
        });
        
        let widths = computeColWidths(this.state.headers);
        let $frozen = $('#' + this.props.id + ".sortable a").slice(0, this.state.freezeColIndex);
        freezeColumns($frozen, widths, this.props.container);
        updateTableWidth(widths, this.props.container);
    }
    
    render() {
        return (            
        <div id={this.props.id} className="dropdown-menu sortable" aria-labelledby={this.props.dropdownmenubutton}>
            {Object.keys(this.state.headers).map((field, index) => {
                return <FieldCheckBox headers={this.state.headers}  key={field} field={field} handlecheckboxes={this.handleCheckboxes} checked={this.state.headers[field].visible}/>
            })}
            <button className="btn btn-outline-secondary btn-sm ms-2" onClick={this.updateHeaders}>Reorder</button>
        </div>
        );
    }
}
