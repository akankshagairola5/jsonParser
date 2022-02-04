
var fs = require('fs');
const { GoogleSpreadsheet } = require('google-spreadsheet');
var filepath1 = 'jsonResult.json';
var obj = {};
var itr = 0;
var stepURL = "https://www.webpagetest.org//results.php?test="


function testResultParser(filepath) {
    try {
        jsonData = JSON.parse(fs.readFileSync(filepath));

        obj["Date"] = 'xxxx-yyy-zz';
        obj["Label"] = jsonData.data.label;
        obj["Location"] = jsonData.data.location;
        //obj["testRuns"] = Object.keys(jsonData.data.runs).length
        var runs = jsonData.data.runs
        var outputData = jsonRunsParser(runs);
        obj = Object.assign(obj, outputData)

        // console.log("Writing JSON output")
       // writeOutput(obj)
        return obj;

    }
    catch (e) {
        console.log("Error in parsing json file " + filepath);
        throw e;
    }

}

function jsonRunsParser(runs) {
    var runsOutputObj = {}

    Object.entries(runs).forEach(([key, views]) => { //for each run 
        itr = itr + 1; //run count
        var run = "run#" + itr;
        runsOutputObj[run] = {}

        for (const viewkey of Object.keys(views)) { //for First and Repeated Views

            runsOutputObj[run][viewkey] = {};
            runsOutputObj[run][viewkey]["view"] = viewkey;

            // console.log("Parsing steps.")
            var outputSteps = jsonStepsParser(views[viewkey].steps, itr)
            runsOutputObj[run][viewkey]["Steps"] = outputSteps;
        }

    });

    return runsOutputObj;

}

function jsonStepsParser(stepsJsonObj , runNum) {
    var stepItr = 0;
    var stepObj = {};

    for (const stepkey of Object.keys(stepsJsonObj)) {
        var hits = miss = 0;
        var step = "step" + ++stepItr;

        var requests = stepsJsonObj[stepkey].requests;

        //parsing response.
        requests.forEach((request) => {
            var response = request.headers.response;

            if (response.includes("x-cache: Hit from cloudfront")) {
                ++hits;
            }

            if (response.includes("x-cache: Miss from cloudfront")) {
                ++miss;
            }

        });

        stepObj[step] =
        {
            "Name": stepsJsonObj[stepkey].eventName,
            //"TotalRequests": Object.keys(requests).length,
            "Hits": hits,
            "Miss": miss,
            "loadTime": stepsJsonObj[stepkey].loadTime,
            "stepURL": stepURL+ stepsJsonObj[stepkey].testID + "#run" + runNum + "_" + step,
            "screenshotURL": stepsJsonObj[stepkey].pages.screenShot
        }

        stepObj = Object.assign(stepObj, stepObj)

    }
    return stepObj;

}

//writing output to json file
// function writeOutput(obj) {
//     try {

//         fs.writeFile("jsonOutput.json", JSON.stringify(obj), 'utf8', function (err) {
//             if (err) {
//                 console.log("An error occured while writing JSON Object to File.");
//                 return console.log(err);
//             }
//             console.log("JSON file has been saved.");
//         });

//     }
//     catch (e) {
//         console.log("Error in writing json output ");
//         throw e;
//     }

// }

module.exports = {

    reportgenerator: async function (report) {
        var jsonOutput = testResultParser(filepath1);

        const doc = new GoogleSpreadsheet('1tng1MvgjdnXaXrcKVvi88mogu_ZZ4lY-6T-6QEaqBas');
        var spreadsheetCreds = JSON.parse(fs.readFileSync('./credentials/creds.json'));

        await doc.useServiceAccountAuth(spreadsheetCreds);
        await doc.loadInfo()
        
        const sheet = doc.sheetsByIndex[0];
        const rows = await sheet.getRows()

        var array = [];
        var rowNum = 0;
        var rowArrayItr = []
        //Object.values(jsonOutput).reduce(function (previous, jsonObj) {
        for (const jsonOutputkey of Object.keys(jsonOutput)) {

            if (typeof jsonOutput[jsonOutputkey] != 'object')                
                array.push(jsonOutput[jsonOutputkey])
                
            else {
                var views = jsonOutput[jsonOutputkey]
                var runNum = jsonOutputkey.match(/\d/g).join("");
                array.push(runNum) //extract run#

                for (const key of Object.keys(views)) {
                    var viewToArray = views[key].view; //read if firstview or repeat view
                    console.log("Parsing View-"+viewToArray)
                    var steps = views[key].Steps; //read data for steps
                    for (const stepkey of Object.keys(steps)) {
                        var newArr = []

                        newArr.push(viewToArray)
                        newArr.push(stepkey)
                        newArr.push(steps[stepkey].Name)
                        newArr.push(steps[stepkey].Hits)
                        newArr.push(steps[stepkey].Miss)
                        newArr.push(steps[stepkey].loadTime)
                        newArr.push(steps[stepkey].stepURL)
                        newArr.push(steps[stepkey].screenshotURL)

                        rowArrayItr[0]=++rowNum;
                        console.log("Writitng- Run:#"+runNum + " Step:#"+stepkey)
                        var finalArray = [...rowArrayItr,...array, ...newArr]
                        await sheet.addRow(finalArray)
                    }
                }
            }
        }

    }
}

module.exports.reportgenerator();