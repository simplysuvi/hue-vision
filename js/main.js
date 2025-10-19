const tracking = {
  active: false,
  interval: null,

  start: function() {
    dataset.clearSession();
    this.active = true;
    $('#start-tracking').prop('disabled', true);
    $('#stop-tracking').prop('disabled', false);
    $('#draw-heatmap').prop('disabled', true);
  },

  stop: function() {
    this.active = false;
    $('#start-tracking').prop('disabled', false);
    $('#stop-tracking').prop('disabled', true);
    $('#draw-heatmap').prop('disabled', false);
  },
};

$(document).ready(function() {
  const $target = $('#target');
  const targetSize = $target.outerWidth();

  function moveTarget() {
    // Move the model target to where we predict the user is looking to
    if (training.currentModel == null || training.inTraining || !tracking.active) {
      return;
    }

    training.getPrediction().then(prediction => {
      dataset.session.n += 1;
      dataset.session.x.push(prediction[0]);
      dataset.session.y.push(prediction[1]);

      const left = prediction[0] * ($('body').width() - targetSize);
      const top = prediction[1] * ($('body').height() - targetSize);

      $target.css('left', left + 'px');
      $target.css('top', top + 'px');
    });
  }

  setInterval(moveTarget, 100);

  function download(content, fileName, contentType) {
    const a = document.createElement('a');
    const file = new Blob([content], {
      type: contentType,
    });
    a.href = URL.createObjectURL(file);
    a.download = fileName;
    a.click();
  }

  // Map functions to keys and buttons:

  $('body').keyup(function(e) {
    // Escape key - Close help modal
    if (e.keyCode === 27) {
      ui.hideHelp();
      e.preventDefault();
      return false;
    }

    // Space key - Capture example
    if (e.keyCode === 32 && ui.readyToCollect) {
      dataset.captureExample();
      e.preventDefault();
      return false;
    }
    
    // A key - Toggle auto-collection
    if (e.keyCode === 65 && ui.readyToCollect) { // 'A' key
      ui.toggleAutoCollect();
      e.preventDefault();
      return false;
    }
    
    // C key - Start calibration mode
    if (e.keyCode === 67 && ui.readyToCollect) { // 'C' key
      ui.startCalibration();
      e.preventDefault();
      return false;
    }
    
    // T key - Start training
    if (e.keyCode === 84 && !$('#start-training').prop('disabled')) { // 'T' key
      training.fitModel();
      e.preventDefault();
      return false;
    }
    
    // H key - Toggle heatmap
    if (e.keyCode === 72 && !$('#draw-heatmap').prop('disabled')) { // 'H' key
      if ($('#heatMap').css('opacity') === '0') {
        heatmap.drawHeatmap(dataset, training.currentModel);
      } else {
        heatmap.clearHeatmap();
      }
      e.preventDefault();
      return false;
    }
    
    // R key - Reset model
    if (e.keyCode === 82 && !$('#reset-model').prop('disabled')) { // 'R' key
      training.resetModel();
      e.preventDefault();
      return false;
    }
    
    // ? key - Show help
    if (e.keyCode === 191 && e.shiftKey) { // '?' key (Shift + /)
      ui.displayHelp();
      e.preventDefault();
      return false;
    }
  });

  $('#start-calibration').click(function(e) {
    ui.startCalibration();
  });

  $('#start-training').click(function(e) {
    training.fitModel();
  });

  $('#start-tracking').click(function(e) {
    tracking.start();
  });

  $('#stop-tracking').click(function(e) {
    tracking.stop();
  });

  $('#reset-model').click(function(e) {
    training.resetModel();
  });

  $('#draw-heatmap').click(function(e) {
    ui.showPhase('heatmap');
    heatmap.drawHeatmap(dataset);
  });

  $('#clear-heatmap').click(function(e) {
    heatmap.clearHeatmap();
  });

  $('#store-data').click(function(e) {
    const data = dataset.toJSON();
    const json = JSON.stringify(data);
    download(json, 'dataset.json', 'text/plain');
  });

  $('#load-data').click(function(e) {
    $('#data-uploader').trigger('click');
  });

  $('#data-uploader').change(function(e) {
    const file = e.target.files[0];
    const reader = new FileReader();

    reader.onload = function() {
      const data = reader.result;
      const json = JSON.parse(data);
      dataset.fromJSON(json);
    };

    reader.readAsBinaryString(file);
  });

  $('#store-model').click(async function(e) {
    await training.currentModel.save('downloads://model');
  });

  $('#load-model').click(function(e) {
    $('#model-uploader').trigger('click');
  });

  $('#model-uploader').change(async function(e) {
    const files = e.target.files;
    training.currentModel = await tf.loadLayersModel(
      tf.io.browserFiles([files[0], files[1]]),
    );
    ui.onFinishTraining();
  });
  
  // Help button event handler
  $('#help-button').click(function() {
    ui.displayHelp();
  });
  
  // Target customization
  $('#customize-target').click(function() {
    $('#settings-panel').removeClass('hidden');
  });
  
  $('#close-settings').click(function() {
    $('#settings-panel').addClass('hidden');
  });
  
  // Target size slider
  $('#target-size').on('input', function() {
    const size = $(this).val();
    $('#target').css({
      width: size + 'px',
      height: size + 'px'
    });
  });
  
  // Target color selector
  $('#target-color').change(function() {
    const color = $(this).val();
    
    // Remove all color classes
    $('#target').removeClass('color-default color-blue color-green color-purple color-red');
    
    // Add selected color class
    if (color !== 'default') {
      $('#target').addClass('color-' + color);
    } else {
      // Default gradient is already in the base CSS
      $('#target').css('background', 'linear-gradient(135deg, #f9a66c, #f27121)');
    }
  });
  
  // Target shape selector
  $('#target-shape').change(function() {
    const shape = $(this).val();
    
    // Remove all shape classes
    $('#target').removeClass('target-circle target-square target-triangle target-star');
    
    // Reset any custom styles that might have been applied
    $('#target').css({
      'clip-path': '',
      'border-radius': '',
      'width': $('#target-size').val() + 'px',
      'height': $('#target-size').val() + 'px',
      'border-left': '',
      'border-right': '',
      'border-bottom': ''
    });
    
    // Add selected shape class
    if (shape !== 'circle') {
      $('#target').addClass('target-' + shape);
      
      // Special handling for triangle
      if (shape === 'triangle') {
        const size = $('#target-size').val();
        const halfSize = size / 2;
        
        $('#target').css({
          'border-left': halfSize + 'px solid transparent',
          'border-right': halfSize + 'px solid transparent',
          'border-bottom': size + 'px solid',
          'border-bottom-color': $('#target').css('background-color')
        });
      }
    } else {
      // Circle is default
      $('#target').css('border-radius', '50%');
    }
  });
});
