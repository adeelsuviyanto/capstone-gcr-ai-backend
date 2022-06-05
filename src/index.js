//import {initializeApp} from 'firebase/app'
//import {getAnalytics} from 'firebase/analytics'

//Express configuration: HTTP backend service
const express = require('express');
const web = express();
const port = 8080;

//Google API initialization
const {google} = require('googleapis');
const { Client, setLogger } = require('@grpc/grpc-js');
const createUnixSocketPool = require('./unix-socket');
const firebaseConfig = require('./firebase')


//Private initialization
//const userAuth = require('./userauth');

//Initialize Express HTTPS server
web.use(express.json());
web.use(express.urlencoded({extended: true}));
const PORT = process.env.PORT || 8080;

//Cloud SQL: Create pool
const createPool = async() => {
  const config = {
    connectionLimit: 1,
    connectionTimeout: 10000,
    acquireTimeout: 10000,
    waitForConnections: true,
    queueLimit: 0,
  };
  return createUnixSocketPool(config);
};

const ensureSchema = async pool => {
  await pool.query(
    `CREATE TABLE IF NOT EXISTS patients
      (patientid INT NOT NULL AUTO_INCREMENT, name VARCHAR (60) NOT NULL, sex CHAR (2) NOT NULL,
      dateofbirth DATE NOT NULL, address VARCHAR (128));`
  )
  console.log("Table 'patients' exists.");
}

const createPoolAndEnsureSchema = async () => 
  await createPool()
    .then(async pool => {
      await ensureSchema(pool);
      return pool;
    })
    .catch(err => {
      throw err;
    });
let pool;

//Creating UDP Socket Pool and ensuring table schema
web.use(async (req, res, next) => {
  if(pool){
    return next();
  }
  try{
    pool = await createPoolAndEnsureSchema();
    next();
  }
  catch(err){
    return next(err);
  }
})

//Making sure Express is able to parse JSON request bodies
web.use(express.json());

//Endpoints
web.get('/', (req, res) => {
  res.send('Backend configured.')
});

web.post('/registerpatient', async (req, res) => {
  //Parse JSON-based request body
  const patientData = res.json(req.body);
  console.log(patientData);
  //If request body is empty then respond with 400 code
  if(!patientData){
    return res.status(400).send('Invalid request body.').end();
  }
  pool = pool || (await createPoolAndEnsureSchema);
  try{
    const stmt = 'INSERT INTO patients (name, sex, dateofbirth, address) VALUES (?, ?, ?, ?)';
    await pool.query(stmt, [patientData.name, patientData.sex, patientData.dateofbirth, patientData.address]);
  }
  catch(err){
    return res.status(500).send('SQL Query Error. Check application logs.').end();
  }
  res.status(200).send('Patient data has successfully been submitted.')
})


web.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});