// Zamuro signature, "vigil" variant: the mark waits at the foot of the page
// and appears only once the reader arrives there.
(function () {
  var mark = document.querySelector('.vigil-mark');
  var footer = document.getElementById('site-footer');
  if (!mark || !footer) return;

  if (!('IntersectionObserver' in window)) {
    mark.classList.add('visible');
    return;
  }

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        mark.classList.add('visible');
        io.disconnect();
      }
    });
  }, { threshold: 0.3 });

  io.observe(footer);
})();
