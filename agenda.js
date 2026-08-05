/* =========================================================
   AGENDA — calendario de disponibilidad
   - Si js/firebase-config.js tiene una configuración real, los
     datos se guardan en Firestore y se ven igual en todos lados.
   - Si no, se usa localStorage como modo de demostración local
     (solo visible en este navegador) para que el sitio funcione
     de inmediato aunque no se haya conectado Firebase.
   ========================================================= */
(function(){
  "use strict";

  const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
  const DOW = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];
  const DEMO_ADMIN_PASSWORD = "5obase2026"; // solo para el modo de demostración local

  const cfg = window.FIREBASE_CONFIG || {};
  const isConfigured = cfg.apiKey && cfg.apiKey.indexOf("PEGA_AQUI") === -1;

  let useFirebase = false;
  let db = null, auth = null;

  if (isConfigured && window.firebase) {
    try{
      firebase.initializeApp(cfg);
      db = firebase.firestore();
      auth = firebase.auth();
      useFirebase = true;
    }catch(e){
      console.warn("No se pudo iniciar Firebase, usando modo demostración.", e);
      useFirebase = false;
    }
  }

  // ---------- state ----------
  const today = new Date();
  today.setHours(0,0,0,0);
  let viewYear = today.getFullYear();
  let viewMonth = today.getMonth();
  let monthData = {};      // { "YYYY-MM-DD": {status, evento, nota} }
  let isAdmin = false;
  let unsubscribe = null;

  // ---------- dom refs ----------
  const els = {};
  function cacheEls(){
    els.grid = document.getElementById("calGrid");
    els.monthLabel = document.getElementById("calMonthLabel");
    els.prev = document.getElementById("calPrev");
    els.next = document.getElementById("calNext");
    els.demoBanner = document.getElementById("demoBanner");
    els.modeTag = document.getElementById("agendaMode");
    els.adminFab = document.getElementById("adminFab");
    els.adminModalBackdrop = document.getElementById("adminModalBackdrop");
    els.loginForm = document.getElementById("loginForm");
    els.loginEmail = document.getElementById("loginEmail");
    els.loginPass = document.getElementById("loginPass");
    els.loginMsg = document.getElementById("loginMsg");
    els.loginClose = document.getElementById("loginClose");
    els.dateModalBackdrop = document.getElementById("dateModalBackdrop");
    els.dateModalClose = document.getElementById("dateModalClose");
    els.dateModalTitle = document.getElementById("dateModalTitle");
    els.dateModalSub = document.getElementById("dateModalSub");
    els.dateForm = document.getElementById("dateForm");
    els.eventoInput = document.getElementById("eventoInput");
    els.notaInput = document.getElementById("notaInput");
    els.dateMsg = document.getElementById("dateMsg");
    els.dateDelete = document.getElementById("dateDelete");
    els.readOnlyInfo = document.getElementById("readOnlyInfo");
  }

  function pad(n){ return String(n).padStart(2,"0"); }
  function idFor(y,m,d){ return `${y}-${pad(m+1)}-${pad(d)}`; }

  // ---------- data layer ----------
  function loadLocal(){
    try{ return JSON.parse(localStorage.getItem("5obase_agenda")||"{}"); }
    catch(e){ return {}; }
  }
  function saveLocal(data){ localStorage.setItem("5obase_agenda", JSON.stringify(data)); }

  function subscribeMonth(y,m){
    if (unsubscribe){ unsubscribe(); unsubscribe = null; }
    const start = idFor(y,m,1);
    const lastDay = new Date(y,m+1,0).getDate();
    const end = idFor(y,m,lastDay);

    if (useFirebase){
      unsubscribe = db.collection("agenda")
        .where(firebase.firestore.FieldPath.documentId(), ">=", start)
        .where(firebase.firestore.FieldPath.documentId(), "<=", end)
        .onSnapshot(snap=>{
          monthData = {};
          snap.forEach(doc=>{ monthData[doc.id] = doc.data(); });
          renderGrid();
        }, err=>{
          console.error(err);
        });
    } else {
      const all = loadLocal();
      monthData = {};
      Object.keys(all).forEach(k=>{ if (k>=start && k<=end) monthData[k]=all[k]; });
      renderGrid();
    }
  }

  function saveDate(id, payload){
    if (useFirebase){
      return db.collection("agenda").doc(id).set(payload, {merge:false});
    }
    const all = loadLocal();
    all[id] = payload;
    saveLocal(all);
    subscribeMonth(viewYear, viewMonth);
    return Promise.resolve();
  }

  function deleteDate(id){
    if (useFirebase){
      return db.collection("agenda").doc(id).delete();
    }
    const all = loadLocal();
    delete all[id];
    saveLocal(all);
    subscribeMonth(viewYear, viewMonth);
    return Promise.resolve();
  }

  // ---------- render ----------
  function renderGrid(){
    els.monthLabel.textContent = `${MESES[viewMonth]} ${viewYear}`;
    els.grid.innerHTML = "";

    DOW.forEach(d=>{
      const el = document.createElement("div");
      el.className = "cal-dow";
      el.textContent = d;
      els.grid.appendChild(el);
    });

    const firstDow = new Date(viewYear, viewMonth, 1).getDay();
    const totalDays = new Date(viewYear, viewMonth+1, 0).getDate();

    for(let i=0;i<firstDow;i++){
      const el = document.createElement("div");
      el.className = "cal-cell is-empty";
      els.grid.appendChild(el);
    }

    for(let d=1; d<=totalDays; d++){
      const id = idFor(viewYear, viewMonth, d);
      const cellDate = new Date(viewYear, viewMonth, d);
      cellDate.setHours(0,0,0,0);
      const info = monthData[id];
      const status = info ? info.status : "disponible";
      const isPast = cellDate < today;
      const isToday = cellDate.getTime() === today.getTime();

      const cell = document.createElement("div");
      cell.className = `cal-cell status-${status}` + (isPast ? " is-past":"") + (isToday ? " is-today":"");
      cell.dataset.id = id;

      if (!isPast || isAdmin){
        cell.classList.add("is-clickable");
        cell.addEventListener("click", ()=>openDateModal(id, cellDate, info));
      }

      const num = document.createElement("span");
      num.className = "num";
      num.textContent = d;
      cell.appendChild(num);

      const bulb = document.createElement("span");
      bulb.className = "bulb";
      cell.appendChild(bulb);

      if (info && info.evento){
        const evt = document.createElement("span");
        evt.className = "evt";
        evt.textContent = info.evento;
        cell.appendChild(evt);
      }

      els.grid.appendChild(cell);
    }
  }

  function changeMonth(delta){
    viewMonth += delta;
    if (viewMonth < 0){ viewMonth = 11; viewYear--; }
    if (viewMonth > 11){ viewMonth = 0; viewYear++; }
    subscribeMonth(viewYear, viewMonth);
  }

  // ---------- date modal ----------
  let activeDateId = null;
  function openDateModal(id, dateObj, info){
    activeDateId = id;
    const label = dateObj.toLocaleDateString("es-MX", {weekday:"long", day:"numeric", month:"long", year:"numeric"});
    els.dateModalTitle.textContent = label.charAt(0).toUpperCase()+label.slice(1);
    els.dateMsg.textContent = "";

    if (isAdmin){
      els.dateForm.classList.remove("sr-only");
      els.dateForm.style.display = "";
      els.readOnlyInfo.style.display = "none";
      els.dateModalSub.textContent = "Marca la disponibilidad de esta fecha.";
      const status = info ? info.status : "disponible";
      const radio = els.dateForm.querySelector(`input[name="status"][value="${status}"]`);
      if (radio) radio.checked = true;
      els.eventoInput.value = (info && info.evento) || "";
      els.notaInput.value = (info && info.nota) || "";
      els.dateDelete.style.display = info ? "" : "none";
    } else {
      els.dateForm.style.display = "none";
      els.readOnlyInfo.style.display = "";
      const status = info ? info.status : "disponible";
      const statusLabels = {disponible:"Disponible", apartado:"Apartado (en proceso)", confirmado:"Fecha confirmada"};
      els.dateModalSub.textContent = "";
      els.readOnlyInfo.innerHTML = `
        <p style="color:var(--gold-bright);font-weight:600;margin-bottom:8px;">${statusLabels[status]}</p>
        ${status === "disponible" ? `<p style="color:var(--smoke);font-size:.9rem;">Esta fecha está libre. Contáctanos para cotizar tu evento.</p>` : `<p style="color:var(--smoke);font-size:.9rem;">Esta fecha ya tiene un evento en proceso. Si es tuyo y necesitas confirmar detalles, contáctanos directamente.</p>`}
      `;
    }
    els.dateModalBackdrop.classList.add("is-open");
  }
  function closeDateModal(){ els.dateModalBackdrop.classList.remove("is-open"); activeDateId=null; }

  function handleDateFormSubmit(e){
    e.preventDefault();
    const status = els.dateForm.querySelector('input[name="status"]:checked').value;
    const evento = els.eventoInput.value.trim();
    const nota = els.notaInput.value.trim();
    els.dateMsg.textContent = "Guardando...";
    els.dateMsg.className = "form-msg";

    if (status === "disponible" && !evento && !nota){
      deleteDate(activeDateId).then(()=>{
        els.dateMsg.textContent = "Fecha marcada como disponible.";
        els.dateMsg.className = "form-msg ok";
        setTimeout(closeDateModal, 700);
      }).catch(showDateError);
      return;
    }

    saveDate(activeDateId, {status, evento, nota})
      .then(()=>{
        els.dateMsg.textContent = "Guardado.";
        els.dateMsg.className = "form-msg ok";
        setTimeout(closeDateModal, 700);
      }).catch(showDateError);
  }
  function showDateError(err){
    console.error(err);
    els.dateMsg.textContent = "No se pudo guardar. Intenta de nuevo.";
    els.dateMsg.className = "form-msg error";
  }

  // ---------- admin/login ----------
  function openLogin(){ els.adminModalBackdrop.classList.add("is-open"); els.loginMsg.textContent=""; }
  function closeLogin(){ els.adminModalBackdrop.classList.remove("is-open"); }

  function setAdminUI(on){
    isAdmin = on;
    document.body.classList.toggle("is-admin", on);
    els.adminFab.setAttribute("aria-label", on ? "Cerrar sesión de administrador" : "Iniciar sesión de administrador");
    els.adminFab.querySelector("span") && (els.adminFab.querySelector("span").textContent = on ? "Salir" : "");
    renderGrid();
  }

  function handleLoginSubmit(e){
    e.preventDefault();
    const email = els.loginEmail.value.trim();
    const pass = els.loginPass.value;
    els.loginMsg.textContent = "Verificando...";
    els.loginMsg.className = "form-msg";

    if (useFirebase){
      auth.signInWithEmailAndPassword(email, pass)
        .then(()=>{ closeLogin(); })
        .catch(err=>{
          els.loginMsg.textContent = "Correo o contraseña incorrectos.";
          els.loginMsg.className = "form-msg error";
        });
    } else {
      if (pass === DEMO_ADMIN_PASSWORD){
        setAdminUI(true);
        closeLogin();
      } else {
        els.loginMsg.textContent = `Modo demostración: usa la contraseña "${DEMO_ADMIN_PASSWORD}".`;
        els.loginMsg.className = "form-msg error";
      }
    }
  }

  function handleAdminFabClick(){
    if (isAdmin){
      if (useFirebase) auth.signOut();
      setAdminUI(false);
    } else {
      openLogin();
    }
  }

  // ---------- init ----------
  function init(){
    cacheEls();
    if (!els.grid) return;

    els.demoBanner.classList.toggle("is-visible", !useFirebase);
    els.modeTag.innerHTML = useFirebase
      ? `<i></i> Agenda en vivo`
      : `<i></i> Modo demostración`;

    els.prev.addEventListener("click", ()=>changeMonth(-1));
    els.next.addEventListener("click", ()=>changeMonth(1));
    els.adminFab.addEventListener("click", handleAdminFabClick);
    els.loginForm.addEventListener("submit", handleLoginSubmit);
    els.loginClose.addEventListener("click", closeLogin);
    els.adminModalBackdrop.addEventListener("click", e=>{ if(e.target===els.adminModalBackdrop) closeLogin(); });
    els.dateModalClose.addEventListener("click", closeDateModal);
    els.dateModalBackdrop.addEventListener("click", e=>{ if(e.target===els.dateModalBackdrop) closeDateModal(); });
    els.dateForm.addEventListener("submit", handleDateFormSubmit);
    els.dateDelete.addEventListener("click", ()=>{
      if (!activeDateId) return;
      deleteDate(activeDateId).then(closeDateModal);
    });

    if (useFirebase){
      auth.onAuthStateChanged(user=>{ setAdminUI(!!user); });
    }

    subscribeMonth(viewYear, viewMonth);
  }

  document.addEventListener("DOMContentLoaded", init);
})();
