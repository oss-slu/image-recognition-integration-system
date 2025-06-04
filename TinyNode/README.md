```
██████╗ ███████╗██████╗ ██╗   ██╗███╗   ███╗
██╔══██╗██╔════╝██╔══██╗██║   ██║████╗ ████║
██████╔╝█████╗  ██████╔╝██║   ██║██╔████╔██║
██╔══██╗██╔══╝  ██╔══██╗██║   ██║██║╚██╔╝██║
██║  ██║███████╗██║  ██║╚██████╔╝██║ ╚═╝ ██║
╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝ ╚═════╝ ╚═╝     ╚═╝
```
reconditorium eximium rerum universalium mutabiliumque

# TinyThings
A tiny NodeJS web application for connecting with the [RERUM API](https://store.rerum.io/v1/API.html).  This is for software developers looking to develop a client application that uses the public RERUM API as the client's back end.  Developers can fork this as a starting point for their client application.  Visit [rerum.io](https://rerum.io) for more general information about RERUM. See a working demo of this application at [tiny.rerum.io](https://tiny.rerum.io/app).

### RERUM Registration Prerequisite
What authenticates and attributes your fork of TinyThings with RERUM is the token information in a `.env` file.  The `sample.env` file included in the codebase details the required information.  You need to make your own `.env` file with the information presented in the `sample.env` file.  To get tokens you must register at [store.rerum.io](https://store.rerum.io/v1).  Once you have the tokens in a `.env` file you can install and/or deploy your fork.

### Default Installation as a Client App
The following is a git shell example for installing the app on your local machine.

```shell
cd /code_folder
git clone https://github.com/CenterForDigitalHumanities/TinyNode.git tiny_things
npm install
```

Create a file named `.env` in the root folder.  In the above example, the root is `/code_folder/tiny_things`.  `/code_folder/tiny_things/.env` looks like this:

```shell
ACCESS_TOKEN = OBTAINED_FROM_REGISTRATION
REFRESH_TOKEN = OBTAINED_FROM_REGISTRATION
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

To stop the application, kill or exit the process via your shell (<kbd>CTRL + C</kbd> or <kbd>CTRL + X</kbd>).

From here, you can continue to add more front ends than just the `index.html` page to comprise what you imagine for your client web application!

### Centralized Client API Mode
In this form there is no app front end.  Instead, only the underlying hooks to interact with the RERUM API are exposed.  Other web applications can use this Client API to interact with the RERUM API without registering themselves.  However, their data will not be uniquely attributed because all the data will share the same registered agent - the agent that established the Client API.  This is useful when multiple disparate front end driven applications interact with the same data corpus for the same purpose and so do not require individualized attribution.  To run the app in this form, make a small change to the `.env` file as detailed below.

```shell
OPEN_API_CORS = true
```

**Note:** If you leave `index.html` in the app code it is possible that users will be able to navigate to this page and experience a front end.  This is either a bug or a feature...if you don't want users to end up in a front end then remove or rename the `index.html` file.  

# 🌟👍 Contributors 👍🌟
Trying to contribute to the public TinyThings?  No way, that's awesome.  Read the [Contributors Guide](CONTRIBUTING.md)!

# Who is to blame?
The developers in the Research Computing Group at Saint Louis University authored and maintain this template in connection with the RERUM API service.
Neither specific warranty nor rights are associated with RERUM; registering and contributing implies only those rights 
each object asserts about itself. We welcome sister instances, ports to other languages, package managers, builds, etc.
