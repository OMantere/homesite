import React, { Component } from 'react';
import _ from 'lodash'
import { meno, tulo } from './menoTuloApi'

import Search from './Search'
import TimeTable from './TimeTable'

export default class App extends Component {

    constructor(props) {
        super(props);

        this.state = {
            currentView: React.createElement(TimeTable, {
                meno: meno,
                tulo: tulo
            })
        }
    }

    openTimeTableView(stop) {
        this.setState({
            currentView: React.createElement(TimeTable, {
                stop: stop
            })
        })
    }

    render() {
        return this.state.currentView;
    }
}