import fs from "fs";
import path from "path";

const SOURCE_PATH = path.join("\\\\10.10.3.118", "climps", "10_Day", "Data");

// Month mapping (short + full → number)
const monthMap = {
  "01_January": "01", "01_Jan": "01",
  "02_February": "02", "02_Feb": "02",
  "03_March": "03", "03_Mar": "03",
  "04_April": "04", "04_Apr": "04",
  "05_May": "05",
  "06_June": "06", "06_Jun": "06",
  "07_July": "07", "07_Jul": "07",
  "08_August": "08", "08_Aug": "08",
  "09_September": "09", "09_Sep": "09",
  "10_October": "10", "10_Oct": "10",
  "11_November": "11", "11_Nov": "11",
  "12_December": "12", "12_Dec": "12",
};

const getDirs = (p) =>
  fs.existsSync(p)
    ? fs.readdirSync(p, { withFileTypes: true }).filter(d => d.isDirectory()).map(d => d.name)
    : [];

export function collectDates() {
  return getDirs(SOURCE_PATH)
    .filter(y => /^\d{4}$/.test(y)) // ✅ only 4-digit years
    .flatMap(year =>
      getDirs(path.join(SOURCE_PATH, year)).flatMap(month =>
        getDirs(path.join(SOURCE_PATH, year, month)).map(dayFolder => {
          const day = dayFolder.replace(/[^\d]/g, ""); // e.g. "Aug20" → "20"
          const monthNum = monthMap[month];
          if (day && monthNum) {
            return `${monthNum}/${day.padStart(2, "0")}/${year}`;
          }
          return null;
        }).filter(Boolean)
      )
    );
}
