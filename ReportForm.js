function ReportForm() {
    try {
        const [formData, setFormData] = React.useState({
            transactionId: '',
            date: '',
            amount: '',
            paymentMethod: 'card',
            issueType: '',
            description: '',
            email: '',
            attachments: []
        });
        
        const [loading, setLoading] = React.useState(false);
        const [success, setSuccess] = React.useState(false);
        const [error, setError] = React.useState('');

        // Replace this email with your email address
        const ADMIN_EMAIL = 'kixhore.pvt@gmail.com';

        const issueTypes = [
            'Payment Failed',
            'Double Charged',
            'Download Not Working',
            'Wrong Amount Charged',
            'Technical Error',
            'Other'
        ];

        const handleInputChange = (e) => {
            const { name, value } = e.target;
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        };

        const handleFileChange = (e) => {
            const files = Array.from(e.target.files);
            setFormData(prev => ({
                ...prev,
                attachments: [...prev.attachments, ...files]
            }));
        };

        const removeAttachment = (index) => {
            setFormData(prev => ({
                ...prev,
                attachments: prev.attachments.filter((_, i) => i !== index)
            }));
        };

        const validateForm = () => {
            if (!formData.transactionId) return 'Transaction ID is required';
            if (!formData.date) return 'Date is required';
            if (!formData.amount) return 'Amount is required';
            if (!formData.issueType) return 'Issue type is required';
            if (!formData.description) return 'Description is required';
            if (!formData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) return 'Valid email is required';
            return '';
        };

        const sendEmail = async (formData) => {
            const formattedMessage = `
                Transaction Report

                Transaction ID: ${formData.transactionId}
                Date: ${formData.date}
                Amount: ${formData.amount}
                Payment Method: ${formData.paymentMethod}
                Issue Type: ${formData.issueType}
                Reporter Email: ${formData.email}

                Description:
                ${formData.description}

                Number of Attachments: ${formData.attachments.length}
            `;

            const emailData = {
                to: ADMIN_EMAIL,
                subject: `Transaction Issue Report - ${formData.issueType}`,
                text: formattedMessage,
                attachments: formData.attachments
            };

            try {
                // Here you would integrate with your email service
                // For example, using a serverless function or API endpoint
                const response = await fetch('https://api.yourdomain.com/send-email', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(emailData)
                });

                if (!response.ok) {
                    throw new Error('Failed to send email');
                }

                return true;
            } catch (error) {
                console.error('Email sending error:', error);
                throw error;
            }
        };

        const handleSubmit = async (e) => {
            e.preventDefault();
            
            const validationError = validateForm();
            if (validationError) {
                setError(validationError);
                return;
            }

            setLoading(true);
            setError('');

            try {
                await sendEmail(formData);
                setSuccess(true);
                setFormData({
                    transactionId: '',
                    date: '',
                    amount: '',
                    paymentMethod: 'card',
                    issueType: '',
                    description: '',
                    email: '',
                    attachments: []
                });
            } catch (err) {
                setError('Failed to submit report. Please try again.');
                console.error('Report submission error:', err);
            } finally {
                setLoading(false);
            }
        };

        return (
            <div data-name="report-form-section" className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
                <h2 className="text-2xl font-bold mb-6 text-gray-800">Transaction Issue Report</h2>

                {success ? (
                    <div className="bg-green-50 text-green-800 p-4 rounded-lg mb-6">
                        <div className="flex items-center">
                            <i className="fas fa-check-circle text-green-500 mr-2"></i>
                            Report submitted successfully! We'll get back to you soon.
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Transaction ID
                                </label>
                                <input
                                    type="text"
                                    name="transactionId"
                                    value={formData.transactionId}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2 border border-gray-300 text-gray-900 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                                    placeholder="Enter transaction ID"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Transaction Date
                                </label>
                                <input
                                    type="date"
                                    name="date"
                                    value={formData.date}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2 border border-gray-300 text-gray-900 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Amount
                                </label>
                                <input
                                    type="number"
                                    name="amount"
                                    value={formData.amount}
                                    onChange={handleInputChange}
                                    step="0.01"
                                    className="w-full px-4 py-2 border border-gray-300 text-gray-900 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                                    placeholder="Enter amount"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Payment Method
                                </label>
                                <select
                                    name="paymentMethod"
                                    value={formData.paymentMethod}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2 border border-gray-300 text-gray-900 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                                >
                                    <option value="card">Credit/Debit Card</option>
                                    <option value="paypal">PayPal</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Issue Type
                                </label>
                                <select
                                    name="issueType"
                                    value={formData.issueType}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2 border border-gray-300 text-gray-900 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                                >
                                    <option value="">Select an issue type</option>
                                    {issueTypes.map(type => (
                                        <option key={type} value={type}>{type}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Email Address
                                </label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2 border border-gray-300 text-gray-900 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                                    placeholder="Enter your email"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Description
                            </label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                                rows="4"
                                className="w-full px-4 py-2 border border-gray-300 text-gray-900 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                                placeholder="Please describe the issue in detail"
                            ></textarea>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Attachments (Screenshots, etc.)
                            </label>
                            <input
                                type="file"
                                multiple
                                onChange={handleFileChange}
                                className="hidden"
                                id="file-upload"
                            />
                            <label
                                htmlFor="file-upload"
                                className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 bg-white"
                            >
                                <i className="fas fa-upload mr-2"></i>
                                Upload Files
                            </label>
                            
                            {formData.attachments.length > 0 && (
                                <div className="mt-2 space-y-2">
                                    {formData.attachments.map((file, index) => (
                                        <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                                            <span className="text-sm text-gray-600">{file.name}</span>
                                            <button
                                                type="button"
                                                onClick={() => removeAttachment(index)}
                                                className="text-red-500 hover:text-red-700"
                                            >
                                                <i className="fas fa-times"></i>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {error && (
                            <div className="bg-red-50 text-red-800 p-4 rounded-lg">
                                <div className="flex items-center">
                                    <i className="fas fa-exclamation-circle text-red-500 mr-2"></i>
                                    {error}
                                </div>
                            </div>
                        )}

                        <div className="flex justify-end">
                            <button
                                type="submit"
                                disabled={loading}
                                className={`px-6 py-2 rounded-lg text-white font-medium ${
                                    loading 
                                        ? 'bg-gray-400 cursor-not-allowed' 
                                        : 'bg-blue-600 hover:bg-blue-700'
                                }`}
                            >
                                {loading ? (
                                    <span className="flex items-center">
                                        <i className="fas fa-spinner fa-spin mr-2"></i>
                                        Submitting...
                                    </span>
                                ) : (
                                    'Submit Report'
                                )}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        );
    } catch (error) {
        console.error('ReportForm error:', error);
        reportError(error);
        return null;
    }
}
