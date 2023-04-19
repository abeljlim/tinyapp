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

const users = {
  userRandomID: {
    id: "userRandomID",
    email: "a@a.com",
    password: "p",
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk",
  },
};

const findUserFromEmail = email => {
  const userKey = Object.keys(users).find(key => users[key].email === email);
  return users[userKey];
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

// REGISTER (GET)
app.get("/register", (req, res) => {
  // If user is logged in, then redirect
  if(users[req.cookies["user_id"]]) {
    res.redirect("/urls");
    return;
  }

  const templateVars = {
    // req.body.email
    user: users[req.cookies["user_id"]],
  };
  res.render("urls_registration", templateVars);
});

// REGISTER (POST)
app.post("/register", (req, res) => {
  console.log(req.body); // Log the POST request body to the console
  // Edge case 1: If the e-mail or password are empty strings, send back a response with the 400 status code.
  // Edge case 2: If someone tries to register with an email that is already in the users object, send back a response with the 400 status code.
  if (req.body.email === "" || req.body.password === "") {
    // const templateVars = {
    //   user: users[req.cookies["user_id"]],
    // };
    // res.status(400).render("urls_registration", templateVars);

    // Doing it like the lecture
    res.status(400).send("Please provide both an email and a password.");
    console.log('users', users);
    return;
  }
  
  // Doing it like the lecture
  if(findUserFromEmail(req.body.email)) {
    res.status(400).send("That email was already taken!");
    console.log('users', users);
    return;
  }

  let randomString = generateRandomString();

  // prevent collisions with other random strings by regenerating the string as long as it already exists in urlDatabase
  while (users[randomString]) {
    randomString = generateRandomString();
  }

  users[randomString] = {
    id: randomString,
    email: req.body.email,
    password: req.body.password,
  };
  res.cookie('user_id', randomString);
  console.log('users', users);
  res.redirect(`/urls`);
});

// BROWSE
app.get("/urls", (req, res) => {
  const templateVars = {
    user: users[req.cookies["user_id"]],
    urls: urlDatabase,
  };
  console.log('users', users); // as advised by Nally
  res.render("urls_index", templateVars);
});

// ADD
app.get("/urls/new", (req, res) => {
  const templateVars = {
    user: users[req.cookies["user_id"]],
  };
  res.render("urls_new", templateVars);
});

// LOGIN (GET)
app.get("/login", (req, res) => {
  // If user is logged in, then redirect
  if(users[req.cookies["user_id"]]) {
    res.redirect("/urls");
    return;
  }

  const templateVars = {
    user: users[req.cookies["user_id"]],
  };
  res.render("urls_login", templateVars);
});

// LOGIN (POST)
app.post("/login", (req, res) => {
  const user = findUserFromEmail(req.body.email);

  // Error checking - e-mail not found
  if(!user) {
    res.status(403).send("E-mail not found!");
    return;
  }
  
  // Error checking - not matching password
  if(user.password !== req.body.password) {
    res.status(403).send("Password does not match!");
    return;
  }

  res.cookie('user_id', user.id);
  res.redirect('/urls');
});

// CLEAR COOKIE
app.post("/logout", (req, res) => {
  // remove cookie with user_id
  res.clearCookie('user_id');
  res.redirect('/login');
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
  // edge case: non-existent ID - could do a 404
  if (!urlDatabase[req.params.id]) {
    res.status(404).send("404 URL Not Found");
    return;
  }

  const templateVars = {
    user: users[req.cookies["user_id"]],
    id: req.params.id,
    longURL: urlDatabase[req.params.id],
  };
  res.render("urls_show", templateVars);
});

app.get("/u/:id", (req, res) => {
  // edge case: non-existent ID - could do a 404 (repeated code, but a separate function seems unnecessary)
  if (!urlDatabase[req.params.id]) {
    res.status(404).send("404 URL Not Found");
    return;
  }

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

app.post("*", (req, res) => {
  res.status(404).send("<html><body>404 Not Found</body></html>\n");
});


app.get("*", (req, res) => {
  res.status(404).send("<html><body>404 Not Found</body></html>\n");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});