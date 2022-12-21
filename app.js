var express = require("express");
const con = require("./handlers/mysql.js");
var bodyParser = require("body-parser");
var app = express();
const multer = require('multer');
var upload = multer({ storage: multer.memoryStorage() });
const session = require('express-session');
const crypto = require('crypto');

app.use(bodyParser.urlencoded({ extended: false }));

app.use(bodyParser.json());

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
        con.query(sql, values, (err, result) => {
            if (err) reject(err);
            resolve(result);
        });
    });
}

app.listen(3000, () => {
    console.log("Server running on port 3000");
});

const verifyAuth = (req, res, next) => {
    const { token } = req.body;

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
            if(horario.dia == weekday) {
                for (let i = 0; i < horario.info.length; i++) {
                    if (i == horario.info.length - 1) {
                        if (hours >= horario.info[i].hora[0] && minutes >= horario.info[i].minuto[0]) {
                            return res.status(200).send(horario.info[i]);
                        }
                    } else {
                        if (hours >= horario.info[i].hora[0] && minutes >= horario.info[i].minuto[0] && hours < horario.info[i + 1].hora[0] && minutes < horario.info[i + 1].minuto[0]) {
                            return res.status(200).send(horario.info[i]);
                        }
                    }
                }
            }
        })
    })

    if (!data[0]) return res.status(404).send({ message: "Professor não encontrado!" });

    res.status(200).send(data);

});
