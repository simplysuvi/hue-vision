window.ui = {
  state: 'loading',
  phase: 'training', // training, session, heatmap
  readyToCollect: false,
  nExamples: 0,
  nTrainings: 0,
  autoCollectMode: false,
  autoCollectInterval: null,
  calibrationMode: false,
  calibrationPoints: [],
  currentCalibrationPoint: 0,
  calibrationInterval: null,

  setContent: function(key, value) {
    // Set an element's content based on the data-content key.
    $('[data-content="' + key + '"]').html(value);
  },

  showInfo: function(text, dontFlash) {
    // Show info and beep / flash.
    this.setContent('info', text);
    if (!dontFlash) {
      $('#info').addClass('flash');
      new Audio('hint.mp3').play();
      setTimeout(function() {
        $('#info').removeClass('flash');
      }, 1000);
    }
  },

  onWebcamEnabled: function() {
    this.state = 'finding face';
    this.showInfo("Thanks! Now let's detect your face!", true);
  },

  onFoundFace: function() {
    this.setContent('face-detected', 'Yes');
    $('[data-content="face-detected"]').addClass('detected');
    this.readyToCollect = true;
    $('#start-calibration').prop('disabled', false);
    if (dataset.train.n >= 2) {
      $('#start-training').prop('disabled', false);
    }
    if (this.state == 'finding face') {
      this.state = 'collecting';
      this.showInfo(
        "<h3>Let's start!</h3>" +
          'Collect data points by moving your mouse and following the cursor with your eyes and hitting the space key repeatedly.<br><br>' +
          'You can also toggle automatic collection mode by pressing "A" on your keyboard.',
        true,
      );
    }
  },

  onFaceNotFound: function() {
    this.setContent('face-detected', 'No');
    $('[data-content="face-detected"]').removeClass('detected');
    this.readyToCollect = false;
    $('#start-calibration').prop('disabled', true);
    $('#start-training').prop('disabled', true);
  },
  
  toggleAutoCollect: function() {
    this.autoCollectMode = !this.autoCollectMode;
    
    if (this.autoCollectMode) {
      // Start auto-collection
      this.showInfo(
        '<h3>Auto-collection enabled</h3>' +
        'Move your cursor around and follow it with your eyes. Samples will be collected automatically every 1.5 seconds.<br><br>' +
        'Press "A" again to disable auto-collection.',
        true
      );
      
      this.autoCollectInterval = setInterval(function() {
        if (ui.readyToCollect && facetracker.currentPosition) {
          dataset.captureExample();
        }
      }, 1500);
    } else {
      // Stop auto-collection
      clearInterval(this.autoCollectInterval);
      this.showInfo(
        '<h3>Auto-collection disabled</h3>' +
        'Switched back to manual collection. Press space to collect samples.',
        true
      );
    }
  },

  onAddExample: function(nTrain, nVal) {
    // Call this when an example is added.
    this.nExamples = nTrain + nVal;
    this.setContent('n-train', nTrain);
    this.setContent('n-val', nVal);
    if (nTrain >= 2) {
      $('#start-training').prop('disabled', false);
    }
    if (this.state == 'collecting' && this.nExamples == 5) {
      this.showInfo(
        '<h3>Keep going!</h3>' +
          'You need to collect at least 20 data points to start seeing results.',
      );
    }
    if (this.state == 'collecting' && this.nExamples == 25) {
      this.showInfo(
        '<h3>Great job! 👌</h3>' +
          "Now that you have a handful of samples, let's train the machine learning model!<br><br> " +
          'Hit the Start Training button in the top right corner!',
      );
    }
    if (this.state == 'trained' && this.nExamples == 50) {
      this.showInfo(
        '<h3>Fantastic! 👏</h3>' +
          "You've collected lots of data points. Let's try training our model again!",
      );
    }
    if (nTrain > 0 && nVal > 0) {
      $('#store-data').prop('disabled', false);
    }
  },

  onFinishTraining: function() {
    // Call this when training is finished.
    this.nTrainings += 1;
    $('#target').css('opacity', '0.9');
    $('#start-session').prop('disabled', false);
    $('#customize-target').prop('disabled', false);
    $('#reset-model').prop('disabled', false);
    $('#store-model').prop('disabled', false);
    $('#training-progress').hide();

    if (this.nTrainings == 1) {
      this.state = 'trained';
      this.showInfo(
        '<h3>Awesome!</h3>' +
          'The model has been trained. Click the "Start Session" button to begin eye tracking.<br>' +
          "You can continue to collect more data and retrain the model to improve accuracy.",
      );
    } else if (this.nTrainings == 2) {
      this.state = 'trained_twice';
      this.showInfo(
        '<h3>Getting better! 🚀</h3>' +
          'Keep collecting and retraining!<br>' +
          'You can also draw a heatmap that shows you where your ' +
          'model has its strong and weak points.',
      );
    } else if (this.nTrainings == 3) {
      this.state = 'trained_thrice';
      this.showInfo(
        'If your model is overfitting, remember you can reset it anytime.',
      );
    } else if (this.nTrainings == 4) {
      this.state = 'trained_thrice';
      this.showInfo(
        '<h3>Have fun!</h3>' +
          'Check this space for more! 😄',
      );
    }
  },

  showPhase: function(phase) {
    this.phase = phase;
    $('#training-phase').addClass('hidden');
    $('#session-phase').addClass('hidden');
    $('#heatmap-phase').addClass('hidden');
    $('#' + phase + '-phase').removeClass('hidden');
  },

  initSessionControls: function() {
    $('#start-session').click(() => {
      this.showPhase('session');
    });

    $('#new-session').click(() => {
      this.showPhase('session');
      heatmap.clearHeatmap();
    });

    $('#retrain-model').click(() => {
      this.showPhase('training');
      heatmap.clearHeatmap();
    });
  },
  
  showTrainingProgress: function(epoch, totalEpochs, loss, valLoss) {
    if (!$('#training-progress').length) {
      $('body').append('<div id="training-progress"></div>');
      $('#training-progress').css({
        position: 'fixed',
        bottom: '60px',
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'white',
        padding: '15px',
        borderRadius: '10px',
        boxShadow: '0 4px 24px rgba(0, 0, 0, 0.1)',
        zIndex: 1000,
        textAlign: 'center',
        width: '300px'
      });
    }
    
    const percent = Math.round((epoch / totalEpochs) * 100);
    $('#training-progress').html(`
      <div>Training Progress: ${epoch}/${totalEpochs} epochs (${percent}%)</div>
      <div style="background: #f0f0f0; height: 10px; border-radius: 5px; margin: 10px 0;">
        <div style="background: linear-gradient(135deg, #f9a66c, #f27121); width: ${percent}%; height: 100%; border-radius: 5px;"></div>
      </div>
      <div>Loss: ${loss.toFixed(5)} | Validation Loss: ${valLoss.toFixed(5)}</div>
    `);
    
    $('#training-progress').show();
  },
  
  displayHelp: function() {
    const helpContent =
      '<button id="close-help" class="icon-button">×</button>' +
      '<h3>Keyboard Shortcuts</h3>' +
      '<ul style="list-style-type: none; padding-left: 0;">' +
      '<li><strong>Space</strong> - Capture training sample</li>' +
      '<li><strong>A</strong> - Toggle automatic data collection</li>' +
      '<li><strong>C</strong> - Start calibration mode</li>' +
      '<li><strong>T</strong> - Start training (when enabled)</li>' +
      '<li><strong>H</strong> - Toggle heatmap (when enabled)</li>' +
      '<li><strong>R</strong> - Reset model (when enabled)</li>' +
      '<li><strong>?</strong> - Show this help</li>' +
      '</ul>' +
      '<h3>Features</h3>' +
      '<ul style="list-style-type: none; padding-left: 0;">' +
      '<li><strong>Calibration</strong> - Guided data collection at specific points</li>' +
      '<li><strong>Auto-collection</strong> - Automatically collect samples while you look around</li>' +
      '<li><strong>Target Customization</strong> - Change the size, color, and shape of the target</li>' +
      '<li><strong>Heatmap</strong> - Visualize model accuracy across the screen</li>' +
      '</ul>';

    $('#help-modal').html(helpContent);
    $('#modal-overlay, #help-modal').removeClass('hidden');

    $('#close-help').click(function() {
      ui.hideHelp();
    });
  },

  hideHelp: function() {
    $('#modal-overlay, #help-modal').addClass('hidden');
  },
  
  startCalibration: function() {
    if (!this.readyToCollect || this.calibrationMode) {
      return;
    }
    
    // Stop auto collection if it's running
    if (this.autoCollectMode) {
      this.toggleAutoCollect();
    }
    
    this.calibrationMode = true;
    
    // Define calibration points (9-point calibration)
    const width = $('body').width();
    const height = $('body').height();
    const padding = 100; // Padding from edges
    
    this.calibrationPoints = [
      { x: padding, y: padding }, // Top-left
      { x: width / 2, y: padding }, // Top-center
      { x: width - padding, y: padding }, // Top-right
      { x: padding, y: height / 2 }, // Middle-left
      { x: width / 2, y: height / 2 }, // Center
      { x: width - padding, y: height / 2 }, // Middle-right
      { x: padding, y: height - padding }, // Bottom-left
      { x: width / 2, y: height - padding }, // Bottom-center
      { x: width - padding, y: height - padding } // Bottom-right
    ];
    
    this.currentCalibrationPoint = 0;
    
    // Create calibration target if it doesn't exist
    if (!$('#calibration-target').length) {
      $('body').append('<div id="calibration-target"></div>');
      $('#calibration-target').css({
        position: 'absolute',
        width: '20px',
        height: '20px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(249,166,108,1) 0%, rgba(242,113,33,1) 70%)',
        border: '2px solid white',
        boxShadow: '0 0 10px rgba(0,0,0,0.2)',
        transform: 'translate(-50%, -50%)',
        zIndex: 1000,
        display: 'none'
      });
    }
    
    // Create calibration instructions
    if (!$('#calibration-instructions').length) {
      $('body').append('<div id="calibration-instructions"></div>');
      $('#calibration-instructions').css({
        position: 'fixed',
        bottom: '120px',
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'white',
        padding: '15px',
        borderRadius: '10px',
        boxShadow: '0 4px 24px rgba(0,0,0,0.1)',
        zIndex: 1000,
        textAlign: 'center',
        width: '400px',
        fontSize: '16px'
      });
    }
    
    this.showInfo(
      '<h3>Calibration Mode</h3>' +
      'Follow the orange dot with your eyes as it moves around the screen.<br><br>' +
      'The system will automatically collect samples at each position.',
      true
    );
    
    // Show first calibration point
    this.showCalibrationPoint();
    
    // Start calibration sequence
    this.calibrationInterval = setInterval(() => {
      // Collect sample at current point
      if (facetracker.currentPosition) {
        // Manually set mouse position to current calibration point
        const point = this.calibrationPoints[this.currentCalibrationPoint];
        mouse.mousePosX = point.x / $('body').width();
        mouse.mousePosY = point.y / $('body').height();
        
        // Capture example
        dataset.captureExample();
        
        // Move to next point
        this.currentCalibrationPoint++;
        
        // Update progress
        $('#calibration-instructions').html(
          `Calibration progress: ${this.currentCalibrationPoint} of ${this.calibrationPoints.length} points`
        );
        
        // Check if calibration is complete
        if (this.currentCalibrationPoint >= this.calibrationPoints.length) {
          this.stopCalibration();
          return;
        }
        
        // Show next point
        this.showCalibrationPoint();
      }
    }, 2000); // 2 seconds per point
  },
  
  showCalibrationPoint: function() {
    const point = this.calibrationPoints[this.currentCalibrationPoint];
    $('#calibration-target').css({
      left: point.x + 'px',
      top: point.y + 'px',
      display: 'block'
    });
    
    // Animate the target to draw attention
    $('#calibration-target').animate({
      width: '30px',
      height: '30px'
    }, 500, function() {
      $(this).animate({
        width: '20px',
        height: '20px'
      }, 500);
    });
  },
  
  stopCalibration: function() {
    clearInterval(this.calibrationInterval);
    this.calibrationMode = false;
    
    // Hide calibration elements
    $('#calibration-target').hide();
    $('#calibration-instructions').hide();
    
    this.showInfo(
      '<h3>Calibration Complete!</h3>' +
      `Collected ${this.calibrationPoints.length} calibration points.<br><br>` +
      'Now you can train the model by clicking the "Start Training" button.',
      true
    );
    
    // Enable training if we have enough samples
    if (dataset.train.n >= 2) {
      $('#start-training').prop('disabled', false);
    }
  }
};

$(document).ready(function() {
  ui.initSessionControls();
});
