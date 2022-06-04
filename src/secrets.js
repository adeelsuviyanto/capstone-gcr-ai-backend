const { SecretManagerServiceClient } = require("@google-cloud/secret-manager");

const client = new SecretManagerServiceClient
const {CLOUD_SQL_CREDENTIALS_SECRET} = process.env;