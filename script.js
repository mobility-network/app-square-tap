const btnRecord = document.getElementById("btn-record")
const canvasVid = document.getElementById("canvas-video")
const canvasPlot = document.getElementById("canvas-plot")
const formPlot = document.getElementById("form")
const szBody = 16;
const szFoot = 32;
const vidRes = [840, 1440];
let canvas;
let video;
let video_null;
let poseNet;
let pose;
let capture = false;
let footXY = [[[], []], [[], []]];
let time = [];
let frame = 0;
let plotOption = "Position vs Time";

//#region SETUP
function setup() {
    // Graphics
    var constraints = {
        audio: false,
        video: {
            facingMode: {
                exact: "environment"
            }
        }
    }
    canvas = createCanvas(vidRes[0], vidRes[1]);
    canvas.parent(canvasVid);
    video = createCapture(VIDEO, constraints);
    video.hide();
    // Pose Model
    poseNet = ml5.poseNet(video, "single", modelLoaded);
    poseNet.on('pose', trackPoses);
    // Plot
    initPlot()
}

function modelLoaded() {
    console.log('Pose Estimation Online');
}
//#endregion

//#region INTERFACE
btnRecord.onclick = function () {
    capture = !capture;
    if (capture) {
        btnRecord.innerHTML = "STOP"
        btnRecord.style.backgroundColor = "rgba(187, 19, 62, 1)";
        footXY = [[[], []], [[], []]]
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
        title: "Foot XY"
    };

    // Display using Plotly
    Plotly.newPlot(canvasPlot, data, layout);
}

function plotData() {
    // Define Data
    if (plotOption == "Position vs Time") {
        var data = [{
            x: time,
            y: footXY[0][1],
            mode: "markers"
        }];
    } else {
        var data = [{
            x: footXY[0][0],
            y: footXY[0][1],
            mode: "markers"
        }];
    }

    // Define Layout
    var layout = {
        title: "Foot XY"
    };

    // Display using Plotly
    Plotly.newPlot(canvasPlot, data, layout);
}
//#endregion

//#region TRACK POSES
function trackPoses(poses) {
    frame++;
    time.push(frame);
    if (poses.length > 0) {
        pose = poses[0].pose;
        footXY[0][0].push(pose.rightAnkle.x)
        footXY[0][1].push(pose.rightAnkle.y)
        footXY[1][0].push(pose.leftAnkle.x)
        footXY[1][1].push(pose.leftAnkle.y)
    } else {
        footXY[0][0].push(-1)
        footXY[0][1].push(-1)
        footXY[0][0].push(-1)
        footXY[1][1].push(-1)
    }
}
//#endregion

//#region DRAW
function draw() {
    background(255)

    vHeight = width * (video.height / video.width);
    vScaleX = 0 + 1 * width / video.width;
    vScaleY = 1 + 0 * (video.height / video.width);
    vTop = 64;
    vPad = (vidRes[1] - vHeight) / 2;
    hPad = 0;//(windowWidth - width) / 2;
    if (vPad < 0) {
        vPad = 0;
    }
    image(video, 0, vPad, width, vHeight);

    if (pose && capture) {
        // ADD LANDMARKS
        fill(255, 255, 0);
        //ellipse(vScaleX * pose.rightShoulder.x, vScaleY * pose.rightShoulder.y + vPad + vTop, szFoot);
        //ellipse(vScaleX * pose.leftShoulder.x, vScaleY * pose.leftShoulder.y + vPad + vTop, szFoot);

        ellipse(vScaleX * pose.rightAnkle.x + hPad, vScaleY * pose.rightAnkle.y + vPad + vTop, szFoot);
        fill(255, 0, 0);
        ellipse(vScaleX * pose.leftAnkle.x + hPad, vScaleY * pose.leftAnkle.y + vPad + vTop, szBody);
        ellipse(vScaleX * pose.rightKnee.x + hPad, vScaleY * pose.rightKnee.y + vPad + vTop, szBody);
        ellipse(vScaleX * pose.leftKnee.x + hPad, vScaleY * pose.leftKnee.y + vPad + vTop, szBody);
        ellipse(vScaleX * pose.rightHip.x + hPad, vScaleY * pose.rightHip.y + vPad + vTop, szBody);
        ellipse(vScaleX * pose.leftHip.x + hPad, vScaleY * pose.leftHip.y + vPad + vTop, szBody);
        /*// ADD SEGMENTS
        strokeWeight(2);
        stroke(255);
        line(pose.rightAnkle.x + hPad, pose.rightAnkle.y + vPad + vTop,
            pose.rightKnee.x + hPad, pose.rightKnee.y + vPad + vTop);
        line(pose.leftAnkle.x + hPad, pose.leftAnkle.y + vPad + vTop,
            pose.leftKnee.x + hPad, pose.leftKnee.y + vPad + vTop);
        line(pose.rightKnee.x + hPad, pose.rightKnee.y + vPad + vTop,
            pose.rightHip.x + hPad, pose.rightHip.y + vPad + vTop);
        line(pose.leftKnee.x + hPad, pose.leftKnee.y + vPad + vTop,
            pose.leftHip.x + hPad, pose.leftHip.y + vPad + vTop);*/
    }
}
//#endregion