const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const axios = require("axios");
const mysql = require("mysql")
const nodemailer = require("nodemailer")
const smpt = require('./config/config')
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
  // conexão com banco de dados www.remotemysql.com/phpmyadmin
  const connection = mysql.createConnection({
    host: process.env['HOST'],
    user: process.env['USER'],
    password: process.env['PASSWORD'],
    database: process.env['DATABASE']
  });
  setInterval(function() {
    connection.query('SELECT 1');
  }, 5000);
  function deletarInscricao() {
    // pegando valores passado pelo usuario
    const email = req.body.queryResult.parameters.email;
    const option = req.body.queryResult.parameters.posso;
    if (option.toLowerCase() == 'sim' || option.toLowerCase() == "s" || option.toLowerCase() == 'yes' || option.toLowerCase() == "si") {
      var query = 'DELETE FROM `EPICEDB` WHERE `EPICEDB`.`email` = "' + email + '"'
      connection.query(query, (error, rows, fields) => {
        if (error) {
          // console.log(error)
          return res.json({
            fulfillmentText: 'Ocorreu um erro em nossa api :(',
          })
        } else if (rows.affectedRows == 0) {
          return res.json({
            fulfillmentMessages: [
              {
                payload: {
                  richContent: [
                    [
                      {
                        "rawUrl": "https://i.ibb.co/qDM90Vs/30723-data-animation.gif",
                        "type": "image"
                      },
                      {
                        "type": "button",
                        "text": `Este e-mail: ${email} não está cadastrado em nosso banco de dados.`,
                        "icon": {
                          "color": "#fd6584",
                          "type": "info"
                        }
                      }
                    ]
                  ]
                }
              }
            ]
          })
        } else {
          connection.end();
          console.log(rows.affectedRows)
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
        }
      })
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
    var query = 'insert into EPICEDB (name, email, curso) values ("' + name + '","' + email + '", "' + curso + '")'
    connection.query(query, (error, results, fields) => {
      if (error) {
        console.log(error)
        if (error.code === 'ER_DUP_ENTRY') {
          return res.json({
            fulfillmentText: `${name.split(' ')[0]}, esté email já foi cadastro`,
          })
        }
        return res.json({
          fulfillmentText: 'Ocorreu um erro em nossa api :(',
        })
      }
      connection.end();
      return res.json({
        fulfillmentMessages: [
          {
            payload: {
              richContent: [
                [
                  {
                    "rawUrl": "https://digitalsynopsis.com/wp-content/uploads/2015/10/gif-icons-menu-transition-animations-shake-new-mail.gif",
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
    })
  }
  function sendEmail() {
    const nome = req.body.queryResult.parameters.name;
    const email = req.body.queryResult.parameters.email;
    const assunto = req.body.queryResult.parameters.assunto;
    const mensagem = req.body.queryResult.parameters.mensagem;
    console.log(nome)
    async function run() {
      try {
        await transporter.sendMail({
          from: email,
          to: smpt.user,
          subject: `${nome.split(' ')[0]} - ${assunto}`,
          html: `
          <b>Nova mensagem de ${nome}</b>
          </br>
          <p>${mensagem}</p>
          `, // html body
        })
        return res.json({
          fulfillmentMessages: [
            {
              payload: {
                richContent: [
                  [
                    {
                      "rawUrl": "https://digitalsynopsis.com/wp-content/uploads/2015/10/gif-icons-menu-transition-animations-shake-new-mail.gif",
                      "type": "image"
                    },
                    {
                      "type": "button",
                      "text": `Olá ${nome.split(' ')[0]}, foi enviada com sucesso!`,
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
      } catch (err) {
        console.log(err)
        return res.json({
          fulfillmentText: 'Ops.. meu serviço está em manutenção :('
        })
      }
    } run()
  }
  console.log(intername)
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
  }
});

const listener = app.listen(3000, function() {
  console.log("FUego");
});