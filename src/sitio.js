import '@fontsource-variable/inter';
import './styles.css';
import { CONTACTO } from './config.js';

const wa = `https://wa.me/${CONTACTO.whatsapp}?text=${encodeURIComponent(CONTACTO.mensajeWhatsapp)}`;

document.querySelectorAll('[data-whatsapp]').forEach((el) => {
  el.href = wa;
  el.target = '_blank';
  el.rel = 'noopener';
});
document.querySelectorAll('[data-instagram]').forEach((el) => {
  el.href = `https://www.instagram.com/${CONTACTO.instagram}/`;
  el.target = '_blank';
  el.rel = 'noopener';
});
document.querySelectorAll('[data-anio]').forEach((el) => {
  el.textContent = new Date().getFullYear();
});

// Menú del celular
const boton = document.querySelector('[data-menu-boton]');
const menu = document.getElementById('menu-movil');
if (boton && menu) {
  const alternar = (abrir) => {
    menu.hidden = !abrir;
    boton.setAttribute('aria-expanded', String(abrir));
  };
  boton.addEventListener('click', () => alternar(menu.hidden));
  menu.addEventListener('click', (e) => { if (e.target.closest('a')) alternar(false); });
}
