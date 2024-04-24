window.ui = {
  state: 'loading',
  readyToCollect: false,
  nExamples: 0,
  nTrainings: 0,

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
    if (this.state == 'finding face') {
      this.state = 'collecting';
      this.readyToCollect = true;
      this.showInfo(
        "<h3>Let's start!</h3>" +
          'Collect data points by moving your mouse and following the cursor with your eyes and hitting the space key repeatedly in a simultaneous manner.',
        true,
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
          "Now that you have a handful of samples, let's train the machine learning model!<br> " +
          'Hit the `Start Training` button in the top right corner!',
      );
    }
    if (this.state == 'trained' && this.nExamples == 50) {
      this.showInfo(
        '<h3>Fantastic! 👏</h3>' +
          "You've collected lots of data points. Let's try training our baby model again!",
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
    $('#draw-heatmap').prop('disabled', false);
    $('#reset-model').prop('disabled', false);
    $('#store-model').prop('disabled', false);

    if (this.nTrainings == 1) {
      this.state = 'trained';
      this.showInfo(
        '<h3>Awesome! 😍</h3>' +
          'The green circle should start following your eyes around.<br>' +
          "The accuracy may not be the best initially. The more you train the model, the better the accuracy. 😅<br>" +
          "Let's collect more training data! Keep following the mouse cursor and hitting space.",
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
        'If your model is overfitting, remember you can reset it anytime 👻',
      );
    } else if (this.nTrainings == 4) {
      this.state = 'trained_thrice';
      this.showInfo(
        '<h3>Have fun!</h3>' +
          'Check this space for more! 😄',
      );
    }
  },
};
