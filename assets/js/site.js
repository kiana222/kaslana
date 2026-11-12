var resumeData = JSON.parse(document.getElementById('resume-data').textContent);

  (function() {
    'use strict';

    // 主题切换
    var toggleBtn = document.getElementById('themeToggle');
    var html = document.documentElement;
    try {
      var stored = localStorage.getItem('theme') || 'light';
      html.setAttribute('data-theme', stored);
    } catch (_) {
      html.setAttribute('data-theme', 'light');
    }

    if (toggleBtn) {
      toggleBtn.addEventListener('click', function() {
        var current = html.getAttribute('data-theme');
        var next = current === 'dark' ? 'light' : 'dark';
        html.setAttribute('data-theme', next);
        try {
          localStorage.setItem('theme', next);
        } catch (_) {}
      });
    }

    // 整体风格切换
    var styleBtn = document.getElementById('styleBtn');
    var stylePanel = document.getElementById('stylePanel');
    var styleWrap = styleBtn ? styleBtn.parentElement : null;
    var styleFloatBtn = document.getElementById('styleFloatBtn');
    var styleItems = document.querySelectorAll('.style-item');
    var canEffect = window.matchMedia('(hover: hover) and (pointer: fine)').matches &&
                    !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // 霓虹粒子（仅霓虹风格，低密度保证流畅）
    var particleCanvas = document.getElementById('particleCanvas');
    var particleSystem = null;
    function startParticles() {
      if (!particleCanvas || particleSystem || !canEffect) return;
      var ctx = particleCanvas.getContext('2d');
      var dots = [];
      var W = 0, H = 0, raf = 0;
      function resize() {
        W = particleCanvas.width = window.innerWidth;
        H = particleCanvas.height = window.innerHeight;
      }
      resize();
      window.addEventListener('resize', resize);
      for (var i = 0; i < 100; i++) {
        dots.push({
          x: Math.random() * (W || 1600),
          y: Math.random() * (H || 900),
          r: 1 + Math.random() * 2.2,
          s: 0.18 + Math.random() * 0.5,
          hue: [300, 265, 190][i % 3],
          drift: (Math.random() - 0.5) * 0.3
        });
      }
      function frame() {
        if (!particleSystem) return;
        ctx.clearRect(0, 0, W, H);
        dots.forEach(function(d) {
          d.y -= d.s;
          d.x += d.drift;
          if (d.y < -4) { d.y = H + 4; d.x = Math.random() * W; }
          if (d.x < -4) d.x = W + 4;
          if (d.x > W + 4) d.x = -4;
          var a = 0.35 + 0.55 * Math.sin(d.y / (H || 1) * Math.PI);
          ctx.beginPath();
          ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
          ctx.fillStyle = 'hsla(' + d.hue + ', 100%, 68%, ' + a + ')';
          ctx.shadowColor = 'hsla(' + d.hue + ', 100%, 68%, 0.9)';
          ctx.shadowBlur = 10;
          ctx.fill();
          ctx.shadowBlur = 0;
        });
        raf = window.requestAnimationFrame(frame);
      }
      raf = window.requestAnimationFrame(frame);
      particleSystem = {
        stop: function() {
          window.cancelAnimationFrame(raf);
          window.removeEventListener('resize', resize);
        }
      };
    }
    function stopParticles() {
      if (particleSystem) {
        particleSystem.stop();
        particleSystem = null;
      }
    }

    // 霓虹水面：深色水底 + 鼠标移动处泛起涟漪
    function applyStyle(name) {
      html.setAttribute('data-style', name);
      try { localStorage.setItem('resumeStyle', name); } catch (_) {}
      styleItems.forEach(function(it) {
        it.classList.toggle('active', it.getAttribute('data-style') === name);
      });
      if (name === 'neon') { startParticles(); }
      else { stopParticles(); }
    }
    if (styleBtn && stylePanel) {
      var pendingStyle = null;
      var styleModal = document.getElementById('styleModal');
      var styleConfirmBtn = document.getElementById('styleConfirmBtn');
      var styleCancelBtn = document.getElementById('styleCancelBtn');
      styleBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        stylePanel.classList.toggle('open');
      });
      if (styleFloatBtn) {
        styleFloatBtn.addEventListener('click', function(e) {
          e.stopPropagation();
          stylePanel.classList.toggle('open');
        });
      }
      var styleFloatBtnM = document.getElementById('styleFloatBtnM');
      if (styleFloatBtnM) {
        styleFloatBtnM.addEventListener('click', function(e) {
          e.stopPropagation();
          stylePanel.classList.toggle('open');
        });
      }
      styleItems.forEach(function(it) {
        it.addEventListener('click', function() {
          var name = this.getAttribute('data-style');
          var current = html.getAttribute('data-style');
          if (name === 'neon' && current !== 'neon') {
            pendingStyle = name;
            if (styleModal) styleModal.classList.add('open');
            return;
          }
          applyStyle(name);
          stylePanel.classList.remove('open');
        });
      });
      if (styleConfirmBtn) {
        styleConfirmBtn.addEventListener('click', function() {
          if (styleModal) styleModal.classList.remove('open');
          if (pendingStyle) {
            applyStyle(pendingStyle);
            pendingStyle = null;
            stylePanel.classList.remove('open');
          }
        });
      }
      if (styleCancelBtn) {
        styleCancelBtn.addEventListener('click', function() {
          if (styleModal) styleModal.classList.remove('open');
          pendingStyle = null;
        });
      }
      document.addEventListener('click', function(e) {
        if (stylePanel.classList.contains('open') && styleWrap && !styleWrap.contains(e.target) && !(styleFloatBtn && styleFloatBtn.contains(e.target)) && !(styleFloatBtnM && styleFloatBtnM.contains(e.target))) {
          stylePanel.classList.remove('open');
        }
      });
    }
    var savedStyle = 'tech';
    try { savedStyle = localStorage.getItem('resumeStyle') || 'tech'; } catch (_) {}
    applyStyle(savedStyle);

    // 单页滚动：导航高亮 + 阅读进度 + 返回顶部
    var sections = document.querySelectorAll('.page[id]');
    var navLinks = document.querySelectorAll('.nav-link');
    var progressBar = document.getElementById('scrollProgress');
    var backTopBtn = document.getElementById('backTopBtn');
    var backTopBtnM = document.getElementById('backTopBtnM');
    var lastScrollY = 0;

    function updateScrollState() {
      var st = window.pageYOffset || document.documentElement.scrollTop || 0;
      var doc = document.documentElement;
      var max = doc.scrollHeight - window.innerHeight;
      if (progressBar && max > 0) {
        progressBar.style.width = (st / max * 100) + '%';
      }
      var currentId = sections.length ? sections[0].id : 'about';
      sections.forEach(function(sec) {
        var top = sec.getBoundingClientRect().top + st;
        if (st >= top - 120) currentId = sec.id;
      });
      if (sections.length) {
        var lastSec = sections[sections.length - 1];
        var lastBottom = lastSec.getBoundingClientRect().bottom + st;
      if (st + window.innerHeight >= lastBottom - 8) {
          currentId = lastSec.id;
        }
      }
      // 移动端：下滑隐藏导航，上滑显示
      var topNavHide = document.getElementById('topNav');
      if (topNavHide) {
        if (window.innerWidth <= 900 && st > lastScrollY + 2 && st > 140) {
          topNavHide.classList.add('nav-hidden');
        } else {
          topNavHide.classList.remove('nav-hidden');
        }
      }
      lastScrollY = st;
      navLinks.forEach(function(link) {
        link.classList.toggle('active', link.getAttribute('href') === '#' + currentId);
      });
      var topNavEl = document.getElementById('topNav');
      var activeLinkEl = document.querySelector('.nav-link.active');
      if (topNavEl && activeLinkEl) {
        var lr = activeLinkEl.offsetLeft;
        if (lr < topNavEl.scrollLeft || lr + activeLinkEl.offsetWidth > topNavEl.scrollLeft + topNavEl.clientWidth) {
          topNavEl.scrollLeft = Math.max(0, lr - (topNavEl.clientWidth - activeLinkEl.offsetWidth) / 2);
        }
      }
      if (backTopBtn || backTopBtnM) {
        var showTop = st > 600;
        if (backTopBtn) backTopBtn.classList.toggle('show', showTop);
        if (backTopBtnM) backTopBtnM.classList.toggle('show', showTop);
      }
    }
    var scrollTicking = false;
    function onScrollTick() {
      updateScrollState();
      scrollTicking = false;
    }
    function onScroll() {
      if (!scrollTicking) {
        window.requestAnimationFrame(onScrollTick);
        scrollTicking = true;
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    updateScrollState();

    [backTopBtn, backTopBtnM].forEach(function(btn) {
      if (btn) {
        btn.addEventListener('click', function() {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        });
      }
    });

    // 滚动渐显
    function animateStat(el) {
      var target = parseInt(el.getAttribute('data-count'), 10);
      if (isNaN(target)) return;
      var start = null;
      function step(ts) {
        if (!start) start = ts;
        var p = Math.min((ts - start) / 700, 1);
        el.innerText = Math.round(target * (0.2 + 0.8 * p));
        if (p < 1) window.requestAnimationFrame(step);
        else el.innerText = target;
      }
      window.requestAnimationFrame(step);
    }
    function revealElement(el) {
      el.classList.add('revealed');
      el.querySelectorAll('.stat-num[data-count]').forEach(animateStat);
    }
    var revealEls = document.querySelectorAll('.reveal');
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function(entries) {
        entries.forEach(function(en) {
          if (en.isIntersecting) {
            io.unobserve(en.target);
            revealElement(en.target);
          }
        });
      }, { threshold: 0.12 });
      revealEls.forEach(function(el) { io.observe(el); });
    } else {
      revealEls.forEach(revealElement);
    }

    // 定位页数字入场计数
    document.querySelectorAll('#about .stat-num[data-count]').forEach(animateStat);

    // 光标光晕（桌面端，随鼠标平滑跟随）
    var cursorGlow = document.getElementById('cursorGlow');
    if (cursorGlow && canEffect) {
      var gx = 0, gy = 0, gtx = 0, gty = 0, glowTicking = false;
      document.addEventListener('mousemove', function(e) {
        gtx = e.clientX;
        gty = e.clientY;
        if (!glowTicking) {
          window.requestAnimationFrame(function() {
            gx += (gtx - gx) * 0.22;
            gy += (gty - gy) * 0.22;
            cursorGlow.style.transform = 'translate3d(' + (gx - 300) + 'px,' + (gy - 300) + 'px,0)';
            glowTicking = false;
          });
          glowTicking = true;
        }
      });
    }

    // 鼠标拖尾粒子（桌面端）
    var mouseTrail = document.getElementById('mouseTrail');
    if (mouseTrail && canEffect) {
      var lastSpawn = 0;
      var trailDots = 0;
      document.addEventListener('mousemove', function(e) {
        var now = Date.now();
        if (now - lastSpawn < 30 || trailDots >= 14) return;
        lastSpawn = now;
        var dot = document.createElement('span');
        dot.className = 'mouse-dot';
        dot.style.left = e.clientX + 'px';
        dot.style.top = e.clientY + 'px';
        dot.style.setProperty('--dx', (Math.random() * 24 - 12) + 'px');
        dot.style.setProperty('--dy', (-14 - Math.random() * 22) + 'px');
        mouseTrail.appendChild(dot);
        trailDots++;
        dot.addEventListener('animationend', function() {
          dot.remove();
          trailDots--;
        });
      });
    }

    // 卡片点击反馈：波纹 + 发光脉冲
    var clickTargets = document.querySelectorAll('.skill-card, .medal-item, .project-card, .stat-card, .interest-tag');
    clickTargets.forEach(function(card) {
      card.addEventListener('click', function(e) {
        var r = card.getBoundingClientRect();
        var rip = document.createElement('span');
        rip.className = 'ripple';
        rip.style.left = (e.clientX - r.left) + 'px';
        rip.style.top = (e.clientY - r.top) + 'px';
        card.appendChild(rip);
        card.classList.remove('card-pop');
        void card.offsetWidth;
        card.classList.add('card-pop');
        setTimeout(function() {
          rip.remove();
          card.classList.remove('card-pop');
        }, 480);
      });
    });

    // 卡片 3D 微倾斜（桌面端）
    var tiltEls = document.querySelectorAll('.tilt');
    if (canEffect) {
      tiltEls.forEach(function(el) {
        el.addEventListener('mousemove', function(e) {
          var r = el.getBoundingClientRect();
          var x = (e.clientX - r.left) / r.width;
          var y = (e.clientY - r.top) / r.height;
          el.style.setProperty('--ry', ((x - 0.5) * 10).toFixed(2) + 'deg');
          el.style.setProperty('--rx', ((0.5 - y) * 10).toFixed(2) + 'deg');
        });
        el.addEventListener('mouseleave', function() {
          el.style.setProperty('--rx', '0deg');
          el.style.setProperty('--ry', '0deg');
        });
      });
    }

    // 文字简笔装饰：高亮词下方波浪线 + 云朵/星星
    function injectWave(el) {
      var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('viewBox', '0 0 100 8');
      svg.setAttribute('preserveAspectRatio', 'none');
      svg.setAttribute('class', 'hl-wave');
      var p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      p.setAttribute('d', 'M0 5 Q 8 0, 16 5 T 32 5 T 48 5 T 64 5 T 80 5 T 96 5');
      p.setAttribute('fill', 'none');
      p.setAttribute('stroke', 'currentColor');
      p.setAttribute('stroke-width', '2');
      p.setAttribute('stroke-linecap', 'round');
      p.setAttribute('opacity', '0.75');
      svg.appendChild(p);
      el.appendChild(svg);
    }
    function makeDoodle(kind) {
      var d = document.createElement('span');
      d.className = 'doodle doodle-' + kind;
      return d;
    }
    document.querySelectorAll('.wave-anchor').forEach(injectWave);
    document.querySelectorAll('.cloud-anchor').forEach(function(el) {
      el.appendChild(makeDoodle('cloud'));
    });
    document.querySelectorAll('.star-anchor').forEach(function(el) {
      el.appendChild(makeDoodle('star'));
    });

    // 证书轮播：只渲染实际存在的证书文件。
    // 新增证书：把 5.jpg / 6.jpg / 7.jpg（或修改下方列表）放入本目录即可自动出现在轮播中；
    // 文件不存在时不会渲染任何空位，访客看不出预留。
    var certFiles = resumeData.certFiles;
    var certMeta = resumeData.certMeta;
    var certTrack = document.getElementById('certTrack');
    var certStage = document.getElementById('certStage');
    var certPrevBtn = document.getElementById('certPrev');
    var certNextBtn = document.getElementById('certNext');
    var certSlides = [];
    var certIndex = 0;

    function initCarousel() {
      if (certSlides.length === 0) return;
      var N = certSlides.length;
      var trackChildren = [];
      var renderIndex = 2;
      function cloneSlide(s) {
        var c = s.cloneNode(true);
        c.classList.remove('active');
        var srcImg = s.querySelector('img');
        var cloneImg = c.querySelector('img');
        if (srcImg && cloneImg) {
          if (srcImg.classList.contains('loaded')) {
            cloneImg.classList.add('loaded');
          } else {
            cloneImg.onload = function() { cloneImg.classList.add('loaded'); };
            if (cloneImg.complete && cloneImg.naturalWidth > 0) cloneImg.classList.add('loaded');
          }
        }
        return c;
      }
      if (N === 1) {
        trackChildren.push(certSlides[0]);
        renderIndex = 0;
      } else {
        trackChildren.push(cloneSlide(certSlides[N - 2]));
        trackChildren.push(cloneSlide(certSlides[N - 1]));
        certSlides.forEach(function(s) { trackChildren.push(s); });
        trackChildren.push(cloneSlide(certSlides[0]));
        trackChildren.push(cloneSlide(certSlides[1]));
      }
      certTrack.innerHTML = '';
      trackChildren.forEach(function(s) { certTrack.appendChild(s); });

      function childImageIndex(k) {
        return ((k - 2) % N + N) % N;
      }
      function render() {
        var slide = trackChildren[renderIndex];
        var x = slide.offsetLeft - (certStage.clientWidth - slide.clientWidth) / 2;
        certTrack.style.transform = 'translateX(' + (-x) + 'px)';
        var activeImage = childImageIndex(renderIndex);
        trackChildren.forEach(function(c, k) {
          c.classList.toggle('active', childImageIndex(k) === activeImage);
        });
      }
      var moving = false;
      var carouselReady = false;
      function goTo(i, smooth) {
        certTrack.classList.toggle('no-anim', !smooth);
        renderIndex = i;
        render();
      }
      function next() {
        if (moving || !carouselReady || N === 1) return;
        moving = true;
        goTo(renderIndex + 1, true);
        setTimeout(function() {
          moving = false;
          if (renderIndex === N + 2) {
            certTrack.classList.add('no-anim');
            renderIndex = 2;
            render();
            void certTrack.offsetWidth;
          }
        }, 500);
      }
      function prev() {
        if (moving || !carouselReady || N === 1) return;
        moving = true;
        goTo(renderIndex - 1, true);
        setTimeout(function() {
          moving = false;
          if (renderIndex === 1) {
            certTrack.classList.add('no-anim');
            renderIndex = N + 1;
            render();
            void certTrack.offsetWidth;
          }
        }, 500);
      }
      function start() {
        carouselReady = true;
        window.addEventListener('resize', function() { goTo(renderIndex, false); });
        if (certPrevBtn) certPrevBtn.addEventListener('click', prev);
        if (certNextBtn) certNextBtn.addEventListener('click', next);
        document.addEventListener('keydown', function(e) {
          if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
          var r = certStage.getBoundingClientRect();
          if (r.bottom > 0 && r.top < window.innerHeight) {
            e.preventDefault();
            if (e.key === 'ArrowRight') next();
            else prev();
          }
        });
        var sx = 0, sy = 0;
        certStage.addEventListener('touchstart', function(e) {
          sx = e.changedTouches[0].screenX;
          sy = e.changedTouches[0].screenY;
        }, { passive: true });
        certStage.addEventListener('touchend', function(e) {
          var dx = e.changedTouches[0].screenX - sx;
          var dy = e.changedTouches[0].screenY - sy;
          if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) {
            if (dx < 0) next();
            else prev();
          }
        }, { passive: true });
      }
      // 卡片框架立即就位（图片淡入），克隆图全部就绪后再开放切换
      goTo(renderIndex, false);
      // 克隆卡图片全部就绪后再启用，避免切换时空白/突兀出现
      var imgReady = 0;
      var imgTotal = trackChildren.length;
      function imgDone() {
        imgReady++;
        if (imgReady >= imgTotal) start();
      }
      trackChildren.forEach(function(child) {
        var im = child.querySelector('img');
        if (!im) { imgDone(); return; }
        if (im.complete && im.naturalWidth > 0) imgDone();
        else {
          im.addEventListener('load', imgDone);
          im.addEventListener('error', imgDone);
        }
      });
    }

    if (certTrack) {
      // 先探测哪些证书文件真实存在（占位槽位在文件加入前不渲染）
      var certProbePending = certFiles.length;
      var certExisting = [];
      certFiles.forEach(function(file) {
        var probe = new Image();
        probe.onload = function() { certExisting.push(file); certProbeDone(); };
        probe.onerror = certProbeDone;
        probe.src = file;
      });
      function certProbeDone() {
        certProbePending--;
        if (certProbePending === 0) buildCertSlides();
      }
      function buildCertSlides() {
        certExisting.forEach(function(file) {
          var slide = document.createElement('div');
          slide.className = 'cert-slide';
          var card = document.createElement('div');
          card.className = 'cert-card';
          var img = document.createElement('img');
          img.alt = certMeta[file] || '荣誉证书';
          card.appendChild(img);
          slide.appendChild(card);
          certTrack.appendChild(slide);
          certSlides.push(slide);
          img.onload = function() { img.classList.add('loaded'); };
          img.onerror = function() {
            certTrack.removeChild(slide);
            certSlides = certSlides.filter(function(s) { return s !== slide; });
          };
          img.src = file;
        });
        initCarousel();
      }
    }

    // 按钮悬停预览浮窗（桌面端）
    if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      var hoverPreview = document.createElement('div');
      hoverPreview.className = 'hover-preview';
      hoverPreview.setAttribute('aria-hidden', 'true');
      var hoverImg = document.createElement('img');
      var hoverCap = document.createElement('div');
      hoverCap.className = 'hover-preview-cap';
      hoverPreview.appendChild(hoverImg);
      hoverPreview.appendChild(hoverCap);
      document.body.appendChild(hoverPreview);

      var previewSource = null;
      function placeHoverPreview() {
        if (!previewSource) return;
        var r = previewSource.getBoundingClientRect();
        var below = r.top < 320;
        hoverPreview.classList.toggle('below', below);
        hoverPreview.style.left = Math.round(r.left + r.width / 2) + 'px';
        hoverPreview.style.top = Math.round(below ? r.bottom : r.top) + 'px';
      }
      document.querySelectorAll('[data-preview]').forEach(function(btn) {
        btn.addEventListener('mouseenter', function() {
          previewSource = btn;
          hoverImg.src = btn.getAttribute('data-preview');
          hoverCap.innerText = btn.getAttribute('data-preview-label') || '';
          placeHoverPreview();
          hoverPreview.classList.add('show');
        });
        btn.addEventListener('mouseleave', function() {
          hoverPreview.classList.remove('show');
          previewSource = null;
        });
      });
      window.addEventListener('resize', function() {
        if (hoverPreview.classList.contains('show')) placeHoverPreview();
      });
    }

    // 复制功能逻辑
    var copyBtns = document.querySelectorAll('.copy-btn');
    copyBtns.forEach(function(btn) {
      btn.addEventListener('click', function() {
        var textToCopy = this.getAttribute('data-clipboard-text');
        var originalText = this.innerText;
        
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(textToCopy).then(function() {
            btn.innerText = '已复制!';
            btn.classList.add('copied');
            setTimeout(function() {
              btn.innerText = originalText;
              btn.classList.remove('copied');
            }, 2000);
          }).catch(function(err) {
            console.error('复制失败: ', err);
          });
        } else {
          var textarea = document.createElement('textarea');
          textarea.value = textToCopy;
          document.body.appendChild(textarea);
          textarea.select();
          try {
            var successful = document.execCommand('copy');
            if (successful) {
              btn.innerText = '已复制!';
              btn.classList.add('copied');
              setTimeout(function() {
                btn.innerText = originalText;
                btn.classList.remove('copied');
              }, 2000);
            }
          } catch (err) {
            console.error('复制失败: ', err);
          }
          document.body.removeChild(textarea);
        }
      });
    });

    // ===== 面板切换逻辑 =====
    var openWorldBtn = document.getElementById('openWorldGameBtn');
    var gamePanel = document.getElementById('gameInfoPanel');
    var backBtn = document.getElementById('backToInterestsBtn');
    
    var aiGameBtn = document.getElementById('aiGameBtn');
    var aiGamePanel = document.getElementById('aiGameInfoPanel');
    var backToAiBtn = document.getElementById('backToAiBtn');

    var interestsGrid = document.getElementById('interestsGrid');

    if (openWorldBtn && gamePanel && backBtn && interestsGrid) {
      openWorldBtn.addEventListener('click', function() {
        interestsGrid.style.display = 'none';
        gamePanel.style.display = 'flex';
      });
      backBtn.addEventListener('click', function() {
        gamePanel.style.display = 'none';
        interestsGrid.style.display = 'flex';
      });
    }

    if (aiGameBtn && aiGamePanel && backToAiBtn && interestsGrid) {
      aiGameBtn.addEventListener('click', function() {
        interestsGrid.style.display = 'none';
        aiGamePanel.style.display = 'flex';
      });
      backToAiBtn.addEventListener('click', function() {
        aiGamePanel.style.display = 'none';
        interestsGrid.style.display = 'flex';
      });
    }

    // 进入动画：先背景 + 艺术字，点击后正文四周聚集

    // 初始化触发一次滚动状态（含移动端导航）
    updateScrollState();
  })();

  // ===== 音乐播放器功能 =====
  var songs = resumeData.songs;
  var currentSongIndex = 0;
  var audio = document.getElementById('globalAudio');
  audio.loop = false; // 禁用原生单曲循环，交由播放模式逻辑控制
  var playBtn = document.getElementById('playBtn');
  var progressBar = document.getElementById('progressBar');
  var currentTimeLabel = document.getElementById('currentTime');
  var durationLabel = document.getElementById('duration');

  // ===== 播放模式 =====
  var playMode = 'order'; // order, loop, shuffle
  var modeOrderBtn = document.getElementById('modeOrderBtn');
  var modeLoopBtn = document.getElementById('modeLoopBtn');
  var modeShuffleBtn = document.getElementById('modeShuffleBtn');

  window.setPlayMode = function(mode) {
    playMode = mode;
    // 更新UI状态
    [modeOrderBtn, modeLoopBtn, modeShuffleBtn].forEach(function(btn) {
      btn.classList.remove('active');
    });
    if (mode === 'order') modeOrderBtn.classList.add('active');
    else if (mode === 'loop') modeLoopBtn.classList.add('active');
    else if (mode === 'shuffle') modeShuffleBtn.classList.add('active');
  };

  function loadSong(index, autoPlay) {
    if (index < 0) index = songs.length - 1;
    if (index >= songs.length) index = 0;
    currentSongIndex = index;
    audio.src = songs[index].src;
    audio.load();
    if (autoPlay) {
      audio.play().catch(function(e) {
        console.log("播放失败，可能需要用户交互", e);
      });
    }
    updatePlayButton();
  }

  function togglePlay() {
    if (!musicEnabled) {
      openMusicModal();
      return;
    }
    if (audio.paused) {
      audio.play().catch(function(e) {
        console.log("播放失败，可能需要用户交互", e);
      });
    } else {
      audio.pause();
    }
    updatePlayButton();
  }

  function updatePlayButton() {
    if (audio.paused) {
      playBtn.innerText = '▶️';
    } else {
      playBtn.innerText = '⏸️';
    }
  }

  function nextSong() {
    if (playMode === 'shuffle') {
      var randomIndex = currentSongIndex;
      while (randomIndex === currentSongIndex && songs.length > 1) {
        randomIndex = Math.floor(Math.random() * songs.length);
      }
      loadSong(randomIndex, true);
    } else {
      loadSong(currentSongIndex + 1, true);
    }
  }
  function prevSong() {
    loadSong(currentSongIndex - 1, true);
  }

  function formatTime(seconds) {
    var m = Math.floor(seconds / 60);
    var s = Math.floor(seconds % 60);
    return m + ":" + (s < 10 ? "0" : "") + s;
  }

  function seekTo(value) {
    audio.currentTime = value;
  }

  audio.addEventListener('timeupdate', function() {
    if (!isNaN(audio.duration)) {
      progressBar.value = Math.floor(audio.currentTime);
      currentTimeLabel.innerText = formatTime(Math.floor(audio.currentTime));
    }
  });

  audio.addEventListener('canplaythrough', function() {
    progressBar.max = Math.floor(audio.duration);
    durationLabel.innerText = formatTime(Math.floor(audio.duration));
  });
  audio.addEventListener('play', updatePlayButton);
  audio.addEventListener('pause', updatePlayButton);

  // ===== 修改：播放结束根据模式执行不同操作 =====
  audio.addEventListener('ended', function() {
    if (playMode === 'loop') {
      audio.currentTime = 0;
      audio.play().catch(function(){ updatePlayButton(); });
    } else if (playMode === 'shuffle') {
      var randomIndex = Math.floor(Math.random() * songs.length);
      loadSong(randomIndex, true);
    } else {
      loadSong(currentSongIndex + 1, true);
    }
  });

  // 进入页面不自动播放，仅预载第一首用于显示时长
  loadSong(0, false);

  // ===== 音量控制与静音逻辑 =====
  var muteBtn = document.getElementById('muteBtn');
  var volumeBar = document.getElementById('volumeBar');
  var previousVolume = 0.5;

  audio.volume = volumeBar.value;
  previousVolume = audio.volume;

  muteBtn.addEventListener('click', function() {
    if (audio.muted) {
      audio.muted = false;
      volumeBar.value = previousVolume;
      audio.volume = previousVolume;
      muteBtn.innerText = '🔊';
      muteBtn.classList.remove('muted');
    } else {
      previousVolume = audio.volume;
      audio.muted = true;
      audio.volume = 0;
      volumeBar.value = 0;
      muteBtn.innerText = '🔇';
      muteBtn.classList.add('muted');
    }
  });

  volumeBar.addEventListener('input', function() {
    var val = parseFloat(this.value);
    audio.volume = val;
    audio.muted = false;
    if (val > 0) {
      muteBtn.innerText = '🔊';
      muteBtn.classList.remove('muted');
      previousVolume = val;
    } else {
      muteBtn.innerText = '🔇';
      muteBtn.classList.add('muted');
    }
  });

  // ===== 悬浮播放器开关与首次开启确认 =====
  var musicFloatBtn = document.getElementById('musicFloatBtn');
  var musicFloatBtnM = document.getElementById('musicFloatBtnM');
  var musicPanel = document.getElementById('musicPanel');
  var musicModal = document.getElementById('musicModal');
  var musicConfirmBtn = document.getElementById('musicConfirmBtn');
  var musicCancelBtn = document.getElementById('musicCancelBtn');
  var musicEnabled = false;

  function openMusicModal() {
    if (musicModal) musicModal.classList.add('open');
  }
  function closeMusicModal() {
    if (musicModal) musicModal.classList.remove('open');
  }
  function enableMusic() {
    musicEnabled = true;
    closeMusicModal();
    loadSong(0, true);
    if (musicPanel) musicPanel.classList.add('open');
  }

  if (musicConfirmBtn) {
    musicConfirmBtn.addEventListener('click', enableMusic);
  }
  if (musicCancelBtn) {
    musicCancelBtn.addEventListener('click', closeMusicModal);
  }

  if (musicFloatBtn && musicPanel) {
    musicFloatBtn.addEventListener('click', function() {
      if (!musicEnabled) {
        openMusicModal();
        return;
      }
      musicPanel.classList.toggle('open');
    });
    if (musicFloatBtnM) {
      musicFloatBtnM.addEventListener('click', function() {
        if (!musicEnabled) {
          openMusicModal();
          return;
        }
        musicPanel.classList.toggle('open');
      });
    }
    document.addEventListener('click', function(e) {
      if (musicPanel.classList.contains('open') &&
          !musicPanel.contains(e.target) &&
          !musicFloatBtn.contains(e.target) &&
          !(musicFloatBtnM && musicFloatBtnM.contains(e.target)) &&
          !(musicModal && musicModal.contains(e.target))) {
        musicPanel.classList.remove('open');
      }
    });
  }

  // ===== 缩放功能 =====
  var currentScale = 1;
  var MIN_SCALE = 0.5;
  var MAX_SCALE = 3.0;
  var bodyEl = document.body;

  document.addEventListener('wheel', function(e) {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      var delta = e.deltaY > 0 ? -0.1 : 0.1;
      currentScale += delta;
      currentScale = Math.min(Math.max(MIN_SCALE, currentScale), MAX_SCALE);
      bodyEl.style.transform = 'scale(' + currentScale + ')';
    }
  }, { passive: false });

  var lastTouchDist = 0;
  var initialScale = 1;

  document.addEventListener('touchstart', function(e) {
    if (e.touches.length === 2) {
      var dx = e.touches[0].clientX - e.touches[1].clientX;
      var dy = e.touches[0].clientY - e.touches[1].clientY;
      lastTouchDist = Math.sqrt(dx * dx + dy * dy);
      initialScale = currentScale;
    }
  }, { passive: true });

  document.addEventListener('touchmove', function(e) {
    if (e.touches.length === 2) {
      e.preventDefault();
      var dx = e.touches[0].clientX - e.touches[1].clientX;
      var dy = e.touches[0].clientY - e.touches[1].clientY;
      var currentDist = Math.sqrt(dx * dx + dy * dy);
      
      if (lastTouchDist > 0) {
        var newScale = initialScale * (currentDist / lastTouchDist);
        currentScale = Math.min(Math.max(MIN_SCALE, newScale), MAX_SCALE);
        bodyEl.style.transform = 'scale(' + currentScale + ')';
      }
    }
  }, { passive: false });

