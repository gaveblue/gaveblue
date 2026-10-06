const path = require('node:path');
module.exports = {
  content: ['index.html', 'app.js', 'form-pages.js'].map(file => path.join(__dirname, '../postoscredenciados-covreecia', file)),
  theme: { extend: {} },
  plugins: []
};
