const express = require("express")
const bodyParser = require("body-parser")
const fetch = require('node-fetch');
const request = require('request');
const Hubspot = require('hubspot');
const Analytics = require("@rudderstack/rudder-sdk-node");
const client = new Analytics('1lMWZsS6PIYIgF6qJBG9NK4oPzH', 'https://hosted.rudderlabs.com/v1/batch'); 

const app = express()
const PORT = 3000

const hubspot1 = new Hubspot({
  apiKey: '2b393f9f-410b-404d-afed-bbc594ebc5fe',
  checkLimit: false // (Optional) Specify whether to check the API limit on each call. Default: true
});

const hubspot2 = new Hubspot({
  apiKey: 'f4b9be8f-d51b-45a1-9ce2-0002c9b47628',
  checkLimit: false // (Optional) Specify whether to check the API limit on each call. Default: true
});

app.use(express.static('public/'));


app.use(bodyParser.json());

app.post("/hook", (req, res) => {
  
		const data={};
        data.tenantId=req.body[0].portalId;
	    console.log(req.body[0].portalId);
  
  console.log('hook triggered');
	hubspot2.contacts
	.get()
	.then(results => { //console.log(results);
		data.contacts=results;
		console.log(data);
		client.track({
		
			event: JSON.stringify(data.tenantId),
			userId: JSON.stringify(results),
		});
		client.track({
			event: "Contacts-hub2",
			userId: req.body[0].eventId,
		})
	})
	.catch(err => {
		console.error(err)
	})
   //res.status(200).end()	
	
   hubspot1.contacts
  .get()
  .then(results => { //console.log(results);
		data.contacts=results;
		console.log(data);
		client.track({
		
			event: JSON.stringify(data.tenantId),
			userId: JSON.stringify(results),
		});
		client.track({
			event: "Contacts-hub1",
			userId: req.body[0].eventId,
		})
	})
  .catch(err => {
    console.error(err)
  })
  
  res.status(200).end()
});

app.get('/redirect', (req, res) => {
 // console.log(req);
 const { code } = req.query;
  const formData = {
    grant_type: 'authorization_code',
    client_id: '13e6b8fd-d6f3-4e19-b8f8-d29401aa5378',
    client_secret: 'ab6e5fb2-47bf-4da1-8a5c-54b401f594f0',
    redirect_uri: 'https://multitenancysync.loca.lt/redirect',
    code: req.query.code
  };
  
  const params = {
  client_id: '13e6b8fd-d6f3-4e19-b8f8-d29401aa5378',
  scope: ['contacts_read'],
  redirect_uri: 'https://multitenancysync.loca.lt/redirect',
};

  request.post('https://api.hubapi.com/oauth/v1/token', { form: formData }, (err, data) => {
    // Handle the returned tokens
    //const { access_token } = data.body;
	console.log(JSON.parse(data.body).access_token);
	const refreshToken = JSON.parse(data.body).refresh_token;
	
	const hubspotapp = new Hubspot({
	  clientId: '13e6b8fd-d6f3-4e19-b8f8-d29401aa5378',
	  clientSecret: 'ab6e5fb2-47bf-4da1-8a5c-54b401f594f0',
	  redirectUri: 'https://multitenancysync.loca.lt/redirect',
	  refreshToken,
	});
	
	hubspotapp.contacts.get()
		.then(results => {
			//console.log('hubspot app', results);
		})
		.catch(err => {
			//console.log(err);
		});
	
	
	request.get('https://api.hubapi.com/contacts/v1/lists/all/contacts/all?count=1',
	  {
		headers: {
		  'Authorization': `Bearer ${JSON.parse(data.body).access_token}`,
		  'Content-Type': 'application/json'
		}
	  },
	  (err, contactsData) => {
		console.log(contactsData);
	  }
	);
	
	
     res.json(data);
  });
})
app.get('/test-url', (req, res) => {
    res.json({ message: 'Hello world!' });
});


app.listen(PORT, () => console.log(`Server running on port ${PORT}`))