import {initializeApp} from 'firebase/app'
import {getAnalytics} from 'firebase/analytics'

//Express configuration: HTTP backend service
const express = require('express');
const web = express();
const port = 8080;

//Google API initialization
const {google} = require('googleapis');

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
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);