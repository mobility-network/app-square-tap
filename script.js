const btnRecord = document.getElementById("btn-record")
const canvasVid = document.getElementById("canvas-video")
const canvasPlot = document.getElementById("canvas-plot")
const formPlot = document.getElementById("form-plot")
let detector;
let detectorConfig;
let poses;
let video;
let videoready = false;
let skeleton = true;
let model;
let tracking = false;
let frame = 0;
let plotOption = "Position vs Time";
let footXY = [[], []];
let time = [];
const RAT = 0.75;
let num_kp = 1;

async function init() {
    const detectorConfig = {
        modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
    };
    detector = await poseDetection.createDetector(
        poseDetection.SupportedModels.MoveNet,
        detectorConfig
    );
    edges = {
        '5,7': 'm',
        '7,9': 'm',
        '6,8': 'c',
        '8,10': 'c',
        '5,6': 'y',
        '5,11': 'm',
        '6,12': 'c',
        '11,12': 'y',
        '11,13': 'm',
        '13,15': 'm',
        '12,14': 'c',
        '14,16': 'c'
    };
}

async function videoReady() {
    videoready = true;
    console.log("video ready");
    await getPoses();
}

async function getPoses() {
    poses = await detector.estimatePoses(video.elt);
    setTimeout(getPoses, 0);
}

async function setup() {
    var constraints = {
        audio: false,
        video: {
            facingMode: {
                exact: "user"
            }
        }
    }

    canvas = createCanvas(480, 360);
    canvas.parent(canvasVid);
    video = createCapture(constraints, videoReady);
    video.size(480, 360);
    video.hide();

    await init();
    initPlot();
}

//#region INTERFACE
btnRecord.onclick = function () {
    tracking = !tracking;
    if (tracking) {
        btnRecord.innerHTML = "STOP"
        btnRecord.style.backgroundColor = "rgba(187, 19, 62, 1)";
        footXY = [[], []];
        time = [];
        frame = 0;
    } else {
        btnRecord.innerHTML = "START"
        btnRecord.style.backgroundColor = "rgba(28, 153, 109, 1)";
        plotData()
    }
}

formPlot.onchange = function () {
    plotOption = formPlot.options[formPlot.selectedIndex].text;
    plotData();
}
//#engregion

//#region PLOT FUNCTIONS
function initPlot() {
    // Define Data
    var data = [{
        x: [],
        y: [],
        mode: "markers"
    }];

    // Define Layout
    var layout = {
        autosize: true,
        title: "Foot XY"
    };

    // Display using Plotly
    Plotly.newPlot(canvasPlot, data, layout);
}

function plotData() {
    // Define Data
    if (plotOption == "Position vs Time") {
        var trace1 = {
            x: time,
            y: footXY[0],
            name: 'X',
            mode: 'lines'
        };

        var trace2 = {
            x: time,
            y: footXY[1],
            name: 'Y',
            mode: 'lines'
        };
        var data = [trace1, trace2];
    }

    // Define Layout
    var layout = {
        autosize: true,
        title: "Foot XY",
        xaxis: {
            autorange: false,
            range: [0, frame],
            title: 'Frame'
        },
        yaxis: {
            title: 'Position'
        }
    };

    // Display using Plotly
    Plotly.newPlot(canvasPlot, data, layout);
}
//#endregion

//#region TRACKING
function trackPoses() {
    frame++;
    time.push(frame);
    if (poses.length > 0) {
        footXY[0].push(poses[0].keypoints[1].x)
        footXY[1].push(poses[0].keypoints[1].y)
    } else {
        footXY[0].push(-1)
        footXY[1].push(-1)
    }
}

//#region DRAW FUNCTIONS
function draw() {
    if (videoready == true) {
        if (poses == undefined) {
            getPoses();
        } else if (tracking == true) {
            trackPoses();
        }
    }

    background(220);
    translate(0, 0);
    //scale(-1, 1);
    image(video, 0, 0, video.width, video.height);

    drawKeypoints();
    drawSkeleton();
}

function drawKeypoints() {
    var count = 0;
    if (poses && poses.length > 0) {
        for (let kp of poses[0].keypoints) {
            const { x, y, score } = kp;
            if (score > 0.3) {
                if (count == num_kp) {
                    fill(255);
                    stroke(0);
                    strokeWeight(4);
                    circle(x * RAT, y * RAT, 16);
                } else {
                    fill(255);
                    stroke(0);
                    strokeWeight(4);
                    circle(x * RAT, y * RAT, 4);
                }
            }
            count = count + 1;
        }
    }
}

// Draws lines between the keypoints
function drawSkeleton() {
    confidence_threshold = 0.5;

    if (poses && poses.length > 0) {
        for (const [key, value] of Object.entries(edges)) {
            const p = key.split(",");
            const p1 = p[0];
            const p2 = p[1];

            const y1 = poses[0].keypoints[p1].y * RAT;
            const x1 = poses[0].keypoints[p1].x * RAT;
            const c1 = poses[0].keypoints[p1].score;
            const y2 = poses[0].keypoints[p2].y * RAT;
            const x2 = poses[0].keypoints[p2].x * RAT;
            const c2 = poses[0].keypoints[p2].score;

            if ((c1 > confidence_threshold) && (c2 > confidence_threshold)) {
                strokeWeight(2);
                stroke('rgb(0, 255, 0)');
                line(x1, y1, x2, y2);
            }
        }
    }
}
//#endregion