const btnRecord = document.getElementById("btn-record")
const btnFootR = document.getElementById("btn-right")
const btnFootL = document.getElementById("btn-left")
const canvasVid = document.getElementById("canvas-video")
const canvasPlot = document.getElementById("canvas-plot")
const lblCount = document.getElementById("lbl-count")
let detector;
let detectorConfig;
let poses;
let video;
let videoready = false;
let skeleton = true;
let model;
let newCycle = false;
let tracking = false;
let frame = 0;
let num_cycles = 0;
let keypointXY = [[], []];
let time = [];
const CYCRAD = 50;
let RAT = 0.65;
const DEF_RES = [640, 480];
let ADJ_RES = [DEF_RES[0] * RAT, DEF_RES[1] * RAT];
let num_kp = 15;

function adjustCanvasSize() {
    if (screen.width > 900) {
        RAT = 1;
    } else {
        RAT = 0.65;
    }
    console.log(RAT)
    ADJ_RES = [DEF_RES[0] * RAT, DEF_RES[1] * RAT];
}

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
                exact: "environment"
            }
        }
    }

    adjustCanvasSize();
    canvas = createCanvas(ADJ_RES[0], ADJ_RES[1]);
    canvas.parent(canvasVid);
    video = createCapture(constraints, videoReady);
    video.size(ADJ_RES[0], ADJ_RES[1]);
    video.hide();

    await init();
    initPlot();
}

//#region INTERFACE
btnRecord.onclick = function () {
    tracking = !tracking;
    if (tracking) {
        btnRecord.innerHTML = "STOP"
        btnRecord.classList.remove('btn-dark');
        btnRecord.classList.add('btn-danger');
        keypointXY = [[], []];
        time = [];
        frame = 0;

        num_cycles = 0;
        newCycle = false;
        lblCount.innerHTML = num_cycles;
    } else {
        btnRecord.innerHTML = "START"
        btnRecord.classList.remove('btn-danger');
        btnRecord.classList.add('btn-dark');
        plotData()
    }
}

btnFootR.onclick = function () {
    num_kp = 16;
    btnFootR.classList.add('active');
    btnFootL.classList.remove('active');
}
btnFootL.onclick = function () {
    num_kp = 15;
    btnFootR.classList.remove('active');
    btnFootL.classList.add('active');
}
//#endregion

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
        //autosize: false,
        //height: ADJ_RES[1] * 0.75,
        //width: ADJ_RES[0],
        title: "Foot XY-Time"
    };

    // Display using Plotly
    Plotly.newPlot(canvasPlot, data, layout);
}

function plotData() {
    // Define Data
    var trace1 = {
        x: time,
        y: keypointXY[0],
        name: 'X',
        mode: 'lines'
    };

    var trace2 = {
        x: time,
        y: keypointXY[1],
        name: 'Y',
        mode: 'lines'
    };
    var data = [trace1, trace2];

    // Define Layout
    var layout = {
        //autosize: false,
        //height: ADJ_RES[1] * 0.75,
        //width: ADJ_RES[0],
        title: "Foot XY-Time",
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
        kpX = poses[0].keypoints[num_kp].x;
        kpY = poses[0].keypoints[num_kp].y;
        keypointXY[0].push(kpX)
        keypointXY[1].push(kpY)

        testCycle(kpX, kpY)
    } else {
        keypointXY[0].push(-1)
        keypointXY[1].push(-1)
    }
}

function testCycle(x, y) {
    let dX = x - keypointXY[0][0];
    let dY = y - keypointXY[1][0];
    let dist = Math.sqrt(dX * dX + dY * dY);

    if (dist > CYCRAD) {
        newCycle = true;
    }
    if (dist < CYCRAD && newCycle) {
        num_cycles++;
        lblCount.innerHTML = "Cycles: " + num_cycles;
        newCycle = false;
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

    drawStartPoint();
    drawKeypoints();
    drawSkeleton();
}

function drawStartPoint() {
    fill(0, 0, 0, 0);
    stroke(255, 0, 0);
    strokeWeight(4);
    circle(keypointXY[0][0] * RAT, keypointXY[1][0] * RAT, CYCRAD);
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