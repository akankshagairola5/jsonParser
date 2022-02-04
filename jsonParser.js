
var fs = require('fs');
var filepath1 = 'jsonResult.json';
var obj = {};
var itr = 0;

function testResultParser(filepath) {
    try {
        jsonData = JSON.parse(fs.readFileSync(filepath));

        obj["TestURL"] = jsonData.data.summary;
        var runs = jsonData.data.runs
        obj["runs"] = Object.keys(runs).length
        for (const key of Object.keys(runs)) {

            if (runs[key].firstView) {

                var run = "run#" + ++itr;
                console.log("Parsing run: " + run)
                //adding steps count
                obj[run] =
                {
                    "Total Steps": Object.keys(runs[key].firstView.steps).length,
                }

                console.log("Parsing steps.")
                var outputSteps = jsonStepsParser(runs[key].firstView.steps)
                obj[run] = Object.assign(obj[run], outputSteps)
            }

        }

        console.log("Writing JSON output")
        writeOutput(obj)

    }
    catch (e) {
        console.log("Error in parsing json file " + filepath);
        throw e;
    }

}

function jsonStepsParser(stepsJsonObj) {
    var stepItr = 0;
    var stepObj = {};

    for (const stepkey of Object.keys(stepsJsonObj)) {
        var hits = miss = 0;

        var step = "step#" + ++stepItr;

        var requests = stepsJsonObj[stepkey].requests;
        console.log("Parsing: " + step)
        stepObj[step] =
        {
            "Name": stepsJsonObj[stepkey].eventName,
            "Total Requests": Object.keys(requests).length,
        }

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

        stepObj[step]["Total Requests with hit from cloudfront"] = hits;
        stepObj[step]["Total Requests with miss from cloudfront"] = miss;

        stepObj = Object.assign(stepObj, stepObj)

    }
    return stepObj;

}

function writeOutput(obj) {
    try {

        fs.writeFile("jsonOutput.json", JSON.stringify(obj), 'utf8', function (err) {
            if (err) {
                console.log("An error occured while writing JSON Object to File.");
                return console.log(err);
            }
            console.log("JSON file has been saved.");
        });

    }
    catch (e) {
        console.log("Error in writing json output ");
        throw e;
    }

}

testResultParser(filepath1)