    // Role-based access control
    const USER_ROLE = document.body.getAttribute('data-role') || 'admin';
    const IS_VIEWER = USER_ROLE === 'viewer';

    function guardWrite(action) {
      if (IS_VIEWER) {
        showToast('View-only access. Contact admin for changes.', 'error');
        return true; // blocked
      }
      return false; // allowed
    }

    // Account-specific media endpoints, injected by the page frontmatter
    // (window.VLH_MEDIA). Empty/missing values degrade to raw URLs.
    const MEDIA_CFG = window.VLH_MEDIA || {};

    // Portfolio category labels (canonical list: src/lib/portfolio-copy.ts)
    const serviceLabels = {
      'kitchen_remodel': 'Kitchen Remodeling',
      'bathroom_remodel': 'Bathroom Remodeling',
      'interior_painting': 'Interior Painting',
      'flooring': 'Flooring',
      'general_repairs': 'General Repairs & Handyman',
      'other': 'Other'
    };

    function formatDate(dateStr) {
      if (!dateStr) return 'N/A';
      try {
        return new Date(dateStr).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        });
      } catch {
        return dateStr;
      }
    }

    function formatServices(servicesJson) {
      if (!servicesJson) return 'Home Services';
      try {
        const services = JSON.parse(servicesJson);
        return services.map(s => {
          const key = typeof s === 'string' ? s : (s.type || s.service || 'service');
          return serviceLabels[key] || key;
        }).join(', ');
      } catch {
        return servicesJson || 'Home Services';
      }
    }

    // =====================================================
    // FILTER AND SEARCH
    // =====================================================
    const filterTabs = document.querySelectorAll('.filter-tab:not(#portfolioLoadMore)');
    const galleryCards = document.querySelectorAll('.gallery-card');
    const searchInput = document.getElementById('searchInput');
    const noResults = document.getElementById('noResults');
    const loadMoreBtn = document.getElementById('portfolioLoadMore');
    let currentFilter = 'all';
    const ADMIN_PAGE = 24;
    let adminShown = ADMIN_PAGE;

    filterTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        filterTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        currentFilter = tab.dataset.filter;
        adminShown = ADMIN_PAGE; // reset paging when the filter changes
        applyFilters();
      });
    });

    if (searchInput) searchInput.addEventListener('input', () => { adminShown = ADMIN_PAGE; applyFilters(); });
    if (loadMoreBtn) loadMoreBtn.addEventListener('click', () => { adminShown += ADMIN_PAGE; applyFilters(); });

    // Show first `adminShown` cards that match the active tab + search; reveal
    // the rest in pages via "Load more". Keeps the DOM light as portfolios grow.
    function applyFilters() {
      const query = (searchInput ? searchInput.value : '').toLowerCase().trim();
      let matchCount = 0;

      galleryCards.forEach(card => {
        const type = card.dataset.type;
        const searchData = card.dataset.search || '';

        const matchesFilter = currentFilter === 'all' || type === currentFilter;
        const matchesSearch = query === '' || searchData.includes(query);

        if (matchesFilter && matchesSearch) {
          matchCount++;
          card.classList.toggle('hidden', matchCount > adminShown);
        } else {
          card.classList.add('hidden');
        }
      });

      if (noResults) noResults.classList.toggle('visible', matchCount === 0);
      if (loadMoreBtn) loadMoreBtn.style.display = matchCount > adminShown ? '' : 'none';
    }
    // Only run on the LIST page (these elements are absent on the detail page,
    // where this same script also loads — an unguarded call there throws and
    // aborts the whole IIFE before later state initializes).
    if (galleryCards.length) applyFilters();

    // =====================================================
    // CREATE PORTFOLIO MODAL
    // =====================================================
    const createModal = document.getElementById('createModal');

    function openCreateModal() {
      if (guardWrite()) return;
      createModal.classList.add('show');
      document.getElementById('projectName').focus();
    }
    window.openCreateModal = openCreateModal;

    function closeCreateModal() {
      createModal.classList.remove('show');
      document.getElementById('createPortfolioForm').reset();
      document.getElementById('clientInfoSection').classList.remove('open');
      document.querySelector('.collapsible-toggle').classList.remove('open');
    }
    window.closeCreateModal = closeCreateModal;

    function toggleClientInfo() {
      const section = document.getElementById('clientInfoSection');
      const toggle = document.querySelector('.collapsible-toggle');
      section.classList.toggle('open');
      toggle.classList.toggle('open');
    }
    window.toggleClientInfo = toggleClientInfo;

    async function createPortfolio() {
      const btn = document.getElementById('createBtn');
      btn.disabled = true;
      btn.textContent = 'Creating...';

      try {
        const data = {
          project_name: document.getElementById('projectName').value,
          project_type: document.getElementById('projectType').value,
          description: document.getElementById('projectDescription').value,
          client_name: document.getElementById('clientName').value,
          client_email: document.getElementById('clientEmail').value,
          client_phone: document.getElementById('clientPhone').value,
          client_city: document.getElementById('clientCity').value
        };

        const response = await fetch('/api/manual-portfolios/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });

        const result = await response.json();

        if (result.success) {
          showToast('Portfolio created! Add images now.', 'success');
          closeCreateModal();
          // Navigate to the new portfolio's editor sub-page.
          window.location.href = '/admin/portfolios/' + result.portfolio_id + '/';
        } else {
          showToast(result.error || 'Failed to create', 'error');
        }
      } catch (err) {
        showToast('Failed to create portfolio', 'error');
      } finally {
        btn.disabled = false;
        btn.textContent = 'Create Portfolio';
      }
    }
    window.createPortfolio = createPortfolio;

    // =====================================================
    // MANUAL PORTFOLIO DETAIL
    // =====================================================
    const manualDetailModal = document.getElementById('manualDetailModal');
    const manualDetailContent = document.getElementById('manualDetailContent');
    let currentManualId = null;
    let currentMedia = [];
    const MEDIA_PAGE = 60;            // editor media grid renders in chunks
    let mediaRenderLimit = MEDIA_PAGE; // bumped by "Load more" (see showMoreMedia)

    // Resolve a media row to an optimized image URL. Use the Cloudflare Images
    // variant whenever we have an ID (especially important for HEIC originals,
    // which browsers can't render but CF Images serves as JPEG/WebP). Videos
    // and missing IDs fall back to the raw R2 URL.
    function mediaImgUrl(m, variant) {
      if (!m) return '';
      const v = variant || 'w=400,q=75,f=auto';
      if (m.media_type === 'video') return m.media_url;
      if (m.cloudflare_image_id && MEDIA_CFG.imagesBase) {
        return `${MEDIA_CFG.imagesBase}/${m.cloudflare_image_id}/${v}`;
      }
      return m.media_url;
    }
    function mediaFullUrl(m) {
      // Lightbox/full-view variant — larger but still serves HEIC properly
      return mediaImgUrl(m, 'w=1600,q=85,f=auto');
    }
    // Cloudflare Stream poster for a video tile — a ~9KB JPG instead of
    // downloading the whole video to grab a frame. Falls back to the raw URL.
    function mediaPoster(m) {
      if (m && m.stream_uid && MEDIA_CFG.streamSubdomain) return 'https://' + MEDIA_CFG.streamSubdomain + '/' + m.stream_uid + '/thumbnails/thumbnail.jpg?time=1s&height=400';
      return (m && m.media_url) || '';
    }
    // A safe video thumbnail for grids: Stream poster (a ~9KB JPG) when the
    // video is in Stream, otherwise a static play tile. NEVER a raw <video> —
    // several full .mov decoders in one tab make the browser run out of memory
    // ("Aww snap"). opts: { cls, onclick }.
    function videoTile(m, opts) {
      opts = opts || {};
      var cls = opts.cls || '';
      var oc = opts.onclick ? (' onclick="' + opts.onclick + '"') : '';
      if (m && m.stream_uid) {
        return '<img class="' + cls + '" src="' + mediaPoster(m) + '" alt="Video" loading="lazy"' + oc + ' style="width:100%;height:100%;object-fit:cover;background:#1e293b;" onerror="this.style.opacity=0.01" />';
      }
      return '<div class="' + cls + '"' + oc + ' style="display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#1e293b,#334155);width:100%;height:100%;"><svg width="34" height="34" viewBox="0 0 24 24" fill="#fff"><polygon points="6 4 20 12 6 20 6 4"/></svg></div>';
    }
    // Wrap a raw R2 URL in Cloudflare's on-the-fly resize so grids never load a
    // full-resolution original. Only rewrites our own origin; passes others through.
    function cdnThumb(url, opts) {
      if (!url) return '';
      try {
        var u = new URL(url, location.origin);
        return u.origin + '/cdn-cgi/image/' + (opts || 'width=500,quality=75,format=auto') + u.pathname;
      } catch (e) { return url; }
    }

    // Reveal the next chunk of media tiles in the editor grid.
    window.showMoreMedia = function() {
      mediaRenderLimit += MEDIA_PAGE;
      if (currentManualId != null) renderManualDetail(currentManualId);
    };

    async function openManualDetail(id) {
      currentManualId = id;
      mediaRenderLimit = MEDIA_PAGE; // reset chunked media paging per portfolio
      manualDetailModal.classList.add('show');

      // Reset pair selection state
      pairSelectionMode = false;
      selectedBeforeId = null;
      selectedAfterId = null;

      // Reset gallery selection state
      gallerySelectionMode = false;

      // Show loading state
      manualDetailContent.innerHTML = `
        <div class="detail-loading">
          <div class="spinner"></div>
          <p>Loading portfolio...</p>
        </div>
      `;

      // Fetch media, pairs, and gallery items for this portfolio
      try {
        const [mediaResponse, pairsResponse, galleryResponse] = await Promise.all([
          fetch(`/api/manual-portfolios/${id}/media/`),
          fetch(`/api/manual-portfolios/${id}/pairs/`),
          fetch(`/api/manual-portfolios/${id}/gallery/`)
        ]);

        const mediaData = await mediaResponse.json();
        const pairsData = await pairsResponse.json();
        const galleryData = await galleryResponse.json();

        if (mediaData.success) {
          currentMedia = mediaData.media || [];
        }
        if (pairsData.success) {
          currentPairs = pairsData.pairs || [];
        }
        if (galleryData.success) {
          currentGalleryItems = galleryData.items || [];
        }

        renderManualDetail(id, mediaData.portfolio_name);
      } catch (err) {
        console.error('Failed to fetch data:', err);
        currentMedia = [];
        currentPairs = [];
        currentGalleryItems = [];
        renderManualDetail(id);
      }
    }
    window.openManualDetail = openManualDetail;

    function renderManualDetail(id, fetchedName = null) {
      const card = document.querySelector(`[data-id="manual-${id}"]`);

      // For newly created portfolios, card may not exist yet
      let portfolio;
      if (card) {
        portfolio = JSON.parse(card.dataset.portfolio);
      } else {
        // Fallback for new portfolios - create minimal object
        portfolio = {
          project_name: fetchedName || 'New Portfolio',
          project_type: 'other',
          description: '',
          client_name: '',
          client_email: '',
          client_phone: '',
          client_city: '',
          slug: generateSlug(fetchedName || 'new-portfolio'),
          is_published: 0,
          display_mode: 'pairs'
        };
      }

      // Ensure display_mode exists (for existing portfolios)
      if (!portfolio.display_mode) {
        portfolio.display_mode = 'pairs';
      }

      // Ensure slug exists
      if (!portfolio.slug) {
        portfolio.slug = generateSlug(portfolio.project_name);
      }

      // Build media grid with pair indicators
      let mediaHtml = '';
      if (currentMedia.length > 0) {
        const gridClass = pairSelectionMode ? 'media-grid selection-mode' : 'media-grid';
        // Gallery-related affordances (in-gallery purple border, cover star)
        // apply to BOTH gallery and combined modes — combined mode also
        // shows an explicit gallery list, just alongside pairs.
        const isGalleryMode = portfolio.display_mode === 'gallery';
        const showsGallery = portfolio.display_mode === 'gallery' || portfolio.display_mode === 'combined';
        const showsPairs   = portfolio.display_mode === 'pairs'   || portfolio.display_mode === 'combined';
        mediaHtml = `<div class="${gridClass}">
          ${currentMedia.slice(0, mediaRenderLimit).map(m => {
            const isVideo = m.media_type === 'video';
            const pairInfo = getPairInfo(m.id);
            const galleryInfo = getGalleryInfo(m.id);
            const isPaired = !!pairInfo;
            const isInGallery = !!galleryInfo;
            const isSelectedBefore = selectedBeforeId === m.id;
            const isSelectedAfter = selectedAfterId === m.id;

            // Build classes — paired (green/blue border) and in-gallery (purple
            // border) can both coexist visually in combined mode.
            let itemClasses = 'media-item';
            if (showsGallery && isInGallery) {
              itemClasses += ' in-gallery';
              // Cover badge is only meaningful in gallery-only mode;
              // combined mode's cover comes from the starred pair.
              if (isGalleryMode && galleryInfo.isCover) itemClasses += ' is-cover';
            }
            if (showsPairs && isPaired) {
              itemClasses += ' paired';
              itemClasses += pairInfo.type === 'Before' ? ' before-image' : ' after-image';
            }
            if (isSelectedBefore) itemClasses += ' selected-before';
            if (isSelectedAfter) itemClasses += ' selected-after';

            // Click handler precedence:
            //   1. Pair-selection mode → toggle as before/after candidate
            //   2. Gallery-selection mode → toggle inclusion in gallery
            //   3. Otherwise → open in lightbox
            const canSelectForPair = showsPairs && pairSelectionMode && !isPaired && !isVideo;
            const canSelectForGallery = showsGallery && gallerySelectionMode && !isInGallery;
            const isSelectedForGallery = selectedForGallery.has(m.id);
            let clickHandler;
            if (canSelectForPair) {
              clickHandler = `selectMediaForPair(${m.id})`;
            } else if (canSelectForGallery) {
              clickHandler = `toggleGallerySelection(${m.id})`;
              if (isSelectedForGallery) itemClasses += ' gallery-selected';
            } else {
              clickHandler = `openLightbox('${mediaFullUrl(m)}', ${isVideo})`;
            }

            // Add is-video class for video indicator in selection mode
            if (isVideo) {
              itemClasses += ' is-video';
            }

            // Badge HTML. In combined mode an item could in theory have both
            // a pair badge AND a gallery badge — pairs take precedence so the
            // card always reads cleanly. Cover star only renders for the
            // gallery-only mode (combined uses pair cover).
            let badgeHtml = '';
            if (showsPairs && isPaired) {
              const badgeClass = pairInfo.type === 'Before' ? 'before' : 'after';
              badgeHtml = `
                <div class="pair-badge ${badgeClass}">
                  <span class="pair-num">Pair ${pairInfo.pairIndex}</span>
                  <span class="pair-type">${pairInfo.type}</span>
                </div>
              `;
            } else if (isSelectedBefore) {
              badgeHtml = `<div class="pair-badge before"><span class="pair-type">Before</span></div>`;
            } else if (isSelectedAfter) {
              badgeHtml = `<div class="pair-badge after"><span class="pair-type">After</span></div>`;
            } else if (showsGallery && isInGallery) {
              badgeHtml = `
                <div class="gallery-badge">
                  <span class="gallery-num">Gallery ${galleryInfo.galleryIndex}</span>
                  ${isGalleryMode && galleryInfo.isCover ? '<span class="gallery-star">⭐</span>' : ''}
                </div>
              `;
            }

            const showDeleteBtn = !pairSelectionMode && !gallerySelectionMode;

            // For videos, use video element for thumbnail (simple, always works)
            // Cover-star on the media card itself, only in gallery-only mode
            // (combined mode's cover comes from the chosen before/after pair).
            // Click the star to toggle this image as the gallery cover.
            const showCoverStar = isGalleryMode && isInGallery && !pairSelectionMode && !gallerySelectionMode;
            const coverStarHtml = showCoverStar ? `
              <button class="media-cover-btn ${galleryInfo.isCover ? 'is-cover' : ''}"
                      onclick="event.stopPropagation(); setCoverGalleryItem(${galleryInfo.galleryItemId})"
                      title="${galleryInfo.isCover ? 'Cover image' : 'Set as cover'}">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="${galleryInfo.isCover ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                </svg>
              </button>
            ` : '';

            return `
              <div class="${itemClasses}" onclick="${clickHandler}">
                ${isVideo
                  ? `${videoTile(m)}<span class="media-video-badge">Video</span>`
                  : `<img src="${mediaImgUrl(m)}" alt="Portfolio media" loading="lazy" />`
                }
                ${badgeHtml}
                <button class="media-copy-btn" onclick="copyMediaUrl('${isVideo ? m.media_url : mediaFullUrl(m)}', event)" title="Copy media URL">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                </button>
                ${coverStarHtml}
                ${showDeleteBtn ? `
                  <button class="media-delete-btn" onclick="deleteMedia(${id}, ${m.id}, event)" title="Delete">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <line x1="18" y1="6" x2="6" y2="18"/>
                      <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                ` : ''}
              </div>
            `;
          }).join('')}
        </div>`;
        // Chunked rendering: only the first `mediaRenderLimit` tiles are in the
        // DOM; reveal more on demand so portfolios with hundreds of photos stay
        // responsive.
        if (currentMedia.length > mediaRenderLimit) {
          const remaining = currentMedia.length - mediaRenderLimit;
          mediaHtml += `<div style="text-align:center; margin-top:12px;">
            <button class="btn-secondary" onclick="showMoreMedia()">Load more (${remaining} more)</button>
          </div>`;
        }
      } else {
        mediaHtml = `<div class="empty-media">No images or videos yet. Use the upload area above to add some!</div>`;
      }

      // Selection mode hint
      let selectionHintHtml = '';
      if (pairSelectionMode) {
        const step1Class = selectedBeforeId ? 'before' : 'pending';
        const step2Class = selectedAfterId ? 'after' : 'pending';
        selectionHintHtml = `
          <div class="selection-hint">
            <span class="step ${step1Class}">1</span>
            <span>${selectedBeforeId ? 'Before selected' : 'Select BEFORE image'}</span>
            <span class="step ${step2Class}">2</span>
            <span>${selectedAfterId ? 'After selected' : 'Select AFTER image'}</span>
            <button class="btn btn-sm btn-secondary btn-cancel-selection" onclick="exitPairSelectionMode()">Cancel</button>
          </div>
        `;
      }

      // Build pairs list
      let pairsHtml = '';
      if (currentPairs.length > 0) {
        pairsHtml = `<div class="pairs-list">
          ${currentPairs.map((pair, idx) => {
            const isCover = pair.is_cover === 1;
            return `
              <div class="pair-item ${isCover ? 'is-cover' : ''}">
                <div class="pair-images">
                  <img class="pair-thumb before" src="${cdnThumb(pair.before_url)}" alt="Before" loading="lazy" />
                  <span class="pair-arrow">→</span>
                  <img class="pair-thumb after" src="${cdnThumb(pair.after_url)}" alt="After" loading="lazy" />
                </div>
                <div class="pair-info">
                  <div class="pair-title">${pair.title || 'Pair ' + (idx + 1)}</div>
                  ${pair.description ? `<div class="pair-desc">${pair.description}</div>` : ''}
                  ${isCover ? `<div class="pair-cover-badge">⭐ Cover Pair</div>` : ''}
                </div>
                <div class="pair-actions">
                  <button class="pair-btn-cover ${isCover ? 'active' : ''}" onclick="setCoverPair(${pair.id})" title="${isCover ? 'Cover pair' : 'Set as cover'}">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                    </svg>
                  </button>
                  <button class="pair-btn-delete" onclick="deletePair(${pair.id})" title="Delete pair">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                </div>
              </div>
            `;
          }).join('')}
        </div>`;
      } else {
        pairsHtml = `<div class="empty-pairs">
          No pairs created yet. Select a before and after image to create your first pair.
        </div>`;
      }

      // Gallery selection hint (with batch add button)
      const selectedCount = selectedForGallery.size;
      const gallerySelectionHtml = gallerySelectionMode ? `
        <div class="selection-hint">
          <span>${selectedCount > 0 ? `${selectedCount} selected` : 'Tap images to select them'}</span>
          <div style="display: flex; gap: 8px;">
            ${selectedCount > 0 ? `
              <button class="btn btn-sm btn-success" onclick="addSelectedToGallery()">
                Add ${selectedCount} to Gallery
              </button>
            ` : ''}
            <button class="btn btn-sm btn-secondary" onclick="exitGallerySelectionMode()">Cancel</button>
          </div>
        </div>
      ` : '';

      // Gallery items HTML
      let galleryItemsHtml = '';
      if (currentGalleryItems.length > 0) {
        galleryItemsHtml = `<div class="gallery-items-list">
          ${currentGalleryItems.map((item, idx) => {
            const isCover = item.is_cover === 1;
            const thumbUrl = mediaImgUrl(item);
            const fullUrl = mediaFullUrl(item);
            const isVideo = item.media_type === 'video';
            const thumbHtml = isVideo
              ? `${videoTile(item, { cls: 'gallery-thumb', onclick: "openLightbox('" + item.media_url + "', true)" })}<span class="gallery-video-badge">Video</span>`
              : `<img class="gallery-thumb" src="${thumbUrl}" alt="${item.title || 'Gallery image'}" onclick="openLightbox('${fullUrl}')" loading="lazy" />`;
            return `
              <div class="gallery-item ${isCover ? 'is-cover' : ''}">
                <div class="gallery-thumb-wrap">${thumbHtml}</div>
                <div class="gallery-info">
                  <div class="gallery-title">${item.title || (isVideo ? 'Video' : 'Image') + ' ' + (idx + 1)}</div>
                  ${item.description ? `<div class="gallery-desc">${item.description}</div>` : ''}
                  ${isCover && portfolio.display_mode !== 'combined' ? `<div class="gallery-cover-badge">⭐ Cover</div>` : ''}
                </div>
                <div class="gallery-actions">
                  ${portfolio.display_mode === 'combined' ? '' : `
                    <button class="gallery-btn-cover ${isCover ? 'active' : ''}" onclick="setCoverGalleryItem(${item.id})" title="${isCover ? 'Cover image' : 'Set as cover'}">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                      </svg>
                    </button>
                  `}
                  <button class="gallery-btn-delete" onclick="removeFromGallery(${item.id})" title="Remove from gallery">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                </div>
              </div>
            `;
          }).join('')}
        </div>`;
      } else {
        galleryItemsHtml = `<div class="empty-gallery">
          No images in gallery yet. Tap "Add to Gallery" to add your first image.
        </div>`;
      }

      // Unpaired media HTML for combined mode
      let unpairedMediaHtml = '';
      const pairedMediaIds = new Set();
      currentPairs.forEach(p => {
        pairedMediaIds.add(p.before_media_id);
        pairedMediaIds.add(p.after_media_id);
      });
      const unpairedMedia = currentMedia.filter(m => !pairedMediaIds.has(m.id));
      if (unpairedMedia.length === 0) {
        unpairedMediaHtml = '<p style="color: var(--color-text-secondary); font-size: 14px;">All media is paired. Add more photos to show individual gallery items.</p>';
      } else {
        const itemsHtml = unpairedMedia.map(m => {
          const isVideo = m.media_type === 'video';
          if (isVideo) {
            return '<div class="gallery-item-preview">' + videoTile(m, { cls: 'gallery-thumb' }) + '<span class="gallery-video-badge">Video</span></div>';
          } else {
            return '<div class="gallery-item-preview"><img src="' + mediaImgUrl(m) + '" class="gallery-thumb" alt=""></div>';
          }
        }).join('');
        unpairedMediaHtml = '<p style="color: var(--color-text-secondary); font-size: 14px; margin-bottom: 12px;">' + unpairedMedia.length + ' item(s) will automatically appear as gallery photos on the public page.</p><div class="gallery-items-grid">' + itemsHtml + '</div>';
      }

      // Publishing section - works with all modes
      const isPublished = portfolio.is_published === 1;
      // For combined mode: need either pairs OR unpaired media
      // For pairs mode: need pairs
      // For gallery mode: need gallery items
      let canPublish;
      let publishRequirement;
      if (portfolio.display_mode === 'combined') {
        // Combined mode: need at least 1 pair OR at least 1 admin-added gallery item
        canPublish = currentPairs.length > 0 || currentGalleryItems.length > 0;
        publishRequirement = 'Create a before/after pair or add items to the gallery to publish';
      } else if (portfolio.display_mode === 'pairs') {
        canPublish = currentPairs.length > 0;
        publishRequirement = 'Create at least 1 before/after pair to publish';
      } else {
        canPublish = currentGalleryItems.length > 0;
        publishRequirement = 'Add at least 1 image to the gallery to publish';
      }
      const publishHtml = `
        <div class="publish-section">
          <div class="publish-url-preview">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
            </svg>
            <span class="url-domain">mannyknows.com/projects/</span>
            <span class="url-slug">${portfolio.slug}</span>
          </div>
          <div class="publish-status">
            <span class="status-dot ${isPublished ? 'published' : 'draft'}"></span>
            <span class="status-label">${isPublished ? 'Published' : 'Draft'}</span>
            ${isPublished
              ? `<button class="btn btn-sm btn-secondary" onclick="togglePublish(${id}, false)">Unpublish</button>`
              : `<button class="btn btn-sm btn-success" onclick="togglePublish(${id}, true)" ${!canPublish ? 'disabled' : ''}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4 20-7z"/>
                  </svg>
                  Publish to Website
                </button>`
            }
          </div>
          ${!canPublish ? `<p class="publish-note">⚠️ ${publishRequirement}</p>` : ''}
          ${isPublished ? `<p class="publish-note">✅ Live at <a href="/projects/${portfolio.slug}" target="_blank" style="color: #22c55e;">mannyknows.com/projects/${portfolio.slug}</a></p>` : ''}
        </div>
      `;

      manualDetailContent.innerHTML = `
        <div class="mobile-close-header">
          <span class="modal-title">${portfolio.project_name}</span>
          <button class="mobile-close-btn" onclick="closeManualDetail()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div class="detail-header">
          <div class="detail-title-group">
            <select class="card-type-select" onchange="setPortfolioCategory(${id}, this.value)" title="Project category">
              ${['kitchen_remodel','bathroom_remodel','interior_painting','flooring','general_repairs','other'].map(k => `<option value="${k}"${portfolio.project_type === k ? ' selected' : ''}>${serviceLabels[k] || k}</option>`).join('')}
            </select>
            <h2 class="editable-field" onclick="startEditName(${id}, this)" title="Click to edit name">
              <span>${portfolio.project_name}</span>
              <svg class="edit-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
            </h2>
            <div class="detail-meta">
              Created ${formatDate(portfolio.created_at)}
              ${portfolio.client_city ? ` • ${portfolio.client_city}` : ''}
            </div>
          </div>
          <button class="btn btn-primary btn-close-desktop" onclick="closeManualDetail()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div class="detail-body">
          <!-- AI Polish: rewrites title + description in one shot from the
               portfolio context + an optional admin guidance note. Replaces
               both fields immediately (admin can edit after). -->
          <div class="detail-section" id="polishSection-${id}" style="background: linear-gradient(135deg, rgba(0,123,255,0.06) 0%, rgba(99,102,241,0.06) 50%, rgba(255, 79, 170,0.06) 100%); border: 1px solid var(--glass-border); border-radius: var(--radius-lg); padding: 16px 18px;">
            <div style="display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap; margin-bottom: 10px;">
              <h3 class="detail-section-title" style="margin: 0;">✨ AI Polish</h3>
              <button
                class="btn btn-sm"
                id="polishBtn-${id}"
                onclick="polishPortfolio(${id})"
                style="background: linear-gradient(135deg, #007bff, #6366f1, #ff4faa); color: #fff; border: none; padding: 8px 16px; border-radius: var(--radius-md); font-weight: 600; cursor: pointer; box-shadow: 0 2px 8px rgba(0, 123, 255, 0.3);"
              >
                Polish Title + Description
              </button>
            </div>
            <textarea
              id="polishNote-${id}"
              class="form-input"
              rows="2"
              placeholder="Optional: guidance for the AI (e.g. 'emphasize the color change' or 'mention the rotted trim repair')"
              style="resize: vertical; min-height: 56px; font-size: 13px;"
            ></textarea>
            <p style="font-size: 11px; color: var(--color-text-secondary); margin: 6px 0 0 0;">
              Rewrites the title and description below using project context + your note. You can still edit after.
            </p>
          </div>

          <div class="detail-section">
            <h3 class="detail-section-title">Description</h3>
            ${portfolio.description ? `
              <p class="editable-field" onclick="startEditDescription(${id}, this)" title="Click to edit description" style="color: var(--color-text-primary); line-height: 1.6;">
                <span>${portfolio.description}</span>
                <svg class="edit-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
              </p>
            ` : `
              <p class="editable-field" onclick="startEditDescription(${id}, this)" title="Click to add description" style="color: var(--color-text-secondary); line-height: 1.6; font-style: italic;">
                <span>Click to add description...</span>
                <svg class="edit-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>
              </p>
            `}
          </div>

          ${portfolio.source_project_id ? `
            <details class="detail-section" id="sourceProjectSection-${id}" style="border: 1px solid var(--glass-border); border-radius: var(--radius-lg); padding: 14px 18px; background: rgba(255,255,255,0.02);">
              <summary style="cursor: pointer; font-size: 14px; font-weight: 600; color: var(--color-text-primary); display: flex; align-items: center; gap: 8px; list-style: none;">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
                Original Project Details
                <span style="font-size: 11px; color: var(--color-text-secondary); font-weight: 400; margin-left: auto;">Click to expand</span>
              </summary>
              <div id="sourceProjectContent-${id}" style="margin-top: 14px; padding-top: 14px; border-top: 1px dashed var(--glass-border);">
                <div style="text-align: center; padding: 20px; color: var(--color-text-secondary); font-size: 13px;">Loading…</div>
              </div>
            </details>
          ` : ''}

          <div class="detail-section">
            <h3 class="detail-section-title">Display Mode</h3>
            <div class="mode-toggle" style="display: flex; gap: 8px; margin-bottom: 12px; flex-wrap: wrap;">
              <button
                class="mode-btn ${portfolio.display_mode === 'pairs' ? 'active' : ''}"
                onclick="setDisplayMode(${id}, 'pairs')"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="2" y="3" width="8" height="18" rx="1"/><rect x="14" y="3" width="8" height="18" rx="1"/>
                </svg>
                Before/After
              </button>
              <button
                class="mode-btn ${portfolio.display_mode === 'gallery' ? 'active' : ''}"
                onclick="setDisplayMode(${id}, 'gallery')"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                  <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
                </svg>
                Gallery Only
              </button>
              <button
                class="mode-btn ${portfolio.display_mode === 'combined' ? 'active' : ''}"
                onclick="setDisplayMode(${id}, 'combined')"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="2" y="3" width="6" height="9" rx="1"/><rect x="10" y="3" width="6" height="9" rx="1"/>
                  <rect x="2" y="14" width="4" height="4"/><rect x="8" y="14" width="4" height="4"/><rect x="14" y="14" width="4" height="4"/>
                </svg>
                Combined
              </button>
            </div>
            <p style="font-size: 12px; color: var(--color-text-secondary); margin-bottom: 0;">
              ${portfolio.display_mode === 'pairs'
                ? 'Before/After mode: Create side-by-side comparisons'
                : portfolio.display_mode === 'gallery'
                  ? 'Gallery mode: Showcase individual finished photos'
                  : 'Combined mode: Before/After pairs + unpaired photos shown as gallery'
              }
            </p>
          </div>

          <div class="detail-section">
            <h3 class="detail-section-title">Add Photos & Videos</h3>
            <div class="upload-area" id="uploadArea" onclick="triggerFileInput()">
              <svg class="upload-area-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21 15 16 10 5 21"/>
              </svg>
              <p class="upload-area-text">Tap to add photos or videos</p>
              <p class="upload-area-hint">JPG, PNG, MP4 - Original quality preserved</p>
            </div>
            <div class="upload-progress-list" id="uploadProgress"></div>
          </div>

          <div class="detail-section">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; gap: 8px; flex-wrap: wrap;">
              <h3 class="detail-section-title" style="margin-bottom: 0;">Media (${currentMedia.length})</h3>
              <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                ${(portfolio.display_mode === 'pairs' || portfolio.display_mode === 'combined') && !pairSelectionMode && currentMedia.length >= 2 ? `
                  <button class="btn btn-sm btn-primary" onclick="enterPairSelectionMode()">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    Create Pair
                  </button>
                ` : ''}
                ${(portfolio.display_mode === 'gallery' || portfolio.display_mode === 'combined') && !gallerySelectionMode && currentMedia.length >= 1 ? `
                  <button class="btn btn-sm btn-primary" onclick="enterGallerySelectionMode()">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    Add to Gallery
                  </button>
                ` : ''}
              </div>
            </div>
            ${pairSelectionMode ? selectionHintHtml : (gallerySelectionMode ? gallerySelectionHtml : '')}
            <p style="font-size: 12px; color: var(--color-text-secondary); margin-bottom: 12px;">
              ${pairSelectionMode
                ? 'Tap unpaired images to select them. Green border = Before, Blue border = After'
                : gallerySelectionMode
                  ? 'Tap images to add them to the gallery'
                  : portfolio.display_mode === 'pairs'
                    ? 'Tap to view full size. Green = Before, Blue = After'
                    : portfolio.display_mode === 'gallery'
                      ? 'Tap to view full size. Purple border = In Gallery. Tap the star on a gallery item to set it as the cover.'
                      : 'Tap to view full size. Green/Blue = paired (Before/After). Purple = in gallery. Cover comes from the starred pair below.'
              }
            </p>
            ${mediaHtml}
          </div>

          ${(portfolio.display_mode === 'pairs' || portfolio.display_mode === 'combined') ? `
          <div class="detail-section">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
              <h3 class="detail-section-title" style="margin-bottom: 0;">Before/After Pairs (${currentPairs.length})</h3>
            </div>
            ${pairsHtml}
          </div>
          ` : ''}

          <div class="detail-section">
            <h3 class="detail-section-title">Publishing</h3>
            ${publishHtml}
          </div>

          <div class="detail-actions-bottom">
            <button class="btn btn-sm btn-danger" onclick="confirmDeletePortfolio(${id}, '${portfolio.project_name.replace(/'/g, "\\'")}')">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              </svg>
              Delete Portfolio
            </button>
            <button class="btn btn-sm btn-success" onclick="downloadAll(${id})">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Download
            </button>
            <button class="btn btn-sm btn-primary" onclick="closeManualDetail()">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              Done
            </button>
          </div>
        </div>
      `;

      // Setup drag and drop
      setupDragDrop();

      // For portfolios promoted from projects, lazy-load the original
      // project's details (services, scope, attachments, contract PDF,
      // every project_updates row) on the first time the <details> opens.
      // We don't fetch eagerly because most portfolio edits don't need it.
      if (portfolio.source_project_id) {
        const section = document.getElementById(`sourceProjectSection-${id}`);
        if (section && !section.dataset.loaded) {
          section.addEventListener('toggle', function onFirstToggle() {
            if (!section.open || section.dataset.loaded) return;
            section.dataset.loaded = '1';
            loadSourceProject(id);
          });
        }
      }
    }

    // Fetch + render the "Original Project Details" panel.
    async function loadSourceProject(portfolioId) {
      const container = document.getElementById(`sourceProjectContent-${portfolioId}`);
      if (!container) return;
      try {
        const res = await fetch(`/api/admin/portfolios/${portfolioId}/source-project/`, { credentials: 'include' });
        const data = await res.json();
        if (!data.success || !data.has_source) {
          container.innerHTML = '<div style="padding: 16px; color: var(--color-text-secondary); font-size: 13px;">No original project linked to this portfolio.</div>';
          return;
        }
        container.innerHTML = renderSourceProjectHtml(data);
      } catch (err) {
        console.error('[Portfolio] Failed to load source project:', err);
        container.innerHTML = '<div style="padding: 16px; color: #fca5a5; font-size: 13px;">Failed to load original project details.</div>';
      }
    }
    window.loadSourceProject = loadSourceProject;

    function renderSourceProjectHtml(data) {
      const p = data.project || {};
      const att = data.attachments || [];
      const c = data.contract;
      const docs = data.documents || [];
      const updates = data.updates || [];

      const esc = s => String(s == null ? '' : s)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
      const fmtMoney = n => (Number(n) || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
      const fmtDt = s => {
        if (!s) return '—';
        const d = new Date(String(s).replace(' ', 'T'));
        return isNaN(d.getTime()) ? String(s) : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      };
      let services = '—';
      if (p.services) {
        try {
          const arr = JSON.parse(p.services);
          const labels = { kitchen_remodel: 'Kitchen Remodel', bathroom_remodel: 'Bathroom Remodel', interior_painting: 'Interior Painting', flooring: 'Flooring', general_repairs: 'General Repairs', other: 'Other' };
          services = arr.map(s => labels[typeof s === 'string' ? s : (s.type || s.service)] || s).join(', ') || '—';
        } catch {}
      }
      const address = [p.customer_address, p.customer_city, p.customer_state, p.customer_zip].filter(Boolean).join(', ') || '—';
      const isVideoUrl = u => /\.(mp4|mov|webm|m4v)(?:\?|$)/i.test(u || '');
      const thumb = u => {
        if (!u) return '';
        try {
          const url = new URL(u);
          if (url.hostname === (MEDIA_CFG.publicHost || 'images.mannyknows.com') && !window.location.hostname.includes('localhost')) {
            return `${url.origin}/cdn-cgi/image/width=200,height=200,fit=cover,quality=80,format=auto${url.pathname}`;
          }
        } catch {}
        return u;
      };

      const infoRow = (label, value) =>
        `<div style="display: flex; gap: 10px; padding: 6px 0; border-bottom: 1px dashed var(--glass-border); font-size: 13px;">
           <span style="flex: 0 0 130px; color: var(--color-text-secondary);">${esc(label)}</span>
           <span style="flex: 1; color: var(--color-text-primary);">${value}</span>
         </div>`;

      const attachmentsHtml = att.length === 0
        ? '<div style="color: var(--color-text-secondary); font-size: 13px; padding: 8px 0;">No PDF attachments.</div>'
        : att.map(a => {
            const isSigned = /(?:[-—]\s*signed\s*$|signed\s*$)/i.test(a.label || '');
            const stroke = isSigned ? '#22c55e' : '#94a3b8';
            const pill = isSigned ? `<span style="font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 999px; background: rgba(34,197,94,0.18); color: #86efac; text-transform: uppercase; letter-spacing: 0.3px;">Signed</span>` : '';
            return `<a href="${esc(a.file_url)}" target="_blank" rel="noopener" style="display: flex; align-items: center; gap: 8px; padding: 8px 10px; background: rgba(255,255,255,0.03); border: 1px solid var(--glass-border); border-radius: var(--radius-sm); font-size: 13px; text-decoration: none; color: var(--color-text-primary); margin-bottom: 6px;">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${stroke}" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              <span style="flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${esc(a.label || 'Attachment')}</span>
              ${pill}
            </a>`;
          }).join('');

      const contractHtml = !c ? '' : `
        <a href="${esc(c.signed_pdf_url || '#')}" ${c.signed_pdf_url ? 'target="_blank" rel="noopener"' : 'style="pointer-events: none; opacity: 0.5;"'}
          style="display: flex; align-items: center; gap: 8px; padding: 8px 10px; background: rgba(255,255,255,0.03); border: 1px solid var(--glass-border); border-radius: var(--radius-sm); font-size: 13px; text-decoration: none; color: var(--color-text-primary); margin-bottom: 6px;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${c.signed_pdf_url ? '#22c55e' : '#94a3b8'}" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          <span style="flex: 1;">Contract — ${esc(c.status || 'draft')}</span>
          ${c.signed_pdf_url ? '<span style="font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 999px; background: rgba(34,197,94,0.18); color: #86efac; text-transform: uppercase; letter-spacing: 0.3px;">Signed PDF</span>' : '<span style="font-size: 11px; color: var(--color-text-secondary);">no PDF</span>'}
        </a>
        ${c.offline_scan_url ? `<a href="${esc(c.offline_scan_url)}" target="_blank" rel="noopener" style="display: flex; align-items: center; gap: 8px; padding: 8px 10px; background: rgba(255,255,255,0.03); border: 1px solid var(--glass-border); border-radius: var(--radius-sm); font-size: 13px; text-decoration: none; color: var(--color-text-primary); margin-bottom: 6px;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          <span style="flex: 1;">Signed copy (uploaded)</span>
          <span style="font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 999px; background: rgba(34,197,94,0.18); color: #86efac; text-transform: uppercase; letter-spacing: 0.3px;">Offline</span>
        </a>` : ''}`;

      // Project-owned documents (admin/offline uploads + quote-promotion docs).
      const documentsHtml = docs.length === 0
        ? '<div style="color: var(--color-text-secondary); font-size: 13px; padding: 8px 0;">No uploaded documents.</div>'
        : docs.map(d => `<a href="${esc(d.file_url)}" target="_blank" rel="noopener" style="display: flex; align-items: center; gap: 8px; padding: 8px 10px; background: rgba(255,255,255,0.03); border: 1px solid var(--glass-border); border-radius: var(--radius-sm); font-size: 13px; text-decoration: none; color: var(--color-text-primary); margin-bottom: 6px;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            <span style="flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${esc(d.label || d.file_name || 'Document')}</span>
          </a>`).join('');

      const mediaHtml = updates.length === 0
        ? '<div style="color: var(--color-text-secondary); font-size: 13px; padding: 8px 0;">No project images or videos.</div>'
        : `<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(80px, 1fr)); gap: 6px;">${updates.map(u => {
            const v = isVideoUrl(u.image_url);
            const tag = u.posted_by === 'quote_migration' ? 'b' : (u.posted_by === 'crew_lead' || u.posted_by === 'admin') ? 'd' : '';
            return v
              ? `<a href="${esc(u.image_url)}" target="_blank" rel="noopener" style="aspect-ratio: 1; background: linear-gradient(135deg, #1e293b 0%, #334155 100%); display: flex; align-items: center; justify-content: center; color: #94a3b8; border-radius: 6px; position: relative; text-decoration: none;">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><polygon points="6 4 20 12 6 20 6 4"/></svg>
                  ${tag ? `<span style="position: absolute; top: 4px; left: 4px; background: rgba(0,0,0,0.6); color: #fff; padding: 1px 5px; border-radius: 3px; font-size: 9px; font-weight: 700;">${tag}</span>` : ''}
                </a>`
              : `<a href="${esc(u.image_url)}" target="_blank" rel="noopener" style="aspect-ratio: 1; overflow: hidden; border-radius: 6px; position: relative; display: block;">
                  <img src="${esc(thumb(u.image_url))}" alt="" loading="lazy" style="width: 100%; height: 100%; object-fit: cover; display: block;">
                  ${tag ? `<span style="position: absolute; top: 4px; left: 4px; background: rgba(0,0,0,0.6); color: #fff; padding: 1px 5px; border-radius: 3px; font-size: 9px; font-weight: 700;">${tag}</span>` : ''}
                </a>`;
          }).join('')}</div>`;

      return `
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 18px;">
          <div>
            <h4 style="margin: 0 0 8px 0; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: var(--color-text-secondary);">Project</h4>
            ${infoRow('Project #', `<a href="/admin/projects" style="color: var(--color-primary); text-decoration: none;">${esc(p.project_number || '—')}</a>`)}
            ${infoRow('Customer', esc(p.customer_name || '—'))}
            ${infoRow('Address', esc(address))}
            ${infoRow('Services', esc(services))}
            ${infoRow('Total', fmtMoney(p.total))}
            ${infoRow('Started', fmtDt(p.started_at))}
            ${infoRow('Completed', fmtDt(p.completed_at))}
            ${infoRow('Archived', fmtDt(p.portfolio_at))}
          </div>
          <div>
            <h4 style="margin: 0 0 8px 0; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: var(--color-text-secondary);">Quote ${p.quote_number ? `<a href="/admin/quotes?open=${p.quote_id}" style="font-weight: 400; color: var(--color-primary); text-decoration: none; margin-left: 6px; font-size: 11px;">#${esc(p.quote_number)} ↗</a>` : ''}</h4>
            ${infoRow('Accepted', fmtDt(p.quote_responded_at))}
            ${infoRow('Subtotal', fmtMoney(p.quote_subtotal))}
            ${p.quote_discount > 0 ? infoRow('Discount', `−${fmtMoney(p.quote_discount)}`) : ''}
            ${infoRow('Total', fmtMoney(p.quote_total))}
          </div>
        </div>

        <div style="margin-top: 16px;">
          <h4 style="margin: 0 0 8px 0; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: var(--color-text-secondary);">Scope of work</h4>
          <div style="font-size: 13px; color: var(--color-text-primary); line-height: 1.6; padding: 10px 12px; background: rgba(255,255,255,0.03); border: 1px solid var(--glass-border); border-radius: var(--radius-sm); white-space: pre-wrap;">${esc(p.scope_description || '—')}</div>
        </div>

        <div style="margin-top: 16px; display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 18px;">
          <div>
            <h4 style="margin: 0 0 8px 0; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: var(--color-text-secondary);">Quote PDFs (${att.length})</h4>
            ${attachmentsHtml}
          </div>
          <div>
            <h4 style="margin: 0 0 8px 0; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: var(--color-text-secondary);">Contract</h4>
            ${c ? contractHtml : '<div style="color: var(--color-text-secondary); font-size: 13px; padding: 8px 0;">No contract on file.</div>'}
          </div>
        </div>

        <div style="margin-top: 16px;">
          <h4 style="margin: 0 0 8px 0; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: var(--color-text-secondary);">Documents (${docs.length})</h4>
          ${documentsHtml}
        </div>

        <div style="margin-top: 16px;">
          <h4 style="margin: 0 0 8px 0; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: var(--color-text-secondary);">All project media (${updates.length})</h4>
          ${mediaHtml}
          ${updates.length > 0 ? '<div style="margin-top: 8px; font-size: 11px; color: var(--color-text-secondary);">Tag legend: <strong>b</strong> = before (from quote), <strong>d</strong> = during (admin/crew)</div>' : ''}
        </div>
      `;
    }
    window.renderSourceProjectHtml = renderSourceProjectHtml;

    function closeManualDetail() {
      manualDetailModal.classList.remove('show');
      currentManualId = null;
      currentMedia = [];
      // Reload to refresh the grid with any new/changed data
      window.location.reload();
    }
    window.closeManualDetail = closeManualDetail;

    // =====================================================
    // FILE UPLOAD
    // =====================================================
    const fileInput = document.getElementById('fileInput');

    function triggerFileInput() {
      fileInput.click();
    }
    window.triggerFileInput = triggerFileInput;

    fileInput.addEventListener('change', async (e) => {
      if (guardWrite()) return;
      const files = Array.from(e.target.files);
      if (files.length === 0 || !currentManualId) return;

      await uploadFiles(files);
      fileInput.value = '';
    });

    function setupDragDrop() {
      const uploadArea = document.getElementById('uploadArea');
      if (!uploadArea) return;

      uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
      });

      uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragover');
      });

      uploadArea.addEventListener('drop', async (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0 && currentManualId) {
          await uploadFiles(files);
        }
      });
    }

    // Convert HEIC/HEIF to JPEG using canvas (Safari supports HEIC natively)
    async function convertHeicToJpeg(file) {
      const isHeic = file.type === 'image/heic' || file.type === 'image/heif' ||
        file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif');
      if (!isHeic) return file;

      try {
        const bitmap = await createImageBitmap(file);
        const canvas = document.createElement('canvas');
        canvas.width = bitmap.width;
        canvas.height = bitmap.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(bitmap, 0, 0);
        bitmap.close();

        const blob = await new Promise((resolve) =>
          canvas.toBlob(resolve, 'image/jpeg', 0.92)
        );
        const newName = file.name.replace(/\.heic$/i, '.jpg').replace(/\.heif$/i, '.jpg');
        return new File([blob], newName, { type: 'image/jpeg' });
      } catch (err) {
        console.error('[Upload] HEIC conversion failed:', err);
        throw new Error('HEIC conversion failed. Try converting to JPEG first, or use Safari.');
      }
    }

    // File size limits
    const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
    const MAX_VIDEO_SIZE = 5 * 1024 * 1024 * 1024; // 5GB (presigned URLs support up to 5GB)

    function formatFileSize(bytes) {
      if (bytes >= 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
      if (bytes >= 1024) return (bytes / 1024).toFixed(1) + ' KB';
      return bytes + ' bytes';
    }

    async function uploadFiles(files) {
      const progressList = document.getElementById('uploadProgress');
      progressList.innerHTML = '';

      for (let i = 0; i < files.length; i++) {
        let file = files[i];
        const itemId = `upload-${Date.now()}-${i}`;

        // Try client-side HEIC conversion (Safari); if fails, server will handle it
        try {
          file = await convertHeicToJpeg(file);
        } catch (err) {
          console.log(`[Upload] Client HEIC conversion failed for ${file.name}, server will handle it`);
        }

        const isVideo = file.type.startsWith('video/');
        const maxSize = isVideo ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE;
        const maxSizeLabel = isVideo ? '5GB' : '10MB';

        // Check file size BEFORE upload
        if (file.size > maxSize) {
          progressList.innerHTML += `
            <div class="upload-progress-item" id="${itemId}">
              <span class="upload-progress-name">${file.name}</span>
              <div class="upload-progress-bar">
                <div class="upload-progress-fill error" style="width: 100%"></div>
              </div>
              <span class="upload-progress-status error">Too large (${formatFileSize(file.size)} > ${maxSizeLabel})</span>
            </div>
          `;
          continue; // Skip this file
        }

        // Add progress item
        progressList.innerHTML += `
          <div class="upload-progress-item" id="${itemId}">
            <span class="upload-progress-name">${file.name}</span>
            <div class="upload-progress-bar">
              <div class="upload-progress-fill" style="width: 0%"></div>
            </div>
            <span class="upload-progress-status">Uploading ${formatFileSize(file.size)}...</span>
          </div>
        `;

        try {
          const timestamp = Date.now();
          const fileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
          const path = `portfolios/${currentManualId}_${timestamp}_${fileName}`;
          const statusSpan = document.querySelector(`#${itemId} .upload-progress-status`);
          const progressFill = document.querySelector(`#${itemId} .upload-progress-fill`);

          let fileUrl;

          // Handle video uploads: Upload to R2
          if (isVideo) {
            statusSpan.textContent = 'Uploading video to storage...';
            let r2Url;

            // For smaller videos (< 95MB), use direct Workers upload
            // For larger videos, use presigned URL
            const usePresigned = file.size > 95 * 1024 * 1024;

            if (usePresigned) {
              // Large video: Use presigned URL for direct R2 upload
              const presignedResponse = await fetch('/api/r2-presigned-url/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  key: path,
                  contentType: file.type,
                  contentLength: file.size
                })
              });

              const presignedResult = await presignedResponse.json();

              if (!presignedResult.success) {
                throw new Error(presignedResult.error || 'Failed to get upload URL');
              }

              // Upload to R2 with progress tracking
              await new Promise((resolve, reject) => {
                const xhr = new XMLHttpRequest();

                xhr.upload.addEventListener('progress', (e) => {
                  if (e.lengthComputable) {
                    const percent = Math.round((e.loaded / e.total) * 100);
                    progressFill.style.width = `${percent}%`;
                    const uploaded = formatFileSize(e.loaded);
                    const total = formatFileSize(e.total);
                    statusSpan.textContent = `${uploaded} / ${total} (${percent}%)`;
                  }
                });

                xhr.addEventListener('load', () => {
                  if (xhr.status >= 200 && xhr.status < 300) {
                    resolve();
                  } else {
                    reject(new Error(`Upload failed: ${xhr.status}`));
                  }
                });

                xhr.addEventListener('error', () => reject(new Error('Upload failed - connection error')));
                xhr.addEventListener('abort', () => reject(new Error('Upload cancelled')));

                xhr.open('PUT', presignedResult.presignedUrl);
                xhr.setRequestHeader('Content-Type', file.type);
                xhr.send(file);
              });

              r2Url = presignedResult.publicUrl;
            } else {
              // Smaller video: Use Workers upload (more reliable)
              statusSpan.textContent = `Uploading ${formatFileSize(file.size)}...`;

              const uploadResponse = await fetch('/api/r2-upload/', {
                method: 'POST',
                headers: {
                  'Content-Type': file.type,
                  'X-Upload-Path': path,
                  'X-Upload-Timestamp': timestamp.toString()
                },
                body: file
              });

              const uploadResult = await uploadResponse.json();

              if (!uploadResult.success) {
                throw new Error(uploadResult.error || 'Upload failed');
              }

              r2Url = uploadResult.fileUrl;
              progressFill.style.width = '100%';
            }

            // Use R2 URL directly for video playback (simple, works)
            fileUrl = r2Url;
            statusSpan.textContent = 'Done';

          } else {
            // Handle image uploads via Cloudflare Images (optimized delivery)
            statusSpan.textContent = 'Uploading to Cloudflare Images...';

            const formData = new FormData();
            formData.append('file', file);

            const uploadResponse = await fetch('/api/cloudflare-images-upload/', {
              method: 'POST',
              body: formData
            });

            const uploadResult = await uploadResponse.json();

            if (!uploadResult.success) {
              throw new Error(uploadResult.error || 'Upload failed');
            }

            // Store Cloudflare Image ID for optimized URL generation
            fileUrl = uploadResult.media_url; // Fallback public URL
            // We'll add cloudflare_image_id to mediaPayload below
            file._cloudflareImageId = uploadResult.cloudflare_image_id;
            progressFill.style.width = '100%';
          }

          // Update progress
          progressFill.style.width = '100%';
          statusSpan.textContent = 'Saving...';

          // Add to database
          const mediaPayload = {
            media_url: fileUrl,
            media_type: isVideo ? 'video' : 'image',
            file_name: file.name,
            file_size: file.size,
            // Include Cloudflare Image ID for optimized URL generation (images only)
            cloudflare_image_id: file._cloudflareImageId || null
          };

          console.log('[Upload] Saving to database:', mediaPayload);

          const saveResponse = await fetch(`/api/manual-portfolios/${currentManualId}/media/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin',
            body: JSON.stringify(mediaPayload)
          });

          console.log('[Upload] Save response status:', saveResponse.status);
          const saveResult = await saveResponse.json();
          console.log('[Upload] Save result:', saveResult);

          if (saveResult.success) {
            statusSpan.textContent = isVideo ? 'Done (processing)' : 'Done';
            statusSpan.classList.add('success');
          } else {
            throw new Error(saveResult.error || 'Save failed');
          }

        } catch (err) {
          const statusSpan = document.querySelector(`#${itemId} .upload-progress-status`);
          statusSpan.textContent = 'Failed';
          statusSpan.classList.add('error');
          console.error('Upload error:', err);
        }
      }

      // Refresh media after all uploads
      setTimeout(() => {
        openManualDetail(currentManualId);
      }, 1000);
    }

    // =====================================================
    // MEDIA ACTIONS
    // =====================================================
    async function deleteMedia(portfolioId, mediaId, event) {
      event.stopPropagation();
      if (guardWrite()) return;
      if (!confirm('Delete this media?')) return;

      try {
        const response = await fetch(`/api/manual-portfolios/${portfolioId}/media/?media_id=${mediaId}`, {
          method: 'DELETE'
        });

        const data = await response.json();

        if (data.success) {
          showToast('Media deleted', 'success');
          openManualDetail(portfolioId);
        } else {
          showToast(data.error || 'Failed to delete', 'error');
        }
      } catch (err) {
        showToast('Failed to delete media', 'error');
      }
    }
    window.deleteMedia = deleteMedia;

    // Copy a media item's URL to the clipboard so it can be reused — e.g. pasted
    // into the hero slider builder on /admin/web to use a portfolio shot as a slide.
    function copyMediaUrl(url, e) {
      var btn = e && e.currentTarget;
      if (e) { e.stopPropagation(); e.preventDefault(); }
      navigator.clipboard.writeText(url)
        .then(function () {
          showToast('Image URL copied');
          if (btn) {
            var orig = btn.innerHTML;
            btn.classList.add('copied');
            btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>';
            setTimeout(function () { btn.innerHTML = orig; btn.classList.remove('copied'); }, 1500);
          }
        })
        .catch(function () { showToast('Copy failed', 'error'); });
    }
    window.copyMediaUrl = copyMediaUrl;

    // =====================================================
    // DELETE PORTFOLIO (with double confirmation)
    // =====================================================
    let pendingDeleteId = null;
    let pendingDeleteName = '';
    const deleteConfirmModal = document.getElementById('deleteConfirmModal');
    const deleteConfirmInput = document.getElementById('deleteConfirmInput');
    const deleteConfirmName = document.getElementById('deleteConfirmName');
    const deleteConfirmBtn = document.getElementById('deleteConfirmBtn');

    function confirmDeletePortfolio(id, name) {
      if (guardWrite()) return;
      pendingDeleteId = id;
      pendingDeleteName = name;
      deleteConfirmName.textContent = name;
      deleteConfirmInput.value = '';
      deleteConfirmBtn.disabled = true;
      deleteConfirmModal.classList.add('show');
      deleteConfirmInput.focus();
    }
    window.confirmDeletePortfolio = confirmDeletePortfolio;

    deleteConfirmInput?.addEventListener('input', () => {
      deleteConfirmBtn.disabled = deleteConfirmInput.value !== pendingDeleteName;
    });

    function closeDeleteConfirm() {
      deleteConfirmModal.classList.remove('show');
      pendingDeleteId = null;
      pendingDeleteName = '';
    }
    window.closeDeleteConfirm = closeDeleteConfirm;

    async function executeDeletePortfolio() {
      if (guardWrite()) return;
      if (!pendingDeleteId || deleteConfirmInput.value !== pendingDeleteName) return;

      deleteConfirmBtn.disabled = true;
      deleteConfirmBtn.textContent = 'Deleting...';

      try {
        const response = await fetch(`/api/manual-portfolios/?portfolio_id=${pendingDeleteId}`, {
          method: 'DELETE'
        });

        const data = await response.json();

        if (data.success) {
          showToast('Portfolio deleted', 'success');
          closeDeleteConfirm();
          closeManualDetail();
          // Reload page to refresh the list
          window.location.reload();
        } else {
          showToast(data.error || 'Failed to delete portfolio', 'error');
          deleteConfirmBtn.disabled = false;
          deleteConfirmBtn.textContent = 'Delete Forever';
        }
      } catch (err) {
        console.error('Delete error:', err);
        showToast('Failed to delete portfolio', 'error');
        deleteConfirmBtn.disabled = false;
        deleteConfirmBtn.textContent = 'Delete Forever';
      }
    }
    window.executeDeletePortfolio = executeDeletePortfolio;

    async function downloadAll(id) {
      try {
        const response = await fetch(`/api/manual-portfolios/${id}/download/`);
        const data = await response.json();

        if (!data.success || !data.files || data.files.length === 0) {
          showToast('No files to download', 'error');
          return;
        }

        // Queue all downloads - browser manages them
        showToast(`Starting ${data.files.length} downloads...`, 'info');

        data.files.forEach(file => {
          const link = document.createElement('a');
          link.href = file.url;
          link.download = file.name;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        });

      } catch (err) {
        console.error('Download error:', err);
        showToast('Failed to start downloads', 'error');
      }
    }
    window.downloadAll = downloadAll;

    // =====================================================
    // PAIR SELECTION & MANAGEMENT
    // =====================================================
    let currentPairs = [];
    let pairSelectionMode = false;
    let selectedBeforeId = null;
    let selectedAfterId = null;

    // Gallery mode state
    let currentGalleryItems = [];
    let gallerySelectionMode = false;

    async function fetchGalleryItems(portfolioId) {
      try {
        const response = await fetch(`/api/manual-portfolios/${portfolioId}/gallery/`);
        const data = await response.json();
        if (data.success) {
          currentGalleryItems = data.items || [];
        }
      } catch (err) {
        console.error('Failed to fetch gallery items:', err);
        currentGalleryItems = [];
      }
    }

    async function fetchPairs(portfolioId) {
      try {
        const response = await fetch(`/api/manual-portfolios/${portfolioId}/pairs/`);
        const data = await response.json();
        if (data.success) {
          currentPairs = data.pairs || [];
        } else {
          currentPairs = [];
        }
      } catch (err) {
        console.error('Failed to fetch pairs:', err);
        currentPairs = [];
      }
    }

    function enterPairSelectionMode() {
      pairSelectionMode = true;
      selectedBeforeId = null;
      selectedAfterId = null;
      renderManualDetail(currentManualId);
    }
    window.enterPairSelectionMode = enterPairSelectionMode;

    function exitPairSelectionMode() {
      pairSelectionMode = false;
      selectedBeforeId = null;
      selectedAfterId = null;
      renderManualDetail(currentManualId);
    }
    window.exitPairSelectionMode = exitPairSelectionMode;

    function isMediaPaired(mediaId) {
      return currentPairs.some(p => p.before_media_id === mediaId || p.after_media_id === mediaId);
    }

    function getPairInfo(mediaId) {
      for (let i = 0; i < currentPairs.length; i++) {
        const pair = currentPairs[i];
        if (pair.before_media_id === mediaId) {
          return { pairIndex: i + 1, type: 'Before', pair };
        }
        if (pair.after_media_id === mediaId) {
          return { pairIndex: i + 1, type: 'After', pair };
        }
      }
      return null;
    }

    function selectMediaForPair(mediaId) {
      if (!pairSelectionMode) return;
      if (isMediaPaired(mediaId)) {
        showToast('This image is already paired', 'error');
        return;
      }

      if (!selectedBeforeId) {
        // First selection - mark as Before
        selectedBeforeId = mediaId;
        renderManualDetail(currentManualId);
      } else if (selectedBeforeId === mediaId) {
        // Deselect
        selectedBeforeId = null;
        renderManualDetail(currentManualId);
      } else if (!selectedAfterId) {
        // Second selection - mark as After and create pair
        selectedAfterId = mediaId;
        createPairWithAI(selectedBeforeId, selectedAfterId);
      }
    }
    window.selectMediaForPair = selectMediaForPair;

    async function createPairWithAI(beforeMediaId, afterMediaId) {
      // Show AI generating modal
      const aiModal = document.createElement('div');
      aiModal.className = 'ai-generating-overlay';
      aiModal.id = 'aiGeneratingModal';
      aiModal.innerHTML = `
        <div class="ai-generating-modal">
          <div class="spinner"></div>
          <h3>Creating Pair...</h3>
          <p>AI is analyzing the before/after images to generate a title and description.</p>
        </div>
      `;
      document.body.appendChild(aiModal);

      try {
        const response = await fetch(`/api/manual-portfolios/${currentManualId}/pairs/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            before_media_id: beforeMediaId,
            after_media_id: afterMediaId,
            generate_ai: true
          })
        });

        const data = await response.json();

        if (data.success) {
          showToast(`Pair created: "${data.title}"`, 'success');
          // Reset selection and refresh
          pairSelectionMode = false;
          selectedBeforeId = null;
          selectedAfterId = null;
          await fetchPairs(currentManualId);
          renderManualDetail(currentManualId);
        } else {
          showToast(data.error || 'Failed to create pair', 'error');
          selectedAfterId = null;
          renderManualDetail(currentManualId);
        }
      } catch (err) {
        console.error('Create pair error:', err);
        showToast('Failed to create pair', 'error');
        selectedAfterId = null;
        renderManualDetail(currentManualId);
      } finally {
        document.getElementById('aiGeneratingModal')?.remove();
      }
    }

    async function deletePair(pairId) {
      if (guardWrite()) return;
      if (!confirm('Delete this pair? The images will remain but no longer be paired.')) return;

      try {
        const response = await fetch(`/api/manual-portfolios/${currentManualId}/pairs/?pair_id=${pairId}`, {
          method: 'DELETE'
        });

        const data = await response.json();

        if (data.success) {
          showToast('Pair deleted', 'success');
          await fetchPairs(currentManualId);
          renderManualDetail(currentManualId);
        } else {
          showToast(data.error || 'Failed to delete pair', 'error');
        }
      } catch (err) {
        showToast('Failed to delete pair', 'error');
      }
    }
    window.deletePair = deletePair;

    async function setCoverPair(pairId) {
      try {
        const response = await fetch(`/api/manual-portfolios/${currentManualId}/pairs/`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            pair_id: pairId,
            is_cover: true
          })
        });

        const data = await response.json();

        if (data.success) {
          showToast('Cover pair updated', 'success');
          await fetchPairs(currentManualId);
          renderManualDetail(currentManualId);
        } else {
          showToast(data.error || 'Failed to update cover', 'error');
        }
      } catch (err) {
        showToast('Failed to update cover', 'error');
      }
    }
    window.setCoverPair = setCoverPair;

    // =====================================================
    // GALLERY FUNCTIONS (with batch selection)
    // =====================================================
    let selectedForGallery = new Set();

    function enterGallerySelectionMode() {
      gallerySelectionMode = true;
      selectedForGallery.clear();
      renderManualDetail(currentManualId);
    }
    window.enterGallerySelectionMode = enterGallerySelectionMode;

    function exitGallerySelectionMode() {
      gallerySelectionMode = false;
      selectedForGallery.clear();
      renderManualDetail(currentManualId);
    }
    window.exitGallerySelectionMode = exitGallerySelectionMode;

    function getGalleryInfo(mediaId) {
      const item = currentGalleryItems.find(g => g.media_id === mediaId);
      if (!item) return null;
      return {
        galleryItemId: item.id,
        galleryIndex: currentGalleryItems.indexOf(item) + 1,
        isCover: item.is_cover === 1
      };
    }

    // Toggle selection for batch gallery add
    function toggleGallerySelection(mediaId) {
      if (selectedForGallery.has(mediaId)) {
        selectedForGallery.delete(mediaId);
      } else {
        selectedForGallery.add(mediaId);
      }
      renderManualDetail(currentManualId);
    }
    window.toggleGallerySelection = toggleGallerySelection;

    // Add all selected items to gallery
    async function addSelectedToGallery() {
      if (selectedForGallery.size === 0) return;

      const mediaIds = Array.from(selectedForGallery);
      let successCount = 0;

      for (const mediaId of mediaIds) {
        try {
          const response = await fetch(`/api/manual-portfolios/${currentManualId}/gallery/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ media_id: mediaId })
          });

          const data = await response.json();
          if (data.success) successCount++;
        } catch (err) {
          console.error('Failed to add media', mediaId, err);
        }
      }

      showToast(`Added ${successCount} item${successCount !== 1 ? 's' : ''} to gallery!`, 'success');

      // Refresh gallery items
      const galleryResponse = await fetch(`/api/manual-portfolios/${currentManualId}/gallery/`);
      const galleryData = await galleryResponse.json();
      if (galleryData.success) {
        currentGalleryItems = galleryData.items || [];
      }

      gallerySelectionMode = false;
      selectedForGallery.clear();
      renderManualDetail(currentManualId);
    }
    window.addSelectedToGallery = addSelectedToGallery;

    // Legacy single-add (kept for compatibility)
    async function addToGallery(mediaId) {
      toggleGallerySelection(mediaId);
    }
    window.addToGallery = addToGallery;

    async function removeFromGallery(galleryId) {
      if (guardWrite()) return;
      if (!confirm('Remove this image from the gallery?')) return;

      try {
        const response = await fetch(`/api/manual-portfolios/${currentManualId}/gallery/`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ gallery_id: galleryId })
        });

        const data = await response.json();

        if (data.success) {
          showToast('Removed from gallery', 'success');
          currentGalleryItems = currentGalleryItems.filter(g => g.id !== galleryId);
          renderManualDetail(currentManualId);
        } else {
          showToast(data.error || 'Failed to remove', 'error');
        }
      } catch (err) {
        showToast('Failed to remove from gallery', 'error');
      }
    }
    window.removeFromGallery = removeFromGallery;

    async function setCoverGalleryItem(galleryId) {
      try {
        const response = await fetch(`/api/manual-portfolios/${currentManualId}/gallery/`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ gallery_id: galleryId, is_cover: true })
        });

        const data = await response.json();

        if (data.success) {
          showToast('Cover updated!', 'success');
          // Update local state
          currentGalleryItems.forEach(g => {
            g.is_cover = g.id === galleryId ? 1 : 0;
          });
          renderManualDetail(currentManualId);
        } else {
          showToast(data.error || 'Failed to update cover', 'error');
        }
      } catch (err) {
        showToast('Failed to update cover', 'error');
      }
    }
    window.setCoverGalleryItem = setCoverGalleryItem;

    async function setDisplayMode(portfolioId, mode) {
      try {
        const response = await fetch('/api/manual-portfolios/', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            portfolio_id: portfolioId,
            display_mode: mode
          })
        });

        const data = await response.json();

        if (data.success) {
          // Update the card data so renderManualDetail picks up the change
          const card = document.querySelector(`[data-id="manual-${portfolioId}"]`);
          if (card) {
            const portfolio = JSON.parse(card.dataset.portfolio);
            portfolio.display_mode = mode;
            card.dataset.portfolio = JSON.stringify(portfolio);
          }
          showToast(`Switched to ${mode === 'pairs' ? 'Before/After' : 'Gallery'} mode`, 'success');
          renderManualDetail(portfolioId);
        } else {
          showToast(data.error || 'Failed to update mode', 'error');
        }
      } catch (err) {
        showToast('Failed to update mode', 'error');
      }
    }
    window.setDisplayMode = setDisplayMode;

    async function setPortfolioCategory(portfolioId, category) {
      try {
        const response = await fetch('/api/manual-portfolios/', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ portfolio_id: portfolioId, project_type: category })
        });
        const data = await response.json();
        if (data.success) {
          const card = document.querySelector(`[data-id="manual-${portfolioId}"]`);
          if (card) { const p = JSON.parse(card.dataset.portfolio); p.project_type = category; card.dataset.portfolio = JSON.stringify(p); }
          showToast('Category updated', 'success');
        } else {
          showToast(data.error || 'Failed to update category', 'error');
        }
      } catch (err) {
        showToast('Failed to update category', 'error');
      }
    }
    window.setPortfolioCategory = setPortfolioCategory;

    // Inline edit: portfolio name
    function startEditName(portfolioId, el) {
      const currentName = el.querySelector('span').textContent;
      const input = document.createElement('input');
      input.type = 'text';
      input.value = currentName;
      input.className = 'edit-inline-input';
      input.setAttribute('data-original', currentName);

      el.replaceWith(input);
      input.focus();
      input.select();

      async function save() {
        const newName = input.value.trim();
        if (!newName || newName === currentName) {
          renderManualDetail(portfolioId);
          return;
        }
        try {
          const response = await fetch('/api/manual-portfolios/', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ portfolio_id: portfolioId, project_name: newName })
          });
          const data = await response.json();
          if (data.success) {
            const card = document.querySelector(`[data-id="manual-${portfolioId}"]`);
            if (card) {
              const p = JSON.parse(card.dataset.portfolio);
              p.project_name = newName;
              card.dataset.portfolio = JSON.stringify(p);
              const titleEl = card.querySelector('.card-title');
              if (titleEl) titleEl.textContent = newName;
            }
            showToast('Name updated', 'success');
          } else {
            showToast(data.error || 'Failed to update name', 'error');
          }
        } catch (err) {
          showToast('Failed to update name', 'error');
        }
        renderManualDetail(portfolioId);
      }

      input.addEventListener('blur', save);
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); input.blur(); }
        if (e.key === 'Escape') { input.removeEventListener('blur', save); renderManualDetail(portfolioId); }
      });
    }
    window.startEditName = startEditName;

    // Inline edit: description
    function startEditDescription(portfolioId, el) {
      const card = document.querySelector(`[data-id="manual-${portfolioId}"]`);
      const portfolio = card ? JSON.parse(card.dataset.portfolio) : {};
      const currentDesc = portfolio.description || '';

      const textarea = document.createElement('textarea');
      textarea.value = currentDesc;
      textarea.className = 'edit-inline-textarea';
      textarea.placeholder = 'Add a description...';

      el.replaceWith(textarea);
      textarea.focus();

      async function save() {
        const newDesc = textarea.value.trim();
        if (newDesc === currentDesc) {
          renderManualDetail(portfolioId);
          return;
        }
        try {
          const response = await fetch('/api/manual-portfolios/', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ portfolio_id: portfolioId, description: newDesc })
          });
          const data = await response.json();
          if (data.success) {
            if (card) {
              const p = JSON.parse(card.dataset.portfolio);
              p.description = newDesc;
              card.dataset.portfolio = JSON.stringify(p);
            }
            showToast('Description updated', 'success');
          } else {
            showToast(data.error || 'Failed to update description', 'error');
          }
        } catch (err) {
          showToast('Failed to update description', 'error');
        }
        renderManualDetail(portfolioId);
      }

      textarea.addEventListener('blur', save);
      textarea.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') { textarea.removeEventListener('blur', save); renderManualDetail(portfolioId); }
      });
    }
    window.startEditDescription = startEditDescription;

    // AI Polish: rewrites the portfolio title + description in one call using
    // the existing project context (services, scope, city) plus an optional
    // admin guidance note. Mirrors the polish flow from Messages.
    async function polishPortfolio(portfolioId) {
      if (guardWrite()) return;
      const btn = document.getElementById('polishBtn-' + portfolioId);
      const noteEl = document.getElementById('polishNote-' + portfolioId);
      if (!btn) return;
      const card = document.querySelector('[data-id="manual-' + portfolioId + '"]');
      const portfolio = card ? JSON.parse(card.dataset.portfolio || '{}') : {};
      const originalLabel = btn.textContent;
      btn.disabled = true;
      btn.textContent = 'Polishing…';

      try {
        // Server pulls the rich project + quote context from the DB itself,
        // so the client only needs to identify the portfolio + any admin note.
        const polishRes = await fetch('/api/admin/polish-portfolio/', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            portfolio_id: portfolioId,
            custom_note: (noteEl?.value || '').trim(),
          }),
        });
        const polishData = await polishRes.json();
        if (!polishData?.success || !polishData.title || !polishData.description) {
          throw new Error(polishData?.error || 'Polish failed');
        }

        // Persist both fields. The PATCH endpoint regenerates the slug when
        // project_name changes, which is what we want. Note the field name is
        // `portfolio_id` (not `id`) — that's what the endpoint validates.
        const saveRes = await fetch('/api/manual-portfolios/', {
          method: 'PATCH',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            portfolio_id: portfolioId,
            project_name: polishData.title,
            description: polishData.description,
          }),
        });
        const saveData = await saveRes.json();
        if (!saveData?.success) {
          throw new Error(saveData?.error || 'Save failed');
        }

        // Reflect new values in the in-memory portfolio + re-render the editor.
        if (card) {
          const updated = Object.assign({}, portfolio, {
            project_name: polishData.title,
            description: polishData.description,
            slug: saveData.portfolio?.slug || portfolio.slug,
          });
          card.dataset.portfolio = JSON.stringify(updated);
        }
        showToast('Polished — title + description updated', 'success');
        // Re-render via the existing detail flow.
        await openManualDetail(portfolioId);
      } catch (err) {
        console.error('[Polish Portfolio] Failed:', err);
        showToast((err && err.message) || 'Polish failed', 'error');
      } finally {
        btn.disabled = false;
        btn.textContent = originalLabel;
      }
    }
    window.polishPortfolio = polishPortfolio;

    async function togglePublish(portfolioId, publish) {
      try {
        const response = await fetch('/api/manual-portfolios/', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            portfolio_id: portfolioId,
            is_published: publish
          })
        });

        const data = await response.json();

        if (data.success) {
          showToast(publish ? 'Portfolio published!' : 'Portfolio unpublished', 'success');
          // Refresh card data
          const card = document.querySelector(`[data-id="manual-${portfolioId}"]`);
          if (card) {
            const portfolio = JSON.parse(card.dataset.portfolio);
            portfolio.is_published = publish ? 1 : 0;
            portfolio.slug = data.slug || portfolio.slug;
            card.dataset.portfolio = JSON.stringify(portfolio);
          }
          renderManualDetail(portfolioId);
        } else {
          showToast(data.error || 'Failed to update publish status', 'error');
        }
      } catch (err) {
        showToast('Failed to update publish status', 'error');
      }
    }
    window.togglePublish = togglePublish;

    // Generate slug from project name
    function generateSlug(name) {
      return name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
    }

    // =====================================================
    // LIGHTBOX
    // =====================================================
    function openLightbox(url, isVideo = false) {
      const lightbox = document.getElementById('lightbox');
      const lightboxImage = document.getElementById('lightboxImage');
      const lightboxVideo = document.getElementById('lightboxVideo');

      if (isVideo) {
        // Video - use video element
        lightboxImage.style.display = 'none';
        lightboxVideo.style.display = 'block';
        lightboxVideo.src = url;
        lightboxVideo.play();
      } else {
        // Image
        lightboxVideo.style.display = 'none';
        lightboxVideo.pause();
        lightboxVideo.src = '';
        lightboxImage.style.display = 'block';
        lightboxImage.src = url;
      }

      lightbox.classList.add('show');
      event?.stopPropagation();
    }
    window.openLightbox = openLightbox;

    function closeLightbox() {
      const lightbox = document.getElementById('lightbox');
      const lightboxVideo = document.getElementById('lightboxVideo');
      lightbox.classList.remove('show');
      lightboxVideo.pause();
      lightboxVideo.src = '';
      event?.stopPropagation();
    }
    window.closeLightbox = closeLightbox;

    // =====================================================
    // TOAST
    // =====================================================
    function showToast(message, type = 'info') {
      const toast = document.getElementById('toast');
      const toastMsg = document.getElementById('toastMessage');
      toastMsg.textContent = message;
      toast.className = `toast show ${type}`;
      setTimeout(() => { toast.className = 'toast'; }, 3000);
    }

    // =====================================================
    // THEME & MOBILE NAV
    // =====================================================
    function toggleTheme() {
      const current = document.documentElement.getAttribute('data-theme') || 'dark';
      const next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('admin-theme', next);
    }
    window.toggleTheme = toggleTheme;

    const mobileNavToggle = document.getElementById('mobileNavToggle');
    const mobileNavPanel = document.getElementById('mobileNavPanel');
    const mobileNavOverlay = document.getElementById('mobileNavOverlay');
    const mobileNavClose = document.getElementById('mobileNavClose');

    function openMobileNav() {
      mobileNavToggle?.classList.add('active');
      mobileNavPanel?.classList.add('active');
      mobileNavOverlay?.classList.add('active');
      document.body.style.overflow = 'hidden';
    }

    function closeMobileNav() {
      mobileNavToggle?.classList.remove('active');
      mobileNavPanel?.classList.remove('active');
      mobileNavOverlay?.classList.remove('active');
      document.body.style.overflow = '';
    }
    window.closeMobileNav = closeMobileNav;

    mobileNavToggle?.addEventListener('click', () => {
      mobileNavPanel?.classList.contains('active') ? closeMobileNav() : openMobileNav();
    });

    mobileNavClose?.addEventListener('click', closeMobileNav);
    mobileNavOverlay?.addEventListener('click', closeMobileNav);

    // Close modals on escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeCreateModal();
        closeManualDetail();
        closeLightbox();
        closeMobileNav();
      }
    });

    // Close modals on backdrop click
    createModal?.addEventListener('click', (e) => {
      if (e.target === createModal) closeCreateModal();
    });
    manualDetailModal.addEventListener('click', (e) => {
      if (e.target === manualDetailModal) closeManualDetail();
    });

    // Logout
    async function logout() {
      await fetch('/api/admin/logout/', { method: 'POST' });
      window.location.href = '/admin';
    }
    window.logout = logout;

    // Desktop bell
    const bellBtn = document.getElementById('bellBtn');
    const bellBadge = document.getElementById('bellBadge');
    const bellDropdown = document.getElementById('bellDropdown');
    const bellList = document.getElementById('bellList');
    // Mobile bell
    const bellBtnMobile = document.getElementById('bellBtnMobile');
    const bellBadgeMobile = document.querySelector('.bell-badge-mobile');
    const bellDropdownMobile = document.getElementById('bellDropdownMobile');
    const bellListMobile = document.getElementById('bellListMobile');

    let bellOpen = false;
    let activeBellDropdown = null;

    function closeBell() {
      bellOpen = false;
      if (bellDropdown) bellDropdown.style.display = 'none';
      if (bellDropdownMobile) bellDropdownMobile.style.display = 'none';
      activeBellDropdown = null;
    }

    [bellBtn, bellBtnMobile].forEach(btn => {
      btn?.addEventListener('click', (e) => {
        e.stopPropagation();
        const dropdown = btn === bellBtn ? bellDropdown : bellDropdownMobile;
        if (bellOpen && activeBellDropdown === dropdown) {
          closeBell();
        } else {
          closeBell();
          bellOpen = true;
          activeBellDropdown = dropdown;
          if (dropdown) dropdown.style.display = 'block';
        }
      });
    });

    document.addEventListener('click', () => { if (bellOpen) closeBell(); });
    bellDropdown?.addEventListener('click', (e) => e.stopPropagation());
    bellDropdownMobile?.addEventListener('click', (e) => e.stopPropagation());

    function bellEscapeHtml(str) {
      return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    function bellGetTimeAgo(date) {
      const now = new Date();
      const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
      if (diff < 60) return 'just now';
      if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
      if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
      return `${Math.floor(diff / 86400)}d ago`;
    }

    function renderBellNotifications(data, listEl) {
      let html = '';

      // New leads
      (data.leads || []).forEach((l) => {
        const dateObj = l.created_at ? new Date(l.created_at + 'Z') : null;
        const timeAgo = dateObj ? bellGetTimeAgo(dateObj) : '';
        html += `<div class="bell-notification" onclick="window.location.href='/admin/leads'" style="border-left: 3px solid #22c55e;">
          <div class="bell-notification-top">
            <span class="bell-notification-name">${bellEscapeHtml(l.customer_name || 'New Lead')}</span>
            <span class="bell-notification-time">${timeAgo}</span>
          </div>
          <div class="bell-notification-body">${bellEscapeHtml(l.service_type || 'New lead received')}</div>
          <div class="bell-notification-quote" style="color: #22c55e;">NEW LEAD</div>
        </div>`;
      });

      // Quote responses (accepted/declined)
      (data.quoteResponses || []).forEach((q) => {
        const dateObj = q.responded_at ? new Date(q.responded_at + 'Z') : null;
        const timeAgo = dateObj ? bellGetTimeAgo(dateObj) : '';
        const isAccepted = q.status === 'accepted';
        html += `<div class="bell-notification" onclick="window.location.href='/admin/quotes'" style="border-left: 3px solid ${isAccepted ? '#007bff' : '#f59e0b'};">
          <div class="bell-notification-top">
            <span class="bell-notification-name">${bellEscapeHtml(q.customer_name || 'Customer')}</span>
            <span class="bell-notification-time">${timeAgo}</span>
          </div>
          <div class="bell-notification-body">Quote ${isAccepted ? 'accepted' : 'declined'}</div>
          <div class="bell-notification-quote" style="color: ${isAccepted ? '#007bff' : '#f59e0b'};">#${bellEscapeHtml(q.quote_number || '')}</div>
        </div>`;
      });

      // Customer replies
      (data.replies || []).forEach((r) => {
        const dateObj = r.created_at ? new Date(r.created_at + 'Z') : null;
        const timeAgo = dateObj ? bellGetTimeAgo(dateObj) : '';
        const preview = (r.body || '').substring(0, 80) + ((r.body || '').length > 80 ? '...' : '');
        html += `<div class="bell-notification" onclick="window.location.href='/admin/quotes'">
          <div class="bell-notification-top">
            <span class="bell-notification-name">${bellEscapeHtml(r.customer_name || r.sender_name || 'Customer')}</span>
            <span class="bell-notification-time">${timeAgo}</span>
          </div>
          <div class="bell-notification-body">${bellEscapeHtml(preview)}</div>
          <div class="bell-notification-quote">#${bellEscapeHtml(r.quote_number || '')}</div>
        </div>`;
      });

      listEl.innerHTML = html || '<div style="padding: 16px; text-align: center; color: var(--color-text-secondary); font-size: 13px;">No new notifications</div>';
    }

    var bellErrorCount = 0;
    async function loadBellNotifications() {
      if (bellErrorCount >= 3) { window.location.href = '/admin/'; return; }
      try {
        const res = await fetch('/api/admin/unread-replies/', { credentials: 'same-origin' });
        if (res.status === 401 || res.status === 403) { window.location.href = '/admin/'; return; }
        if (!res.ok) { bellErrorCount++; return; }
        const data = await res.json();
        if (!data.success) return;
        bellErrorCount = 0;
        const total = data.total || 0;
        [bellBadge, bellBadgeMobile].forEach(badge => {
          if (badge) {
            badge.textContent = String(total);
            badge.style.display = total > 0 ? 'flex' : 'none';
          }
        });
        [bellBtn, bellBtnMobile].forEach(btn => {
          if (total > 0) btn?.classList.add('has-notifications');
          else btn?.classList.remove('has-notifications');
        });
        if (bellList) renderBellNotifications(data, bellList);
        if (bellListMobile) renderBellNotifications(data, bellListMobile);
      } catch (err) { bellErrorCount++; }
    }
    async function markAllRead() {
      try {
        await fetch('/api/admin/unread-replies/', {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mark_all: true })
        });
        loadBellNotifications();
        closeBell();
      } catch (err) {
        console.error('Failed to mark all as read:', err);
      }
    }
    window.markAllRead = markAllRead;

    loadBellNotifications();
    setInterval(loadBellNotifications, 30000);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) { bellErrorCount = 0; loadBellNotifications(); } });

    // Auto-open the detail modal when the URL has ?open={id}. Used by the new
    // /admin/portfolios/[id] sub-page during the migration so the "Back to
    // modal view" link actually opens the editor. Cleans the URL after open
    // so external links don't dead-end at the list. Editor lives on the
    // sub-page now, so redirect there.
    (function () {
      if (window.location.pathname !== '/admin/portfolios/' && window.location.pathname !== '/admin/portfolios') return;
      const params = new URLSearchParams(window.location.search);
      const openId = params.get('open');
      if (openId && /^\d+$/.test(openId)) {
        window.location.replace('/admin/portfolios/' + openId + '/');
      }
    })();
