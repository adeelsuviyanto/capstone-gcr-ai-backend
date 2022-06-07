//import {initializeApp} from 'firebase/app'
//import {getAnalytics} from 'firebase/analytics'

//Express configuration: HTTP backend service
const express = require('express');
const web = express();
const port = 8080;

//Instantiate body-parser
const bodyParser = require('body-parser');
const urlencodedParser = bodyParser.urlencoded({extended: false});
const jsonParser = bodyParser.json();

//Google API initialization
const {google} = require('googleapis');
const { Client, setLogger } = require('@grpc/grpc-js');
const createUnixSocketPool = require('./unix-socket');

//Private initialization
//const userAuth = require('./userauth');

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

//Routes
web.get('/', (req, res) => {
  res.send('Backend configured.')
});

web.post('/registerpatient', jsonParser, async (req, res) => {
  //Parse JSON-based request body
  const patientData = req.body;
  //const {patientData} = web.json(req.body);
  //console.log(patientData);
  //If request body is empty then respond with 400 code
  if(!patientData){
    return res.status(400).send('Invalid request body.').end();
  }
  pool = pool || (await createPoolAndEnsureSchema());
  try{
    const stmt = 'INSERT INTO patients (name, sex, dateofbirth, address) VALUES (?, ?, ?, ?)';
    await pool.query(stmt, [patientData.name, patientData.sex, patientData.dateofbirth, patientData.address]);
  }
  catch(err){
    return res.status(500).send('SQL Query Error. Check application logs.').end();
  }
  res.status(200).send('Patient data has successfully been submitted.').end();
});

web.get('/patientlist', async (req, res) => {
  pool = pool || (await createPoolAndEnsureSchema());
  try{
    //Query patient data, to limit to user configurable entries in the future
    //As of 6-6-2022, this will query ALL data from SQL table.
    //Beware!
    //This will send raw string data in form of a JSON string
    const patientListQuery = pool.query("SELECT JSON_ARRAYAGG(JSON_OBJECT('patientid', patientid, 'name', name, 'sex', sex, 'dateofbirth', dateofbirth)) FROM patients ORDER BY patientid");
    const patientList = await patientListQuery;
    //let patientListTruncated = patientList.replace(`"JSON_OBJECT('patientid', patientid, 'name', name, 'sex', sex, 'dateofbirth', dateofbirth)": `, ``);
    res.status(200).send(patientList).end();
  }
  catch(err){
    res.status(500).send('Unable to query patient list, could be an SQL Error. Check application logs.').end();
  }
});

web.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});