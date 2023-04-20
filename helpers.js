const findUserFromEmail = (email, database) => {
  const userKey = Object.keys(database).find(key => database[key].email === email);
  return database[userKey];
};

module.exports = { findUserFromEmail };