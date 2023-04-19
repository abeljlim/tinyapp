const express = require("express");
const app = express();
const cookieParser = require('cookie-parser');
const PORT = 3000; // default port 8080

app.set("view engine", "ejs");

const generateRandomString = function() {
  // return a string of 6 random alphanumeric characters
  let randomStr = "";
  for (let i = 0; i < 6; i++) {
    // ASCII chars are in values 48-57, 65-90, 97-122 -> 62 values
    const randomVal = Math.floor(Math.random() * 62);
    let randomValCharCode;
    // digit
    if (randomVal < 10) {
      const randomValWithinDigits = randomVal + 48;
      randomValCharCode = randomValWithinDigits;
    }
    // uppercase char
    else if (randomVal < 36) {
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
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

// ADD
app.post("/urls", (req, res) => {
  console.log(req.body); // Log the POST request body to the console
  let randomString = generateRandomString();

  // prevent collisions with other random strings by regenerating the string as long as it already exists in urlDatabase
  while (urlDatabase[randomString]) {
    randomString = generateRandomString();
  }

  urlDatabase[randomString] = req.body.longURL;
  res.redirect(`/urls/${randomString}`);
});

// BROWSE
app.get("/urls", (req, res) => {
  const templateVars = {
    username: req.cookies["username"],
    urls: urlDatabase,
  };
  console.log(templateVars); // as advised by Nally
  res.render("urls_index", templateVars);
});

// ADD
app.get("/urls/new", (req, res) => {
  const templateVars = {
    username: req.cookies["username"],
  };
  res.render("urls_new", templateVars);
});

// COOKIE
app.post("/login", (req, res) => {
  // get username and create cookie with it
  res.cookie('username', req.body.username);
  res.redirect('/urls');
});

// CLEAR COOKIE
app.post("/logout", (req, res) => {
  // get username and create cookie with it
  res.clearCookie('username');
  res.redirect('/urls');
});

// DELETE
app.post("/urls/:id/delete", (req, res) => {
  // edge case: non-existent ID - could do a 404?
  console.log(`deleting urlDatabase property { "${req.params.id}": "${urlDatabase[req.params.id]}" }`);
  delete urlDatabase[req.params.id];
  res.redirect('/urls');
});

// EDIT
app.post("/urls/:id", (req, res) => {
  // get longURL and update the urlDatabase object with it
  urlDatabase[req.params.id] = req.body.longURL;
  res.redirect('/urls');
});

// READ
app.get("/urls/:id", (req, res) => {
  const templateVars = {
    username: req.cookies["username"],
    id: req.params.id,
    longURL: urlDatabase[req.params.id],
  };
  res.render("urls_show", templateVars);
});

app.get("/u/:id", (req, res) => {
  // edge case: non-existent ID - could do a 404
  const longURL = urlDatabase[req.params.id];
  res.redirect(longURL);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/set", (req, res) => {
  const a = 1;
  res.send(`a = ${a}`);
});

app.get("/fetch", (req, res) => {
  res.send(`a = ${a}`);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});