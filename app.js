const fs                = require('fs');
const { Client }        = require('whatsapp-web.js');
const qrcode            = require('qrcode');
const expressjs         = require('express');
const http              = require('http');
const socketIo          = require('socket.io');
const app               = expressjs();
const server            = http.createServer(app);
const io                = socketIo(server);

const { body, validationResult }    = require('express-validator');
const { formatNumber }              = require('./helpers/formatter');

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
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu'
        ],
    },
    session: sessionData
});

// Express JS Process
app.get('/', (req, res) => {
    res.sendFile('index.html', { root:__dirname });
})

// Whatsapp API Process
client.on('message', async msg => {

    if (msg.body == ".hallo") 
    {
        msg.reply("Yes im here");
    }
    else if (msg.body == ".me") 
    {
        msg.reply(msg.from); 
    }
    else if (msg.body === '.groupinfo') 
    {
        let chat = await msg.getChat();
        if (chat.isGroup) {
            msg.reply(`
            *Group Details*
            ID: ${chat.id._serialized}
            Name: ${chat.name}
            Description: ${chat.description}
            Created At: ${chat.createdAt.toString()}
            Created By: ${chat.owner.user}
            Participant count: ${chat.participants.length}
            `);
        } else {
            msg.reply('This command can only be used in a group!');
        }
    }
});

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

// Check the number is registered
const checkRegisteredNumber = async (number) => {

    const isRegistered  = await client.isRegisteredUser(number);
    return isRegistered;
}

// Send Message
app.post('/send-message', [
    body('number').notEmpty(),
    body('message').notEmpty()
], async (req, res) => {
    const errors    = validationResult(req).formatWith(({ msg }) => {
        return msg;
    });

    if (!errors.isEmpty()) 
    {
        return res.status(422).json({
            status: false,
            message: errors.mapped()
        });    
    }

    const number        = formatNumber(req.body.number);
    const message       = req.body.message;

    const isRegistered  = await checkRegisteredNumber(number);

    if (!isRegistered) 
    {
        return res.status(422).json({
            status: false,
            message: "The number wasn't registered"
        });
    }

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

// HTTP Server Process
server.listen(8000, function() {
    console.log('App Running on *: '+8000)
});