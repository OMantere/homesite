import axios from 'axios'



export function meno() {
    return new Promise((resolve, reject) => {
        axios.get('https://oskarimantere.com/aamudata/meno')
            .then((response) => {
                resolve(response.data)
            })
    })
}

export function tulo() {
    return new Promise((resolve, reject) => {
        axios.get('https://oskarimantere.com/aamudata/tulo')
            .then((response) => {
                resolve(response.data)
            })
    })
}