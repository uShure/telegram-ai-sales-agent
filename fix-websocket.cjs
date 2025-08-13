const fs = require('fs');
const path = require('path');

// Find the WebSocketFrame.js file
const wsFramePath = path.join(__dirname, 'node_modules/websocket/lib/WebSocketFrame.js');

if (fs.existsSync(wsFramePath)) {
  // Read the file
  let content = fs.readFileSync(wsFramePath, 'utf8');

  // Replace optional dependencies with stubs
  content = content.replace(
    /var bufferUtil = require\('bufferutil'\);/g,
    "var bufferUtil = { mask: function() {}, unmask: function() {} };"
  );

  content = content.replace(
    /var validation = require\('utf-8-validate'\);/g,
    "var validation = { isValidUTF8: function() { return true; } };"
  );

  // Write back
  fs.writeFileSync(wsFramePath, content, 'utf8');
  console.log('WebSocket dependencies fixed!');
} else {
  console.log('WebSocketFrame.js not found');
}
