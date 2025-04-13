const DOWNLOAD_LIMIT = 3;

const getDownloadHistory = (section) => {
    try {
        const history = JSON.parse(localStorage.getItem('downloadHistory') || '{}');
        return history[section] || [];
    } catch (error) {
        console.error('Error getting download history:', error);
        return [];
    }
};

const addToDownloadHistory = (section, fileId) => {
    try {
        const history = JSON.parse(localStorage.getItem('downloadHistory') || '{}');
        if (!history[section]) {
            history[section] = [];
        }
        if (!history[section].includes(fileId)) {
            history[section].push(fileId);
        }
        localStorage.setItem('downloadHistory', JSON.stringify(history));
    } catch (error) {
        console.error('Error updating download history:', error);
    }
};

const isFileDownloaded = (section, fileId) => {
    try {
        const history = getDownloadHistory(section);
        return history.includes(fileId);
    } catch (error) {
        console.error('Error checking download history:', error);
        return false;
    }
};

const getDownloadCount = (section) => {
    try {
        const history = getDownloadHistory(section);
        return history.length;
    } catch (error) {
        console.error('Error getting download count:', error);
        return 0;
    }
};

const incrementDownloadCount = (section, fileId) => {
    try {
        if (!isFileDownloaded(section, fileId)) {
            addToDownloadHistory(section, fileId);
        }
    } catch (error) {
        console.error('Error incrementing download count:', error);
    }
};

const resetDownloadCount = (section) => {
    try {
        const history = JSON.parse(localStorage.getItem('downloadHistory') || '{}');
        history[section] = [];
        localStorage.setItem('downloadHistory', JSON.stringify(history));
    } catch (error) {
        console.error('Error resetting download count:', error);
    }
};

const initializeStripe = () => {
    return new Promise((resolve, reject) => {
        if (window.Stripe) {
            resolve(window.Stripe('your_publishable_key'));
        } else {
            const script = document.createElement('script');
            script.src = 'https://js.stripe.com/v3/';
            script.onload = () => resolve(window.Stripe('your_publishable_key'));
            script.onerror = reject;
            document.head.appendChild(script);
        }
    });
};

const createPaymentSession = async (amount, section) => {
    try {
        const response = await fetch('https://api.example.com/create-payment-session', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                amount,
                section,
            }),
        });

        if (!response.ok) {
            throw new Error('Failed to create payment session');
        }

        const { sessionId } = await response.json();
        return sessionId;
    } catch (error) {
        console.error('Error creating payment session:', error);
        throw error;
    }
};
