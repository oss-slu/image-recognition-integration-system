# Contribute to the RERUM API
```
██████╗ ███████╗██████╗ ██╗   ██╗███╗   ███╗
██╔══██╗██╔════╝██╔══██╗██║   ██║████╗ ████║
██████╔╝█████╗  ██████╔╝██║   ██║██╔████╔██║
██╔══██╗██╔══╝  ██╔══██╗██║   ██║██║╚██╔╝██║
██║  ██║███████╗██║  ██║╚██████╔╝██║ ╚═╝ ██║
╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝ ╚═════╝ ╚═╝     ╚═╝
```
## ❤️ Thank You
Thank you for considering a contribution to the public RERUM API!  The `main` branch is protected and you cannot push to it. 

## localhost / I Need Tokens!
If you want to contribute, it is important you are able to deploy the code and run tests locally.  To do so, you will need to create a `.env` file which contains secrets for developers.  Once you have the secrets, you can continue.

Contact the developers for the required development secrets!
* [Patrick Cuba](https://github.com/orgs/CenterForDigitalHumanities/people/cubap), IT Architect. patrick.m.cuba@slu.edu  <br>![Github stats](https://github-readme-stats.vercel.app/api?username=cubap&theme=highcontrast&show_icons=true&count_private=true)
* [Bryan Haberberger](https://github.com/orgs/CenterForDigitalHumanities/people/thehabes), Full-Stack Developer. bryan.j.haberberger@slu.edu <br>![Github stats](https://github-readme-stats.vercel.app/api?username=thehabes&theme=highcontrast&show_icons=true&count_private=true)
* [Research Computing Group at Saint Louis University](https://github.com/CenterForDigitalHumanities) -- research.computing@slu.edu 

## 💻 Ready to Install It And Run It!

### NodeJS is Required
For download and installation instructions [head to the NodeJS guide](https://nodejs.org/en/download).

### Git is Required
For download and installation instruction, [head to the Git guide](https://git-scm.com/downloads).  Note this can also be achieved by installing [GitHub for Desktop](https://desktop.github.com/).  

### RERUM API Code is Required
The following is a git shell example for installing the RERUM API web application on your local machine.

```shell
cd /code_folder
git clone https://github.com/CenterForDigitalHumanities/rerum_server_nodejs.git rerum_api
npm install
```
**Note: do not run** `npm audit fix`.  We will do that upstream in the `main` branch.

Create a file named `.env` in the root folder.  In the above example, the root is `/code_folder/rerum_api`.  `/code_folder/rerum_api/.env` looks like this:

```shell
RERUM_API_VERSION = 1.0.0
COLLECTION_ACCEPTEDSERVER = acceptedServer
COLLECTION_V0 = annotation
AUDIENCE = http://rerum.io/api
ISSUER_BASE_URL = https://cubap.auth0.com/
RERUM_BASE = http://store.rerum
RERUM_PREFIX = http://store.rerum/v1/
RERUM_ID_PREFIX = http://store.rerum/v1/id/
RERUM_AGENT_CLAIM = http://store.rerum.io/agent
RERUM_CONTEXT = http://store.rerum.io/v1/context.json
RERUM_API_DOC = https://store.rerum.io/v1/API.html
MONGO_CONNECTION_STRING = OBTAINED_FROM_ADMINS
MONGODBNAME = OBTAINED_FROM_ADMINS
MONGODBCOLLECTION = OBTAINED_FROM_ADMINS
DOWN = false
READONLY = false
CLIENTID = OBTAINED_FROM_ADMINS
RERUMSECRET = OBTAINED_FROM_ADMINS
BOT_TOKEN = OBTAINED_FROM_ADMINS
BOT_AGENT = OBTAINED_FROM_ADMINS
```

Now, you can run tests
```shell
npm run runtest
```

And start the app
```shell
npm start
```

Your RERUM API will attempt to run at `http://localhost:3005`.  If port `3005` is taken, then update the .env value `PORT` to an open port and try to start it again.

To stop the application, kill or exit the process via your shell (<kbd>CTRL + C</kbd> or <kbd>CTRL + X</kbd>).

## 🎉 Ready to Start Contributing!

### Make a Branch and Checkout
Excellent, way to get there.  First, make a new branch through the GitHub Interface or through your shell.  Make sure you 'checkout' that branch.

```shell
cd /code_folder/rerum_api
git checkout my_new_branch
```

### Run and Test your Code
Now you can make code changes and see them in real time by using `npm start`.  Double check that you haven't caused any errors by running the tests via `npm run runtest`.  In addition to running tests, you can actually make requests to your localhost API using web API clients like [Postman](https://www.postman.com/) or [Talend API Tester](https://chrome.google.com/webstore/detail/talend-api-tester-free-ed/aejoelaoggembcahagimdiliamlcdmfm).  The following is a screenshot of an example of calling to a localhost RERUM API.

![Talend API Example](/public/talend.jpg)

### Commit Your Code and Open a Pull Request
When you are finished with the commits to your new branch, open a Pull Request that targets the `main` branch at [https://github.com/CenterForDigitalHumanities/rerum_server_nodejs/tree/main/](https://github.com/CenterForDigitalHumanities/rerum_server_nodejs/tree/main/).  Pull requests will be reviewed by the code owners in the Research Computing Group.
