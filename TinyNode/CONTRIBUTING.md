# Contribute to the TinyThings RERUM Client
```
██████╗ ███████╗██████╗ ██╗   ██╗███╗   ███╗
██╔══██╗██╔════╝██╔══██╗██║   ██║████╗ ████║
██████╔╝█████╗  ██████╔╝██║   ██║██╔████╔██║
██╔══██╗██╔══╝  ██╔══██╗██║   ██║██║╚██╔╝██║
██║  ██║███████╗██║  ██║╚██████╔╝██║ ╚═╝ ██║
╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝ ╚═════╝ ╚═╝     ╚═╝
```
## ❤️ Thank You

Thank you for considering a contribution to this application!  The `main` branch is protected and you cannot push to it. 

## localhost / I Need Tokens!

If you want to contribute, it is imortant you are able to deploy the code and run tests locally.  To do so, you will need to create a `.env` file which contains secrets for developers.  Once you have the secrets, you can continue.

Contact the developers for the required development secrets!
* [Patrick Cuba](https://github.com/orgs/CenterForDigitalHumanities/people/cubap), IT Architect. patrick.m.cuba@slu.edu  <br>![Github stats](https://github-readme-stats.vercel.app/api?username=cubap&theme=highcontrast&show_icons=true&count_private=true)
* [Bryan Haberberger](https://github.com/orgs/CenterForDigitalHumanities/people/thehabes), Full-Stack Developer. bryan.j.haberberger@slu.edu <br>![Github stats](https://github-readme-stats.vercel.app/api?username=thehabes&theme=highcontrast&show_icons=true&count_private=true)
* [Research Computing Group at Saint Louis Univsersity](https://github.com/CenterForDigitalHumanities) -- research.computing@slu.edu 

## Ready to Install It And Run It!

First, make sure NodeJS is installed on your machine.  For download and installation instructions [head to the NodeJS guide](https://nodejs.org/en/download).

Also make sure Git is installed on your machine.  For download and installation instruction, [head to the Git guide](https://git-scm.com/downloads).  Note this can also be achieved by installing [GitHub for Desktop](https://desktop.github.com/).  

The following is a git shell example for installing the app on your local machine.

```shell
cd /code_folder
git clone https://github.com/CenterForDigitalHumanities/TinyNode.git tiny_things
npm install
```
**Note: do not run** `npm audit fix`.  We will do that upstream in the `main` branch.

Create a file named `.env` in the root folder.  In the above example, the root is `/code_folder/tiny_things`.  `/code_folder/tiny_things/.env` looks like this:

```shell
ACCESS_TOKEN = OBTAINED_FROM_ADMINS
REFRESH_TOKEN = OBTAINED_FROM_ADMINS
RERUM_REGISTRATION_URL = https://store.rerum.io/v1/
RERUM_API_ADDR = https://store.rerum.io/v1/api/
RERUM_ID_PATTERN = https://store.rerum.io/v1/id/
RERUM_ACCESS_TOKEN_URL = https://store.rerum.io/v1/client/request-new-access-token
PORT = 3005
OPEN_API_CORS = false
```

Now, you can run tests
```shell
npm run runtest
```

And start the app
```shell
npm start
```

Your TinyThings will attempt to run at `http://localhost:3005`.  If port `3005` is taken, then update the .env value `PORT` to an open port and try to start it again.

To stop the application, kill or exit the process via your shell (<kbd>CTRL + C</kbd> or <kbd>CTRL + X</kbd>).

## 🎉 Ready to Start Contributing!

Excellent, way to get there.  First, make a new branch through the GitHub Interface or through your shell.  Make sure you 'checkout' that branch.

```shell
cd /code_folder/tiny_things
git checkout my_new_branch
```

Now you can make code changes and see them in real time by using `npm start`.  When you are finished with the commits to your new branch, open a Pull Request that targets the `main` branch at [https://github.com/CenterForDigitalHumanities/TinyNode/tree/main/](https://github.com/CenterForDigitalHumanities/TinyNode/tree/main/).
