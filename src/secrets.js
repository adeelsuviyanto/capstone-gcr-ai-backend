const { SecretManagerServiceClient } = require("@google-cloud/secret-manager");

const client = new SecretManagerServiceClient
const {CLOUD_SQL_CREDENTIALS_SECRET} = process.env;


//secret name: sql-secrets, JSON
//projects/478835089859/secrets/sql-secrets/versions/2 <= resource id