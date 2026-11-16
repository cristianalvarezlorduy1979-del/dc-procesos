// ==========================================================================
// GOOGLE reCAPTCHA v3 (PROTECCIÓN INTELIGENTE INVISIBLE NO BLOQUEANTE)
// ==========================================================================
export const RECAPTCHA_SITE_KEY = '6LcBDRQuAAAAANfXf6euPklvVkXs6nxYszlE9obm';

export function executeRecaptcha(action = 'login') {
  return new Promise((resolve) => {
    let finished = false;

    // Temporizador de seguridad de 500ms para NUNCA congelar ni bloquear el acceso
    const safetyTimer = setTimeout(() => {
      if (!finished) {
        finished = true;
        console.warn(`[reCAPTCHA v3] Verificación silenciosa en segundo plano (${action}). Continuando acceso.`);
        resolve(null);
      }
    }, 500);

    if (typeof window === 'undefined') {
      if (!finished) {
        finished = true;
        clearTimeout(safetyTimer);
        resolve(null);
      }
      return;
    }

    const grecaptcha = window.grecaptcha;
    if (!grecaptcha || typeof grecaptcha.execute !== 'function' || !RECAPTCHA_SITE_KEY) {
      if (!finished) {
        finished = true;
        clearTimeout(safetyTimer);
        resolve(null);
      }
      return;
    }

    try {
      grecaptcha.ready(() => {
        try {
          grecaptcha
            .execute(RECAPTCHA_SITE_KEY, { action })
            .then((token) => {
              if (!finished) {
                finished = true;
                clearTimeout(safetyTimer);
                console.log(`[reCAPTCHA v3] Token verificado con éxito para "${action}".`);
                resolve(token);
              }
            })
            .catch((err) => {
              if (!finished) {
                finished = true;
                clearTimeout(safetyTimer);
                console.warn('[reCAPTCHA v3] Aviso al obtener token:', err);
                resolve(null);
              }
            });
        } catch (innerErr) {
          if (!finished) {
            finished = true;
            clearTimeout(safetyTimer);
            console.warn('[reCAPTCHA v3] Error al invocar execute:', innerErr);
            resolve(null);
          }
        }
      });
    } catch (err) {
      if (!finished) {
        finished = true;
        clearTimeout(safetyTimer);
        console.warn('[reCAPTCHA v3] Excepción al invocar ready:', err);
        resolve(null);
      }
    }
  });
}
