# AI Chat Improvements - Task List

## Branch: fix-ai-chat

### Task 1: Chat Window Positioning
- **Desktop (≥1111px)**: Move chat window to the left side of the screen
- **Mobile/Tablet (<768px to 1110px)**: Center the chat window
- **Desktop experience**: Applies from 1111px and above

### Task 2: Chat Window Interaction
- Implement click/tap outside to close functionality
- Should behave the same as clicking the close X button
- Need to add event listener for outside clicks

### Task 3: Update Chat Messages
**Replace current greeting:** 
"Hi! I'm MannyKnows AI assistant. I can help you learn about our e-commerce solutions, get pricing for your online store, or answer questions about scaling your e-commerce business. What would you like to know?"

**With new two-message sequence:**
1. First message: "Hey what's up? My name is Carl, I'm Manny's AI assistant, and my job is to make your life easy on our site."
2. Second message: "How can I help you today? You can start by telling me your name, where do you live and brief description of the project you have in mind. No need to have all the details, I can help you develop those later. Let me know 🤖🥸"

### Task 4: Fix Glassmorphism Effects
- Current glassmorphism doesn't work well in light mode
- Apply styling similar to:
  - Service Menus Section
  - Process section
  - Customer Success sections
- Need to examine these sections for reference styling

### Task 5: Services Section Styling Update
- Make "Services" section match the style of:
  - "Reviews" section
  - "Process" section
- Ensure consistent visual design language

### Task 6: Dock Menu Icons Update
- Update dock menu icons to match the style of:
  - "Reviews" section
  - "Process" section
- Maintain consistency across UI elements

### Task 7: Service Category Highlighting
- In "Browse service category" section
- Change from background highlighting to border highlighting
- Maintain the animation effect but apply to border instead

## Questions for Clarification:
1. For the chat positioning - should the chat window be fixed positioned or absolute?
2. For the glassmorphism replacement - should we completely remove glassmorphism or adapt it?
3. For the service category border highlighting - what color/style should the border animation be?
4. Should the chat window size change between mobile and desktop, or just positioning?

## Files to Examine:
- Chat component files
- Service sections for styling reference
- Dock menu component
- Service category component
