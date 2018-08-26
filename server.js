const { WebClient } = require("@slack/client");
const web = new WebClient(process.env.SLACK_TOKEN);
const serverless = require("serverless-http");
const bodyParser = require("body-parser");
const rp = require("request-promise");
const app = require("express")();
app.use(bodyParser.json());

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

app.post("/", async function(req, res) {
  const { body } = req;
  const { event } = body;
  if (body.type === "url_verification") {
    response.send(body.challenge);
  } else if (event.type === "app_mention") {
    const { channel } = event;
    let question = event.text.replace("<@U9MRFF0UD>", "").trim();
    if (!/\?/.test(body)) {
      question = `${body}?`;
    }

    let text = "";
    const isYesNoQuestion = await isYesNo(question);
    if (!isYesNoQuestion) {
      text = "Sorry. I can only answer yes/no questions.";
    } else {
      text =
        possibleResponses[Math.floor(Math.random() * possibleResponses.length)];
    }

    return web.chat
      .postMessage({
        channel,
        text
      })
      .then(slackres => {
        res.sendStatus(200);
        console.log("Message sent: ", slackres.ts);
      })
      .catch(console.error);
  }
});

const isYesNo = async question => {
  const options = {
    method: "POST",
    url: "http://104.248.48.204:9000/",
    qs: {
      properties: "%22annotators%22%3A+%22parse%22",
      pipelineLanguage: "en"
    },
    body: question
  };
  const nlp = await rp(options);
  console.log(nlp);
  const { sentences } = JSON.parse(nlp);
  const firstSentence = sentences[0];
  return !/SQ/.test(firstSentence.parse);
};

module.exports.handler = serverless(app);
