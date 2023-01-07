/*
╔────────────────────────────────────────────────────────────╗
|                   By   ® Pedro Santos ©                    ░ 
╚────────────────────────────────────────────────────────────╝
*/

var express = require("express");
const con = require("./handlers/mysql.js");
var bodyParser = require("body-parser");
var app = express();
const multer = require('multer');
const session = require('express-session');
const crypto = require('crypto');
const path = require('path');
var https = require('https');
const antiCrash = require('./handlers/anticrash.js');

antiCrash();

var storage = multer.diskStorage(
    {
        destination: './horarios/',
        filename: function (req, file, cb) {

            cb(null, req.params.turma + ".png");
        }
    }
);

var upload = multer({ storage: storage });

app.use(bodyParser.urlencoded({ extended: false }));

app.use(bodyParser.json());

app.use('/assets', express.static(path.join(__dirname, 'horarios')))

app.use(session({
    resave: false,
    saveUninitialized: false,
    secret: 's%3Al3ozSdvQ83TtC5RvJ.CibaQoHtaY0H3QOB1kqR8H2A',
    cookie: {
        expires: 3600000
    }
}));

global.db = (sql, values) => {
    return new Promise((resolve, reject) => {
        con(sql, values, (err, result) => {
            if (err) reject(err);
            resolve(result);
        });
    });
}

var privateKey = fs.readFileSync(__dirname + '/ssl/private.key', 'utf8');
var certificate = fs.readFileSync(__dirname + '/ssl/certificate.crt', 'utf8');

var credentials = { key: privateKey, cert: certificate };

var httpsServer = https.createServer(credentials, app);
httpsServer.listen(8443)

const verifyAuth = (req, res, next) => {
    const { token } = req.query;

    if (req.session.user.token == token) {
        next();
    } else {
        res.status(401).send({
            message: "Não estás autenticado! Ou o token enviado está incorreto"
        });
    }
}

app.get("/api/auth", async (req, res, next) => {
    const { apiKey } = req.body;

    var sql = "SELECT * FROM apikeys WHERE apiKEY = ?";
    let data = await global.db(sql, [apiKey]);

    if (!data[0]) return res.status(401).send({ message: "APIKey incorreta!" });

    const value = crypto
        .randomBytes(10)
        .toString('hex')

    req.session.user = {
        apiKey: apiKey,
        token: value
    }

    setTimeout(() => {
        delete req.session.user;
    }, 900000);//15 minutos

    res.status(200).send({
        token: value,
        "message": "Autenticado com sucesso! Usa o token para fazer pedidos à API. O token irã expirar em 15 minutos."
    })

});

app.get("/horario/turma", async (req, res) => {

    let { ano } = req.query;

    let anoSystem = new Date().getFullYear();
    let mesSystem = new Date().getMonth();

    if (!ano) return res.status(400).send({ message: "É necessário especificar o ano!" });

    if (mesSystem >= 6) anoSystem;
    else anoSystem--;

    if (ano == 1) ano = String(anoSystem).slice(2);
    if (ano == 2) ano = String(anoSystem - 1).slice(2);
    if (ano == 3) ano = String(anoSystem - 2).slice(2);

    var sql = `SELECT * FROM turmas WHERE turma LIKE '%${ano}'`;
    let data = await global.db(sql);

    if (!data[0]) return res.status(404).send({ message: "Não existem turmas!" });

    let turmas = [];
    data.forEach(turma => {
        turmas.push(turma.turma);
    });

    res.status(200).send(turmas);
});

app.get("/horario/turma/:turma", async (req, res) => {

    const { turma } = req.params;

    var sql = "SELECT img, info FROM horario WHERE turma = ? AND active = 1";
    let data = await global.db(sql, [turma]);

    if (!data[0]) return res.status(404).send({ message: "Turma não encontrada!" });

    let disciplinas = {};
    let info = data[0].info;
    await info.horario.forEach(dia => {
        dia.info.forEach(bloco => {
            if (!disciplinas[bloco.disciplina]) disciplinas[bloco.disciplina] = 0;
        });
    });

    for (const disciplina in disciplinas) {
        var sql = "SELECT * FROM main WHERE t = ? AND m = ?";
        let data = await global.db(sql, [turma, disciplina]);
        disciplinas[disciplina] = data[0].hrsDadas;
    }

    for (const disciplina in disciplinas) {
        var sql = "SELECT duracao FROM modulos WHERE modulo = ?";
        let data = await global.db(sql, [disciplina]);
        disciplinas[disciplina] = data[0].duracao - disciplinas[disciplina];
    }

    let dataToSend = {
        info: await data[0].info,
        img: await data[0].img,
        hrs: disciplinas
    }

    res.status(200).send(dataToSend);

});

app.post("/horario/:turma/insert", verifyAuth, upload.single('horario'), async (req, res) => {

    const { turma } = req.params;
    let info = JSON.parse(req.body.data);

    var sql = "SELECT * FROM turmas WHERE turma = ?";
    let data = await global.db(sql, [turma]);

    if (!data[0]) return res.status(404).send({ message: "Turma não encontrada!" });

    var sql = "SELECT * FROM horario WHERE turma = ?";
    let data1 = await global.db(sql, [turma]);

    if (data1[0]) return res.status(404).send({ message: "Já existe um horário para esta turma!" });

    let filePath = 'https:/apphorarios.pt/assets/' + req.file.filename;

    var sql = "UPDATE horario SET active = 0 WHERE turma = ?";
    await global.db(sql, [turma]);

    var sql = "INSERT INTO horario (turma, info, img, active) VALUES (?, ?, ?, 1)";
    await global.db(sql, [turma, JSON.stringify(info), filePath]);

    info.horario.forEach(async dia => {
        dia.info.forEach(async bloco => {

            var sql = "SELECT * FROM main WHERE t = ? and m = ?"
            let data = await global.db(sql, [turma, bloco.disciplina]);

            if (!data[0]) {
                var sql = "INSERT INTO main (t, m, hrsDadas) VALUES (?, ?, ?)";
                await global.db(sql, [turma, bloco.disciplina, 1]);
            } else {
                var sql = "UPDATE main SET hrsDadas = hrsDadas + 1 WHERE t = ? and m = ?";
                await global.db(sql, [turma, bloco.disciplina]);
            }
        })
    })

    res.status(200).send({ message: "Horário inserido com sucesso!" });

});
