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

app.listen(3000, () => {
    console.log("Server running on port 3000");
});

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

    var sql = "SELECT * FROM turmas";
    let data = await global.db(sql);

    if (!data[0]) return res.status(404).send({ message: "Naõ existem turmas!" });

    res.status(200).send(data);
});

app.get("/horario/turma/:turma", async (req, res) => {

    const { turma } = req.params;

    var sql = "SELECT * FROM horario WHERE turma = ? AND active = 1";
    let data = await global.db(sql, [turma]);

    if (!data[0]) return res.status(404).send({ message: "Turma não encontrada!" });

    res.status(200).send(data);

});

app.post("/horario/:turma/insert", verifyAuth, upload.single('horario'), async (req, res) => {

    const { turma } = req.params;
    let info = req.body.data;

    var sql = "SELECT * FROM turmas WHERE turma = ?";
    let data = await global.db(sql, [turma]);

    if (!data[0]) return res.status(404).send({ message: "Turma não encontrada!" });

    var sql = "SELECT * FROM horario WHERE turma = ?";
    let data1 = await global.db(sql, [turma]);

    if (data1[0]) return res.status(404).send({ message: "Já existe um horário para esta turma!" });

    let filePath = 'http://localhost:3000/assets/' + req.file.filename;

    var sql = "INSERT INTO horario (turma, versao, info, img, active) VALUES (?, ?, ?, ?, 1)";
    await global.db(sql, [turma, JSON.parse(info).versao, info, filePath]);

    sql = `SELECT disciplinas FROM turmas WHERE turma = ?`
    let data2 = await global.db(sql, [turma])
    
    //Falta Testar!!!

    await info.horario.forEach(async dia => {
        dia.info.forEach(async bloco => {
            data2[0].disciplinas[bloco.disciplina] += 1
        })
    })

    sql = `UPDATE turmas SET disciplinas = ? WHERE turma = ?`
    await global.db(sql, [data[0].disciplinas, turma])

    //

    res.status(200).send({ message: "Horário inserido com sucesso!" });

});
