// Premium Podcast Player Logicclass PremiumPodcastPlayer {  constructor() {    this.isPlaying = false;    this.currentProgress = 0;    this.volume = 70;    this.isMuted = false;    this.currentEpisodeId = '1';    this.currentAudio = null;    this.isLoading = false;    this.episodes = [];    this.currentEpisodeIndex = 0;        this.init();  }  init() {    this.extractEpisodeData();    this.bindEvents();    this.setupProgressBar();    this.setupVolumeControl();    this.initializeFirstEpisode();  }  extractEpisodeData() {    const episodeItems = document.querySelectorAll('.episode-item');    this.episodes = Array.from(episodeItems).map((item, index) => ({      id: item.dataset.episodeId,      mediaUrl: item.dataset.mediaUrl,      mediaType: item.dataset.mediaType,      element: item,      index: index    }));  }  initializeFirstEpisode() {    const firstEpisode = document.querySelector('.episode-item');    if (firstEpisode) {      firstEpisode.classList.add('selected');    }  }  bindEvents() {    const playPauseBtn = document.getElementById('play-pause-btn');    if (playPauseBtn) {      playPauseBtn.addEventListener('click', () => this.togglePlayPause());    }    const episodeItems = document.querySelectorAll('.episode-item');    episodeItems.forEach(item => {      item.addEventListener('click', (e) => this.selectEpisode(e.currentTarget));    });    const prevBtn = document.getElementById('prev-btn');    if (prevBtn) {      prevBtn.addEventListener('click', () => this.previousEpisode());    }    const nextBtn = document.getElementById('next-btn');    if (nextBtn) {      nextBtn.addEventListener('click', () => this.nextEpisode());    }    const volumeBtn = document.getElementById('volume-btn');    if (volumeBtn) {      volumeBtn.addEventListener('click', () => this.toggleMute());    }    const externalBtn = document.getElementById('external-link-btn');    if (externalBtn) {      externalBtn.addEventListener('click', () => this.openExternal());    }  }  async togglePlayPause() {    if (this.isLoading) return;        const playIcon = document.getElementById('play-icon');    const pauseIcon = document.getElementById('pause-icon');        if (!this.currentAudio) {      await this.loadCurrentEpisode();      return;    }        if (this.isPlaying) {      this.currentAudio.pause();      this.isPlaying = false;      if (playIcon) playIcon.classList.remove('hidden');      if (pauseIcon) pauseIcon.classList.add('hidden');    } else {      this.currentAudio.play();      this.isPlaying = true;      if (playIcon) playIcon.classList.add('hidden');      if (pauseIcon) pauseIcon.classList.remove('hidden');    }  }  async loadCurrentEpisode() {    const currentEpisode = this.episodes[this.currentEpisodeIndex];    if (!currentEpisode) return;    this.showLoading();        try {      if (this.currentAudio) {        this.currentAudio.pause();        if (this.currentAudio.tagName === 'VIDEO') {          this.currentAudio.remove();        }      }      if (currentEpisode.mediaType === 'audio') {        this.currentAudio = new Audio(currentEpisode.mediaUrl);        this.setupAudioEvents();                this.currentAudio.play();
        this.isPlaying = true;
        this.updatePlayButton();
        
      } else if (currentEpisode.mediaType === 'youtube') {
        window.open(currentEpisode.mediaUrl, '_blank');
        this.isPlaying = false;
        this.updatePlayButton();
      }
      
    } catch (error) {
      console.warn('Media loading failed:', error);
    } finally {
      this.hideLoading();
    }
  }

  setupAudioEvents() {
    if (!this.currentAudio) return;
    
    this.currentAudio.addEventListener('timeupdate', () => {
      if (this.currentAudio.duration) {
        const progress = (this.currentAudio.currentTime / this.currentAudio.duration) * 100;
        this.updateProgress(progress);
        this.updateTimeDisplay();
      }
    });
    
    this.currentAudio.addEventListener('ended', () => {
      this.nextEpisode();
    });
    
    this.currentAudio.volume = this.volume / 100;
  }

  updatePlayButton() {
    const playIcon = document.getElementById('play-icon');
    const pauseIcon = document.getElementById('pause-icon');
    
    if (this.isPlaying) {
      if (playIcon) playIcon.classList.add('hidden');
      if (pauseIcon) pauseIcon.classList.remove('hidden');
    } else {
      if (playIcon) playIcon.classList.remove('hidden');
      if (pauseIcon) pauseIcon.classList.add('hidden');
    }
  }

  updateProgress(percentage) {
    const progressBar = document.getElementById('progress-bar');
    const progressHandle = document.getElementById('progress-handle');
    
    if (progressBar) {
      progressBar.style.width = percentage + '%';
    }
    if (progressHandle) {
      progressHandle.style.left = percentage + '%';
    }
  }

  updateTimeDisplay() {
    if (!this.currentAudio) return;
    
    const currentTime = document.getElementById('current-time');
    const totalTime = document.getElementById('total-time');
    
    if (currentTime) {
      currentTime.textContent = this.formatTime(this.currentAudio.currentTime);
    }
    if (totalTime && this.currentAudio.duration) {
      totalTime.textContent = this.formatTime(this.currentAudio.duration);
    }
  }

  formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return mins + ':' + secs.toString().padStart(2, '0');
  }

  showLoading() {
    this.isLoading = true;
    const playBtn = document.getElementById('play-pause-btn');
    if (playBtn && !document.getElementById('player-loading')) {
      playBtn.classList.add('opacity-70');
    }
  }

  hideLoading() {
    this.isLoading = false;
    const playBtn = document.getElementById('play-pause-btn');
    if (playBtn) {
      playBtn.classList.remove('opacity-70');
    }
    const loadingOverlay = document.getElementById('player-loading');
    if (loadingOverlay) {
      loadingOverlay.remove();
    }
  }

  selectEpisode(episodeElement) {
    this.episodes.forEach(ep => ep.element.classList.remove('selected'));
    episodeElement.classList.add('selected');
    this.currentEpisodeIndex = this.episodes.findIndex(ep => ep.element === episodeElement);
    this.loadCurrentEpisode();
  }

  previousEpisode() {
    if (this.currentEpisodeIndex > 0) {
      this.currentEpisodeIndex--;
      this.selectEpisode(this.episodes[this.currentEpisodeIndex].element);
    }
  }

  nextEpisode() {
    if (this.currentEpisodeIndex < this.episodes.length - 1) {
      this.currentEpisodeIndex++;
      this.selectEpisode(this.episodes[this.currentEpisodeIndex].element);
    }
  }

  toggleMute() {
    if (!this.currentAudio) return;
    
    this.isMuted = !this.isMuted;
    this.currentAudio.muted = this.isMuted;
  }

  openExternal() {
    const currentEpisode = this.episodes[this.currentEpisodeIndex];
    if (currentEpisode && currentEpisode.mediaUrl) {
      window.open(currentEpisode.mediaUrl, '_blank');
    }
  }

  setupProgressBar() {
    const progressContainer = document.getElementById('progress-container');
    if (!progressContainer) return;

    progressContainer.addEventListener('click', (e) => {
      if (!this.currentAudio || !this.currentAudio.duration) return;
      
      const rect = progressContainer.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const newProgress = (clickX / rect.width) * 100;
      
      this.currentAudio.currentTime = (newProgress / 100) * this.currentAudio.duration;
      this.updateProgress(newProgress);
    });
  }

  setupVolumeControl() {
    const volumeContainer = document.getElementById('volume-container');
    if (!volumeContainer) return;

    volumeContainer.addEventListener('click', (e) => {
      const rect = volumeContainer.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const newVolume = (clickX / rect.width) * 100;
      
      this.volume = Math.max(0, Math.min(100, newVolume));
      
      if (this.currentAudio) {
        this.currentAudio.volume = this.volume / 100;
      }
      
      const volumeBar = document.getElementById('volume-bar');
      if (volumeBar) {
        volumeBar.style.width = this.volume + '%';
      }
    });
  }
}

// Initialize the player when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.podcastPlayer = new PremiumPodcastPlayer();
});