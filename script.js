// Function to split text into characters for animation (keeping words together)
function textToChars(element) {
    const text = element.textContent;
    element.innerHTML = '';
    const words = text.split(' ');
    
    words.forEach((word, wordIndex) => {
        // Create a word wrapper to prevent line breaks mid-word
        const wordWrapper = document.createElement('span');
        wordWrapper.className = 'word-wrapper';
        wordWrapper.style.display = 'inline-block';
        wordWrapper.style.whiteSpace = 'nowrap';
        
        // Split word into characters
        word.split('').forEach(char => {
            const span = document.createElement('span');
            span.className = 'char';
            span.textContent = char;
            wordWrapper.appendChild(span);
        });
        
        element.appendChild(wordWrapper);
        
        // Add space after word (except for last word)
        if (wordIndex < words.length - 1) {
            const space = document.createElement('span');
            space.className = 'char';
            space.textContent = '\u00A0';
            element.appendChild(space);
        }
    });
}

// Function to split text into words for animation
function textToWords(element) {
    const text = element.textContent;
    element.innerHTML = '';
    const words = text.split(' ');
    words.forEach((word, index) => {
        if (word) { // Skip empty strings
            const span = document.createElement('span');
            span.className = 'word';
            span.textContent = word;
            element.appendChild(span);
            // Add space after each word except the last
            if (index < words.length - 1) {
                const space = document.createTextNode(' ');
                element.appendChild(space);
            }
        }
    });
}

// Global animation timeline
let masterTimeline;

// Create the master timeline for scroll control
function createScrollTimeline() {
    masterTimeline = anime.timeline({
        easing: 'easeOutExpo',
        autoplay: false // We'll control this with scroll
    });

    // Phase 1: Main quote words appear
    masterTimeline.add({
        targets: '.quote-main .word',
        opacity: [0, 1],
        translateY: [30, 0],
        scale: [0.8, 1],
        duration: 400,
        delay: anime.stagger(100),
        easing: 'easeOutBack'
    })
    
    // Phase 2: Attribution appears
    .add({
        targets: '.attribution',
        opacity: [0, 1],
        translateY: [30, 0],
        duration: 800,
        easing: 'easeOutQuart'
    }, '-=500')
    
    // Phase 3: Response text appears word by word
    .add({
        targets: '.response .word',
        opacity: [0, 1],
        translateY: [30, 0],
        scale: [0.8, 1],
        duration: 400,
        delay: anime.stagger(100),
        easing: 'easeOutBack'
    }, '-=200');
}

// Scroll-based animation controller
function handleScrollAnimation() {
    const scrolled = window.pageYOffset;
    const windowHeight = window.innerHeight;
    
    // Calculate scroll progress (0 to 1)
    // Complete animation over 2.5 viewport heights of scrolling (more space for full reveal)
    let scrollProgress = Math.min(scrolled / (windowHeight * 1), 1);
    
    // Map scroll progress to timeline progress
    if (masterTimeline) {
        const timelineProgress = scrollProgress * masterTimeline.duration;
        masterTimeline.seek(timelineProgress);
    }
    
    // Manage typing cursor positioning to follow the typing
    if (quoteCursor && responseCursor) {
        const quoteWords = document.querySelectorAll('.quote-main .word');
        const responseWords = document.querySelectorAll('.response .word');
        const attribution = document.querySelector('.attribution');
        
        // Find last visible word in quote
        let lastVisibleQuoteWord = null;
        let visibleQuoteCount = 0;
        quoteWords.forEach(word => {
            if (parseFloat(getComputedStyle(word).opacity) > 0.5) {
                lastVisibleQuoteWord = word;
                visibleQuoteCount++;
            }
        });
        
        // Find last visible word in response
        let lastVisibleResponseWord = null;
        let visibleResponseCount = 0;
        responseWords.forEach(word => {
            if (parseFloat(getComputedStyle(word).opacity) > 0.5) {
                lastVisibleResponseWord = word;
                visibleResponseCount++;
            }
        });
        
        // Check if attribution is visible (indicates quote is complete)
        const attributionVisible = attribution ? parseFloat(getComputedStyle(attribution).opacity) > 0.5 : false;
        
        // Position and show quote cursor while typing the quote
        if (visibleQuoteCount > 0 && visibleQuoteCount < quoteWords.length) {
            quoteCursor.classList.add('active');
            
            // Move cursor after the last visible word
            if (lastVisibleQuoteWord) {
                const parent = lastVisibleQuoteWord.parentElement;
                if (parent) {
                    if (lastVisibleQuoteWord.nextSibling === quoteCursor) {
                        // Already in position
                    } else {
                        parent.insertBefore(quoteCursor, lastVisibleQuoteWord.nextSibling);
                    }
                }
            }
        } else {
            quoteCursor.classList.remove('active');
        }
        
        // Position and show response cursor only when quote is fully done
        if (attributionVisible && visibleQuoteCount >= quoteWords.length && 
            visibleResponseCount > 0 && visibleResponseCount < responseWords.length) {
            responseCursor.classList.add('active');
            
            // Move cursor after the last visible word
            if (lastVisibleResponseWord) {
                const parent = lastVisibleResponseWord.parentElement;
                if (parent) {
                    if (lastVisibleResponseWord.nextSibling === responseCursor) {
                        // Already in position
                    } else {
                        parent.insertBefore(responseCursor, lastVisibleResponseWord.nextSibling);
                    }
                }
            }
        } else {
            responseCursor.classList.remove('active');
        }
    }
    
    // Hide scroll indicator when user starts scrolling
    const scrollIndicator = document.querySelector('.scroll-indicator');
    if (scrollIndicator) {
        if (scrolled > 50) {
            scrollIndicator.style.opacity = '0';
            scrollIndicator.style.pointerEvents = 'none';
        } else {
            scrollIndicator.style.opacity = '1';
            scrollIndicator.style.pointerEvents = 'auto';
        }
    }
}

// Track typing cursors
let quoteCursor, responseCursor;

// Initialize everything when the page loads
window.addEventListener('load', () => {
    const mainQuote = document.getElementById('main-quote');
    const responseText = document.getElementById('response-text');
    
    if (mainQuote && responseText) {
        // Use word-based splitting for both (cleaner and no jumping)
        textToWords(mainQuote);
        textToWords(responseText);
        
        // Create typing cursors and position them at the end of text
        quoteCursor = document.createElement('span');
        quoteCursor.className = 'typing-cursor';
        quoteCursor.textContent = ''; // Empty initially
        
        responseCursor = document.createElement('span');
        responseCursor.className = 'typing-cursor';
        responseCursor.textContent = ''; // Empty initially
        
        // Append cursors right after the text content (at the end)
        mainQuote.appendChild(quoteCursor);
        responseText.appendChild(responseCursor);
        
        // Create the scroll-controlled timeline
        setTimeout(() => {
            createScrollTimeline();
            handleScrollAnimation(); // Initialize with current scroll position
        }, 100);
    }
});

// Background line animations (keep these time-based for ambient effect)
anime({
    targets: '.line:nth-child(1)',
    translateX: ['0%', '100vw'],
    duration: 40000,
    easing: 'linear',
    loop: true,
    delay: 2000
});

anime({
    targets: '.line:nth-child(2)',
    translateX: ['0%', '-100vw'],
    duration: 50000,
    easing: 'linear',
    loop: true,
    delay: 10000
});

anime({
    targets: '.line:nth-child(3)',
    translateX: ['0%', '120vw'],
    duration: 60000,
    easing: 'linear',
    loop: true,
    delay: 20000
});

// Enhanced hover animations for links
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('a').forEach(link => {
        link.addEventListener('mouseenter', () => {
            anime({
                targets: link,
                scale: [1, 1.02],
                translateY: [0, -2],
                duration: 300,
                easing: 'easeOutQuad'
            });
        });

        link.addEventListener('mouseleave', () => {
            anime({
                targets: link,
                scale: [1.02, 1],
                translateY: [-2, 0],
                duration: 300,
                easing: 'easeOutQuad'
            });
        });
    });
});

// Optimized scroll event handler
let scrollTicking = false;
function requestScrollTick() {
    if (!scrollTicking) {
        requestAnimationFrame(handleScrollAnimation);
        scrollTicking = true;
        setTimeout(() => { scrollTicking = false; }, 16); // ~60fps throttling
    }
}

window.addEventListener('scroll', requestScrollTick);
