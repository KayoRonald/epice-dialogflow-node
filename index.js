const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const axios = require("axios");
const nodemailer = require("nodemailer");
const smpt = require('./config/config')
const fetch = require('cross-fetch');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  host: smpt.host,
  port: smpt.port,
  secure: false,
  auth: {
    user: smpt.user,
    pass: smpt.pass,
  },
  tls: {
    rejectUnauthorized: false,
  }
})

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extend: true }));

app.get('/', (req, res) => {
  res.send('Hello world')
})

app.post("/dialogflow", (req, res) => {
  var intername = req.body.queryResult.intent.displayName
  function deletarInscricao() {
    // pegando valores passado pelo usuario
    const email = req.body.queryResult.parameters.email;
    const option = req.body.queryResult.parameters.posso;
    if (option.toLowerCase() == 'sim' || option.toLowerCase() == "s" || option.toLowerCase() == 'yes' || option.toLowerCase() == "si") {
      const data = { email }
      async function deletarEmail(data) {
        try {
          await axios.post('https://epice-app.vercel.app/api/deleteUser', data)
          return res.json({
            fulfillmentMessages: [
              {
                payload: {
                  richContent: [
                    [
                      {
                        "rawUrl": "https://i.ibb.co/KXDVnnk/68051-delete.gif",
                        "type": "image"
                      },
                      {
                        "type": "button",
                        "text": `A conta com o email: ${email} foi deletada de nossos serviços!`,
                        "icon": {
                          "color": "#fd6584",
                          "type": "alert"
                        }
                      }
                    ]
                  ]
                }
              }
            ]
          })
        } catch (error) {
          console.log(error.status)
          if (error.message === 'Request failed with status code 401') {
            return res.json({
              fulfillmentText: 'Este email não está cadastrado em nosso banco de dados',
            })
          }
          return res.json({
            fulfillmentText: 'Ocorreu um erro em nossa api :(',
          })
        }
      } deletarEmail(data)
    } else if (option.toLowerCase() == 'não' || option.toLowerCase() == "n" || option.toLowerCase() == 'nao' || option.toLowerCase() == "no") {
      return res.json({
        fulfillmentText: 'Não deleteamos nada'
      })
    }
  }
  function createUSerMysql() {
    // pegando valores passado pelo usuario
    const name = req.body.queryResult.parameters.name;
    const email = req.body.queryResult.parameters.email;
    const curso = req.body.queryResult.parameters.curso;
    const data = {
      name,
      email,
      curso
    }
    async function createUser(data) {
      try {
        await axios.post('https://epice-app.vercel.app/api/subscription', data)
        return res.json({
          fulfillmentMessages: [
            {
              payload: {
                richContent: [
                  [
                    {
                      "rawUrl": "https://i.ibb.co/WFdcS20/75705-welcome-animation.gif",
                      "type": "image"
                    },
                    {
                      "type": "button",
                      "text": `Seja bem vindo(a): ${name.split(' ')[0]}, sua conta foi criada com sucesso`,
                      "icon": {
                        "color": "#FF9800",
                        "type": "check_circle"
                      }
                    }
                  ]
                ]
              }
            }
          ]
        })
      } catch (error) {
        console.log(error)
        if (error.message === 'Request failed with status code 406') {
          return res.json({
            fulfillmentText: `${name.split(' ')[0]}, esté email já foi cadastro`,
          })
        }
        return res.json({
          fulfillmentText: 'Ocorreu um erro em nossa api :(',
        })
      }
    } createUser(data)
  }
  function sendEmail() {
    const nome = req.body.queryResult.parameters.name;
    const email = req.body.queryResult.parameters.email;
    const assunto = req.body.queryResult.parameters.assunto;
    const mensagem = req.body.queryResult.parameters.mensagem;
    // Realizando o envio de email
    (async function() {
      try {
        await transporter.sendMail({
          from: email,
          to: smpt.user,
          replyTo: email,
          subject: `${nome.split(' ')[0]} - ${assunto}`,
          html: `
          <b>Nova mensagem de ${nome}</b>
          </br>
          <p>${mensagem}</p>
          `, // criando a mensagem
        })
        return res.json({
          fulfillmentMessages: [
            {
              payload: {
                richContent: [
                  [
                    {
                      "rawUrl": "https://i.ibb.co/zbGN1Mr/71167-email-ent.gif",
                      "type": "image"
                    },
                    {
                      "type": "button",
                      "text": `Olá ${nome.split(' ')[0]}, seu email foi enviado com sucesso!`,
                      "icon": {
                        "color": "#58cb42",
                        "type": "check_circle"
                      }
                    }
                  ]
                ]
              }
            }
          ]
        })
      } catch (err) {//caso não seja enviado, vai cai dentro do catch
        console.log(err)
        return res.json({
          fulfillmentText: 'Ops.. meu serviço está em manutenção :('
        })
      }
    })();
  }
  function updateName() {
    const name = req.body.queryResult.parameters.name;
    const email = req.body.queryResult.parameters.email;
    const data = {
      name,
      email
    }
    async function run(data) {
      try {
        await axios.post('https://epice-app.vercel.app/api/updateUser/name', data)
        return res.json({
          fulfillmentMessages: [
            {
              payload: {
                richContent: [
                  [
                    {
                      "rawUrl": "https://i.ibb.co/MRNF39K/57137-success-tick.gif",
                      "type": "image"
                    },
                    {
                      "type": "button",
                      "text": `sua alteração foi feita com sucesso! O seu nome já foi modificado em nosso banco de dados`,
                      "icon": {
                        "color": "#fd6584",
                        "type": "check_circle"
                      }
                    }
                  ]
                ]
              }
            }
          ]
        })
      } catch (error) {
        if (error.message === 'Request failed with status code 401') {
          return res.json({
            fulfillmentText: 'Este email não está cadastrado em nosso banco de dados',
          })
        }
        return res.json({
          fulfillmentText: 'Ops.. meu serviço está em manutenção :('
        })
      }
    } run(data)
  }
  function updateCurso() {
    const curso = req.body.queryResult.parameters.curso;
    const email = req.body.queryResult.parameters.email;
    const data = {
      curso,
      email
    }
    async function run(data) {
      try {
        await axios.post('https://epice-app.vercel.app/api/updateUser/curso', data)
        return res.json({
          fulfillmentText: `Alteração feita com sucesso!`
        })
      } catch (error) {
        if (error.message === 'Request failed with status code 401') {
          return res.json({
            fulfillmentText: 'Este email não está cadastrado em nosso banco de dados',
          })
        }
        return res.json({
          fulfillmentText: 'Ops.. meu serviço está em manutenção :('
        })
      }
    } run(data)
  }
  function sobreGet() {
    var array = []
    var y = 'https://epice-app.vercel.app/api/team'
    fetch(y)
      .then(res => res.json())
      .then(json => {
        for (i = 0; i < 8; i++) {
          array.push(json[i].name[0].toLocaleUpperCase() + json[i].name.substring(1, json[i].name.length).toLowerCase())
        }
        return res.json({
          fulfillmentText: array.join([separador = ', '])
        })
      }).catch((error) => {
        console.log(error)
      })
  }
  
  switch (intername) {
    case 'subscription':
      createUSerMysql()
      break;
    case 'unsubscribe':
      deletarInscricao()
      break;
    case 'enviar.email.bot':
      sendEmail()
      break;
    case 'update.name':
      updateName()
      break;
    case 'update.curso':
      updateCurso()
      break;
    case 'sobre':
      sobreGet()
      break;
  }
});

app.listen(3000, function() {
  console.log("FUego");
});
