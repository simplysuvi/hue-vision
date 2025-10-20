// ==============================================
// facetracker.js (MediaPipe FaceMesh version)
// ==============================================

$(document).ready(function () {
  const video = document.getElementById("webcam");
  const overlay = document.getElementById("overlay");
  const eyesCanvas = document.getElementById("eyes");
  const eyesCtx = eyesCanvas.getContext("2d");

  window.facetracker = {
    video,
    overlay,
    overlayCC: overlay.getContext("2d"),
    videoWidthExternal: video.width,
    videoHeightExternal: video.height,
    videoWidthInternal: video.videoWidth,
    videoHeightInternal: video.videoHeight,

    trackingStarted: false,
    currentPosition: null,
    currentEyeRect: null,

    adjustVideoProportions: function () {
      facetracker.videoWidthInternal = video.videoWidth;
      facetracker.videoHeightInternal = video.videoHeight;
      const proportion =
        facetracker.videoWidthInternal / facetracker.videoHeightInternal;
      facetracker.videoWidthExternal = Math.round(
        facetracker.videoHeightExternal * proportion
      );
      facetracker.video.width = facetracker.videoWidthExternal;
      facetracker.overlay.width = facetracker.videoWidthExternal;
    },

    gumSuccess: function (stream) {
      ui.onWebcamEnabled();

      if ("srcObject" in facetracker.video) {
        facetracker.video.srcObject = stream;
      } else {
        facetracker.video.src = window.URL.createObjectURL(stream);
      }

      facetracker.video.onloadedmetadata = function () {
        facetracker.adjustVideoProportions();
        facetracker.video.play();
      };

      facetracker.video.onresize = function () {
        facetracker.adjustVideoProportions();
      };
    },

    gumFail: function () {
      ui.showInfo(
        "There was some problem trying to fetch video from your webcam 😭",
        true
      );
    },
  };

  // =====================================================
  // NEW: MediaPipe FaceMesh integration
  // =====================================================

  let faceMesh;
  let camera;

  async function initFaceMesh() {
    faceMesh = new FaceMesh({
      locateFile: (file) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
    });

    faceMesh.setOptions({
      maxNumFaces: 1,
      refineLandmarks: true, // enables iris landmarks
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    faceMesh.onResults(onResults);

    camera = new Camera(video, {
      onFrame: async () => {
        await faceMesh.send({ image: video });
      },
      width: 640,
      height: 480,
    });

    camera.start();
    facetracker.trackingStarted = true;
  }

  function onResults(results) {
    const ctx = facetracker.overlayCC;
    ctx.clearRect(
      0,
      0,
      facetracker.videoWidthExternal,
      facetracker.videoHeightExternal
    );

    if (!results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0) {
      ui.onFaceNotFound();
      facetracker.currentPosition = null;
      return;
    }

    const landmarks = results.multiFaceLandmarks[0];
    facetracker.currentPosition = landmarks;

    // elegant, balanced mesh lines — visible but not harsh
    drawConnectors(ctx, landmarks, FACEMESH_TESSELATION,
      { color: 'rgba(255, 255, 255, 0.4)', lineWidth: 0.4 });

    // enhance facial structure subtly
    drawConnectors(ctx, landmarks, FACEMESH_FACE_OVAL,
      { color: 'rgba(255, 255, 255, 0.5)', lineWidth: 0.5 });
    drawConnectors(ctx, landmarks, FACEMESH_LIPS,
      { color: 'rgba(255, 255, 255, 0.25)', lineWidth: 0.4 });

    // make eyes pop clearly without oversaturation
    drawConnectors(ctx, landmarks, FACEMESH_LEFT_EYE,
      { color: 'rgba(0, 255, 100, 0.6)', lineWidth: 0.9 });
    drawConnectors(ctx, landmarks, FACEMESH_RIGHT_EYE,
      { color: 'rgba(255, 80, 80, 0.6)', lineWidth: 0.9 });



    // Get iris centers (more stable for gaze)
    const LEFT_IRIS = [468, 469, 470, 471, 472];
    const RIGHT_IRIS = [473, 474, 475, 476, 477];

    function irisCenter(indices) {
      let x = 0,
        y = 0;
      for (const i of indices) {
        x += landmarks[i].x;
        y += landmarks[i].y;
      }
      return { x: x / indices.length, y: y / indices.length };
    }

    const left = irisCenter(LEFT_IRIS);
    const right = irisCenter(RIGHT_IRIS);

    const eyeCenterX = (left.x + right.x) / 2;
    const eyeCenterY = (left.y + right.y) / 2;
    const eyeWidth = Math.abs(right.x - left.x) * video.videoWidth * 1.5;
    const eyeHeight = eyeWidth * 0.6;


    const cropX = eyeCenterX * video.videoWidth - eyeWidth / 2;
    const cropY = eyeCenterY * video.videoHeight - eyeHeight / 2;

    facetracker.currentEyeRect = [cropX, cropY, eyeWidth, eyeHeight];

    // Draw red bounding box on overlay
    // ctx.strokeStyle = "red";
    // ctx.lineWidth = 2;
    // ctx.strokeRect(cropX, cropY, eyeWidth, eyeHeight);

    // Draw eye crop into #eyes canvas
    eyesCtx.drawImage(
      video,
      cropX,
      cropY,
      eyeWidth,
      eyeHeight,
      0,
      0,
      eyesCanvas.width,
      eyesCanvas.height
    );

    ui.onFoundFace();
  }

  // =====================================================
  // Video setup (same as before)
  // =====================================================

  if (navigator.mediaDevices) {
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then(facetracker.gumSuccess)
      .then(initFaceMesh)
      .catch(facetracker.gumFail);
  } else if (navigator.getUserMedia) {
    navigator.getUserMedia(
      { video: true },
      (stream) => {
        facetracker.gumSuccess(stream);
        initFaceMesh();
      },
      facetracker.gumFail
    );
  } else {
    ui.showInfo(
      "Your browser does not seem to support getUserMedia. 😭 This will probably only work in Chrome or Firefox.",
      true
    );
  }
});
