// ==================== IMPORT ==================== //

const Discord = require('discord.js');
const {TOKEN, PREFIX, JoinToCreateID} = require('./Json/config.json');
const {MSG_HELP} = require('./Json/messages.json');
const ytdl = require('ytdl-core');
const { Sleep } = require('./JavaScript/functions.js');


// ==================== CONSTANTEN ==================== //

const client = new Discord.Client({
    intents:[
        Discord.Intents.FLAGS.GUILDS,
        Discord.Intents.FLAGS.GUILD_MESSAGES,
        //Discord.Intents.FLAGS.DIRECT_MESSAGES
    ]
})
const queue = new Map();
let looping = false;
let clearing = false;
let clearID = "wrong_clearID";

client.once("ready", () =>{
    console.log("--------------------------------------------------------------------------------------------------------")
    console.log("Loading...")
    Sleep(1000).then( ()=> {
        console.log("Der Zoomsbot ist Bereit!")
        console.log("start: "+ (new Date).toISOString())
        console.log("--------------------------------------------------------------------------------------------------------")
        console.log("\n")
    })
    client.user.setActivity(
        "dir in deine Seele :)",
        {
            type: "WATCHING"
        }
    )
})
client.once("reconnecting", () =>{
    console.log("Neuverbindung!");
})
client.once("disconnect", () =>{
    console.log("Verbindung getrennt!");
})


//==================== JOIN TO CREATE ==================== //

client.on("voiceStateUpdate", async (oldState, newState) =>{
    if(newState.channel && newState.channel.id === JoinToCreateID && !(oldState.channel == newState.channel)){
        if(oldState.channel){
            if((oldState.channel.name === oldState.member.user.tag)){
                oldState.channel.delete();
            }
        }
        const channel = await newState.guild.channels.create(newState.member.user.tag, {
            type: "voice",
            parent: newState.channel.parent,
        });
        newState.member.voice.setChannel(channel);
    }else if(oldState.channel && oldState.channel.name === oldState.member.user.tag && !(oldState.channel == newState.channel)){
        oldState.channel.delete();
    } else {
    }
})


// ==================== BEFEHLE ==================== //

client.on("message", message =>{
    if(message.author.bot) {
        return;
    }
    if(clearing){
        clearing = false;
        if(message.content == "YES" && !(clearID == "wrong_clearID")){
            message.channel.send("Channel wird in 5 Sekunden gelöscht!")
            Sleep(5000).then(()=>{
                let channel = client.channels.cache.get(clearID);
                channel.clone();
                channel.delete();
                console.log("   clear: Clear von "+clearID+" abgeschlossen")
                
                return;
            });
        }else{
            console.log("   clear: Vorgang abgebrochen")
            
            return(message.channel.send("Vorgang abgebrochen"));
        }
        return
    }
    console.log("--------------------------------------------------------------------------------------------------------")
    console.log("BEARBEITUNG START")
    console.log("=> NEW MESSAGE: "+message.content+" <=");
    Sleep(3200).then( () => {
        console.log("--------------------------------------------------------------------------------------------------------")
        console.log("BEARBEITUNG END")
    })
    if(message.content === "marco"){
        console.log("->marco-polo Methode aufgerufen")
        return(message.reply("polo"))
    }
    if(!message.content.startsWith(PREFIX)) {
        console.log("Nachricht hat kein PREFIX")
        console.log("Bearbeitung END")
        return;
    }
    if(message.content === PREFIX ||
        message.content === PREFIX + "help" || 
        message.content === PREFIX + "hilfe"){
            console.log("->Hilfe Methode aufgerufen")
            return (message.channel.send(MSG_HELP));
    }
    const Warteschlange = queue.get(message.guild.id);

    if(message.content.startsWith(PREFIX+"play")){
        console.log("->Play Methode aufgerufen")
        if(message.content.substring(6,18) === "https://www."){
            execute(message, Warteschlange);
        }else {
            console.log("  ungültige Nachricht")
            return(message.channel.send('Bitte benutze "'+PREFIX+'play <URL>"'))
        }
    } else if(message.content.startsWith(PREFIX + "skip")){
        console.log("->Skip Methode aufgerufen")
        skip(message,Warteschlange);
    } else if(message.content.startsWith(PREFIX+"stop")){
        console.log("->Stop Methode aufgerufen")
        stop(message,Warteschlange);
    } else if(message.content.startsWith(PREFIX + "loop")){
        console.log("->Loop Methode aufgerufen")
        if(looping){
            looping = false
            console.log("  loop auf false gesetzt")
        }else{
            looping = true
            console.log("  loop auf true gesetzt")
        }
        message.channel.send("Loop ist jetzt " + looping)
    } else if(message.content.startsWith(PREFIX + "clear")){
        console.log("->clear Methode aufgerufen")
        clear(message);
    } else if(message.content.startsWith(PREFIX + "get")){
        console.log("->Get Methode aufgerufen")
        permissions = message.channel.permissionsFor(message.author);
        if(permissions.has("ADMINISTRATOR")){
            let args = message.content.split(" ");
            message.channel.send("Informationen bitte der Konsole entnehmen");
            let myChannel = message.guild.channels.catch.find(channel => channel.name === args[1]);
            console.log(myChannel);
        }else{
            message.channel.send("Du hast dazu keine Berechtigung")
        }
        
    } else if(message.content === "!test"){
        console.log("->Test Methode aufgerufen")
        
        return(message.channel.send("test erfolgreich!"))
    } else if (message.content === PREFIX + "ping") {  
        console.log("->ping Methode aufgerufen")
        
        return(message.channel.send("pong! Die Latenz beträgt " + (message.createdTimestamp - Date.now()) + "ms. \n Die API Latenz beträgt " + (Math.round(client.ws.ping)) + "ms"))
      } else{
          console.log("->kein gültiger Befehl wurde eingegeben")
          
        return(message.channel.send("Bitte einen gültigen Befehl eingeben"))
    }
})


// ==================== FUNKTIONEN ==================== //

async function clear(message){
    permissions = message.channel.permissionsFor(message.author);
    if(!permissions.has("ADMINISTRATOR")){
        console.log("   clear: keine Berechtigung")
        
        return(message.channel.send("Du hast dazu keine Brechtigung!"))
    }
    const args = message.content.split(" ");
    if(!args[1]){
        console.log("   clear: falscher Syntax")
        
        return(message.channel.send('Bitte benutze '+PREFIX+'"clear <ChannelID>"'))
    }
    message.channel.send("schreibe <YES> wenn du dir sicher bist oder <NO> um den Vorgang abzubrechen");
    clearing = true;
    clearID = args[1];
}

async function execute(message, Warteschlange){
    const args = message.content.split(" ");

    const voiceChannel = message.member.voice.channel;
    //console.log("voiceChannel: "+voiceChannel);
    if(!voiceChannel){
        console.log("   execute: User ist in keinem VoiceChannel")
        
        return message.channel.send("Bitte gehe in einen Voice-Channel um Musik zu spielen");
    }
    const permissions = voiceChannel.permissionsFor(message.client.user);
    //console.log("permissions: "+permissions);
    if(!permissions.has("CONECT")||!permissions.has("SPEAK")){
        console.log("   execute: Bot hat in dem Channel keine Berechtigungen (CONECT OR SPEAK)")
        
        return message.channel.send("Ich habe in deinem VoiceChannel leider keine Berechtigung dafür. Kontaktiere einen Admin oder probiere es in einem anderen Channel erneut");
    } 
    const songInfo = await ytdl.getInfo(args[1]);
    console.log("   execute: Songinfo wurde geladen")
    const song = {
        title: songInfo.videoDetails.title,
        url: songInfo.videoDetails.video_url
    }
    if (!Warteschlange){
        const Construct = {
            textChannel: message.channel,
            voiceChannel: voiceChannel,
            connection: null,
            songs: [],
            volume: 3,
            playing : true
        }
        queue.set(message.guild.id, Construct);
        Construct.songs.push(song);
        try{
            var connection = await voiceChannel.join();
            Construct.connection = connection;
            console.log("   execute: Play Methode wird aufgerufen")
            play(message.guild, Construct.songs[0]);
        } catch (err){
            console.log(err);
            queue.delete(message.guild.id);
            console.log("   execute: error! Siehe Konsole")
            
            return message.channel.send("Es gab einen Fehler, siehe Konsole");
        }
    } else {
        Warteschlange.songs.push(song);
        console.log("   execute: ein Lied wurde der Warteschlange hinzugefügt")
        
        return message.channel.send("Ich habe \n" + song.title + "\n der Warteschlange hinzugefügt");
    }
    //console.log(looping)
}

function skip(message,Warteschlange){
    if(!message.member.voice.channel){
        console.log("   skip: User ist in keinem VoiceChannel")
        
        return message.channel.send("Bitte gehe in einen Vocie Channel dafür");
    }
    if(!Warteschlange){
        console.log("   skip: Kein Weiteres lied, Ende der Wiedergabe")
        
        return message.channel.send("Es gibt kein Lied das ich skippen kann");
    }
    Warteschlange.connection.dispatcher.end();
}

function stop(message, Warteschlange){
    if(!message.member.voice.channel){
        console.log("   stop: User ist in keinem Voice Channel")
        
        return message.channel.send("Bitte gehe in einen Vocie Channel dafür");
    }
    if(!Warteschlange){
        console.log("   stop: Es wird kein Lied gespielt")
        
        return message.channel.send("Es gibt kein Lied das ich stoppen kann");
    }
    Warteschlange.songs=[];
    Warteschlange.connection.dispatcher.end();
}

function play (guild, song){
    const Warteschlange = queue.get(guild.id);
    if(!song){
        console.log("      play: Es konnte kein Song gefunden werden")
        
        Warteschlange.voiceChannel.leave();
        queue.delete(guild.id);
        return;
    }
    const dispatcher = Warteschlange.connection
        .play(ytdl(song.url))
        .on("finish",()=>{
            if(looping && !Warteschlange.songs == []){
                Warteschlange.songs[1] = Warteschlange.songs[0];
                console.log("      play: Loop ist "+looping+". Lied wird wiederholt")
            }
            Warteschlange.songs.shift();
            play(guild, Warteschlange.songs[0]);
        })
        .on("error", error => {
            console.log(error)
            console.log("      play: Es gab einen Fehler, siehe Konsole")
        })
    dispatcher.setVolumeLogarithmic(Warteschlange.volume/5);
    if(!looping){
    Warteschlange.textChannel.send("Es spielt jetzt: "+song.title)
    }
    console.log("      play: Musik wird gespielt")
    
}


// ==================== ENDE SCRIPT - START BOT ==================== //
client.login(TOKEN)