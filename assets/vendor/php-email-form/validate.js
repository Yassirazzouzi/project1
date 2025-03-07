(function () {
  "use strict";
  
  let forms = document.querySelectorAll('.php-email-form');
  
  forms.forEach(function (e) {
    e.addEventListener('submit', function (event) {
      event.preventDefault();
      
      let thisForm = this;
      let action = thisForm.getAttribute('action');
      
      if (!action) {
        displayError(thisForm, 'The form action property is not set!');
        return;
      }
      
      thisForm.querySelector('.loading').classList.add('d-block');
      thisForm.querySelector('.error-message').classList.remove('d-block');
      thisForm.querySelector('.sent-message').classList.remove('d-block');
      
      let formData = new FormData(thisForm);
      
      // Si reCaptcha est utilisé
      let recaptcha = thisForm.getAttribute('data-recaptcha-site-key');
      
      if (recaptcha) {
        if (typeof grecaptcha !== "undefined") {  // Changed from recaptcha to grecaptcha - the correct global object
          grecaptcha.ready(function () {
            grecaptcha.execute(recaptcha, { action: 'php_email_form_submit' })
              .then(token => {
                formData.set('recaptcha-response', token);
                php_email_form_submit(thisForm, action, formData);
              })
              .catch(error => {
                displayError(thisForm, 'reCaptcha error: ' + error.message);
              });
          });
        } else {
          displayError(thisForm, 'The reCaptcha JavaScript API url is not loaded!');
        }
      } else {
        php_email_form_submit(thisForm, action, formData);
      }
    });
  });
  
  function php_email_form_submit(thisForm, action, formData) {
    fetch(action, {
      method: 'POST',
      body: formData,
      headers: { 'X-Requested-With': 'XMLHttpRequest' }
    })
      .then(response => {
        if (response.ok) {
          return response.text();
        } else {
          throw new Error(`${response.status} ${response.statusText} ${response.url}`);
        }
      })
      .then(data => {
        thisForm.querySelector('.loading').classList.remove('d-block');
        if (data.trim() === 'ok') {  // Changed == to === for stricter comparison
          thisForm.querySelector('.sent-message').classList.add('d-block');
          thisForm.reset();
        } else {
          throw new Error('Form submission failed and no error message returned from: ' + action);
        }
      })
      .catch((error) => {
        displayError(thisForm, error.message || 'An unknown error occurred');
      });
  }
  
  // Fixed secure version of displayError
  function displayError(thisForm, error) {
    thisForm.querySelector('.loading').classList.remove('d-block');
    
    // Use textContent instead of innerHTML to prevent XSS
    const errorElement = thisForm.querySelector('.error-message');
    errorElement.textContent = error;
    errorElement.classList.add('d-block');
  }
})();