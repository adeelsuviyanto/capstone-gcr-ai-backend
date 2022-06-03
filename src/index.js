//import {initializeApp} from 'firebase/app'
//import {getAnalytics} from 'firebase/analytics'

//Express configuration: HTTP backend service
const express = require('express');
const web = express();
const port = 8080;

//Google API initialization
const {google} = require('googleapis');
//const credentials = require('..capstone-project-c22-ps362-c0bce78a39b5.json')
//const credentials = require('/secrets/predictor_service_account.json')
const {SecretManagerServiceClient} = require('@google-cloud/secret-manager');
const { Client } = require('@grpc/grpc-js');
const createUnixSocketPool = require('./unix-socket.js');

//Secrets
//const client = new SecretManagerServiceClient();
/*async function accessSecretVersion(name) {
  const [version] = await client({
    name: name
  })
  return version.payload.data;
}
const sql_user = accessSecretVersion(process.env.db_user);
const sql_pass = accessSecretVersion(process.env.db_password);
const sql_db_name = accessSecretVersion(process.env.db_name);
const sql_connection = accessSecretVersion(process.env.db_connection);
*/

//Private initialization
//const userAuth = require('./userauth');

//Firebase configuration and initialization
const firebaseConfig = {
    apiKey: "AIzaSyD7QMPmKsgYnx_1DUPOtmhzGCgFBUTb7Ps",
    authDomain: "capstone-project-c22-ps362.firebaseapp.com",
    projectId: "capstone-project-c22-ps362",
    storageBucket: "capstone-project-c22-ps362.appspot.com",
    messagingSenderId: "478835089859",
    appId: "1:478835089859:web:d08e256e3ba1ecf9379d76",
    measurementId: "G-7FY8K67PFY"
  };
//const app = initializeApp(firebaseConfig);
//const analytics = getAnalytics(app);

//Initialize Express HTTPS server
web.use(express.json());
web.use(express.urlencoded({extended: true}));
const PORT = process.env.PORT || 8080;

//Cloud SQL: Create pool
const createPool = async() => {
  const config = {
    connectionLimit: 5,
    connectionTimeout: 10000,
    acquireTimeout: 10000,
    waitForConnections: true,
    queueLimit: 0,
  };
};
createUnixSocketPool(config);


//Endpoints
web.get('/', (req, res) => {
  res.send('Backend configured.')
});

web.post('/registerpatient', (req, res) => {
  res.send('Placeholder');
})


web.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});