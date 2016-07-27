'use strict';

function configureLogging(app, loggingService) {
  app.use(logRequests);

  function logRequests(req, res, next) {
    let logTitle = 'Request to url: ' + req.url;
    let oldWrite = res.write;
    let oldEnd = res.end;
    let chunks = [];


    res.write = function (chunk) {
      chunks.push(chunk);

      oldWrite.apply(res, arguments);
    };

    res.end = function (chunk) {
      let endArgs = arguments;
      if (chunk) {
        chunks.push(chunk);
      }
      let body = Buffer.concat(chunks).toString('utf8');
      let bodyObj;
      try {
        bodyObj = JSON.parse(body);
      }
      catch (err) {
        bodyObj = body;
      }

      loggingService.addLogEntry(req.loggingContextId, 'Response Complete', bodyObj, (err) => {
        oldEnd.apply(res, endArgs);
      });
    };



    loggingService.createLogContext(logTitle, (err, contextId) => {
      if (err) {
        return next(err);
      }

      let reqInfo = {
        baseUrl: req.baseUrl,
        body: req.body,
        cookies: req.cookies,
        hostname: req.hostname,
        ip: req.ip,
        ips: req.ips,
        method: req.method,
        originalUrl: req.originalUrl,
        params: req.params,
        path: req.path,
        protocol: req.protocol,
        query: req.query
      };
      req.loggingContextId = contextId;
      loggingService.addLogEntry(contextId, 'Initial Request', reqInfo, next);
    });
  }
}

module.exports = configureLogging;
