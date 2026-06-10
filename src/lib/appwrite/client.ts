import { Account, Client, Databases } from "appwrite";

const client = new Client()
  .setEndpoint("https://nyc.cloud.appwrite.io/v1")
  .setProject("6a296d2600224c5f6084");

const account = new Account(client);
const databases = new Databases(client);

export { account, client, databases };
