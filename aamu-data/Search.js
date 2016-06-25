import React, { Component } from 'react';
import _ from 'lodash'

export default class Search extends Component {

    constructor(props) {
        super(props);
        this.state = {
            stopSearchResults: [],
            stopSearchError: null,
            searching: false
        }
    }

    searchForStops(searchTerm) {
        this.setState({searching: true, stopSearchError: null, stopSearchResults: []});
        getTimetables(searchTerm).then(result => {
            this.setState({stopSearchResults: result, searching: false});
            console.log(this.state)
        }).catch((err) => {
            this.setState({stopSearchError: err, searching: false});
        });
    }

    renderSearchResults() {
        console.log(this.state.stopSearchResults.map(stop => {
            return (
                <li className="stop-search-item">
                    <div className="stop-item-name">{stop.name_fi}</div>
                    <div className="stop-item-address">{stop.address_fi}</div>
                    <div className="stop-item-icon">&#128652;</div>
                </li>
            )
        }));
        return this.state.stopSearchResults.map(stop => {
            return (
                <li className="stop-search-item list-group-item" onClick={() => this.props.openTimeTableView(stop)} key={stop.code}>
                    <div className="container">
                        <span className="stop-item-name col-xs-3">{stop.name_fi}</span>
                        <span className="stop-item-address col-xs-3">{stop.address_fi}</span>
                        <span className="stop-item-icon col-xs-4"><i className="fa fa-bus" aria-hidden="true"/></span>
                    </div>
                </li>
            )
        })
    }

    render() {

        const stopSearch = _.debounce((term) => { this.searchForStops(term) }, 500);
        return (
            <div className="aamu-data-main">
                <div className="search-bar">
                    <input className="form-control" onChange={(event) => stopSearch(event.target.value)}/>
                    <div className="search-loader">
                        <img src="images/ajax-loader2.gif" style={{display: this.state.searching ? 'inline-block' : 'none'}}/>
                    </div>
                    <div className="stop-search-error" style={{display: this.state.stopSearchError ? 'block' : 'none'}}>
                        {this.state.stopSearchError}
                    </div>
                </div>
                <ul className="stop-list list-group">
                    {this.renderSearchResults()}
                </ul>
                <div className="timetables"></div>
            </div>
        );
    }
}