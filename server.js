const { WebClient } = require("@slack/client");
const web = new WebClient(process.env.SLACK_TOKEN);
const serverless = require("serverless-http");
const bodyParser = require("body-parser");
const rp = require("request-promise");
const app = require("express")();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

const possibleResponses = [
  "It is certain.",
  "It is decidedly so.",
  "Without a doubt.",
  "Yes - definitely.",
  "You may rely on it.",
  "As I see it, yes.",
  "Most likely.",
  "Outlook good.",
  "Yes.",
  "Signs point to yes.",
  "Reply hazy, try again.",
  "Ask again later.",
  "Better not tell you now.",
  "Cannot predict now.",
  "Concentrate and ask again.",
  "Don't count on it.",
  "My reply is no.",
  "My sources say no.",
  "Outlook not so good.",
  "Very doubtful."
];

app.get("/ping", (req, res) => res.send(new Date().toISOString()));

app.post("/", async (req, res) => {
  const { body } = req;
  const { event } = body;
  if (body.type === "url_verification") {
    response.send(body.challenge);
  } else if (event.type === "app_mention") {
    const { channel } = event;
    console.log(event)
    let question = event.text.replace("<@UCG3HGCH0>", "").trim();
    if (!/\?/.test(question)) {
      question = `${question}?`;
    }

    let text = "";
    const isYesNoQuestion = await isYesNo(question);
    if (!isYesNoQuestion) {
      text = "Sorry. I can only answer yes/no questions.";
    } else {
      text = possibleResponses[Math.floor(Math.random() * possibleResponses.length)];
    }

    return web.chat.postMessage({
      channel,
      text
    }).then(slackres => {
      res.sendStatus(200);
      console.log("Message sent: ", slackres.ts);
    }).catch(console.error);
  }
});


const isYesNo = async question => {
  const nlp = await rp({
    method: "POST",
    url: "http://167.172.143.199:9000",
    qs: {
      properties: "%22annotators%22%3A+%22parse%22",
      pipelineLanguage: "en"
    },
    body: question
  });
  const { sentences } = JSON.parse(nlp);
  const firstSentence = sentences[0];
  const firstNode = firstSentence.parse.split('\n')[1]
  return /SQ/.test(firstNode);
};

module.exports.handler = serverless(app);
