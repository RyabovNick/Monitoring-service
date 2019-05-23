const winston = require('winston');
const { createLogger, format, transports } = winston;
const fse = require('fs-extra');
const path = require('path');

/**
 * create files and folder if not exist
 */
const combinedLog = path.join(__dirname, '../logs/combined.log');
const errorLog = path.join(__dirname, '../logs/error.log');
const exceptionsLog = path.join(__dirname, '../logs/exceptions.log');

fse.ensureFile(combinedLog, err => {
  if (err) {
    console.log('err: ', err);
  }
});
fse.ensureFile(errorLog, err => {
  if (err) {
    console.log('err: ', err);
  }
});
fse.ensureFile(exceptionsLog, err => {
  if (err) {
    console.log('err: ', err);
  }
});

const logger = createLogger({
  format: format.json(),
  defaultMeta: {
    service: 'monitoring-service',
  },
  transports: [
    new transports.File({
      filename: errorLog,
      level: 'error',
      format: format.combine(
        format.timestamp({
          format: 'DD-MM-YYYY:HH:mm:ss ZZ',
        }),
        format.json(),
      ),
    }),
    new transports.File({
      filename: combinedLog,
      format: format.combine(
        format.timestamp({
          format: 'DD-MM-YYYY:HH:mm:ss ZZ',
        }),
        format.json(),
      ),
    }),
  ],
  exceptionHandlers: [new transports.File({ filename: exceptionsLog })],
});

logger.exceptions.handle(new transports.File({ filename: exceptionsLog }));

module.exports = {
  logger,
};
