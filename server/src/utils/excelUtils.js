const path = require('path');
const fs = require('fs');
const { Worker } = require('worker_threads');

const EXCEL_FILE_PATH = path.join(__dirname, '../../../data/skin_tests.xlsx');
const WORKER_PATH = path.join(__dirname, '../workers/excelWorker.js');

const createWorkerPromise = (type, data = null) => {
    return new Promise((resolve, reject) => {
        const worker = new Worker(WORKER_PATH);
        
        worker.on('message', (message) => {
            if (message.type === `${type}_SUCCESS`) {
                resolve(message.data);
            } else if (message.type === 'ERROR') {
                reject(new Error(message.error));
            }
            worker.terminate();
        });

        worker.on('error', reject);
        worker.postMessage({ type, data, filePath: EXCEL_FILE_PATH });
    });
};

const ensureExcelFile = () => {
    if (!fs.existsSync(path.dirname(EXCEL_FILE_PATH))) {
        fs.mkdirSync(path.dirname(EXCEL_FILE_PATH), { recursive: true });
    }
    if (!fs.existsSync(EXCEL_FILE_PATH)) {
        return writeExcelData([]);
    }
    return Promise.resolve();
};

const readExcelData = async () => {
    await ensureExcelFile();
    return createWorkerPromise('READ');
};

const writeExcelData = (data) => {
    return createWorkerPromise('WRITE', data);
};

module.exports = { readExcelData, writeExcelData, ensureExcelFile };
