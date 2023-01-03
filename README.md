# pap_g4

/horario/turma
method: get
Enviar a lista de todas as turmas
Funciona


/horario/turma/:turma
method: get
Enviar os dados tendo em conta a turma no request
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


