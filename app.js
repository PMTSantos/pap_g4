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
var upload = multer({ storage: multer.memoryStorage() });
const session = require('express-session');

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
    con.query(sql, values, (err, result) => {
      if (err) reject(err);
      resolve(result);
    });
  });
}

app.listen(3000, () => {
  console.log("Server running on port 3000");
});

const isAuthenticated = (req, res, next) => {
  if (req.session.user) {
    next();
  } else {
    res.status(401).send({
      message: "Não estás autenticado!"
    });
  }
}

app.get("/api/auth", async (req, res, next) => {
    const { apiKey, apiSecret } = req.body;

    var sql = "SELECT * FROM users WHERE apiKey = ? AND apiSecret = ?";
    let data = await global.db(sql, [apiKey, apiSecret]);

    if (data.length > 0) {
        req.session.user = data[0];
        res.status(200).send({
            message: "Autenticado com sucesso!",
            apiSecret: ""
        });
    }
});

app.get("/horario/:apiKey/:turma", async function (req, res) {
  const { apiKey, turma } = req.params;

  if (apiKey === "9kG]tXKr[Kpnw8R6g0mYne.e}FKCeF}z") {

  const sql = "SELECT info FROM horario WHERE turma = ?";
  let result = await global.db(sql, [turma]);
    res.send(result[0]);
    
  } else {
    res.status(403);
    res.end();
  }
});

app.post("/horario/:apiKey/:turma", upload.single('horario'), async function (req, res) {
  /*let apiKey = req.params.apiKey;
  let turma = req.params.turma;
  let json = req.body;
 
  if (apiKey == "W}2GY;[0Cf0W]xO066L]VvyDx{Tvl5w4") {
 
    var sql = `INSERT INTO horario (turma, info, versao) VALUES ('${turma}', '${JSON.stringify(json)}', ${version})`;
    con(sql, function (err, result) {
      if (err) throw err;
      res.status(200);
      res.end();
    });
    
  } else {
    res.status(403);
    res.end();
  }*/
  console.log(req.file)
  console.log(JSON.parse(req.body.data))

  let upFile = req.file.buffer.toString('base64');
  let data = JSON.parse(req.body.data)

  var sql = `INSERT INTO horario (turma, info, versao, img) VALUES (?, ?, 2, ?)`
  await global.db(sql, [req.params.turma, data, upFile])
});
