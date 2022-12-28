# pap_g4

/horario/turma
method: get
Enviar a lista de todas as turmas
Funciona


/horario/turma/:turma
method: get
Enviar os dados tendo em conta a turma no request
Funciona

/horario/prof
method: get
Enviar a lista com todos os professores
Funciona

/horario/prof/:prof
method: get 
Enviar os dados do prof (sala onde está)
Funciona

/horario/:turma/insert?token=AbCD1234
method: post
Receber os dados no body e inserir na db
Funciona

-------------------------------------------

API auth

/api/auth
method: get
Recebe a apiKey da conexão e cria um token para a conexão ser aprovada
Funciona


