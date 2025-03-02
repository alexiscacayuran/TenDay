import fs from 'fs';
import path from 'path';
import csvParser from 'csv-parser';
import moment from 'moment';
import { Router } from 'express';
import { uploadBatchToDB } from './tenDayToDB.js';

const SOURCE_PATH = path.join('\\\\10.10.3.118', 'climps', '10_Day', 'Data');
const router = Router();

const decodeCity = (city) => {
    return city
        .replace(/Ã±/g, 'ñ')  // Fix ñ character encoding issues
        .replace(/Ã©/g, 'é')  // Fix é character encoding issues (if needed)
        .normalize();
};

// Utility to encode 'ñ' to 'Ã±' when writing data back
const encodeCity = (city) => {
    return city.replace('ñ', 'Ã±');
};

// Get years from the source path
export const getYears = () => {
    return fs.readdirSync(SOURCE_PATH).filter((entry) => fs.statSync(path.join(SOURCE_PATH, entry)).isDirectory());
};

// Get months based on selected year
export const getMonths = (year) => {
    const yearPath = path.join(SOURCE_PATH, year);
    return fs.readdirSync(yearPath).filter((entry) => fs.statSync(path.join(yearPath, entry)).isDirectory());
};

// Get days based on selected year and month
export const getDays = (year, month) => {
    const monthNumber = getMonthNumber(month);
    const monthName = moment().month(monthNumber - 1).format('MMMM');
    const formattedMonth = String(monthNumber).padStart(2, '0');
    const monthPath = path.join(SOURCE_PATH, year, `${formattedMonth}_${monthName}`);
    return fs.readdirSync(monthPath).filter((entry) => fs.statSync(path.join(monthPath, entry)).isDirectory());
};

// Map abbreviated month name to the month number
const getMonthNumber = (monthStr) => {
    const monthMap = {
        JAN: 1, FEB: 2, MAR: 3, APR: 4, MAY: 5, JUN: 6,
        JUL: 7, AUG: 8, SEP: 9, OCT: 10, NOV: 11, DEC: 12,
    };
    return monthMap[monthStr.toUpperCase()];
};

// Refactor Data Function
export const refactorData = async (year, month, day, userId) => {
    if (!year || !month || !day) {
        return { message: 'Error: Please select Year, Month, and Day.' };
    }

    const monthNumber = getMonthNumber(month);
    if (!monthNumber) {
        return { message: 'Error: Invalid month selected.' };
    }

    const monthName = moment().month(monthNumber - 1).format('MMMM');
    const formattedMonth = String(monthNumber).padStart(2, '0');
    const shortMonthName = moment().month(monthNumber - 1).format('MMM');
    const formattedDay = `${shortMonthName}${String(day).padStart(2, '0')}`; // Format as "Jan13"
    const monthFolder = `${formattedMonth}_${monthName}`;
    const dayPath = path.join(SOURCE_PATH, year, monthFolder, formattedDay, 'CSV_1D'); // Correct folder name

    if (!fs.existsSync(dayPath)) {
        return { message: `Error: Destination path not found: ${dayPath}` };
    }

    batchCounter = 0; // Reset counter for a new starting date

    // Process CSV files
    const files = fs.readdirSync(dayPath)
    .filter(file => file.startsWith('day') && file.endsWith('.csv')) // Ensure only valid "dayX.csv" files
    .sort((a, b) => {
        const numA = parseInt(a.match(/\d+/)[0], 10); // Extract number from "dayX.csv"
        const numB = parseInt(b.match(/\d+/)[0], 10);
        return numA - numB; // Numeric sorting
    });

    
    for (const fileName of files) {
        if (fileName.endsWith('.csv')) {
            const filePath = path.join(dayPath, fileName);
            const skippedCities = await processCSV(filePath, year, month, day, fileName, userId); // Wait for one file to finish before processing the next
            console.log("Skipped Cities due to invalid format:", skippedCities); // Debug log
        }
    }

    return { message: `Processing Data for User ID: ${userId}` }; // Include userId in the response message
};

let batchCounter = 0; // Global counter for batch date increment

const processCSV = async (csvPath, year, month, day, fileName, userId) => {
    console.log(`Processing file: ${csvPath} for User ID: ${userId}`);
    const results = [];
    const skippedCities = [];
    let totalRows = 0;
    const municityProvinceMap = {}; // To store municity name -> list of provinces

    const startDate = moment(`${year}-${getMonthNumber(month)}-${day}`, 'YYYY-MM-DD');
    const batchDate = moment(`${year}-${getMonthNumber(month)}-${day}`, 'YYYY-MM-DD').add(batchCounter, 'days');
    batchCounter++;  // Increment batch counter for each file processed


    const batch = {
            fileName: `${batchDate.format('MMDDYYYY')}(${fileName})`, // Filename format: MMDDYYYY(dayN)        
        start_date: moment(`${year}-${getMonthNumber(month)}-${day}`, 'YYYY-MM-DD').format('M/D/YYYY 0:00'),
        date: batchDate.format('M/D/YYYY 0:00'),
        userID: userId,
        data: [],
    };

    try {
        await new Promise((resolve, reject) => {
            fs.createReadStream(csvPath)
                .pipe(csvParser())
                .on('data', (data) => {
                    totalRows++;
                    const row = { ...data };

                // Handle CITY splitting into Municity and Province
                if (row.CITY) {
                    const city = decodeCity(row.CITY.trim());
                    const municityMatch = city.match(/^([\w\s.'\-\(\)áéíóúñÑüö]+(?:\s(?:Sr\.|Jr\.|III|Pres\.|Sen\.|Dr\.|Hon\.)?)?)\s?\(([^)]+)\)$/);

                    if (municityMatch) {
                        row.municity = municityMatch[1].trim();
                        row.province = municityMatch[2].trim();
                        delete row.CITY;
                    } else {
                        console.log('Skipping row with invalid CITY format:', row);
                        skippedInvalidCity++;
                        skippedCities.push(city);
                        return;
                    }
                } else {
                    console.log('Skipping row with missing CITY field:', row);
                    skippedMissingCity++;
                    return;
                }

                // Province corrections
                if (row.province === 'Samar') row.province = 'Western Samar';
                if (row.province === 'Shariff Kabunsuan') row.province = 'Maguindanao';
                if (row.province.trim() === 'Metropolitan Manila') row.province = 'Metro Manila';

                // Municity to Province adjustments
                const municityToProvince = {
                    'Jose Abad Santos': 'Davao Occidental',
                    'Malita': 'Davao Occidental',
                    'Santa Maria': 'Davao Occidental',
                    'Sarangani': 'Davao Occidental',
                };
                if (municityToProvince[row.municity] && row.province === 'Davao del Sur') {
                    row.province = municityToProvince[row.municity];
                }
                

            // Corrected Municity Adjustments Object
            const municityAdjustments = {
                'Pozzorubio': { province: 'Pangasinan', newName: 'Pozorrubio' },
                'Sofronio Espanola': { province: 'Palawan', newName: 'Sofronio Española' },
                'Zaragoza': { province: 'Nueva Ecija', newName: 'Zaragosa' },
                'Peñaranda': { province: 'Nueva Ecija', newName: 'Penaranda' },
                'Muñoz City': { province: 'Nueva Ecija', newName: 'Munoz' },
                'Salvador Benedicto': { province: 'Negros Occidental', newName: 'Salvador Benedecto' },
                'Pio V. Corpuz': { province: 'Masbate', newName: 'Pio V. Corpus' },
                'Datu Abdullah Sanki': { province: 'Maguindanao', newName: 'Datu Abdullah Sangki' },
                'Lumbaca-Unayan': { province: 'Lanao Del Sur', newName: 'Lumbaca-Unayan' },
                'Cordoba': { province: 'Cebu', newName: 'Cordova' },
                'Quezon': { province: 'Nueva Vizcaya', newName: 'Quezon 2' },
                'Santo Niño': { province: 'Cagayan', newName: 'Santo Nino' },
                'Peñablanca': { province: 'Cagayan', newName: 'Penablanca' },
                'Doña Remedios Trinidad': { province: 'Bulacan', newName: 'Dona Remedios Trinidad' },
                'Peñarrubia': { province: 'Abra', newName: 'Penarrubia' },
                'Kalookan City': { province: 'Metro Manila', newName: 'Caloocan City' },
                'Parañaque': { province: 'Metro Manila', newName: 'Parañaque City' },
                'Las Piñas': { province: 'Metro Manila', newName: 'Las Pinas City' },
            };

            // Check if municity exists in municityAdjustments and province matches
            if (municityAdjustments[row.municity] && row.province === municityAdjustments[row.municity].province) {
                row.municity = municityAdjustments[row.municity].newName;
            }

                 // Add municity to map of provinces
                 if (!municityProvinceMap[row.municity]) {
                    municityProvinceMap[row.municity] = [];
                }
                municityProvinceMap[row.municity].push(row.province);

                batch.data.push({
                    municity: row.municity,
                    province: row.province,
                    cloud_cover: { description: row.CLOUDCOVER },
                    humidity: { mean: row.RELHUMIDIT },
                    rainfall: { 
                        description: row.RAINFALLDE,
                        total: row.RAINFALLTO,
                    },
                    temperature: {
                        mean: row.TEMPMEAN,
                        min: row.TEMPMIN,
                        max: row.TEMPMAX,
                    },
                    wind: {
                        speed: row.WINDSPEED,
                        direction: row.WINDDIRECT,
                    },
                });

                //console.log('File name:', batch.fileName);

                
                
            })
            .on('end', () => {
                // Log all data that will be sent
                //console.log('Data to be sent:', JSON.stringify(batch.data, null, 2));
                resolve();
            })
            .on('error', reject);
    });

    // Print municities that have the same name but different provinces
    //console.log('MUNICITIES with the same name in different provinces:');
    //for (const [municity, provinces] of Object.entries(municityProvinceMap)) {
    //   if (provinces.length > 1) {
    //       console.log(`MUNICITY: ${municity}`);
    //       provinces.forEach((province) => {
    //          console.log(`  - Province: ${province}`);
    //       });
    //   }
    //}

    // Upload the batch to the database
    try {
        const uploadResult = await uploadBatchToDB(batch, userId);
    } catch (error) {
        console.error('Error uploading batch:', error);
    }
} catch (error) {
    console.error('Error processing CSV:', error);
}

return skippedCities;
};

export default router;
