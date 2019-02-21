var express = require('express');
var secured = require('../lib/middleware/secured');
var router = express.Router();
var request = require('request-promise');

// handle redirect from redirect_rule
// sample: https://example.com/foo?state=abc123
// sample: https://YOUR_AUTH0_DOMAIN/continue?state=THE_ORIGINAL_STATE
router.get('/verify-email', secured(), async function (req, res, next) {
  let state = req.query.state;
  let id = req.query.id;
  console.log(`state=${state}; id=${id}`);
  // use hardcoded email for testing
  // in actual scenario, user will select this from multiple emails that they have
  let emailVerificationLink = await openEmailVerificationTicket(state, id);
  console.log(`controller link: ${emailVerificationLink}`);
  res.send(`
    <p>For TESTING convenience, we are displaying the email verification link on this page</p>
    <p>Instead, this link MUST be sent to user emailbox with appropriate instructions/text</p>
    <a href='${emailVerificationLink}'>click to verify your email</a>
    <p>You will not be asked for username/password again in this session</p>
  `);
});

module.exports = router;

// get new access_token using client_credentials grant
// ideally this token must be cached until expiry instead of requesting new one everytime.
async function getAccessTokenForMgmtApi () {
  var options = { method: 'POST',
    url: `https://${process.env.AUTH0_DOMAIN}/oauth/token`,
    headers: { 'content-type': 'application/json' },
    body:
    { grant_type: 'client_credentials',
      client_id: `${process.env.AUTH0_M2M_CLIENT_ID}`,
      client_secret: `${process.env.AUTH0_M2M_CLIENT_SECRET}`,
      audience: `https://${process.env.AUTH0_DOMAIN}/api/v2/`,
      scope: 'create:user_tickets'},
    json: true };
  console.log(`options=${JSON.stringify(options)}`);
  let responseBody = await request(options, function (error, response, body) {
    console.log('inside callback function');
    if (error) {
      console.log(`error fetching access_token: ${error}`);
      throw new Error(error);
    }
  });
  return responseBody.access_token;
}

// open ticket and get verification link in response
async function openEmailVerificationTicket (state, id) {
  let accessToken = await getAccessTokenForMgmtApi(); // AT must be cached till just before expiry (TBD)
  var options = {
    url: `https://${process.env.AUTH0_DOMAIN}/api/v2/tickets/email-verification`,
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'authorization': `Bearer ${accessToken}`,
      'accept': 'application/json'
    },
    body: `{ "result_url" : "https://${process.env.AUTH0_DOMAIN}/continue?state=${state}", "user_id" : "auth0|${id}", "ttl_sec" : 0}`
  };

  let emailVerificationLinkBody =
    await request(options, function (error, response, body) {
      if (error) throw new Error(error);
    });
  let emailVerificationLink = JSON.parse(emailVerificationLinkBody).ticket;
  console.log(`inside function ${emailVerificationLink}`);
  return emailVerificationLink;
}
