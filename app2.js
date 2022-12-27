/*
 * Copyright (c) 2022. Lorem ipsum dolor sit amet, consectetur adipiscing elit.
 * Morbi non lorem porttitor neque feugiat blandit. Ut vitae ipsum eget quam lacinia accumsan.
 * Etiam sed turpis ac ipsum condimentum fringilla. Maecenas magna.
 * Proin dapibus sapien vel ante. Aliquam erat volutpat. Pellentesque sagittis ligula eget metus.
 * Vestibulum commodo. Ut rhoncus gravida arcu.
 */

//POST W}2GY;[0Cf0W]xO066L]VvyDx{Tvl5w4
//GET  9kG]tXKr[Kpnw8R6g0mYne.e}FKCeF}z

var express = require("express");
const con = require("./handlers/mysql.js");
var bodyParser = require("body-parser");
var app = express();
const multer = require('multer');
const session = require('express-session');
const crypto = require('crypto');

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

app.use(session({
    resave: false, // don't save session if unmodified
    saveUninitialized: false, // don't create session until something stored
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

    console.log(req.session.user.token);
    console.log(token)

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
    const { turma } = req.body;

    var sql = "SELECT * FROM turmas WHERE turma = ?";
    let data = await global.db(sql, [turma]);

    if (!data[0]) return res.status(404).send({ message: "Turma não encontrada!" });

    res.status(200).send(data);
});

app.get("/horario/turma/:turma", async (req, res) => {

    const { turma } = req.params;

    var sql = "SELECT * FROM horario WHERE turma = ? AND active = 1";
    let data = await global.db(sql, [turma]);

    if (!data[0]) return res.status(404).send({ message: "Turma não encontrada!" });

    res.status(200).send(data);

});

app.get("/horario/prof", async (req, res) => {

    var sql = "SELECT nome FROM profs";
    let data = await global.db(sql);

    if (!data[0]) return res.status(404).send({ message: "Não foram encontrados horários!" });

    res.status(200).send(data);

});

app.get("/horario/prof/:prof", async (req, res) => {

    const { prof } = req.params;

    var sql = "SELECT info FROM horario WHERE active = 1";
    let data = await global.db(sql, [prof]);

    let weekday = new Date().toLocaleString('en-us', { weekday: 'long' })
    //get the hours and minutes
    let hours = new Date().getHours();
    let minutes = new Date().getMinutes();

    let block = 0;
    if ((hours == 8 && minutes >= 30) || (hours == 9 && minutes < 30)) block = 1;
    if ((hours == 9 && minutes >= 30) || (hours == 10 && minutes < 30)) block = 2;
    if ((hours == 10 && minutes >= 50) || (hours == 11 && minutes < 50)) block = 3;
    if ((hours == 11 && minutes >= 50) || (hours == 12 && minutes < 50)) block = 4;
    if ((hours == 12 && minutes >= 55) || (hours == 13 && minutes < 55)) block = 5;
    if ((hours == 13 && minutes >= 55) || (hours == 14 && minutes < 55)) block = 6;
    if ((hours == 15 && minutes >= 0) || (hours == 16 && minutes < 0)) block = 7;
    if ((hours == 16 && minutes >= 0) || (hours == 17 && minutes < 0)) block = 8;
    if ((hours == 17 && minutes >= 10) || (hours == 18 && minutes < 10)) block = 9;
    if ((hours == 18 && minutes >= 10) || (hours == 19 && minutes < 10)) block = 10;

    switch (weekday) {
        case "Monday":
            weekday = "Segunda";
            break;
        case "Tuesday":
            weekday = "Terça";
            break;
        case "Wednesday":
            weekday = "Quarta";
            break;
        case "Thursday":
            weekday = "Quinta";
            break;
        case "Friday":
            weekday = "Sexta";
            break;
        default:
            weekday = 0;
    }

    if (weekday == 0) return res.status(404).send({ message: "Hoje não há aulas!" });

    data.filter(turma => {
        turma.info.horario.find(horario => {
            if (horario.dia == weekday) {
                horario.info.find(info => {
                    if (info.bloco == block) {
                        return res.status(200).send({ prof, sala: info.sala });
                    }
                })
            }
        })
    })

    return res.status(404).send({ message: "Não foram encontrados dados onde o professor esteja a dar aula!" })

});

app.post("/horario/:turma/insert", verifyAuth, upload.single('horario'), async (req, res) => {

    //grab the file and save it into horaios folder with the turma name then save the path into the database
    const { turma } = req.params;
    let info = req.body.data;

    var sql = "SELECT * FROM turmas WHERE turma = ?";
    let data = await global.db(sql, [turma]);

    if (!data[0]) return res.status(404).send({ message: "Turma não encontrada!" });

    var sql = "SELECT * FROM horario WHERE turma = ?";
    let data1 = await global.db(sql, [turma]);

    if (data1[0]) return res.status(404).send({ message: "Já existe um horário para esta turma!" });
    var sql = "INSERT INTO horario (turma, versao, info, img, active) VALUES (?, ?, ?, ?, 1)";
    await global.db(sql, [turma, JSON.parse(info).versao, info,  req.file.path]);

    res.status(200).send({ message: "Horário inserido com sucesso!" });

});