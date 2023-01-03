CREATE DATABASE IF NOT EXISTS he;

USE he;

CREATE TABLE IF NOT EXISTS turmas (
    turma VARCHAR(255) PRIMARY KEY NOT ,
    disciplinas JSON NOT NULL DEFAULT (JSON_ARRAY)
);

CREATE TABLE IF NOT EXISTS modulos (
    modulo VARCHAR(255) PRIMARY KEY NOT NULL,
    duracao INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS main (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    t VARCHAR(255) NOT NULL,
    m VARCHAR(255) NOT NULL,
    hrsDadas INT NOT NULL DEFAULT 0
);

ALTER TABLE `main` ADD INDEX `m` (`m`);
ALTER TABLE `main` ADD INDEX `t` (`t`);

ALTER TABLE main ADD FOREIGN KEY (t) REFERENCES turmas(turma);
ALTER TABLE main ADD FOREIGN KEY (m) REFERENCES modulos(modulo);

CREATE TABLE IF NOT EXISTS horario (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    turma VARCHAR(255) NOT NULL,
    versao INT NOT NULL,
    info JSON NOT NULL,
    img VARCHAR(255) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT 0
);

ALTER TABLE horario ADD FOREIGN KEY (turma) REFERENCES turmas(turma);
ALTER TABLE `horario` ADD INDEX `turma_h` (`turma`);

CREATE TABLE IF NOT EXISTS apikeys (
    id BIGINT AUTO_INCREMENT,
    apiKEY VARCHAR(255) NOT NULL,
    token VARCHAR(255) DEFAULT NULL,
    perms VARCHAR(255) NOT NULL, -- "read" or "write"
    PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS profs (
    id BIGINT AUTO_INCREMENT,
    nome VARCHAR(255) NOT NULL,
    PRIMARY KEY (id)
);