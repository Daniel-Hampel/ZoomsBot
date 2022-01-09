const Discord = require('discord.js');
const {TOKEN, PREFIX} = require('./Json/config.json');
const {MSG_HELP} = require('./Json/messages.json');
//const {test} = require('./JavaScript/commands');
const { Server } = require('http');
const ytdl = require('ytdl-core');
const { Console } = require('console');
const { copy, args } = require('fluent-ffmpeg/lib/utils');
const { chdir } = require('process');
const { channel } = require('diagnostics_channel');
const { Sleep } = require('./JavaScript/functions.js');
const { captureRejectionSymbol } = require('events');
const { cpSync } = require('fs');

const client = new Discord.Client({
    intents:[
        Discord.Intents.FLAGS.GUILDS,
        Discord.Intents.FLAGS.GUILD_MESSAGES,
        //Discord.Intents.FLAGS.DIRECT_MESSAGES
    ]
})
const queue = new Map();
var loop = false;

client.once("ready", () =>{
    console.log("Bereit!");
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
client.on("voiceStateUpdate", async (oldState, newState) =>{
    if(newState.channel.id === "929742502381101116"){
        const channel = await newState.guild.channels.create(newState.member.user.tag, {
            type: "voice",
            parent: newState.channel.parent,
        });
        newState.member.voice.setChannel(channel);
    }else if(oldState.channel.name === oldState.member.user.tag){
        oldState.channel.delete();
    } else {
        console.log("ERROR");
    }
})

client.on("message", message =>{
    console.log("Bot geht noch")
    //console.log(message);
    if(message.content === "marco"){
        message.reply("polo");
    }
    if(message.author.bot) {
        //console.log("Bot is author of message");
        return;
    }
    if(!message.content.startsWith(PREFIX)) {
        //console.log("Präfix fehlt");
        return;
    }
    if(message.content === PREFIX ||
        message.content === PREFIX + "help" || 
        message.content === PREFIX + "hilfe"){
        return (message.channel.send(MSG_HELP));
    }
    const Warteschlange = queue.get(message.guild.id);

    if(message.content.startsWith(PREFIX+"play")){
        if(message.content.substring(6,18) === "https://www."){
            //let link = message.content.substring(6);
            execute(message, Warteschlange);
        }else {
            message.channel.send('Bitte benutze "'+PREFIX+'play <URL>"')
        }
    } else if(message.content.startsWith(PREFIX + "skip")){
        skip(message,Warteschlange);
    } else if(message.content.startsWith(PREFIX+"stop")){
        stop(message,Warteschlange);
    } else if(message.content.startsWith(PREFIX + "loop")){
        if(loop){
            loop = false
        }else{
            loop = true
        }
        message.channel.send("Loop ist jetzt " + loop)
    } else if(message.content.startsWith(PREFIX + "clear")){
        clear(message);
    } else if(message.content.startsWith(PREFIX + "get")){
        permissions = message.channel.permissionsFor(message.author);
        if(permissions.has("ADMINISTRATOR")){
            let args = message.content.split(" ");
            //console.log(args);
            message.channel.send("look up the Console for informations");
            let myChannel = message.guild.channels.catch.find(channel => channel.name === args[1]);
            console.log(myChannel);
        }else{
            message.channel.send("Du hast dazu keine Berechtigung")
        }
        //message.client.
    } else if(message.content === "!test"){
        message.channel.send("test erfolgreich!");
    } else{
        message.channel.send("Bitte einen gültigen Befehl eingeben");
    }
    
})
function Callback2(){
    console.log("Callbackfunction wurde aufgerufen");
}
async function clear(message){
    permissions = message.channel.permissionsFor(message.author);
    if(!permissions.has("ADMINISTRATOR")){
        return(message.channel.send("Du hast dazu keine Brechtigung!"))
    }
    const args = message.content.split(" ");
    if(!args[1]){
        return(message.channel.send('Bitte benutze '+PREFIX+'"clear <ChannelID>"'))
    }
    message.channel.send("schreibe <YES> wenn du dir sicher bist oder <NO> um den Vorgang abzubrechen");
    await(client.on("message", message =>{
        if(message.content === "YES"){
            message.channel.send("Channel wird in 5 Sekunden gelöscht!")
            Sleep(5000).then(()=>{
                let channel = client.channels.cache.get(args[1]);
                channel.clone();
                channel.delete();
            return;
            });
        }
        if(message.content === "NO"){
            return(message.channel.send("Vorgang abgebrochen"));
        }
        return
    }))
    
}
async function execute(message, Warteschlange){
    const args = message.content.split(" ");

    const voiceChannel = message.member.voice.channel;
    //console.log("voiceChannel: "+voiceChannel);
    if(!voiceChannel){
        return message.channel.send("Bitte gehe in einen Voice-Channel um Musik zu spielen");
    }
    const permissions = voiceChannel.permissionsFor(message.client.user);
    //console.log("permissions: "+permissions);
    if(!permissions.has("CONECT")||!permissions.has("SPEAK")){
        return message.channel.send("Ich habe keine Berechtigung");
    }
    
    const songInfo = await ytdl.getInfo(args[1]);
    //console.log("songInfo ist fertig.")
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
            play(message.guild, Construct.songs[0]);
        } catch (err){
            console.log(err);
            queue.delete(message.guild.id);
            return message.channel.send(err);
        }
    } else {
        Warteschlange.songs.push(song);
        return message.channel.send("Ich habe \n" + song.title + "\n der Warteschlange hinzugefügt");
    }
}

function skip(message,Warteschlange){
    if(!message.member.voice.channel)
        return message.channel.send("Bitte gehe in einen Vocie Channel dafür");
    if(!Warteschlange)
        return message.channel.send("Es gibt kein Lied das ich skippen kann");
    Warteschlange.connection.dispatcher.end();
}

function stop(message, Warteschlange){
    if(!message.member.voice.channel)
        return message.channel.send("Bitte gehe in einen Vocie Channel dafür");
    if(!Warteschlange)
        return message.channel.send("Es gibt kein Lied das ich stoppen kann");
    Warteschlange.songs=[];
    Warteschlange.connection.dispatcher.end();
}

function play (guild, song){
    const Warteschlange = queue.get(guild.id);
    if(!song){
        Warteschlange.voiceChannel.leave();
        queue.delete(guild.id);
        return;
    }
    const dispatcher = Warteschlange.connection
        .play(ytdl(song.url))
        .on("finish",()=>{
            if(loop && !Warteschlange.songs == []){
                Warteschlange.songs[1] = Warteschlange.songs[0];
            }
            Warteschlange.songs.shift();
            play(guild, Warteschlange.songs[0]);
        })
        .on("error", error => console.log(error));
    dispatcher.setVolumeLogarithmic(Warteschlange.volume/5);
    if(loop = true){
    Warteschlange.textChannel.send("Es spielt jetzt: "+song.title)
    }
}

client.login(TOKEN)