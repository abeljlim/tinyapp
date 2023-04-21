const express = require("express");
const app = express();
const cookieSession = require('cookie-session');
const bcrypt = require("bcryptjs");
const { findUserFromEmail } = require('./helpers');
const PORT = 3000;

app.set("view engine", "ejs");

const generateRandomString = function() {
  // return a string of 6 random alphanumeric characters
  let randomStr = "";
  for (let i = 0; i < 6; i++) {
    // ASCII chars are in values 48-57, 65-90, 97-122 -> 62 values
    const randomVal = Math.floor(Math.random() * 62);
    let randomValCharCode;
    if (randomVal < 10) {
      // digit
      const randomValWithinDigits = randomVal + 48;
      randomValCharCode = randomValWithinDigits;
    } else if (randomVal < 36) {
      // uppercase char
      // consider the top 26 values only
      const randomValWithinUppercaseChars = randomVal - 10 + 65;
      randomValCharCode = randomValWithinUppercaseChars;
    } else {
      // lowercase char
      const randomValWithinLowercaseChars = randomVal - 36 + 97;
      randomValCharCode = randomValWithinLowercaseChars;
    }

    const randomValChar = String.fromCharCode(randomValCharCode);
    randomStr += randomValChar;
  }
  return randomStr;
};

const urlDatabase = {
  "b2xVn2": {
    longURL: "http://www.lighthouselabs.ca",
    userID: "userRandomID",
  },
  "9sm5xK": {
    longURL: "http://www.google.com",
    userID: "user2RandomID",
  }
};

const users = {
  userRandomID: {
    id: "userRandomID",
    email: "a@a.com",
    hashedPassword: bcrypt.hashSync("p", 10),
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "b@b.com",
    hashedPassword: bcrypt.hashSync("o", 10),
  },
};

const urlsForUser = id => {
  const filteredUrlDatabase = {};
  for (const urlID in urlDatabase) {
    if (urlDatabase[urlID].userID === id) {
      filteredUrlDatabase[urlID] = urlDatabase[urlID];
    }
  }
  return filteredUrlDatabase;
};

app.use(express.urlencoded({ extended: true }));
app.use(cookieSession({
  name: 'session',
  keys: ['secretkey1', 'secondsecretkey2'],
}));

app.get("/", (req, res) => {
  // If user is not logged in, then redirect to /login
  if (!users[req.session.userID]) {
    res.redirect('/login');
    return;
  }

  // If user is logged in, then redirect to /urls
  res.redirect('/urls');
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

// ADD
app.post("/urls", (req, res) => {

  // If user is not logged in, then send a client error message
  if (!users[req.session.userID]) {
    res.status(401).send("You cannot create a new URL because you are not logged in!");
    return;
  }

  let randomString = generateRandomString();

  // prevent collisions with other random strings by regenerating the string as long as it already exists in urlDatabase
  while (urlDatabase[randomString]) {
    randomString = generateRandomString();
  }

  urlDatabase[randomString] = {
    longURL: req.body.longURL,
    userID: req.session.userID,
  };

  res.redirect(`/urls/${randomString}`);
});

// REGISTER (GET)
app.get("/register", (req, res) => {
  // If user is logged in, then redirect
  if (users[req.session.userID]) {
    res.redirect("/urls");
    return;
  }

  const templateVars = {
    user: users[req.session.userID],
  };
  res.render("urls_registration", templateVars);
});

// REGISTER (POST)
app.post("/register", (req, res) => {
  // Edge case 1: If the e-mail or password are empty strings, send back a response with the 400 status code.
  // Edge case 2: If someone tries to register with an email that is already in the users object, send back a response with the 400 status code.
  if (req.body.email === "" || req.body.password === "") {
    res.status(400).send("Please provide both an email and a password.");
    return;
  }

  if (findUserFromEmail(req.body.email, users)) {
    res.status(400).send("That email was already taken!");
    return;
  }

  let randomString = generateRandomString();

  // prevent collisions with other random strings by regenerating the string as long as it already exists in urlDatabase
  while (users[randomString]) {
    randomString = generateRandomString();
  }

  const hashedPassword = bcrypt.hashSync(req.body.password, 10);

  users[randomString] = {
    id: randomString,
    email: req.body.email,
    hashedPassword: hashedPassword,
  };
  req.session.userID = randomString;
  res.redirect(`/urls`);
});

// BROWSE
app.get("/urls", (req, res) => {
  // If user is not logged in, then display relevant error message
  if (!users[req.session.userID]) {
    res.status(401).send("You have to be logged in to view this page. Please use the Login or Register links before coming to this page.");
    return;
  }

  const templateVars = {
    user: users[req.session.userID],
    urls: urlsForUser(req.session.userID),
  };
  res.render("urls_index", templateVars);
});

// ADD
app.get("/urls/new", (req, res) => {
  // If user is not logged in, then redirect
  if (!users[req.session.userID]) {
    res.redirect("/login");
    return;
  }

  const templateVars = {
    user: users[req.session.userID],
  };
  res.render("urls_new", templateVars);
});

// LOGIN (GET)
app.get("/login", (req, res) => {
  // If user is logged in, then redirect
  if (users[req.session.userID]) {
    res.redirect("/urls");
    return;
  }

  const templateVars = {
    user: users[req.session.userID],
  };
  res.render("urls_login", templateVars);
});

// LOGIN (POST)
app.post("/login", (req, res) => {
  const user = findUserFromEmail(req.body.email, users);

  // Error checking - e-mail / password not matching
  if (!user || !bcrypt.compareSync(req.body.password, user.hashedPassword)) {
    res.status(401).send("Invalid e-mail / password.");
    return;
  }

  req.session.userID = user.id;
  res.redirect('/urls');
});

// CLEAR COOKIE
app.post("/logout", (req, res) => {
  // remove cookie with userID
  req.session = null;
  res.redirect('/login');
});

// DELETE
app.post("/urls/:id/delete", (req, res) => {

  // edge case: URL not found at all
  if (!urlDatabase[req.params.id]) {
    res.status(404).send("404 URL Not Found");
    return;
  }

  // edge case: user not logged in, but URL is found
  if (!users[req.session.userID]) {
    res.status(401).send("Sorry, you do not have access to this URL because you are not logged in.");
    return;
  }

  // edge case: URL is found and user is logged in, but user doesn't own the URL
  const filteredUrlDatabase = urlsForUser(req.session.userID);
  if (!filteredUrlDatabase[req.params.id]) {
    res.status(403).send("403 Forbidden URL (you don't own it!)");
    return;
  }

  // happy path: user is logged in, and owns the URL
  delete urlDatabase[req.params.id];
  res.redirect('/urls');
});

// EDIT
app.post("/urls/:id", (req, res) => {

  // edge case: URL not found at all
  if (!urlDatabase[req.params.id]) {
    res.status(404).send("404 URL Not Found");
    return;
  }

  // edge case: user not logged in, but URL is found
  if (!users[req.session.userID]) {
    res.status(401).send("Sorry, you do not have access to this URL because you are not logged in.");
    return;
  }

  // edge case: URL is found and user is logged in, but user doesn't own the URL
  const filteredUrlDatabase = urlsForUser(req.session.userID);
  if (!filteredUrlDatabase[req.params.id]) {
    res.status(403).send("403 Forbidden URL (you don't own it!)");
    return;
  }

  // edge case: non-existent user ID
  if (!users[req.session.userID]) {
    res.status(401).send("Sorry, you do not have access to this URL because you are not logged in.");
    return;
  }

  // happy path: user is logged in, and owns the URL
  // get longURL and update the urlDatabase object with it
  urlDatabase[req.params.id].longURL = req.body.longURL;
  res.redirect('/urls');
});

// READ
app.get("/urls/:id", (req, res) => {
  // edge case: non-existent user ID
  if (!users[req.session.userID]) {
    res.status(401).send("Sorry, you do not have access to this URL because you are not logged in.");
    return;
  }

  const filteredUrlDatabase = urlsForUser(req.session.userID);

  // edge case: user is logged in here, but the ID is still nonexistent for the user
  if (!filteredUrlDatabase[req.params.id]) {
    res.status(403).send("403 Forbidden URL (you don't own it!)");
    return;
  }

  const templateVars = {
    user: users[req.session.userID],
    id: req.params.id,
    longURL: filteredUrlDatabase[req.params.id].longURL,
  };
  res.render("urls_show", templateVars);
});

app.get("/u/:id", (req, res) => {
  // edge case: non-existent ID - could do a 404 (repeated code, but a separate function seems unnecessary)
  if (!urlDatabase[req.params.id]) {
    res.status(404).send("404 URL Not Found");
    return;
  }

  const longURL = urlDatabase[req.params.id].longURL;
  res.redirect(longURL);
});

app.post("*", (req, res) => {
  res.status(404).send("<html><body>404 Not Found</body></html>\n");
});

app.get("*", (req, res) => {
  res.status(404).send("<html><body>404 Not Found</body></html>\n");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});