const fs = require('fs');
const path = require('path');

// Manually load crypto-js files
const aes = fs.readFileSync('./static/js/plugins/cryptojs/aes.js', 'utf8');
const md5 = fs.readFileSync('./static/js/plugins/cryptojs/md5-min.js', 'utf8');
const ecb = fs.readFileSync('./static/js/plugins/cryptojs/mode-ecb-min.js', 'utf8');

// Use eval to load the scripts into the current scope.
eval(aes);
eval(md5);
eval(ecb);

const API_TOKEN = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL2FwaS5udXdhcm9ib3RpY3MuY29tIiwic3ViIjoiYXV0aC5udXdhcm9ib3RpY3N8MTgyMDc3MDI3NTM0IiwiYXVkIjoiMzEyNzAxNDYtNzE3Qi00RUYwLTg2NDctRjNBQkQ3M0E4NjMwIiwiaWF0IjoxNzU5NDYxNzkzLCJleHAiOjM1MTg5MjQxODYsImp0aSI6IjM3YTI2Yjg5LThhYjctNDhlZi04YTczLTMyMDlkMWU1MDM0OCIsImNvbnRleHQiOnsidHlwZSI6ImFjY2VzcyIsInByb3ZpZGVyIjoiZGV2ZWxvcGVyfG8yMDM5Mm9AZ21haWwuY29tIn0sInNjb3BlIjoicHJvZmlsZSBhdXRoIGF1dGhfcmVmcmVzaC5nZXQgb3RhIG90YS5nZXQgZGV2ZWxvcGVyIn0.ILbJYRCwhiR_EhzUTtGWrBPUc9SK8_vTARlcYP0aqIjDVIVw5-1ZliuPxFWVtl96Z7uD32RutGFhbvvd9crou_MIu10Cd708phQlLU6FlAB99111hnJjBnPzGcIU-9s7AJyYd4F388ZmvtqdVNy-PJuv1Eeoec-NRx9hVDW0JuCuQ4EsHXPdv2czpmf41eaZCPZdu312O1V6Fyage27sj_HMsWkSnQ8yy_vYc3c-4AaMPr-3xkl74_GCL7MuMOAfzmQvTlZmmWisShHaISTGgWhbHYqAkPyQDMAYLDAUA7XgvrZAPUnjWhK4Vb5GD1r1mOZhKWPnjuduCcNAbr_UIg";
const motionsDir = 'static/robot/motions/';
const outputDir = 'decrypted_motions/';

// Create output directory if it doesn't exist
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
}

try {
    // Calculate key
    const hash = CryptoJS.MD5(API_TOKEN);
    const hexKey = hash.toString(CryptoJS.enc.Hex).toUpperCase();
    const secretKey = CryptoJS.enc.Utf8.parse(hexKey);

    const files = fs.readdirSync(motionsDir);

    files.forEach(file => {
        if (path.extname(file) === '.xml') {
            const inputFile = path.join(motionsDir, file);
            const outputFile = path.join(outputDir, file);

            try {
                // Read and parse the file
                const responseText = fs.readFileSync(inputFile, 'utf8');
                const jsonData = JSON.parse(responseText);
                const base64Data = jsonData.data;

                if (!base64Data) {
                    throw new Error(`File content is missing the 'data' field in ${file}.`);
                }

                // Decrypt
                const decryptedWordArray = CryptoJS.AES.decrypt(
                    base64Data,
                    secretKey,
                    {
                        mode: CryptoJS.mode.ECB,
                        padding: CryptoJS.pad.Pkcs7,
                    }
                );

                const xmlString = decryptedWordArray.toString(CryptoJS.enc.Utf8);

                if (!xmlString) {
                    throw new Error(`Decryption failed or resulted in an empty string for ${file}. Check the API_TOKEN.`);
                }

                // Save the decrypted file
                fs.writeFileSync(outputFile, xmlString);
                console.log(`File decrypted successfully and saved to ${outputFile}`);

            } catch (error) {
                console.error(`An error occurred during decryption of ${file}:`, error);
            }
        }
    });

} catch (error) {
    console.error("An error occurred:", error);
}
