function PaymentModal({ isOpen, onClose, amount, section, onSuccess }) {
    try {
        const [loading, setLoading] = React.useState(false);
        const [error, setError] = React.useState('');
        const [selectedMethod, setSelectedMethod] = React.useState('card');

        const handlePayment = async () => {
            try {
                setLoading(true);
                setError('');

                const stripe = await initializeStripe();
                const sessionId = await createPaymentSession(amount, section);

                const { error: stripeError } = await stripe.redirectToCheckout({
                    sessionId
                });

                if (stripeError) {
                    throw stripeError;
                }

                onSuccess();
                resetDownloadCount(section);
                onClose();
            } catch (error) {
                console.error('Payment error:', error);
                setError('Payment failed. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        if (!isOpen) return null;

        return (
            <div data-name="payment-modal" className="fixed inset-0 z-50 overflow-y-auto">
                <div className="flex items-center justify-center min-h-screen px-4">
                    <div className="fixed inset-0 bg-black opacity-50"></div>
                    
                    <div className="relative bg-white rounded-lg max-w-md w-full p-6">
                        <button
                            data-name="close-modal"
                            onClick={onClose}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                        >
                            <i className="fas fa-times"></i>
                        </button>

                        <div className="text-center mb-6">
                            <h3 className="text-2xl font-bold text-gray-900 mb-2">Premium Access</h3>
                            <p className="text-gray-600">
                                Unlock unlimited downloads for this section
                            </p>
                        </div>

                        <div className="space-y-4 mb-6">
                            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                                <span className="font-medium">Amount:</span>
                                <span className="text-xl font-bold">${amount}</span>
                            </div>

                            <div className="space-y-3">
                                <label className="block text-sm font-medium text-gray-700">
                                    Payment Method
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        data-name="card-method"
                                        className={`p-3 border rounded-lg flex items-center justify-center space-x-2 ${
                                            selectedMethod === 'card' 
                                                ? 'border-blue-500 bg-blue-50' 
                                                : 'border-gray-200 hover:border-blue-300'
                                        }`}
                                        onClick={() => setSelectedMethod('card')}
                                    >
                                        <i className="fas fa-credit-card"></i>
                                        <span>Card</span>
                                    </button>
                                    <button
                                        data-name="paypal-method"
                                        className={`p-3 border rounded-lg flex items-center justify-center space-x-2 ${
                                            selectedMethod === 'paypal' 
                                                ? 'border-blue-500 bg-blue-50' 
                                                : 'border-gray-200 hover:border-blue-300'
                                        }`}
                                        onClick={() => setSelectedMethod('paypal')}
                                    >
                                        <i className="fab fa-paypal"></i>
                                        <span>PayPal</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {error && (
                            <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
                                {error}
                            </div>
                        )}

                        <button
                            data-name="pay-button"
                            onClick={handlePayment}
                            disabled={loading}
                            className={`w-full py-3 px-4 rounded-lg text-white font-medium ${
                                loading 
                                    ? 'bg-gray-400 cursor-not-allowed' 
                                    : 'bg-blue-600 hover:bg-blue-700'
                            }`}
                        >
                            {loading ? (
                                <span className="flex items-center justify-center">
                                    <i className="fas fa-spinner fa-spin mr-2"></i>
                                    Processing...
                                </span>
                            ) : (
                                'Pay Now'
                            )}
                        </button>

                        <p className="mt-4 text-xs text-center text-gray-500">
                            Secure payment powered by Stripe
                            <br />
                            Your payment information is encrypted
                        </p>
                    </div>
                </div>
            </div>
        );
    } catch (error) {
        console.error('PaymentModal error:', error);
        reportError(error);
        return null;
    }
}
