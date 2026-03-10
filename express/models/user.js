const db = require('../config/db');

class User {
  static create(username, email, password, callback) {
    const query = 'INSERT INTO users (username, email, password) VALUES (?, ?, ?)';
    db.query(query, [username, email, password], callback);
  }

  static findByEmail(email, callback) {
    const query = 'SELECT * FROM users WHERE email = ?';
    db.query(query, [email], callback);
  }

  static findByUsername(username, callback) {
    const query = 'SELECT * FROM users WHERE username = ?';
    db.query(query, [username], callback);
  }

  static findById(id, callback) {
    const query = 'SELECT * FROM users WHERE id = ?';
    db.query(query, [id], callback);
  }
}

module.exports = User;