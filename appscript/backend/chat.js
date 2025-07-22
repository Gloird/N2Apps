const GOOGLE_CHAT_WEBHOOK_LINK = "https://chat.googleapis.com/v1/spaces/AAQADm5YrcQ/messages?key=AIzaSyDdI0hCZtE6vySjMm-WEfRq3CPzqKqqsHI&token=HICb40NUM5cWyq1LVfbUmjKABNlhrl0VoukUsWUe51s"

/**
 * Fonction qui permet d'envoyer un message dans le chat
 */
function sendMessage(message) {
  console.log(message)
  const payload = JSON.stringify(message);
  const options = {
    method: 'POST',
    contentType: 'application/json',
    payload: payload,
  };
  Logger.log("CHAT = " + message)
  UrlFetchApp.fetch(GOOGLE_CHAT_WEBHOOK_LINK, options);
}


function testMessage() {
  sendMessage({ text: "Action Test", formattedText: "Action Test" })
}