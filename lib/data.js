const fs = require('fs');
const path = require('path');
const dataLib = {};

dataLib.basedir = path.join(__dirname, '/../.data/');

dataLib.create = (dir, file, data, callback) => {
  fs.open(
    dataLib.basedir + dir + '/' + file + '.json',
    'wx',
    (err, fileInfo) => {
      if (!err && fileInfo) {
        fs.writeFile(fileInfo, JSON.stringify(data), (err) => {
          if (!err) {
            fs.close(fileInfo, (err) => {
              if (!err) {
                callback(false);
              } else {
                callback('file close failed!');
              }
            });
          } else {
            callback('Error in writing file.');
          }
        });
      } else {
        callback(err);
      }
    }
  );
};

dataLib.read = (dir, file, callback) => {
  fs.readFile(
    dataLib.basedir + dir + '/' + file + '.json',
    'utf-8',
    (err, data) => {
      callback(err, data);
    }
  );
};

dataLib.update = (dir, file, data, callback) => {
  fs.open(
    dataLib.basedir + dir + '/' + file + '.json',
    'r+',
    (err, fileInfo) => {
      if (!err && fileInfo) {
        let stringData = JSON.stringify(data);
        fs.ftruncate(fileInfo, (err) => {
          if (!err) {
            fs.writeFile(fileInfo, stringData, (err) => {
              if (!err) {
                fs.close(fileInfo, (err) => {
                  if (!err) {
                    callback(false);
                  } else {
                    callback(err);
                  }
                });
              }
            });
          } else {
            callback(err);
          }
        });
      } else {
        callback(err);
      }
    }
  );
};

dataLib.delete = (dir, file, callback) => {
  fs.unlink(dataLib.basedir + dir + '/' + file + '.json', (err) => {
    if (!err) {
      callback(false);
    } else {
      callback(err);
    }
  });
};

dataLib.list = (dir, callback) => {
  fs.readdir(`${dataLib.basedir + dir}/`, (err, fileNames) => {
    if (!err && fileNames && fileNames.length > 0) {
      let trimmedFiles = [];
      fileNames.forEach((file) => trimmedFiles.push(file.replace('.json', '')));
      callback(false, trimmedFiles);
    } else {
      callback({ msg: 'Error Reading Directory' });
    }
  });
};

module.exports = dataLib;
