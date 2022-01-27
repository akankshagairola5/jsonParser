
var fs = require('fs');
var filepath1 = 'jsonResult.json';
var obj = {};
var stepItr = itr = 0;

function testResultParser(filepath) {
    try {
        jsonData = JSON.parse(fs.readFileSync(filepath));

        obj["summary"] = jsonData.data.summary;
        var runs = jsonData.data.runs
        obj["runs"] = Object.keys(runs).length
        for (const key of Object.keys(runs)) {
            if (runs[key].firstView) {

                var steps = runs[key].firstView.steps;

                var run = "run#" + ++itr;
                obj[run] =
                {
                    "Total Steps": Object.keys(steps).length,

                }

                for (const stepkey of Object.keys(steps)) {
                    var hits = miss = 0;

                    var step = "step#" + ++stepItr;
                    var requests = steps[stepkey].requests;

                    obj[run][step] =
                    {
                        "Total Requests": Object.keys(requests).length,
                    }

                    requests.forEach((request) => {
                        var response = request.headers.response;

                        if (response.includes("x-cache: Hit from cloudfront")) {
                            ++hits;
                        }

                        if (response.includes("x-cache: Miss from cloudfront")) {
                            ++miss;
                        }


                    });
                    obj[run][step]["Total assests with hit from cloudfront"] = hits;
                    obj[run][step]["Total assests with miss from cloudfront"] = miss

                }

            }

        }
        fs.writeFile("jsonOutput.json", JSON.stringify(obj), 'utf8', function (err) {
            if (err) {
                console.log("An error occured while writing JSON Object to File.");
                return console.log(err);
            }
         
            console.log("JSON file has been saved.");
        });
        //console.log(obj)

    }
    catch (e) {
        console.log("[USER] Error in parsing json file " + filepath);
        throw e;
    }

}

testResultParser(filepath1)                    
