//Placeholder credentials for Cloud SQL
const sql_user = 'doctors';
const sql_password = '12345678';
const sql_db_name = 'patient-data';
const sql_socket = '/cloudsql/capstone-project-c22-ps362:asia-southeast2:patient-data';

const mysql = require('promise-mysql');

const createUnixSocketPool = async config => {
    const dbSocketPath = '/cloudsql';  
    //Establish connection to Cloud SQL
    return mysql.createPool({
      user: sql_user,
      password: sql_password,
      database: sql_db_name,
      socketPath: sql_socket,
      ...config,
    });
};

module.exports = createUnixSocketPool;