import fs from 'fs';
import path from 'path';
import csvParser from 'csv-parser';
import moment from 'moment';
import limit from 'p-limit';
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

    // If the month is numeric, parse it directly
    if (!isNaN(monthStr)) {
        return parseInt(monthStr, 10);
    }

    // Otherwise, use the month map
    return monthMap[monthStr.toUpperCase()];
};


// Upload Forecast Data Function
export const uploadForecastData = async (year, month, day, userId) => {
    if (!year || !month || !day) {
        return { message: 'Error: Please select Year, Month, and Day.' };
    }

    const startTime = Date.now(); // Start the timer

    const monthNumber = getMonthNumber(month);
    if (!monthNumber || monthNumber < 1 || monthNumber > 12) {
        return { message: 'Error: Invalid month selected.' };
    }
    

    // Ensure the month is formatted as two digits
    const formattedMonth = String(monthNumber).padStart(2, '0');
    const monthName = moment().month(monthNumber - 1).format('MMMM'); // Full month name
    const shortMonthName = moment().month(monthNumber - 1).format('MMM'); // Abbreviated month name
    const formattedDay = String(day).padStart(2, '0'); // Ensure day is two digits

    const monthFolder = `${formattedMonth}_${monthName}`;
    const formattedDayString = `${shortMonthName}${formattedDay}`; // Format as "Jan07"
    const dayPath = path.join(SOURCE_PATH, year, monthFolder, formattedDayString, 'CSV_1D');

    try {
        const files = fs.readdirSync(dayPath);
    } catch (err) {
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

    const concurrency = 5;
    const limiter = limit(concurrency);
    
    const processPromises = files
        .filter(fileName => fileName.endsWith('.csv'))
        .map(fileName => limiter(() => {
            const filePath = path.join(dayPath, fileName);
            return processCSV(filePath, year, month, day, fileName, userId)
                .then(skippedCities => {
                    console.log(`Skipped Cities from ${fileName}:`, skippedCities);
                    return skippedCities;
                });
        }));
    
        const allSkippedCities = await Promise.all(processPromises);
        const endTime = Date.now(); // End the timer
        const durationInSeconds = (endTime - startTime) / 1000; // Duration in seconds
        
        // Convert the duration into hours, minutes, and seconds
        const hours = Math.floor(durationInSeconds / 3600);
        const minutes = Math.floor((durationInSeconds % 3600) / 60);
        const seconds = Math.floor(durationInSeconds % 60);
        
        // Format the time as HH:MM:SS
        const durationFormatted = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        console.log(`
            ✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅
             Completed upload for User ID: ${userId} in ${durationFormatted} HH:MM:SS
            ✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅
             `);        
    

    return {
        message: `Processing completed for User ID: ${userId}`,
        time_taken: durationFormatted,
        total_files: files.length,
        skipped_cities: allSkippedCities.flat()
    };
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

                const requiredFields = [
                    row.CLOUDCOVER,
                    row.RELHUMIDIT,
                    row.RAINFALLDE,
                    row.RAINFALLTO,
                    row.TEMPMEAN,
                    row.TEMPMIN,
                    row.TEMPMAX,
                ];
                
                const hasMissingValue = requiredFields.some(
                    (value) => value === undefined || value === null || value.toString().trim() === ''
                );
                
                if (hasMissingValue) {
                    console.log(`Skipping municity ${row.municity} (${row.province}) due to missing data.`);
                    skippedCities.push(`${row.municity} (${row.province})`);
                    return;
                }                

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
