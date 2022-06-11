//import {initializeApp} from 'firebase/app'
//import {getAnalytics} from 'firebase/analytics'

//Express configuration: HTTP backend service
const express = require('express');
const web = express();
const port = 8080;
const cors = require('cors');
const Multer = require('multer');
const fs = require('fs');
const path = require('path');
const request = require('request');
web.use(cors());

//Instantiate body-parser
const bodyParser = require('body-parser');
const urlencodedParser = bodyParser.urlencoded({extended: false});
const jsonParser = bodyParser.json();

//Google API initialization
const {google} = require('googleapis');
const {Storage} = require('@google-cloud/storage');
const { Client, setLogger } = require('@grpc/grpc-js');
const createUnixSocketPool = require('./unix-socket');
//const storage = new Storage(); disabled temporarily for endpoint test 11-06-2022

//Firebase Admin initialization
const admin = require('firebase-admin');
admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  databaseURL: 'https://capstone-project-c22-ps362-default-rtdb.asia-southeast1.firebasedatabase.app/'
});

const PORT = process.env.PORT || 8080;

//Multer initialization (for file handling)

//11-06-2022 Temporary storage configuration:
const multer = Multer({
  //Below is commented to test the endpoint 11-06-2022
  //storage: Multer.memoryStorage(),

  //Temporary storage configuration for endpoint test
  storage: storage,
  fileFilter: function (req,file, callback){
    var ext = path.extname(file.originalname);
    if(ext !== '.png' && ext !== '.jpg' && ext !== '.jpeg'){
      return callback(new Error('Only images are allowed.'));
    }
    callback(null, true);
  },


  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

let storage = multer.diskStorage({
  destination: function(req, file, callback){
    fs.mkdir('./uploads', function(err){
      if(err) console.log(err.stack);
      else callback(null, './uploads');
    });
  },
  filename: function(req, file, callback){
    callback(null, file.fieldname + '-' + Date.now() + '.' + file.originalname.split('.')[file.originalname.split('.').length -1]);
  }
});

//Files container (GCS bucket) - Disabled for endpoint test 11-06-2022
//const bucket = storage.bucket(process.env.GCLOUD_STORAGE_BUCKET);

//Cloud SQL initialization
//Create UDP connection pool
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

//Firebase Authentication initialization
web.use(decodeToken);
async function decodeToken(req, res, next){
  if(req.headers?.authorization?.startsWith('Bearer ')){
    const token = req.headers.authorization.split('Bearer ')[1];
    
    try{
      const decodedToken = await admin.auth().verifyIdToken(token);
      req['currentUser'] = decodedToken;
    }
    catch(authErr){
      console.log(authErr);
    }
  }
  next();
}
web.use(verifyUser);
function verifyUser(req, res, next){
  if(!req['currentUser']){
    res.status(403).send('Unauthorized').end();
    console.log('Authorization failure');
  }
  else next();
}

//Routes
//Update 10-06-2022: All routes are now secured by Firebase Authentication

//Basic route:
web.get('/', (req, res) => {
  res.send('Brain Tumor Detection backend. Backend configured. Copyright 2022 Bangkit Product-based Capstone Team C22-PS362').end();
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
  //Update 8-6-2022 new: this API endpoint will also be used for direct patient information
  if(req.query.patientid && !req.query.page && !req.query.size){
    patientID = req.query.patientid;
    patientID = Number(patientID);
    pool = pool || (await createPoolAndEnsureSchema());
    try{
      const patientInfo = pool.query("SELECT * FROM patients WHERE patientid=?", [patientID]);
      res.status(200).send(await patientInfo).end();
    }
    catch(err){
      res.status(500).send(err).end();
    }
  }
  //Update 8-6-2022: GET /patientlist now accepts page numbers as query params!
  let page = req.query.page;
  let size = req.query.size;
  size = Number(size);
  page = Number(page);
  if(!page){
    page = 1;
  }
  if(!size){
    size = 10;
  }
  let offset = (page - 1) * size;
  console.log(page);
  console.log(size);
  console.log(offset);

  pool = pool || (await createPoolAndEnsureSchema());
  try{
    const stmt = "SELECT patientid, name, sex, dateofbirth FROM patients ORDER BY patientid LIMIT ? OFFSET ?";
    console.log(size);
    const patientListQuery = pool.query(stmt, [size, offset]);
    const patientList = await patientListQuery;
    //let patientListTruncated = patientList.replace(`"JSON_OBJECT('patientid', patientid, 'name', name, 'sex', sex, 'dateofbirth', dateofbirth)": `, ``);
    res.status(200).send(patientList).end();
  }
  catch(err){
    res.status(500).send(err).end();
  }
});

web.get('/predictionlist', async (req, res) => {
  pool = pool || (await createPoolAndEnsureSchema());
  let page = req.query.page;
  let size = req.query.size;
  page = Number(page);
  size = Number(size);

  if(!page) page = 1;
  if(!size) size = 10;
  let offset = (page - 1) * size;
  try{
    //Query prediction list
    const predictionlistQuery = pool.query("SELECT predictionid, patientid, image, predictionresult, predictiontimestamp FROM predictions ORDER BY predictionid LIMIT ? OFFSET ?", [size, offset]);
    const predictions = await predictionlistQuery;
    res.status(200).send(predictions).end();
  }
  catch(err){
    //res.status(500).send('Unable to query predictions list, could be an SQL Error. Check application logs.').end();
    res.status(500).send(err).end();
  }
});

web.post('/predict', (req, res, next) => {
  let upload = multer.single('userFile');
  if(!req.file){
    res.status(400).send('No image uploaded.');
  }
  upload(req, res, function(err) {
    if(err) res.status(400).send(err).end();
    else{
      console.log(req.file.path);
      res.status(200).send('File uploaded.');
    }
  });
})

web.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});