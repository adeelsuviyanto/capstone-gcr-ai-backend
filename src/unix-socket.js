const mysql = require('promise-mysql');

const createUnixSocketPool = async config => {
    const dbSocketPath = process.env.DB_SOCKET_PATH || '/cloudsql';  
    //Establish connection to Cloud SQL
    return mysql.createPool({
      user: 'doctors',
      password: '12345678',
      database: 'patient_database',
      socketPath: '/cloudsql/capstone-project-c22-ps362:asia-southeast2:patient-data',
      ...config,
    });
};

module.exports = createUnixSocketPool;