const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
const path = require('path');
const fs = require('fs');
const FormData = require('form-data');
const _ = require('lodash');
const ipfsPath = uuidv4();
const fromPath = process.argv[2]
const url = `http://183.131.193.195/api/v0/add?pin=true`
const { createLogger, format, transports } = require('winston');
const { combine, timestamp, label, printf } = format;

const myFormat = printf(({ level, message, label, timestamp }) => {
    return `${timestamp} [${label}] ${level}: ${message}`;
});

const logger = createLogger({
    format: combine(
        label({ label: 'crust folder upload' }),
        timestamp(),
        myFormat
    ),
    transports: [new transports.Console()]
});

function getAllFiles(dirPath, ipfsPath) {
    const files = fs.readdirSync(dirPath)
    let arrayOfFiles = []
    files.forEach(file => {
        if (fs.statSync(dirPath + "/" + file).isDirectory()) {
            arrayOfFiles = _.concat(arrayOfFiles, getAllFiles(dirPath + "/" + file, ipfsPath));
        } else {
            const absPath = path.join(dirPath, "/", file);
            const realPath = _.replace(absPath, fromPath, ipfsPath);
            arrayOfFiles.push({
                absPath: absPath,
                path: realPath,
            })
        }
    })
    return arrayOfFiles
}

async function uploadFiles() {
    if (_.isEmpty(fromPath)) {
        logger.info('please input from path')
        return;
    }
    if (_.isEmpty(ipfsPath)) {
        logger.info('please input ipfs temp path')
        return;
    }
    const form = new FormData();
    logger.info(`query all files`);
    const files = getAllFiles(fromPath, ipfsPath);
    for (const f of files) {
        const fileStream = fs.createReadStream(f.absPath);
        form.append('file', fileStream, { filepath: f.path });
    }
    logger.info(`start upload`);
    const result = await axios.request({
        headers: {
            ...form.getHeaders(),
            Authorization: 'Basic c3Vic3RyYXRlLWNUR1k2aEdZNWZ0dnhwMUs3UmVZRVdDcW5jUW9tTDl4c3o5NmJjb05xelFzUm5vVlY6MHg0MGUxYmUyMmQ3NTFlMzBiM2U5NmQ0ZTExYjU3NDQ1ZjRkODIzZDkzNWNmMGU0MGRmNGIxZTZjZGU5ZmZhNDI3NWQ5NWUzNGU2ZWE2YjY5NWI5ZDljYTIzNTAwMGY2NjlhMzBjODkwNjZjMTRjNzVkZjg2Y2ZkZjg5ZTJkN2Q4Yg=='
        },
        data: form,
        method: 'POST',
        url: url,
        timeout: 3600000,
        maxBodyLength: 10737418240
    });
    const resultArr = result.data.split('\n');

    for (let i = 0; i < resultArr.length - 1; i++) {
        const obj = JSON.parse(resultArr[i]);
        logger.info(`${obj.Name}: http://1.116.126.237/ipfs/${obj.Hash}`);
    }
}

uploadFiles()