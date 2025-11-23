(function() {
    'use strict';
    console.log('🔒🖼️Login Image: Initializing...');

    /**
     * Checks if a user is currently logged in by verifying the existence of the ApiClient
     * and the current user's session information.
     * @returns {boolean} True if a user is logged in, false otherwise.
     */
    const isUserLoggedIn = () => {
        // console.log('🔒🖼️Login Image: Checking login status.');
        try {
            return !!(window.ApiClient && window.ApiClient._currentUser && window.ApiClient._currentUser.Id);
        } catch (error) {
            // console.error('🔒🖼️❌Login Image: Error checking login status.', error);
            return false;
        }
    };

    // These functions handle the main purpose of the script: displaying the user's profile image.

    const getServerAddress = () => window.location.origin;
    const getUserImageUrl = (userId) => userId ? `${getServerAddress()}/Users/${userId}/Images/Primary?quality=40` : '';

    /**
     * Injects CSS to hide Manual Login and Forgot Password buttons.
     */
    const injectButtonHidingCSS = () => {
        if (!document.getElementById('loginImageCustomStyles')) {
            const style = document.createElement('style');
            style.id = 'loginImageCustomStyles';
            style.textContent = `
                #loginPage .btnManual,
                #loginPage .btnForgotPassword {
                    display: none !important;
                }
            `;
            document.head.appendChild(style);
            // console.log('🔒🖼️Login Image: CSS injected to hide buttons.');
        }
    };

    /**
     * Finds the user's profile image and displays it above the password field.
     * It also hides the username input field, as the user is selected from a card.
     */
    const updateProfilePicture = () => {
        // console.log('🔒🖼️Login Image: updateProfilePicture called.');
        const userNameInput = document.getElementById('txtManualName');
        const manualLoginForm = document.querySelector('.manualLoginForm');
        const userLabel = manualLoginForm ? manualLoginForm.querySelector('label[for="txtManualName"]') : null;

        // Don't run if the form isn't ready or is hidden
        if (!userNameInput || !manualLoginForm || manualLoginForm.classList.contains('hide')) {
            // console.log('🔒🖼️Login Image: Form not ready or hidden, skipping update.');
            if (userNameInput) userNameInput.style.display = '';
            if (userLabel) userLabel.style.display = '';
            return;
        }

        const currentUsername = userNameInput.value;
        // console.log("🔒🖼️Login Image: Current username: '${currentUsername}'");
        let userId = null;
        let imageUrl = null;

        // Try to get user ID and image URL from the user cards on the login page
        const userCardsContainer = document.getElementById('divUsers');
        if (userCardsContainer && currentUsername) {
            const userCardContent = userCardsContainer.querySelector(`.cardContent[data-username="${currentUsername}"]`);
            if (userCardContent) {
                userId = userCardContent.dataset.userid;
                // console.log(`🔒🖼️Login Image: Found user ID from card: ${userId}`);
                const cardImageContainer = userCardContent.querySelector('.cardImageContainer');
                if (cardImageContainer && cardImageContainer.style.backgroundImage) {
                    const style = cardImageContainer.style.backgroundImage;
                    const urlMatch = style.match(/url\(['"]?(.*?)['"]?\)/);
                    if (urlMatch && urlMatch[1]) {
                        // Clean up the URL to get a version with quality set to 40 for better performance
                        imageUrl = urlMatch[1]
                            .replace(/width=\d+&?/g, '')
                            .replace(/height=\d+&?/g, '')
                            .replace(/tag=[^&]+&?/g, '')
                            .replace(/quality=\d+&?/g, 'quality=40&')
                            .replace(/&+$/, ''); // Remove trailing ampersands
                        // console.log(`🔒🖼️Login Image: Found image URL from card style: ${imageUrl}`);
                    }
                }
            } else {
                //  console.log(`🔒🖼️Login Image: No user card found for username: '${currentUsername}'`);
            }
        }

        // If we got a user ID but no image from the card, construct the URL manually
        if (userId && !imageUrl) {
            imageUrl = getUserImageUrl(userId);
            // console.log(`🔒🖼️Login Image: Constructed image URL: ${imageUrl}`);
        }

        // Find or create the container for the profile image
        let imageContainer = document.getElementById('userProfileImageContainer');
        if (!imageContainer) {
            // console.log('🔒🖼️Login Image: Creating image container for the first time.');
            imageContainer = document.createElement('div');
            imageContainer.id = 'userProfileImageContainer';
            const inputContainer = manualLoginForm.querySelector('.inputContainer');
            if (inputContainer) {
                manualLoginForm.insertBefore(imageContainer, inputContainer);
            } else {
                manualLoginForm.prepend(imageContainer);
            }
        }

        imageContainer.innerHTML = '';

        // If an image URL was found, display the image and hide the username input
        if (imageUrl) {
            // console.log(`🔒🖼️Login Image: Displaying image: ${imageUrl}`);
            const imgElement = document.createElement('img');
            imgElement.src = imageUrl;
            imgElement.alt = `Profile picture for ${currentUsername}`;
            imgElement.loading = 'lazy'; // Lazy load for better performance
            imgElement.onerror = () => {
                // console.error('🔒🖼️❌Login Image: Failed to load image.');
                imageContainer.innerHTML = '';
                if (userNameInput) userNameInput.style.display = '';
                if (userLabel) userLabel.style.display = '';
            };
            imageContainer.appendChild(imgElement);

            if (userNameInput) userNameInput.style.display = 'none';
            if (userLabel) userLabel.style.display = 'none';
        } else {
            // If no image, ensure the username input is visible
            // console.log('🔒🖼️Login Image: No image URL found. Ensuring username input is visible.');
            imageContainer.innerHTML = '';
            if (userNameInput) userNameInput.style.display = '';
            if (userLabel) userLabel.style.display = '';
        }
    };

    // Store observer instances for cleanup
    let nameObserver = null;
    let formObserver = null;

    /**
     * Sets up MutationObservers to watch for changes to the login form,
     * such as selecting a different user or showing/hiding the form.
     */
    const setupObservers = () => {
        // console.log('🔒🖼️Login Image: Setting up MutationObservers.');
        const userNameInput = document.getElementById('txtManualName');
        const manualLoginForm = document.querySelector('.manualLoginForm');

        // Clean up existing observers if they exist
        if (nameObserver) nameObserver.disconnect();
        if (formObserver) formObserver.disconnect();

        // Observe changes to the username input value (when a user card is clicked)
        nameObserver = new MutationObserver(() => {
            // console.log('🔒🖼️Login Image: Username input value changed.');
            updateProfilePicture();
        });
        nameObserver.observe(userNameInput, { attributes: true, attributeFilter: ['value'] });

        // Observe changes to the form's visibility (e.g., switching to passwordless login)
        formObserver = new MutationObserver(() => {
            // console.log('🔒🖼️Login Image: Login form class attribute changed.');
            if (!manualLoginForm.classList.contains('hide')) {
                console.log('🔒🖼️Login Image: Login form is now visible.');
                updateProfilePicture();
            } else {
                // If the form is hidden, reset the state
                // console.log('🔒🖼️Login Image: Login form is now hidden. Resetting state.');
                const userLabel = manualLoginForm.querySelector('label[for="txtManualName"]');
                if (userNameInput) userNameInput.style.display = '';
                if (userLabel) userLabel.style.display = '';
                const imgContainer = document.getElementById('userProfileImageContainer');
                if (imgContainer) imgContainer.innerHTML = '';
            }
        });
        formObserver.observe(manualLoginForm, { attributes: true, attributeFilter: ['class'] });

        // Trigger an initial update in case the form is already visible on load
        if (!manualLoginForm.classList.contains('hide')) {
            // console.log('🔒🖼️Login Image: Form already visible on load. Triggering initial update.');
            updateProfilePicture();
        } else {
            // console.log('🔒🖼️Login Image: Form initially hidden.');
            const userLabel = manualLoginForm.querySelector('label[for="txtManualName"]');
            if(userNameInput) userNameInput.style.display = '';
            if (userLabel) userLabel.style.display = '';
        }
    };


    // --- Initialization and Page Check Logic ---
    // This part ensures the script only runs on the login page.

    let attempts = 0;
    const maxAttempts = 100; // Try to find the login form for 10 seconds (100 * 100ms)
    let initializationComplete = false;

    /**
     * The main initialization function. It checks for the correct page context
     * before running the script's core logic.
     */
    const initialize = () => {
        // Early exit if already initialized
        if (initializationComplete) return;

        // Condition 1: If a user is already logged in, we are not on the login page. Stop the script.
        if (isUserLoggedIn()) {
            // console.log('🔒🖼️Login Image: User is logged in, stopping script.');
            initializationComplete = true;
            return;
        }

        // Condition 2: Check for the login form elements.
        const userNameInput = document.getElementById('txtManualName');
        const manualLoginForm = document.querySelector('.manualLoginForm');

        if (userNameInput && manualLoginForm) {
            // Elements found, so we are on the login page. Run the main script logic.
            // console.log('🔒🖼️Login Image: Login form found. Setting up observers.');
            injectButtonHidingCSS();
            setupObservers();
            initializationComplete = true;
        } else {
            // Elements not found yet. Try again after a short delay.
            attempts++;
            if (attempts < maxAttempts) {
                // console.log(`🔒🖼️Login Image: Login form not found. Attempt ${attempts}/${maxAttempts}.`);
                setTimeout(initialize, 100);
            } else {
                // console.log('🔒🖼️Login Image: Max attempts reached. Stopping script.');
                initializationComplete = true;
            }
        }
    };

    // Start the initialization process when the script loads.
    initialize();

})();
