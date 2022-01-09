function isLetter(string){
    return(string.length === 1 && string.match(/[a-z]/i))
}
function isCommand(string){
    if(String(string).substring(0, 1) === "!" && (isLetter(String(string).substring(1,2)||String(string).substring(1,2)===""))){
        //console.log("isCommand() funktioniert");
        return true;
    }
    return false;
}

//function isTextChannel guild.

function Sleep(milliseconds) {
    return new Promise(resolve => setTimeout(resolve, milliseconds));
}
module.exports = {Sleep};