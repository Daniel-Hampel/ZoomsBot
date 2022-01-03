const Discord = require('discord.js');
const client = new Discord.Client({
    intents:[
        Discord.Intents.FLAGS.GUILDS,
        Discord.Intents.FLAGS.GUILD_MESSAGES,
        //Discord.Intents.FLAGS.DIRECT_MESSAGES
    ]
})
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

//Commands:
client.on("message", message =>{
    console.log("Bot geht noch - 2")
    //console.log(message);
    if(message.content === "marco"){
        message.reply("polo");
    }
})

client.login("OTI2MjI5MzUyMTMwMTc5MTI0.Yc4oTg.9OLNfR8PMlOlYZmCcQhObIroh_o")