const fs                = require('fs');
const { Client }        = require('whatsapp-web.js');
const qrcode            = require('qrcode-terminal');

const SESSION_FILE_PATH = './session.json';
let sessionData;

if(fs.existsSync(SESSION_FILE_PATH))
{
    sessionData = require(SESSION_FILE_PATH);
}

const client    = new Client({
    puppeteer: 
    {
        headless: true
    },
    session: sessionData
});

// const client = new Client();

client.initialize();

client.on('qr', (qr) => {
    qrcode.generate(qr, {small: true});
});

client.on('authenticated', (session) => {
    console.log('AUTHENTICATED', session);
    sessionData = session;
    fs.writeFile(SESSION_FILE_PATH, JSON.stringify(session), function (err) {
        if (err) 
        {
            console.log(err);
        }
    })
});

client.on('ready', () => {
    console.log('Client is ready!');
});

client.on('message', async msg => {

    if (msg.body == "!hallo") 
    {
        msg.reply("Yes im here");
    }
    else if (msg.body == "!me") 
    {
        msg.reply(msg.from); 
    }
})
