---
mode: agent
---

# Podcast Player Development

## Objectives
1. Make the podcast player functional
2. Support YouTube videos and audio files
3. Set up R2 cloud storage for media
4. Create responsive, accessible player interface

## Current State
- Podcast container exists (HTML/CSS/JS) but non-functional
- YouTube videos open in new windows instead of playing inline
- Plays MP3 from unknown source
- Needs complete functionality overhaul

## Requirements

### Core Functionality
1. **YouTube Integration** (Priority 1)
   - Embed YouTube videos inline
   - Support single videos and playlists
   - Use YouTube test video: https://www.youtube.com/watch?v=USW8yf4L-R4&ab_channel=TED-Ed
   - Postpone custom MP3 support - focus on YouTube first

2. **Player Controls**
   - Play/pause functionality
   - Skip forward (15-30 seconds)
   - Rewind (15-30 seconds)  
   - Volume control
   - Progress bar with scrubbing
   - Current time / total duration display

3. **Content Display**
   - Show video/podcast title
   - Display description
   - Show duration
   - Thumbnail/poster image

4. **Storage Setup**
   - Configure R2 cloud storage for podcast files
   - Handle media file uploads and management
   - Optimize for streaming delivery

### Technical Requirements

5. **Responsive Design**
   - Desktop optimization
   - Mobile-friendly interface
   - Touch-friendly controls on mobile
   - Adaptive layout for different screen sizes

6. **Error Handling**
   - Graceful failure for unavailable videos
   - Network error recovery
   - Invalid URL handling
   - Loading timeout management

7. **Loading States**
   - Show loading indicators during fetch operations
   - Progressive loading for large playlists
   - Skeleton screens while content loads

8. **Accessibility**
   - Keyboard navigation support
   - Screen reader compatibility
   - ARIA labels for all controls
   - Focus management
   - Sufficient color contrast

### Implementation Notes
- Review existing player options and choose best approach
- Test thoroughly across browsers and devices
- Document code with maintenance instructions
- Follow site standards for coding practices
- Ensure compliance with accessibility guidelines

### Future Enhancements
- Custom MP3 file support
- Playlist management
- Playback speed controls
- Offline caching
- Analytics integration
