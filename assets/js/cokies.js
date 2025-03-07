// const cookieConsent = {
  
//   elements: {
//     banner: document.getElementById('cookies'),
//     form: document.getElementById('cookie-form'),
//     acceptAllBtn: document.getElementById('accept-cookies'),
//     rejectAllBtn: document.getElementById('reject-cookies'),
//     essentialCheckbox: document.getElementById('essential-cookies')
//   },

//   // Cookie management functions
//   setCookie: (name, value, days) => {
//     const date = new Date();
//     date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
//     const expires = `expires=${date.toUTCString()}`;
//     document.cookie = `${name}=${value};${expires};path=/;SameSite=Strict`;
//   },

//   getCookie: (name) => {
//     const nameEQ = `${name}=`;
//     const cookies = document.cookie.split(';');
//     for (let i = 0; i < cookies.length; i++) {
//       let cookie = cookies[i];
//       while (cookie.charAt(0) === ' ') {
//         cookie = cookie.substring(1);
//       }
//       if (cookie.indexOf(nameEQ) === 0) {
//         return cookie.substring(nameEQ.length);
//       }
//     }
//     return null;
//   },

//   // Parse JSON cookie safely
//   getJsonCookie: (name) => {
//     const cookie = cookieConsent.getCookie(name);
//     if (!cookie) return null;
//     try {
//       return JSON.parse(cookie);
//     } catch (e) {
//       console.error('Error parsing cookie:', e);
//       return null;
//     }
//   },

//   // Save consent preferences locally
//   saveConsent: (accepted) => {
//     // Essential cookies are always required
//     const consentData = {
//       essential: true,
     
//     };
    
//     // Save consent data to cookies
//     cookieConsent.setCookie('cookies-consent', JSON.stringify(consentData), 365);
//     cookieConsent.setCookie('cookies-banner-hidden', accepted ? 'true' : 'accepted-required', 365);
    
//     // Update UI
//     cookieConsent.updateBannerVisibility();
    
//     // Optional: Send to server for server-side storage (if needed)
//     fetch('save-cookie-preferences.php', {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//       },
//       body: JSON.stringify({
//         accepted: accepted,
//         consentData: consentData
//       })
//     })
//     .then(response => response.json())
//     .then(data => console.log('Server response:', data))
//     .catch(error => console.error('Error sending consent to server:', error));
    
//     // Log for debugging
//     console.log(`Cookies ${accepted ? 'accepted' : 'rejected'}, consent saved:`, consentData);
    
//     // Trigger event for potential analytics or other scripts
//     document.dispatchEvent(new CustomEvent('cookieConsentUpdated', { 
//       detail: { accepted, consentData } 
//     }));
//   },

//   // Check and update banner visibility
//   updateBannerVisibility: () => {
//     const bannerState = cookieConsent.getCookie('cookies-banner-hidden');
    
//     if (!bannerState) {
//       // No decision made yet, show banner
//       if (cookieConsent.elements.banner) {
//         cookieConsent.elements.banner.style.display = 'block';
//       }
//     } else if (bannerState === 'true' || bannerState === 'accepted-required') {
//       // User made a choice, hide banner
//       if (cookieConsent.elements.banner) {
//         cookieConsent.elements.banner.style.display = 'none';
//       }
//     }
//   },

//   // Initialize the cookie consent system
//   init: () => {
//     // Wait for DOM to be fully loaded
//     if (document.readyState === 'loading') {
//       document.addEventListener('DOMContentLoaded', cookieConsent.initAfterDOMLoaded);
//     } else {
//       cookieConsent.initAfterDOMLoaded();
//     }
//   },
  
//   initAfterDOMLoaded: () => {
//     // Refresh element references (in case DOM wasn't ready at script load time)
//     cookieConsent.elements = {
//       banner: document.getElementById('cookies'),
//       form: document.getElementById('cookie-form'),
//       acceptAllBtn: document.getElementById('accept-cookies'),
//       rejectAllBtn: document.getElementById('reject-cookies'),
//       essentialCheckbox: document.getElementById('essential-cookies')
//     };
    
//     // Skip if elements aren't found
//     if (!cookieConsent.elements.banner) {
//       console.warn('Cookie banner elements not found');
//       return;
//     }
    
//     // Set essential cookies as checked and disabled (can't be unchecked)
//     if (cookieConsent.elements.essentialCheckbox) {
//       cookieConsent.elements.essentialCheckbox.checked = true;
//       cookieConsent.elements.essentialCheckbox.disabled = true;
//     }
    
//     // Set up event listeners
//     if (cookieConsent.elements.acceptAllBtn) {
//       cookieConsent.elements.acceptAllBtn.addEventListener('click', () => {
//         cookieConsent.saveConsent(true);
//       });
//     }
    
//     if (cookieConsent.elements.rejectAllBtn) {
//       cookieConsent.elements.rejectAllBtn.addEventListener('click', () => {
//         cookieConsent.saveConsent(false);
//       });
//     }
    
//     // Check if banner should be shown
//     cookieConsent.updateBannerVisibility();
//   }
// };

// // Initialize the system
// cookieConsent.init();



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