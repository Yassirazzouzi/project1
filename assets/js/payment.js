document.addEventListener('DOMContentLoaded', function() {
  // Fonction pour remplir les champs cachés avec les détails du plan
  function populatePlanDetails() {
      const urlParams = new URLSearchParams(window.location.search);
      const plan = urlParams.get('plan') || 'Default Plan';
      const price = urlParams.get('price') || '0.00';
      const duration = urlParams.get('duration') || '1 month';

      document.querySelector('input[name="plan"]').value = plan;
      document.querySelector('input[name="price"]').value = price;
      document.querySelector('input[name="duration"]').value = duration;

      // Mettre à jour le résumé de la commande
      document.getElementById('order-plan').textContent = plan;
      document.getElementById('order-price').textContent = `$${price}`;
      document.getElementById('order-total').textContent = `$${price}`;
  }

  // Appeler la fonction au chargement de la page
  populatePlanDetails();

  // Configuration du bouton PayPal
  paypal.Buttons({
      createOrder: function(data, actions) {
          const price = document.querySelector('input[name="price"]').value;
          return actions.order.create({
              purchase_units: [{
                  amount: {
                      value: price
                  }
              }]
          });
      },
      onApprove: function(data, actions) {
          return actions.order.capture().then(function(orderDetails) {
              // Valider les champs du formulaire avant soumission
              const form = document.getElementById('payment-form');
              const requiredFields = form.querySelectorAll('[required]');
              let isValid = true;

              requiredFields.forEach(field => {
                  if (!field.value.trim()) {
                      isValid = false;
                      displayError('Veuillez remplir tous les champs obligatoires.');
                  }
              });

              if (!isValid) return;

              // Préparer les données du formulaire
              const formData = new FormData(form);
              formData.append('payment_id', orderDetails.id);
              formData.append('payment_status', orderDetails.status);
              formData.append('payer_email', orderDetails.payer.email_address);

              // Envoyer les données au serveur
              fetch('assets/php/register.php', {
                  method: 'POST',
                  body: formData
              })
              .then(response => response.json())
              .then(result => {
                  if (result.success) {
                      alert('Paiement réussi et inscription enregistrée!');
                      window.location.href = 'thank-you.html';
                  } else {
                      displayError('Erreur lors de l\'enregistrement: ' + result.message);
                  }
              })
              .catch(error => {
                  displayError('Une erreur s\'est produite. Veuillez réessayer.');
                  console.error('Erreur:', error);
              });
          });
      },
      onError: function(err) {
          displayError('Erreur de paiement: ' + err);
      }
  }).render('#paypal-button-container');

  // Fonction pour afficher les erreurs
  function displayError(message) {
      const errorDiv = document.getElementById('error-message');
      errorDiv.textContent = message;
      errorDiv.style.display = 'block';
  }
});