//alle Funktionen die extern aufgerufen werden befinden sich hier

function Sleep(milliseconds) {
    return new Promise(resolve => setTimeout(resolve, milliseconds));
}

module.exports = {Sleep};