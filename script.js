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
    // Ensure we start from absolute 0 and complete over viewport height
    let scrollProgress = scrolled <= 0 ? 0 : Math.min(scrolled / (windowHeight * 1), 1);
    
    // Map scroll progress to timeline progress
    if (masterTimeline) {
        const timelineProgress = scrollProgress * masterTimeline.duration;
        masterTimeline.seek(timelineProgress);
        
        // Force complete reset at the top
        if (scrolled === 0) {
            masterTimeline.seek(0);
        }
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
        
        // Position and show quote cursor while typing the quote (including at the very start)
        if (visibleQuoteCount < quoteWords.length) {
            quoteCursor.classList.add('active');
            
            if (visibleQuoteCount === 0) {
                // At the start - position cursor before first word
                const parent = quoteWords[0].parentElement;
                if (parent && parent.firstChild !== quoteCursor) {
                    parent.insertBefore(quoteCursor, parent.firstChild);
                }
            } else if (lastVisibleQuoteWord) {
                // Move cursor after the last visible word
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

// Mobile detection
const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || window.innerWidth <= 768;

// Number generator
const currentNumberEl = document.getElementById('current-number');
const savedNumbersEl = document.getElementById('saved-numbers');
const physicsContainer = document.getElementById('physics-container');

// Rarity counters (persistent - don't decrement on decay)
const rarityCounts = {
    common: 0,
    uncommon: 0,
    rare: 0,
    epic: 0,
    legendary: 0
};

// History of all generated interesting numbers
const numberHistory = [];

// Physics engine setup
const { Engine, Render, World, Bodies, Runner, Body } = Matter;
const engine = Engine.create();
engine.world.gravity.y = 0.5; // Gentle gravity

// Track physics bodies and their DOM elements
const physicsBodies = [];
const MAX_NUMBERS = 500;

// Decay times in milliseconds
const decayTimes = {
    common: 10000,   
    uncommon: 40000,  
    rare: 120000,   
    epic: 400000, 
    legendary: 3200000   
};

// Effect pools for random selection
const effectPools = {
    common: {
        styles: ['effect-italic'],
        colors: [],
        shadows: [],
        animations: []
    },
    uncommon: {
        styles: ['effect-bold', 'effect-italic', 'effect-underline'],
        colors: ['color-blue', 'color-green'],
        shadows: [],
        animations: []
    },
    rare: {
        styles: ['effect-bold', 'effect-italic', 'effect-underline', 'effect-large'],
        colors: ['color-blue', 'color-purple', 'color-cyan'],
        shadows: ['shadow-glow'],
        animations: ['anim-wave', 'anim-bounce']
    },
    epic: {
        styles: ['effect-bold', 'effect-xlarge', 'effect-underline', 'effect-overline'],
        colors: ['color-purple', 'color-pink', 'color-cyan', 'color-orange'],
        shadows: ['shadow-glow', 'shadow-strong'],
        animations: ['anim-glitch', 'anim-shake', 'anim-pulse', 'anim-wiggle', 'anim-float']
    },
    legendary: {
        styles: ['effect-bold', 'effect-xxlarge'],
        colors: ['effect-rainbow'],
        shadows: ['shadow-glow', 'shadow-outline'],
        animations: ['anim-shake', 'anim-pulse', 'anim-glitch', 'anim-wiggle', 'anim-spin']
    }
};

// Random selection helper
function randomSelect(arr, count) {
    const shuffled = [...arr].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
}

// Initialize physics world
function initPhysics() {
    const containerWidth = physicsContainer.clientWidth;
    const containerHeight = physicsContainer.clientHeight;
    
    // Create walls - positioned AT the boundaries, not beyond
    const wallThickness = 50;
    const ground = Bodies.rectangle(
        containerWidth / 2, containerHeight - wallThickness / 2,
        containerWidth, wallThickness,
        { isStatic: true }
    );
    const leftWall = Bodies.rectangle(
        wallThickness / 2, containerHeight / 2,
        wallThickness, containerHeight * 2,
        { isStatic: true }
    );
    const rightWall = Bodies.rectangle(
        containerWidth - wallThickness / 2, containerHeight / 2,
        wallThickness, containerHeight * 2,
        { isStatic: true }
    );
    
    World.add(engine.world, [ground, leftWall, rightWall]);
    
    // Run the engine
    const runner = Runner.create();
    Runner.run(runner, engine);
    
    // Update DOM positions on each physics tick
    Matter.Events.on(engine, 'afterUpdate', () => {
        physicsBodies.forEach(({ body, element }) => {
            if (element && element.parentNode) {
                element.style.left = `${body.position.x}px`;
                element.style.top = `${body.position.y}px`;
                element.style.transform = `translate(-50%, -50%) rotate(${body.angle}rad)`;
            }
        });
    });
}

// Update rarity counter displays
function updateCounters() {
    document.getElementById('common-count').textContent = rarityCounts.common;
    document.getElementById('uncommon-count').textContent = rarityCounts.uncommon;
    document.getElementById('rare-count').textContent = rarityCounts.rare;
    document.getElementById('epic-count').textContent = rarityCounts.epic;
    document.getElementById('legendary-count').textContent = rarityCounts.legendary;
}

// Initialize physics on load (desktop only)
window.addEventListener('load', () => {
    if (!isMobile) {
        setTimeout(initPhysics, 100);
    }
});

// Panel toggle functionality (desktop only)
document.addEventListener('DOMContentLoaded', () => {
    if (!isMobile) {
        const panel = document.querySelector('.number-panel');
        const panelHeader = document.querySelector('.panel-header');
        
        if (panel && panelHeader) {
            panelHeader.addEventListener('click', () => {
                panel.classList.toggle('collapsed');
            });
        }
    }
});

// Generate random 6-digit number
function generateNumber() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// Calculate rarity score (higher = rarer)
function calculateRarity(numStr) {
    const digits = numStr.split('');
    const digitCounts = {};
    let rarity = 0;
    
    // Count occurrences
    digits.forEach(d => {
        digitCounts[d] = (digitCounts[d] || 0) + 1;
    });
    
    const counts = Object.values(digitCounts);
    const uniqueDigits = Object.keys(digitCounts).length;
    const maxCount = Math.max(...counts);
    
    // All same digit (legendary) - 123456
    if (maxCount === 6) rarity += 100;
    
    // 5 same digits (epic) - 111112
    if (maxCount === 5) rarity += 50;
    
    // 4 same digits (rare) - 111123
    if (maxCount === 4) rarity += 20;
    
    // Only 1 unique digit (legendary)
    if (uniqueDigits === 1) rarity += 100;
    
    // Only 2 unique digits (epic)
    if (uniqueDigits === 2) rarity += 30;
    
    // Only 3 unique digits (uncommon)
    if (uniqueDigits === 3) rarity += 10;
    
    // Check for patterns
    const isIncreasing = digits.every((d, i) => i === 0 || parseInt(d) >= parseInt(digits[i-1]));
    const isDecreasing = digits.every((d, i) => i === 0 || parseInt(d) <= parseInt(digits[i-1]));
    const isStrictIncreasing = digits.every((d, i) => i === 0 || parseInt(d) > parseInt(digits[i-1]));
    const isStrictDecreasing = digits.every((d, i) => i === 0 || parseInt(d) < parseInt(digits[i-1]));
    
    // Perfect sequences (legendary)
    if (numStr === '123456' || numStr === '654321') rarity += 150;
    
    // Strict monotonic (epic)
    if (isStrictIncreasing || isStrictDecreasing) rarity += 40;
    
    // Monotonic with repeats (rare)
    if (isIncreasing || isDecreasing) rarity += 15;
    
    // Palindrome (rare)
    if (numStr === numStr.split('').reverse().join('')) rarity += 35;
    
    // Repeating pattern (epic) - 123123, 121212
    const half = numStr.substring(0, 3);
    if (numStr.substring(3) === half) rarity += 45;
    
    return rarity;
}

// Check if number is interesting
function isInteresting(numStr) {
    return calculateRarity(numStr) > 0;
}

// Add number to saved list with rarity styling and decay
function saveNumber(number) {
    // Check limit
    if (physicsBodies.length >= MAX_NUMBERS) {
        // Remove oldest
        const oldest = physicsBodies.shift();
        if (oldest.element) oldest.element.remove();
        World.remove(engine.world, oldest.body);
    }
    
    const numberDiv = document.createElement('div');
    const rarityScore = calculateRarity(number);
    
    // Determine rarity tier
    let rarityTier;
    if (rarityScore >= 100) rarityTier = 'legendary';
    else if (rarityScore >= 50) rarityTier = 'epic';
    else if (rarityScore >= 30) rarityTier = 'rare';
    else if (rarityScore >= 15) rarityTier = 'uncommon';
    else rarityTier = 'common';
    
    // Update counter (persistent)
    rarityCounts[rarityTier]++;
    updateCounters();
    
    // Increase generation speed based on rarity
    updateGenerationSpeed(rarityTier);
    
    // Add to history
    numberHistory.push({
        number: number,
        rarity: rarityTier,
        timestamp: Date.now()
    });
    
    // Base class
    numberDiv.className = 'saved-number';
    numberDiv.textContent = number;
    
    // Apply random effects from the pool
    const pool = effectPools[rarityTier];
    const effectCount = {
        common: 1,
        uncommon: 2,
        rare: 3,
        epic: 4,
        legendary: 5
    }[rarityTier];
    
    // Add random styles
    if (pool.styles.length > 0) {
        randomSelect(pool.styles, Math.min(effectCount, pool.styles.length)).forEach(cls => {
            numberDiv.classList.add(cls);
        });
    }
    
    // Add random colors
    if (pool.colors.length > 0) {
        const color = randomSelect(pool.colors, 1)[0];
        if (color) numberDiv.classList.add(color);
    }
    
    // Add random shadows
    if (pool.shadows.length > 0 && Math.random() > 0.3) {
        const shadow = randomSelect(pool.shadows, 1)[0];
        if (shadow) numberDiv.classList.add(shadow);
    }
    
    // Add random animations - but not movement animations
    if (pool.animations.length > 0 && Math.random() > 0.2) {
        const animations = randomSelect(pool.animations.filter(a => !['anim-wave', 'anim-bounce', 'anim-float'].includes(a)), 1);
        animations.forEach(cls => numberDiv.classList.add(cls));
    }
    
    // Add to DOM
    savedNumbersEl.appendChild(numberDiv);
    
    // Create physics body with accurate sizing
    const containerWidth = physicsContainer.clientWidth;
    const startX = Math.random() * (containerWidth - 100) + 50;
    const startY = -20; // Start above container
    
    // Get actual rendered size and make collision box tighter
    const rect = numberDiv.getBoundingClientRect();
    const width = (rect.width || 60) * 0.7;  // 70% of visual width
    const height = (rect.height || 20) * 0.7;  // 70% of visual height
    
    const body = Bodies.rectangle(startX, startY, width, height, {
        restitution: 0.3,
        friction: 0.8,
        density: 0.001
    });
    
    World.add(engine.world, body);
    
    // Track body and element
    const physicsObj = { body, element: numberDiv, startTime: Date.now(), rarityTier };
    physicsBodies.push(physicsObj);
    
    // Start decay process
    const decayTime = decayTimes[rarityTier];
    
    const decayInterval = setInterval(() => {
        const elapsed = Date.now() - physicsObj.startTime;
        const progress = elapsed / decayTime;
        
        if (progress >= 1) {
            // Remove element and physics body
            numberDiv.remove();
            World.remove(engine.world, body);
            const index = physicsBodies.indexOf(physicsObj);
            if (index > -1) physicsBodies.splice(index, 1);
            clearInterval(decayInterval);
        } else {
            // Fade out: opacity goes from 1 to 0
            numberDiv.style.opacity = 1 - progress;
        }
    }, 100); // Update every 100ms for smooth fade
}

// Export function
function exportData() {
    const data = {
        counters: rarityCounts,
        history: numberHistory,
        exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `interesting-numbers-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Import function
function importData(data) {
    // Add imported counters to existing counters (additive)
    const importedCounts = {
        common: data.counters.common || 0,
        uncommon: data.counters.uncommon || 0,
        rare: data.counters.rare || 0,
        epic: data.counters.epic || 0,
        legendary: data.counters.legendary || 0
    };
    
    rarityCounts.common += importedCounts.common;
    rarityCounts.uncommon += importedCounts.uncommon;
    rarityCounts.rare += importedCounts.rare;
    rarityCounts.epic += importedCounts.epic;
    rarityCounts.legendary += importedCounts.legendary;
    updateCounters();
    
    // Add speed contributions from imported numbers
    Object.keys(importedCounts).forEach(rarity => {
        const count = importedCounts[rarity];
        generationSpeed += speedContributions[rarity] * count;
    });
    
    // Keep existing display and physics - we'll add to them
    
    // Filter for rare, epic, or legendary
    const displayNumbers = data.history
        .filter(item => ['rare', 'epic', 'legendary'].includes(item.rarity))
        .slice(-50); // Get last 50
    
    // Display them with physics but no decay
    displayNumbers.forEach((item, index) => {
        // Check limit and remove oldest if needed
        if (physicsBodies.length >= MAX_NUMBERS) {
            const oldest = physicsBodies.shift();
            if (oldest.element) oldest.element.remove();
            World.remove(engine.world, oldest.body);
        }
        
        const numberDiv = document.createElement('div');
        numberDiv.className = 'saved-number';
        numberDiv.textContent = item.number;
        
        // Apply effects based on rarity
        const pool = effectPools[item.rarity];
        const effectCount = { rare: 3, epic: 4, legendary: 5 }[item.rarity];
        
        // Add random styles
        if (pool.styles.length > 0) {
            randomSelect(pool.styles, Math.min(effectCount, pool.styles.length)).forEach(cls => {
                numberDiv.classList.add(cls);
            });
        }
        
        // Add random colors
        if (pool.colors.length > 0) {
            const color = randomSelect(pool.colors, 1)[0];
            if (color) numberDiv.classList.add(color);
        }
        
        // Add random shadows
        if (pool.shadows.length > 0 && Math.random() > 0.3) {
            const shadow = randomSelect(pool.shadows, 1)[0];
            if (shadow) numberDiv.classList.add(shadow);
        }
        
        // Add random animations - but not movement ones
        if (pool.animations.length > 0 && Math.random() > 0.2) {
            const animations = randomSelect(pool.animations.filter(a => !['anim-wave', 'anim-bounce', 'anim-float'].includes(a)), 1);
            animations.forEach(cls => numberDiv.classList.add(cls));
        }
        
        savedNumbersEl.appendChild(numberDiv);
        
        // Create physics body with accurate sizing
        const containerWidth = physicsContainer.clientWidth;
        const startX = Math.random() * (containerWidth - 100) + 50;
        const startY = -20 - (index * 5); // Stagger start positions
        
        // Get actual rendered size and make collision box tighter
        const rect = numberDiv.getBoundingClientRect();
        const width = (rect.width || 60) * 0.7;  // 70% of visual width
        const height = (rect.height || 20) * 0.7;  // 70% of visual height
        
        const body = Bodies.rectangle(startX, startY, width, height, {
            restitution: 0.3,
            friction: 0.8,
            density: 0.001
        });
        
        World.add(engine.world, body);
        
        // Track body and element (no decay for imported)
        physicsBodies.push({ body, element: numberDiv, startTime: null, rarityTier: item.rarity });
    });
    
    // Add imported numbers to history
    data.history.forEach(item => {
        if (!numberHistory.find(h => h.number === item.number && h.timestamp === item.timestamp)) {
            numberHistory.push(item);
        }
    });
}

// Set up export/import buttons (desktop only)
if (!isMobile) {
    const exportBtn = document.getElementById('export-btn');
    const importBtn = document.getElementById('import-btn');
    const importFile = document.getElementById('import-file');
    
    if (exportBtn) {
        exportBtn.addEventListener('click', exportData);
    }
    
    if (importBtn && importFile) {
        importBtn.addEventListener('click', () => {
            importFile.click();
        });
        
        importFile.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    try {
                        const data = JSON.parse(event.target.result);
                        importData(data);
                    } catch (err) {
                        console.error('Failed to import:', err);
                        alert('Invalid file format');
                    }
                };
                reader.readAsText(file);
            }
            // Reset file input
            e.target.value = '';
        });
    }
}

// Dynamic generation speed system
let generationSpeed = 0; // Speed points accumulated from finds
const baseInterval = 500; // Start at 500ms (2 per second)
const minInterval = 10; // Maximum speed cap at 100 per second

// Speed contributions per rarity (in speed points)
const speedContributions = {
    common: 0.5,
    uncommon: 2,
    rare: 5,
    epic: 15,
    legendary: 50
};

function calculateInterval() {
    // Each speed point reduces interval by 0.5ms
    const reduction = generationSpeed * 0.5;
    return Math.max(minInterval, baseInterval - reduction);
}

function updateGenerationSpeed(rarity) {
    generationSpeed += speedContributions[rarity];
}

// Number generation loop with dynamic speed
let generationTimeout;
function generateLoop() {
    const number = generateNumber();
    currentNumberEl.textContent = number;
    
    if (isInteresting(number)) {
        saveNumber(number);
    }
    
    // Schedule next generation with current speed
    const interval = calculateInterval();
    generationTimeout = setTimeout(generateLoop, interval);
}

// Start the generation loop (desktop only)
if (!isMobile) {
    generateLoop();
}