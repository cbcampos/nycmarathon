const googleScriptURL = "https://script.google.com/macros/s/AKfycbze99xFPDOBHaLWStFwZ-s111wVz0Nc2KWMeQh6j52ofzMlc6KMgChhkAXPUbgjJsTpBQ/exec";

const mileContainer = document.getElementById("mile-markers");
const progressText = document.getElementById("amountRaised");
const progressFill = document.querySelector(".progress-fill");
const modal = document.getElementById("sponsorModal");
const closeModal = document.querySelector(".close");
const submitButton = document.querySelector(".submit-button");

// Debugging function
function logDebug(message) {
    console.log(message);
    const debugPanel = document.getElementById("debug-log");
    if (debugPanel) {
        debugPanel.innerHTML += `<br>🟢 ${message}`;
        debugPanel.scrollTop = debugPanel.scrollHeight; // Auto-scroll
    }
}

// Toggle debug panel visibility
function toggleDebugPanel() {
    const panel = document.getElementById("debug-panel");
    panel.style.display = (panel.style.display === "none") ? "block" : "none";
}

// Define mile positions
const miles = Array.from({ length: 26 }, (_, i) => ({
    number: i + 1,
    coords: pixelToPercentage([
        321, 492, 680, 910, 1130, 1322, 1522, 1715, 1820, 2005,
        2130, 2340, 2507, 2665, 2760, 2760, 2965, 3190, 3430, 3648,
        3690, 3485, 3265, 3060, 2865, 2790
    ][i], [
        1175, 1282, 1200, 1170, 1220, 1260, 1275, 1260, 1410, 1265,
        1230, 1260, 1150, 1075, 1125, 915, 890, 890, 890, 920,
        770, 725, 725, 710, 710, 625
    ][i])
}));

// Convert pixel positions to percentage
function pixelToPercentage(x, y) {
    // Original map dimensions from the coordinate system
    const MAP_WIDTH = 4001;
    const MAP_HEIGHT = 1817;
    const MAP_OFFSET_X = 0;
    const MAP_OFFSET_Y = 0;

    // Calculate percentages from the original map dimensions
    const xPercent = ((x - MAP_OFFSET_X) / MAP_WIDTH) * 100;
    const yPercent = ((y - MAP_OFFSET_Y) / MAP_HEIGHT) * 100;

    return {
        left: `${xPercent}%`,
        top: `${yPercent}%`
    };
}

// Fetch sponsorship data
async function loadSponsorships() {
    logDebug("🔄 Fetching sponsorship data...");
    try {
        // Create a unique callback name with timestamp and random number
        const timestamp = new Date().getTime();
        const random = Math.floor(Math.random() * 1000000);
        const callbackName = `jsonpCallback_${timestamp}_${random}`;
        
        // Create a script element
        const script = document.createElement('script');
        
        // Add callback parameter to URL, ensuring we don't duplicate parameters
        const url = new URL(googleScriptURL);
        url.searchParams.set('callback', callbackName);
        script.src = url.toString();
        
        // Create a promise that will resolve when the callback is called
        const sponsorshipsPromise = new Promise((resolve, reject) => {
            // Set timeout to reject if taking too long
            const timeoutId = setTimeout(() => {
                reject(new Error('Request timed out'));
                cleanup();
            }, 10000); // 10 second timeout
            
            // Cleanup function
            const cleanup = () => {
                clearTimeout(timeoutId);
                if (script.parentNode) {
                    script.parentNode.removeChild(script);
                }
                delete window[callbackName];
            };
            
            // Setup callback
            window[callbackName] = (data) => {
                logDebug("📥 Received data from callback");
                resolve(data);
                cleanup();
            };
            
            script.onerror = () => {
                logDebug("❌ Script loading failed");
                reject(new Error('Script loading failed'));
                cleanup();
            };

            // Additional error handling
            script.onload = () => {
                logDebug("✅ Script loaded successfully");
                // Set a timeout to check if the callback wasn't called
                setTimeout(() => {
                    if (window[callbackName]) {
                        reject(new Error('Callback was not executed'));
                        cleanup();
                    }
                }, 5000);
            };
        });
        
        // Add script to the document
        logDebug(`🔗 Loading script from: ${script.src}`);
        document.body.appendChild(script);
        
        // Wait for the data
        const response = await sponsorshipsPromise;
        logDebug("✅ Sponsorship data loaded:", response);

        if (!response.success) {
            throw new Error(response.error || 'Failed to load sponsorship data');
        }

        const sponsorships = response.data;
        let totalRaised = 0;
        miles.forEach(mile => {
            if (sponsorships[mile.number]) {
                mile.sponsored = true;
                mile.sponsor = sponsorships[mile.number].sponsor;
                mile.message = sponsorships[mile.number].message;
                totalRaised += parseInt(sponsorships[mile.number].amount || 100);
            } else {
                mile.sponsored = false;
            }
        });

        updateProgressBar(totalRaised);
        renderMileMarkers();
    } catch (error) {
        logDebug(`❌ Error loading sponsorships: ${error.message}`);
        // Show error message to user
        const container = document.querySelector('.container');
        const errorMessage = document.createElement('div');
        errorMessage.className = 'error-message';
        errorMessage.textContent = 'Unable to load sponsorship data. Please refresh the page to try again.';
        container.insertBefore(errorMessage, container.firstChild);
    }
}

// Update progress bar
function updateProgressBar(totalRaised) {
    const mileSponsorGoal = 2600;  // $2,600 goal for mile sponsors
    progressText.textContent = `$${totalRaised} raised so far`;
    const percentage = (totalRaised / mileSponsorGoal) * 100;
    progressFill.style.width = `${Math.min(percentage, 100)}%`;
    logDebug(`🔄 Progress bar updated: $${totalRaised} raised so far (${percentage.toFixed(2)}%)`);
}

// Render mile markers
function renderMileMarkers() {
    if (!mileContainer) return;
    mileContainer.innerHTML = "";
    
    miles.forEach(mile => {
        const marker = document.createElement("div");
        marker.classList.add("mile-marker", mile.sponsored ? "sponsored" : "needed");
        marker.textContent = mile.number;
        marker.dataset.mile = mile.number;

        // Position marker using percentage coordinates
        marker.style.left = mile.coords.left;
        marker.style.top = mile.coords.top;

        // Event listeners
        marker.addEventListener("mouseover", (event) => {
            event.stopPropagation();
            showTooltip(event, mile);
        });
        
        marker.addEventListener("mouseout", (event) => {
            event.stopPropagation();
            hideTooltip();
        });
        
        marker.addEventListener("touchstart", (event) => {
            event.preventDefault();
            event.stopPropagation();
            if (!mile.sponsored) {
                openSponsorModal(mile.number);
            } else {
                showTooltip(event, mile);
            }
        });
        
        marker.addEventListener("click", (event) => {
            event.stopPropagation();
            if (!mile.sponsored) {
                openSponsorModal(mile.number);
            }
        });

        mileContainer.appendChild(marker);
    });

    logDebug(`✅ Rendered ${miles.length} mile markers`);
}

// Show tooltip
function showTooltip(event, mile) {
    hideTooltip(); // Remove any existing tooltip
    
    const tooltip = document.createElement("div");
    tooltip.classList.add("tooltip");

    if (mile.sponsored) {
        tooltip.innerHTML = `<h3>Mile ${mile.number} - Sponsored by ${mile.sponsor}</h3><p class="message">"${mile.message}"</p>`;
    } else {
        tooltip.innerHTML = `<h3>Mile ${mile.number} - Needs a Sponsor</h3><button class="sponsor-button">Sponsor This Mile</button>`;
        
        // Add click event listener to the sponsor button
        const sponsorButton = tooltip.querySelector('.sponsor-button');
        sponsorButton.addEventListener('click', (e) => {
            e.stopPropagation();
            openSponsorModal(mile.number);
            hideTooltip();
        });
    }

    document.body.appendChild(tooltip);
    
    // Position tooltip
    if ('ontouchstart' in window) {
        // For mobile devices, center in viewport
        tooltip.style.left = '50%';
        tooltip.style.top = '50%';
        tooltip.style.transform = 'translate(-50%, -50%)';
    } else {
        // For desktop, position near cursor but ensure it stays in viewport
        const rect = tooltip.getBoundingClientRect();
        let left = event.clientX + 10;
        let top = event.clientY + 10;
        
        // Adjust if tooltip would go off screen
        if (left + rect.width > window.innerWidth) {
            left = event.clientX - rect.width - 10;
        }
        if (top + rect.height > window.innerHeight) {
            top = event.clientY - rect.height - 10;
        }
        
        tooltip.style.left = `${left}px`;
        tooltip.style.top = `${top}px`;
    }
}

// Hide tooltip
function hideTooltip() {
    const tooltip = document.querySelector('.tooltip');
    if (tooltip) {
        tooltip.remove();
    }
}

// Open sponsor modal
function openSponsorModal(mile) {
    document.getElementById("mileNumber").textContent = mile;
    modal.style.display = "flex";
    document.body.style.overflow = "hidden";
    
    // Focus management
    const closeButton = modal.querySelector('.close');
    closeButton.focus();
    
    // Trap focus in modal
    modal.addEventListener('keydown', trapFocus);
    
    validateForm();
}

function trapFocus(e) {
    if (e.key !== 'Tab') return;
    
    const focusableElements = modal.querySelectorAll('button, input, textarea, [tabindex]:not([tabindex="-1"])');
    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];
    
    if (e.shiftKey) {
        if (document.activeElement === firstFocusable) {
            lastFocusable.focus();
            e.preventDefault();
        }
    } else {
        if (document.activeElement === lastFocusable) {
            firstFocusable.focus();
            e.preventDefault();
        }
    }
}

// Close modal
closeModal.addEventListener("click", () => {
    modal.style.display = "none";
    document.body.style.overflow = "auto";
});

// Close modal when clicking outside the form
window.addEventListener("click", (event) => {
    if (event.target === modal) {
        modal.style.display = "none";
        document.body.style.overflow = "auto";
    }
});

// Validate form before enabling submit button
function validateForm() {
    const requiredFields = document.querySelectorAll("#sponsorForm input[required], #sponsorForm textarea[required]");
    let allFilled = Array.from(requiredFields).every(field => field.value.trim() !== "");

    submitButton.disabled = !allFilled;
}

// Attach validation to required fields
document.querySelectorAll("#sponsorForm input[required], #sponsorForm textarea[required]").forEach(field => {
    field.addEventListener("input", validateForm);
});

// Security: Sanitize input
function sanitizeInput(input) {
    const div = document.createElement('div');
    div.textContent = input;
    return div.innerHTML;
}

// Form validation messages
const validationMessages = {
    firstName: 'Please enter your first name',
    lastName: 'Please enter your last name',
    email: 'Please enter a valid email address',
    phone: 'Please enter a valid 10-digit phone number',
    message: 'Please enter a message (max 500 characters)',
    amount: 'Amount must be at least $100'
};

// Real-time form validation
function validateField(field) {
    const errorDiv = field.nextElementSibling;
    let isValid = true;
    let message = '';

    // Sanitize input
    const value = sanitizeInput(field.value.trim());

    switch(field.id) {
        case 'email':
            isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
            message = isValid ? '' : validationMessages.email;
            break;
        case 'phone':
            isValid = /^\d{10}$/.test(value.replace(/\D/g, ''));
            message = isValid ? '' : validationMessages.phone;
            break;
        case 'message':
            isValid = value.length > 0 && value.length <= 500;
            message = isValid ? '' : validationMessages.message;
            break;
        case 'amount':
            isValid = parseInt(value) >= 100;
            message = isValid ? '' : validationMessages.amount;
            break;
        default:
            isValid = value.length > 0;
            message = isValid ? '' : validationMessages[field.id];
    }

    field.setAttribute('aria-invalid', !isValid);
    errorDiv.textContent = message;
    return isValid;
}

// Enhance form fields
document.querySelectorAll('#sponsorForm input, #sponsorForm textarea').forEach(field => {
    field.addEventListener('input', () => {
        validateField(field);
        validateForm();
    });

    field.addEventListener('blur', () => {
        validateField(field);
    });
});

// Share functionality
const shareButton = document.querySelector('.share-button');
if (shareButton) {
    shareButton.addEventListener('click', async () => {
        const shareData = {
            title: 'Support Chris\'s NYC Marathon Fundraiser',
            text: 'I just sponsored inclusion by supporting Chris\'s NYC Marathon fundraiser for KultureCity. You can support him too!',
            url: window.location.href
        };

        try {
            if (navigator.share && !navigator.userAgent.includes('Firefox')) { // Exclude Firefox due to implementation issues
                await navigator.share(shareData);
            } else {
                // Fallback for browsers that don't support Web Share API
                const tempInput = document.createElement('input');
                tempInput.value = `${shareData.text}\n${shareData.url}`;
                tempInput.setAttribute('readonly', '');
                tempInput.style.position = 'absolute';
                tempInput.style.left = '-9999px';
                document.body.appendChild(tempInput);
                tempInput.select();
                try {
                    document.execCommand('copy');
                    alert('Link copied to clipboard! Share it with your friends.');
                } catch (err) {
                    console.error('Failed to copy:', err);
                    // Fallback for mobile
                    alert(`Please share this link:\n${shareData.text}\n${shareData.url}`);
                }
                document.body.removeChild(tempInput);
            }
        } catch (err) {
            console.error('Error sharing:', err);
            // Fallback if sharing fails
            alert(`Please share this link:\n${shareData.text}\n${shareData.url}`);
        }
    });
}

// Progressive enhancement: Check for required APIs
const hasRequiredFeatures = {
    localStorage: !!window.localStorage,
    fetch: !!window.fetch,
    promise: !!window.Promise
};

// Save form data to localStorage
function saveFormData() {
    if (!hasRequiredFeatures.localStorage) return;
    
    const formData = {};
    document.querySelectorAll('#sponsorForm input, #sponsorForm textarea').forEach(field => {
        formData[field.id] = field.value;
    });
    localStorage.setItem('sponsorFormData', JSON.stringify(formData));
}

// Load saved form data
function loadSavedFormData() {
    if (!hasRequiredFeatures.localStorage) return;
    
    const savedData = localStorage.getItem('sponsorFormData');
    if (savedData) {
        const formData = JSON.parse(savedData);
        Object.entries(formData).forEach(([id, value]) => {
            const field = document.getElementById(id);
            if (field) field.value = value;
        });
    }
}

// Rate limiting for form submission
const SUBMIT_COOLDOWN = 1000; // 1 second
let lastSubmitTime = 0;

// Update form submission handler
document.getElementById("sponsorForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    // Rate limiting check
    const now = Date.now();
    if (now - lastSubmitTime < SUBMIT_COOLDOWN) {
        alert('Please wait a moment before submitting again.');
        return;
    }
    lastSubmitTime = now;

    // Validate all fields
    let isValid = true;
    document.querySelectorAll('#sponsorForm input[required], #sponsorForm textarea[required]').forEach(field => {
        if (!validateField(field)) {
            isValid = false;
        }
    });

    if (!isValid) {
        return;
    }

    // Get the submit button and show loading state
    const submitButton = document.querySelector(".submit-button");
    submitButton.disabled = true;
    submitButton.textContent = "Submitting...";
    submitButton.setAttribute('aria-busy', 'true');

    logDebug("🚀 Form Submission Started");

    const formData = {
        mile: document.getElementById("mileNumber").textContent,
        firstName: document.getElementById("firstName").value.trim(),
        lastName: document.getElementById("lastName").value.trim(),
        email: document.getElementById("email").value.trim(),
        phone: document.getElementById("phone").value.trim(),
        message: document.getElementById("message").value.trim(),
        amount: document.getElementById("amount").value.trim()
    };

    logDebug("📤 Submitting Form Data:", JSON.stringify(formData, null, 2));

    try {
        // Create a unique callback name
        const callbackName = 'formCallback_' + Math.round(100000 * Math.random());
        
        // Create a script element for JSONP
        const script = document.createElement('script');
        
        // Create the URL with all form data as query parameters
        const params = new URLSearchParams({
            ...formData,
            callback: callbackName
        });
        
        script.src = `${googleScriptURL}?${params.toString()}`;
        
        // Create a promise that will resolve when the callback is called
        const submissionPromise = new Promise((resolve, reject) => {
            // Set up the callback function
            window[callbackName] = (response) => {
                if (response && response.success) {
                    resolve(response);
                } else {
                    reject(new Error(response ? response.error : 'Submission failed'));
                }
                // Clean up
                if (script.parentNode) {
                    script.parentNode.removeChild(script);
                }
                delete window[callbackName];
            };
            
            // Handle script load error
            script.onerror = () => {
                reject(new Error('Failed to submit form'));
                if (script.parentNode) {
                    script.parentNode.removeChild(script);
                }
                delete window[callbackName];
            };
        });

        // Set a timeout
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => {
                reject(new Error('Submission is taking longer than expected, but continuing with redirect...'));
                if (script.parentNode) {
                    script.parentNode.removeChild(script);
                }
                delete window[callbackName];
            }, 15000); // Increased from 5000 to 15000
        });

        // Add script to document to start the request
        document.body.appendChild(script);

        try {
            // Wait for either success or timeout
            const response = await Promise.race([submissionPromise, timeoutPromise]);
            logDebug("✅ Submission successful:", response);
        } catch (error) {
            logDebug("⚠️ Submission warning:", error.message);
            // Don't show error to user if it's just a timeout
            if (!error.message.includes('taking longer than expected')) {
                alert(error.message);
            }
        } finally {
            // Close the modal and reset body overflow
            modal.style.display = "none";
            document.body.style.overflow = "auto";
            
            // Reset the form
            document.getElementById("sponsorForm").reset();
            
            // Reload sponsorships to update the map
            await loadSponsorships();
            
            // Clear saved form data on successful submission
            if (hasRequiredFeatures.localStorage) {
                localStorage.removeItem('sponsorFormData');
            }

            // Create URL with form data as parameters
            const fundraiserUrl = 'redirect.html';
            
            // Store the form data in localStorage for the redirect page to use
            if (hasRequiredFeatures.localStorage) {
                localStorage.setItem('fundraiserFormData', JSON.stringify({
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    email: formData.email,
                    message: `Sponsoring Mile ${formData.mile}: ${formData.message}`,
                    amount: formData.amount
                }));
            }

            // Show success message and redirect
            alert("🎉 Sponsorship submitted successfully! You will be redirected to complete your donation.");
            window.location.href = fundraiserUrl;
        }
    } catch (error) {
        logDebug("❌ Submission Failed:", error.message);
        alert(error.message);
        // Make sure to reset body overflow even on error
        document.body.style.overflow = "auto";
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = "Submit Sponsorship";
        submitButton.setAttribute('aria-busy', 'false');
    }
});

// Load sponsorships when page loads
document.addEventListener("DOMContentLoaded", async () => {
    try {
        // Remove no-js class
        document.documentElement.classList.remove('no-js');
        
        // Initialize countdown first as it doesn't depend on API
        updateCountdown();
        
        // Initialize mobile controls
        initMobileMapControls();
        
        // Load saved form data
        loadSavedFormData();
        
        // Start periodic form data saving
        setInterval(saveFormData, 5000);
        
        // Load sponsorships and update UI
        await loadSponsorships();
        
        // Load training stats with new initialization function
        await initializeTrainingStats();
        
        // Hide loading skeleton after everything is loaded
        document.querySelector('.loading-skeleton').style.display = 'none';
        document.querySelector('.map-container').style.display = 'block';
        
    } catch (error) {
        console.error('Error during initialization:', error);
        logDebug(`❌ Page initialization error: ${error.message}`);
        // Show error message to user
        const container = document.querySelector('.container');
        const errorMessage = document.createElement('div');
        errorMessage.className = 'error-message';
        errorMessage.textContent = 'There was an error loading the page. Please refresh to try again.';
        container.insertBefore(errorMessage, container.firstChild);
    }
});

// Initialize mobile map controls
function initMobileMapControls() {
    const container = document.querySelector('.map-container');
    const mapImage = document.querySelector('.map-image');
    if (!container || !mapImage) return;

    // Prevent context menu and image saving
    container.addEventListener('contextmenu', (e) => e.preventDefault());
    mapImage.addEventListener('contextmenu', (e) => e.preventDefault());
    mapImage.addEventListener('touchstart', (e) => {
        if (e.touches.length === 1) {
            e.preventDefault(); // Prevent long-press menu on single touch
        }
    }, { passive: false });

    // Prevent default touch behaviors
    document.addEventListener('gesturestart', (e) => e.preventDefault());
    document.addEventListener('gesturechange', (e) => e.preventDefault());
    document.addEventListener('gestureend', (e) => e.preventDefault());
}

// Remove unused navigation functions
function getCurrentTransform() {
    const wrapper = document.querySelector('.map-wrapper');
    const transform = window.getComputedStyle(wrapper).getPropertyValue('transform');
    const matrix = new DOMMatrix(transform);
    return {
        x: matrix.m41,
        y: matrix.m42
    };
}

// Update countdown
function updateCountdown() {
    const marathonDate = new Date('2025-11-02T00:00:00');
    const now = new Date();
    const difference = marathonDate - now;
    const days = Math.ceil(difference / (1000 * 60 * 60 * 24));
    document.getElementById('daysLeft').textContent = days;
}

// Function to fetch training stats
function fetchTrainingStats() {
    logDebug("🏃 Starting to fetch training stats from Strava...");
    
    const script = document.createElement('script');
    const callbackName = 'trainingCallback_' + Math.round(100000 * Math.random());
    
    // Create a promise that will resolve when the callback is called
    const statsPromise = new Promise((resolve, reject) => {
        logDebug(`🔄 Setting up callback: ${callbackName}`);
        
        // Define the callback function in the global scope
        window[callbackName] = (response) => {
            logDebug("📥 Received training data response:", response);
            
            // Check if response contains Strava error details
            if (response && response.error && response.error.includes('Strava')) {
                logDebug("🔑 Strava API Token Issue:", response.error);
                console.warn("Strava API Token needs to be refreshed. Error:", response.error);
            }
            
            // Clean up
            if (script.parentNode) {
                script.parentNode.removeChild(script);
                logDebug("🧹 Cleaned up script tag");
            }
            delete window[callbackName];
            logDebug("🧹 Cleaned up callback function");
            
            // Resolve the promise with the response
            resolve(response);
        };
        
        // Handle script load error
        script.onerror = () => {
            const error = new Error('Failed to load training data');
            logDebug("❌ Script loading failed:", error);
            reject(error);
            if (script.parentNode) {
                script.parentNode.removeChild(script);
            }
            delete window[callbackName];
        };

        // Set timeout to 15 seconds
        const timeoutId = setTimeout(() => {
            const error = new Error('Training data request timed out');
            logDebug("⏰ Request timed out:", error);
            reject(error);
            if (script.parentNode) {
                script.parentNode.removeChild(script);
            }
            delete window[callbackName];
        }, 15000);

        // Add script to document
        const url = `${googleScriptURL}?type=training&debug=true&callback=${callbackName}`;
        logDebug(`🔗 Loading training data from URL: ${url}`);
        script.src = url;
        document.body.appendChild(script);
        logDebug("📤 Added script tag to document");
    });
    
    return statsPromise;
}

// Callback function to display training stats
async function displayTrainingStats(stats) {
    const statsContent = document.querySelector('.stats-content');
    if (!statsContent) {
        logDebug("❌ Stats content container not found");
        return;
    }

    try {
        logDebug("📊 Processing training stats:", stats);
        
        // Check if stats exists and has required properties
        if (!stats) {
            logDebug("❌ No stats data received");
            throw new Error('No training data received');
        }

        // Log the exact structure we received
        logDebug("📊 Received stats structure:", JSON.stringify(stats));

        // Validate miles is a number
        if (typeof stats.miles !== 'number') {
            logDebug(`❌ Invalid miles data type: ${typeof stats.miles}, value: ${stats.miles}`);
            throw new Error('Invalid miles data format');
        }

        // Validate activities is a number
        if (typeof stats.activities !== 'number') {
            logDebug(`❌ Invalid activities data type: ${typeof stats.activities}, value: ${stats.activities}`);
            throw new Error('Invalid activities data format');
        }

        // Validate lastUpdated is a string
        if (typeof stats.lastUpdated !== 'string') {
            logDebug(`❌ Invalid lastUpdated data type: ${typeof stats.lastUpdated}, value: ${stats.lastUpdated}`);
            throw new Error('Invalid lastUpdated format');
        }

        const formattedDate = new Date(stats.lastUpdated).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric'
        });

        logDebug(`✅ Successfully processed training data: ${stats.miles} miles across ${stats.activities} runs`);
        
        statsContent.innerHTML = `
            <p class="training-text">
                Chris has run <span class="miles">${stats.miles}</span> miles in 2025
                <br>
                <span class="training-details">
                    Across ${stats.activities} training runs
                    <br>
                    <small>Last updated: ${formattedDate}</small>
                </span>
            </p>
        `;
    } catch (error) {
        console.error('Error displaying training stats:', error);
        logDebug(`❌ Error displaying training stats: ${error.message}`);
        statsContent.innerHTML = `
            <p class="training-text">Unable to load training data</p>
        `;
    }
}

// Update the initialization to better handle training stats loading
async function initializeTrainingStats() {
    logDebug("🎬 Starting training stats initialization");
    try {
        const stats = await fetchTrainingStats();
        if (!stats || !stats.success) {
            throw new Error(stats?.error || 'Failed to fetch training stats');
        }
        await displayTrainingStats(stats);
        logDebug("✅ Training stats initialization complete");
    } catch (error) {
        logDebug(`❌ Training stats initialization failed: ${error.message}`);
        const statsContent = document.querySelector('.stats-content');
        if (statsContent) {
            statsContent.innerHTML = `
                <p class="training-text">Unable to load training data</p>
            `;
        }
    }
}
