import React, { Component } from 'react';
import _ from 'lodash'

export default class TimeTable extends Component {

    constructor(props) {
        super(props);

        this.state = {
            menot: [],
            tulot: []
        };

        setInterval(() => {this.getMeno(); this.getTulo();}, 1000*60);
    }

    getTimeLeft(timeStr) {
        const h = new Date().getHours();
        const m = new Date().getMinutes();
        const busH = parseInt(timeStr.substr(0, 2));
        const busM = parseInt(timeStr.substr(2, 2));
        const mins = (busH - h)*60 + (busM - m);
        return mins > 59 ? `${Math.floor(mins/60)} h ${mins % 60} m` : `${mins % 60} m`;
    }

    getName(code, data) {
        const line = data.lines.filter((line) => { return line.indexOf(code) > -1 })[0];
        return line.indexOf(',') > -1 ? line.substr(line.indexOf(':')+1,line.indexOf(',') - line.indexOf(':')-1) : line.substr(line.indexOf(':')+1);
    }

    componentDidMount() {
        this.getMeno(); this.getTulo();
    }

    getMeno() {
        this.props.meno().then(resp => {
            this.setState({
                menot: resp[0].departures.map(dep => {
                    return <li className="departure-item list-group-item" key={dep.time}>
                        <div className="container">
                            <span className="bus-line col-xs-3">{dep.code.substr(1, 4)}</span>
                            <span className="bus-name col-xs-3">{this.getName(dep.code, resp[0])}</span>
                            <span className="bus-time col-xs-3">{this.getTimeLeft(dep.time.toString())}</span>
                        </div>
                    </li>
                })
            })
        })
    }

    getTulo() {
        this.props.tulo().then(resp => {
            this.setState({
                tulot: resp[0].departures.map(dep => {
                    return <li className="departure-item list-group-item" key={dep.time}>
                        <div className="container">
                            <span className="bus-line col-xs-3">{dep.code.substr(1, 4)}</span>
                            <span className="bus-name col-xs-3">{this.getName(dep.code, resp[0])}</span>
                            <span className="bus-time col-xs-3">{this.getTimeLeft(dep.time.toString())}</span>
                        </div>
                    </li>
                })
            })
        })
    }

    render() {
        return (
            <div>
                <div className="arrivals">
                    <h3>Helsinkiin</h3>
                    {this.state.tulot}
                </div>
                <div className="departures">
                    <h3>Espooseen</h3>
                    {this.state.menot}
                </div>
            </div>
        )
    }
}