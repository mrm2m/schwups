#!/usr/bin/env node

var http = require("http");
var fs = require("fs");
var path = require("path");

var dirname = "";
var basename = "";
var local_path = ""

if (process.argv.length != 3) {
  process.stderr.write("Usage: " + process.argv[1] + " <path>\n");
  process.exit(1);
}

fs.lstat(process.argv[2], function(err, stats) {
  if (err || !(stats.isFile() || stats.isDirectory())) {
    process.stderr.write("Cannot open file: " + process.argv[2] + "\n");
    process.exit(1);
  }
  dirname = path.normalize(path.dirname(process.argv[2]));
  basename = path.basename(process.argv[2]);
//  process.stdout.write("Working on " + path.normalize(dirname + path.sep + basename) + "\ndirname = " + dirname + ", basename = " + basename + "\n");
  local_path = path.normalize(dirname + path.sep + basename)
});

function check_request (url) {
  dest = path.normalize(dirname + url);
  return ((dest.substring(0,local_path.length) == local_path) && fs.existsSync(dest) && (fs.lstatSync(dest).isFile() || fs.lstatSync(dest).isDirectory()));
}

http.createServer(function(request, response) {
  if (request.url == "/") {
    response.writeHead(302, {'Location': request.url + basename});
    response.end();
  }
  if (check_request(request.url)) {
    if (fs.lstatSync(path.normalize(dirname + request.url)).isDirectory()) {
      response.writeHead(200, {"Content-Type": "text/html"});
      response.write("<html><head><title>schwups</title></head><body><ul><li><a href=\"../\">../</a></li>");
      fs.readdirSync(path.normalize(dirname + request.url)).forEach(function(entry) {
        response.write("<li><a href=\"" + request.url + "/" + entry + "\">" + entry + "</a></li>");
      });
      response.write("</ul></body></html>");
      response.end();
    } else {
      response.writeHead(200, {})
      var readStream = fs.createReadStream(path.normalize(dirname + request.url));
      readStream.pipe(response);
    }
  } else {
    response.writeHead(404, {"Content-Type": "text/html"});
    response.write("<html><head><title>schwups</title></head><body>M&ouml;&ouml;p</body></html>");
    response.end();
    process.stderr.write(path.normalize(dirname + request.url) + " is not valid.\n");
  }
}).listen(8888);
