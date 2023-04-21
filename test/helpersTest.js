const { assert } = require('chai');
const { findUserFromEmail } = require('../helpers.js');

const testUsers = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur",
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk",
  },
};

describe('findUserFromEmail', function() {
  it('should return a user with valid email', function() {
    const existingUser = findUserFromEmail("user@example.com", testUsers);
    
    // Check equality of existingUser to the user object with id userRandomID
    assert.deepEqual(existingUser, {
      id: "userRandomID",
      email: "user@example.com",
      password: "purple-monkey-dinosaur"
    });
  });

  it('should return undefined with invalid email', function() {
    const nonExistingUser = findUserFromEmail("a@a.com", testUsers);
    assert.deepEqual(nonExistingUser, undefined);
  });
});