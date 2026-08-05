(function(){
  "use strict";

  // ---- sticky nav ----
  const nav = document.getElementById("siteNav");
  const onScroll = () => {
    nav.classList.toggle("is-scrolled", window.scrollY > 40);
  };
  onScroll();
  window.addEventListener("scroll", onScroll, {passive:true});

  // ---- mobile menu ----
  const burger = document.getElementById("navBurger");
  const links = document.getElementById("navLinks");
  burger.addEventListener("click", ()=>{
    const open = links.classList.toggle("is-open");
    burger.setAttribute("aria-expanded", open ? "true":"false");
  });
  links.querySelectorAll("a").forEach(a=>{
    a.addEventListener("click", ()=> links.classList.remove("is-open"));
  });

  // ---- scroll reveal ----
  const revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window){
    const io = new IntersectionObserver((entries)=>{
      entries.forEach(entry=>{
        if (entry.isIntersecting){
          entry.target.classList.add("is-in");
          io.unobserve(entry.target);
        }
      });
    }, {threshold:.15});
    revealEls.forEach(el=>io.observe(el));
  } else {
    revealEls.forEach(el=>el.classList.add("is-in"));
  }

  // ---- custom video players (play + mute) ----
  document.querySelectorAll("[data-video-card]").forEach(card=>{
    const video = card.querySelector("video");
    const playBtn = card.querySelector(".play-btn");
    const muteBtn = card.querySelector(".mute-btn");
    if (!video) return;

    playBtn && playBtn.addEventListener("click", ()=>{
      if (video.paused){
        video.play();
        playBtn.classList.add("is-hidden");
      } else {
        video.pause();
        playBtn.classList.remove("is-hidden");
      }
    });
    video.addEventListener("click", ()=>{
      if (!video.paused){ video.pause(); playBtn.classList.remove("is-hidden"); }
    });
    video.addEventListener("ended", ()=> playBtn.classList.remove("is-hidden"));

    if (muteBtn){
      muteBtn.addEventListener("click", ()=>{
        video.muted = !video.muted;
        muteBtn.innerHTML = video.muted ? ICON_MUTED : ICON_SOUND;
      });
    }
  });

  const ICON_MUTED = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M11 5 6 9H2v6h4l5 4z"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>';
  const ICON_SOUND = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M11 5 6 9H2v6h4l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M18.5 5.5a9 9 0 0 1 0 13"/></svg>';

  // ---- footer year ----
  const y = document.getElementById("yearNow");
  if (y) y.textContent = new Date().getFullYear();
})();
