const cookieConsent = {
  elements: {
    banner: document.getElementById('cookies'),
    acceptAllBtn: document.getElementById('accept-cookies'),
    rejectAllBtn: document.getElementById('reject-cookies')
  },

  // Fonction pour obtenir un cookie par son nom
  getCookie: (name) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
  },

  // Vérifier si le consentement a déjà été donné
  checkConsentStatus: () => {
    const consentCookie = cookieConsent.getCookie('cookies-consent');
    
    // Si le cookie de consentement existe, masquer la bannière
    if (consentCookie) {
      try {
        const consentData = JSON.parse(decodeURIComponent(consentCookie));
        
        // Masquer la bannière si le consentement a été donné
        if (consentData && cookieConsent.elements.banner) {
          cookieConsent.elements.banner.style.display = 'none';
          return true;
        }
      } catch (error) {
        console.error('Erreur de parsing du cookie de consentement', error);
      }
    }
    
    // Afficher la bannière si aucun consentement n'a été trouvé
    if (cookieConsent.elements.banner) {
      cookieConsent.elements.banner.style.display = 'block';
    }
    
    return false;
  },

  // Gérer l'enregistrement des cookies
  saveConsent: (accepted) => {
    // Données de consentement
    const consentData = { 
      essential: true,
      analytics: accepted,
      marketing: accepted,
      timestamp: new Date().toISOString()
    };

    // Enregistrement du cookie côté client
    const cookieOptions = {
      path: '/',
      maxAge: 365 * 24 * 60 * 60, // 1 an
      sameSite: 'Strict'
    };

    // Sérialisation sécurisée
    const serializedConsent = JSON.stringify(consentData);
    document.cookie = `cookies-consent=${encodeURIComponent(serializedConsent)}; path=${cookieOptions.path}; max-age=${cookieOptions.maxAge}; SameSite=${cookieOptions.sameSite}`;
    
    // Envoi des données au serveur
    fetch('assets/php/save-cookie-preferences.php', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ 
        accepted, 
        consentData 
      })
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Erreur réseau');
      }
      return response.json();
    })
    .then(data => {
      console.log('Réponse serveur :', data);
      
      // Masquer la bannière
      if (cookieConsent.elements.banner) {
        cookieConsent.elements.banner.style.display = 'none';
      }
    })
    .catch(error => {
      console.error('Erreur envoi consentement :', error);
    });
  },

  // Initialisation du système de consentement
  init: () => {
    // Vérifier le statut du consentement lors du chargement
    const consentAlreadyGiven = cookieConsent.checkConsentStatus();

    // Ajouter les écouteurs d'événements uniquement si le consentement n'a pas été donné
    if (!consentAlreadyGiven) {
      if (cookieConsent.elements.acceptAllBtn && cookieConsent.elements.rejectAllBtn) {
        cookieConsent.elements.acceptAllBtn.addEventListener('click', () => cookieConsent.saveConsent(true));
        cookieConsent.elements.rejectAllBtn.addEventListener('click', () => cookieConsent.saveConsent(false));
      } else {
        console.warn('Éléments de consentement de cookies introuvables');
      }
    }
  }
};

// Initialisation une fois le DOM chargé
document.addEventListener('DOMContentLoaded', cookieConsent.init);