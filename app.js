const fs                = require('fs');
const { Client }        = require('whatsapp-web.js');
const qrcode            = require('qrcode');
const expressjs         = require('express');
const http              = require('http');
const socketIo          = require('socket.io');

const app               = expressjs();
const server            = http.createServer(app);
const io                = socketIo(server);


// Declaration
app.use(expressjs.json());
app.use(expressjs.urlencoded({ extended: true }));

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

// Express JS Process
app.get('/', (req, res) => {
    res.sendFile('index.html', { root:__dirname });
})

// Whatsapp API Process
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

client.initialize();

// Socket IO Process
io.on('connection', function (socket) {
    socket.emit('none', 'Connecting...');

    client.on('qr', (qr) => {
        qrcode.toDataURL(qr, (err, url) => {
            socket.emit('qr', url);
            socket.emit('message', 'QR Code received, scan please !!!');
        });
    });

    client.on('ready', () => {
        socket.emit('ready', 'Whatsapp is ready!');
        socket.emit('message', 'Whatsapp is ready!');
    });

    client.on('authenticated', (session) => {
        socket.emit('message', 'Whatsapp is authenticated')
        socket.emit('authenticated', 'Whatsapp is authenticated')
        sessionData = session;
        fs.writeFile(SESSION_FILE_PATH, JSON.stringify(session), function (err) {
            if (err) 
            {
                console.log(err);
            }
        })
    });
});

// Send Message
app.post('/send-message', (req, res) => {
    const number    = req.body.number;
    const message   = req.body.message;

    client.sendMessage(number, message).then(response => {
        res.status(200).json({
            status: true,
            response: response
        });
    }).catch( err => {
        res.status(500).json({
            status: false,
            response: err
        });
    });
});

server.listen(8000, function() {
    console.log('App Running on *: '+8000)
});